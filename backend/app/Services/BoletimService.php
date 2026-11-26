<?php

namespace App\Services;

use App\Models\Leitura;
use Carbon\Carbon;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

/**
 * Gera o Boletim das Estações.
 *
 * Estratégia de performance:
 *  - Toda agregação pesada é feita no banco (GROUP BY por hora/dia) e o PHP só
 *    trabalha sobre o resumo (≤ 24 linhas no dia, ≤ 366 no ano).
 *  - Consultas usam toBase() (stdClass) em vez de hidratar models Eloquent,
 *    evitando casts decimal/Carbon por linha.
 *  - O resultado é independente da métrica (as séries das 6 métricas vêm juntas),
 *    então trocar de métrica na tela não recalcula nada.
 *  - O resultado é cacheado com stale-while-revalidate (Cache::flexible).
 */
class BoletimService
{
    private const PERIODOS_PERMITIDOS = ['dia', 'semana', 'mes', 'ano'];
    private const METRICAS = ['temperatura_ar', 'umidade_ar', 'itgu', 'itu', 'indice_uv', 'pressao'];

    private const NOMES_MESES_ABREV = [
        1 => 'Jan', 2 => 'Fev', 3 => 'Mar', 4 => 'Abr', 5 => 'Mai', 6 => 'Jun',
        7 => 'Jul', 8 => 'Ago', 9 => 'Set', 10 => 'Out', 11 => 'Nov', 12 => 'Dez',
    ];

    /** Incrementar sempre que a estrutura do array cacheado mudar. */
    private const VERSAO_CACHE = 4;

    private ChuvaService $chuvaService;

    public function __construct(?ChuvaService $chuvaService = null)
    {
        $this->chuvaService = $chuvaService ?? new ChuvaService();
    }

    /**
     * [fresco, máximo] em segundos para o período em andamento. A estação envia
     * leitura a cada ~60 s, então 1 min de frescor é o mesmo que "tempo real".
     */
    private const TTL_PERIODO_ABERTO = [60, 300];

    /**
     * Período encerrado: só muda se a estação reenviar backlog do buffer EEPROM,
     * por isso pode ficar 6 h fresco e até 24 h servindo stale enquanto revalida.
     */
    private const TTL_PERIODO_FECHADO = [21600, 86400];

    /** Critérios de recorde: chave => [coluna, procurarMaior?]. */
    private const CRITERIOS_RECORDE = [
        'temp_max' => ['temperatura_ar', true],
        'temp_min' => ['temperatura_ar', false],
        'umid_max' => ['umidade_ar', true],
        'umid_min' => ['umidade_ar', false],
        'uv_max' => ['indice_uv', true],
        'pressao_min' => ['pressao', false],
        'itgu_max' => ['itgu', true],
    ];

    public function gerar(int $estacaoId, string $periodo, Carbon $dataReferencia, string $metrica = 'temperatura_ar'): array
    {
        if (! in_array($periodo, self::PERIODOS_PERMITIDOS)) {
            $periodo = 'dia';
        }
        if (! in_array($metrica, self::METRICAS)) {
            $metrica = 'temperatura_ar';
        }

        [$inicio, $fim] = $this->intervaloDoPeriodo($periodo, $dataReferencia);

        $chave = sprintf('boletim:v%d:%d:%s:%s', self::VERSAO_CACHE, $estacaoId, $periodo, $inicio->format('Ymd'));
        $ttl = $fim->isPast() ? self::TTL_PERIODO_FECHADO : self::TTL_PERIODO_ABERTO;

        $base = Cache::flexible(
            $chave,
            $ttl,
            fn () => $this->calcular($estacaoId, $periodo, $dataReferencia->copy(), $inicio->copy(), $fim->copy())
        );

        return [
            'periodo' => $periodo,
            'metrica' => $metrica,
            ...$base,
            'serieChart' => $base['series'][$metrica],
        ];
    }

    /**
     * Calcula a parte do boletim que independe da métrica selecionada (é o que vai para o cache).
     */
    private function calcular(int $estacaoId, string $periodo, Carbon $dataReferencia, Carbon $inicio, Carbon $fim): array
    {
        $base = [
            'rotulo' => $this->rotuloPeriodo($periodo, $dataReferencia),
            'granularidade' => $periodo === 'dia' ? 'hora' : 'dia',
        ];

        $corpo = $periodo === 'dia'
            ? $this->calcularDia($estacaoId, $inicio, $fim)
            : $this->calcularPorDias($estacaoId, $periodo, $inicio, $fim);

        [$inicioAnterior, $fimAnterior] = $this->intervaloDoPeriodo($periodo, $this->dataPeriodoAnterior($periodo, $dataReferencia));
        $anterior = $this->resumoPeriodo($estacaoId, $inicioAnterior, $fimAnterior);

        $corpo['comparacaoAnterior'] = $this->compararComPeriodoAnterior($corpo['_resumoAtual'], $anterior);
        unset($corpo['_resumoAtual']);

        return $base + $corpo;
    }

    // ---------------------------------------------------------------------
    // Período "dia" (granularidade horária) — 3 consultas no total
    // ---------------------------------------------------------------------

    private function calcularDia(int $estacaoId, Carbon $inicio, Carbon $fim): array
    {
        // Consulta 1: leituras do dia (~1.5k linhas) como stdClass, só com as colunas necessárias,
        // fazendo JOIN com estacoes para saber se possui_pluviometro sem consulta extra.
        $colunasSelect = array_merge(
            ['leituras.registrado_em', 'leituras.itgu_classificacao', 'leituras.chuva_mm', 'estacoes.possui_pluviometro'],
            array_map(fn ($m) => "leituras.{$m}", self::METRICAS)
        );
        $leituras = Leitura::query()->toBase()
            ->join('estacoes', 'estacoes.id', '=', 'leituras.estacao_id')
            ->where('leituras.estacao_id', $estacaoId)
            ->whereBetween('leituras.registrado_em', [$inicio, $fim])
            ->orderBy('leituras.registrado_em')
            ->get($colunasSelect);

        // Passada única O(n): soma/quantidade por hora e métrica + janela de alerta + chuva por hora.
        $horas = [];
        $horasAlerta = [];
        $primeiroAlerta = null;
        $ultimoAlerta = null;
        $chuvaPorHora = [];
        $chuvaTotal = 0.0;
        $temLeiturasChuva = false;

        foreach ($leituras as $leitura) {
            $hora = (int) substr($leitura->registrado_em, 11, 2);
            $horas[$hora] ??= [];

            foreach (self::METRICAS as $metrica) {
                if ($leitura->$metrica === null) {
                    continue;
                }
                $horas[$hora][$metrica][0] = ($horas[$hora][$metrica][0] ?? 0.0) + (float) $leitura->$metrica;
                $horas[$hora][$metrica][1] = ($horas[$hora][$metrica][1] ?? 0) + 1;
            }

            if (
                ! empty($leitura->possui_pluviometro)
                && $leitura->chuva_mm !== null
                && (float) $leitura->chuva_mm >= 0.0
                && (float) $leitura->chuva_mm <= ChuvaService::MAX_MM_POR_CICLO
            ) {
                $chuvaValor = (float) $leitura->chuva_mm;
                $chuvaPorHora[$hora] = ($chuvaPorHora[$hora] ?? 0.0) + $chuvaValor;
                $chuvaTotal += $chuvaValor;
                $temLeiturasChuva = true;
            }

            if ($leitura->itgu_classificacao === 'perigo') {
                $horasAlerta[$hora] = true;
                $primeiroAlerta ??= $leitura;
                $ultimoAlerta = $leitura;
            }
        }
        ksort($horas);

        $media = fn (int $hora, string $metrica, int $casas) => isset($horas[$hora][$metrica])
            ? round($horas[$hora][$metrica][0] / $horas[$hora][$metrica][1], $casas)
            : null;

        // Consulta 2: média por hora dos 7 dias anteriores, já agregada no banco (24 linhas).
        $media7dias = $this->mediaPorHora(
            $estacaoId,
            $inicio->copy()->subDays(7)->startOfDay(),
            $inicio->copy()->subDay()->endOfDay()
        );

        $series = [];
        foreach (self::METRICAS as $metrica) {
            $serie = [];
            for ($h = 0; $h < 24; $h++) {
                $valorMedia = $media7dias->get($h)?->$metrica;
                $serie[] = [
                    'rotulo' => sprintf('%02d:00', $h),
                    'valor' => $media($h, $metrica, 2),
                    'media' => $valorMedia !== null ? round((float) $valorMedia, 2) : null,
                ];
            }
            $series[$metrica] = $serie;
        }

        $tabela = [];
        foreach (array_keys($horas) as $h) {
            $tabela[] = [
                'rotulo' => sprintf('%02d:00', $h),
                'temperatura_ar' => $media($h, 'temperatura_ar', 1),
                'umidade_ar' => $media($h, 'umidade_ar', 1),
                'itgu' => $media($h, 'itgu', 1),
                'indice_uv' => $media($h, 'indice_uv', 1),
            ];
        }

        $rec = $this->extremos($leituras, self::CRITERIOS_RECORDE);
        $hm = fn (?object $l) => $l ? substr($l->registrado_em, 11, 5) : null;
        $card = fn (string $titulo, string $chave, string $coluna, string $unidade, string $cor) => [
            'titulo' => $titulo,
            'valor' => $this->decimal($rec[$chave]?->$coluna),
            'unidade' => $unidade,
            'quando' => $hm($rec[$chave]),
            'cor' => $cor,
        ];

        $cardItgu = $card('Maior ITGU', 'itgu_max', 'itgu', '', 'quente');
        $cardItgu['extra'] = $rec['itgu_max']?->itgu_classificacao;

        $umidSoma = 0.0;
        $umidQtd = 0;
        foreach ($horas as $metricas) {
            $umidSoma += $metricas['umidade_ar'][0] ?? 0.0;
            $umidQtd += $metricas['umidade_ar'][1] ?? 0;
        }

        return [
            'recordes' => [
                'cards' => [
                    $card('Hora mais quente', 'temp_max', 'temperatura_ar', '°C', 'quente'),
                    $card('Hora mais fria', 'temp_min', 'temperatura_ar', '°C', 'fria'),
                    $card('Maior umidade', 'umid_max', 'umidade_ar', '%', 'umida'),
                    $card('Menor umidade', 'umid_min', 'umidade_ar', '%', 'seca'),
                    $card('Pico de UV', 'uv_max', 'indice_uv', '', 'uv'),
                    $card('Menor pressão', 'pressao_min', 'pressao', ' hPa', 'pressao'),
                    $cardItgu,
                    [
                        'titulo' => 'Horas em alerta térmico',
                        'valor' => count($horasAlerta),
                        'unidade' => 'h',
                        'quando' => $primeiroAlerta ? $hm($primeiroAlerta) . '–' . $hm($ultimoAlerta) : null,
                        'cor' => 'quente',
                    ],
                ],
            ],
            'series' => $series,
            'tabela' => $tabela,
            'chuva' => $this->resumoChuvaDia($chuvaPorHora, $chuvaTotal, $temLeiturasChuva),
            '_resumoAtual' => [
                'temp_max' => $rec['temp_max'] ? (float) $rec['temp_max']->temperatura_ar : null,
                'umid_media' => $umidQtd > 0 ? $umidSoma / $umidQtd : null,
                'dias_alerta' => $primeiroAlerta ? 1 : 0,
            ],
        ];
    }

    // ---------------------------------------------------------------------
    // Períodos "semana", "mes" e "ano" (granularidade diária) — 2 consultas no total
    // ---------------------------------------------------------------------

    private function calcularPorDias(int $estacaoId, string $periodo, Carbon $inicio, Carbon $fim): array
    {
        $dias = $this->agregadoPorDia($estacaoId, $inicio, $fim);
        $porData = $dias->keyBy('dia');

        $criterios = [];
        foreach (self::CRITERIOS_RECORDE as $chave => [$coluna, $maior]) {
            $criterios[$chave] = [$coluna . ($maior ? '_max' : '_min'), $maior];
        }
        $rec = $this->extremos($dias, $criterios);
        $diasComAlerta = $dias->where('teve_alerta', true)->count();

        $dm = fn (?object $r) => $r ? Carbon::parse($r->dia)->format('d/m') : null;
        $card = fn (string $titulo, string $chave, string $unidade, string $cor) => [
            'titulo' => $titulo,
            'valor' => $this->decimal($rec[$chave]?->{$criterios[$chave][0]}),
            'unidade' => $unidade,
            'quando' => $dm($rec[$chave]),
            'cor' => $cor,
        ];

        $resultado = [
            'recordes' => [
                'cards' => [
                    $card('Dia mais quente', 'temp_max', '°C', 'quente'),
                    $card('Dia mais frio', 'temp_min', '°C', 'fria'),
                    $card('Maior umidade', 'umid_max', '%', 'umida'),
                    $card('Menor umidade', 'umid_min', '%', 'seca'),
                    $card('Pico de UV', 'uv_max', '', 'uv'),
                    $card('Menor pressão', 'pressao_min', ' hPa', 'pressao'),
                    $card('Maior ITGU', 'itgu_max', '', 'quente'),
                    ['titulo' => 'Dias em alerta térmico', 'valor' => $diasComAlerta, 'unidade' => ' de ' . $dias->count(), 'quando' => null, 'cor' => 'quente'],
                ],
            ],
            'series' => $periodo === 'ano'
                ? $this->seriesPorMes($dias)
                : $this->seriesPorDia($porData, $inicio, $fim),
        ];

        if ($periodo === 'semana') {
            $resultado['tabela'] = $dias->map(fn ($d) => [
                'rotulo' => Carbon::parse($d->dia)->translatedFormat('D d/m'),
                'maximo' => $this->arredondar($d->temperatura_ar_max, 1),
                'minimo' => $this->arredondar($d->temperatura_ar_min, 1),
                'umid_media' => $d->umidade_ar_qtd > 0 ? round($d->umidade_ar_soma / $d->umidade_ar_qtd, 1) : null,
                'teve_alerta' => $d->teve_alerta,
            ])->values()->all();
        } elseif ($periodo === 'mes') {
            $resultado['mapaCalor'] = $this->mapaCalorDoMes($porData, $inicio, $fim);
        } else {
            $resultado['tabela'] = $this->tabelaPorMes($dias);
        }

        $temps = $dias->pluck('temperatura_ar_max')->filter(fn ($v) => $v !== null);
        $umidQtd = $dias->sum('umidade_ar_qtd');
        $resultado['chuva'] = $this->resumoChuvaDias($dias);
        $resultado['_resumoAtual'] = [
            'temp_max' => $temps->isNotEmpty() ? (float) $temps->max() : null,
            'umid_media' => $umidQtd > 0 ? $dias->sum('umidade_ar_soma') / $umidQtd : null,
            'dias_alerta' => $diasComAlerta,
        ];

        return $resultado;
    }

    /**
     * Uma única consulta GROUP BY dia com MAX/MIN/SUM/COUNT de todas as métricas.
     * Tudo (recordes, séries, tabelas, mapa de calor, comparação) é derivado daqui.
     */
    private function agregadoPorDia(int $estacaoId, Carbon $inicio, Carbon $fim): Collection
    {
        $colunas = ['DATE(leituras.registrado_em) as dia'];
        foreach (self::METRICAS as $m) {
            $colunas[] = "MAX(leituras.$m) as {$m}_max, MIN(leituras.$m) as {$m}_min, SUM(leituras.$m) as {$m}_soma, COUNT(leituras.$m) as {$m}_qtd";
        }
        $colunas[] = 'SUM(CASE WHEN estacoes.possui_pluviometro = ? AND leituras.chuva_mm >= 0 AND leituras.chuva_mm <= ? THEN leituras.chuva_mm ELSE NULL END) as chuva_mm_soma';
        $colunas[] = 'COUNT(CASE WHEN estacoes.possui_pluviometro = ? AND leituras.chuva_mm >= 0 AND leituras.chuva_mm <= ? THEN leituras.chuva_mm ELSE NULL END) as chuva_mm_qtd';
        $colunas[] = "MAX(CASE WHEN leituras.itgu_classificacao = 'perigo' THEN 1 ELSE 0 END) as teve_alerta";

        $bindingsSelect = [true, ChuvaService::MAX_MM_POR_CICLO, true, ChuvaService::MAX_MM_POR_CICLO];

        return Leitura::query()->toBase()
            ->join('estacoes', 'estacoes.id', '=', 'leituras.estacao_id')
            ->selectRaw(implode(', ', $colunas), $bindingsSelect)
            ->where('leituras.estacao_id', $estacaoId)
            ->whereBetween('leituras.registrado_em', [$inicio, $fim])
            ->groupByRaw('DATE(leituras.registrado_em)')
            ->orderBy('dia')
            ->get()
            ->map(function ($d) {
                // Normaliza tipos que variam entre MySQL / PostgreSQL / SQLite.
                $d->dia = substr((string) $d->dia, 0, 10);
                $d->teve_alerta = (bool) $d->teve_alerta;
                foreach (self::METRICAS as $m) {
                    $d->{"{$m}_soma"} = (float) $d->{"{$m}_soma"};
                    $d->{"{$m}_qtd"} = (int) $d->{"{$m}_qtd"};
                }
                $d->chuva_mm_soma = (float) $d->chuva_mm_soma;
                $d->chuva_mm_qtd = (int) $d->chuva_mm_qtd;

                return $d;
            });
    }

    private function resumoChuvaDia(array $chuvaPorHora, float $chuvaTotal, bool $temLeiturasChuva): array
    {
        $totalArredondado = $temLeiturasChuva ? round($chuvaTotal, 2) : null;
        if (! $temLeiturasChuva || $totalArredondado <= 0.0) {
            return [
                'teve_chuva' => false,
                'total_mm' => $totalArredondado,
                'pico_hora_mm' => null,
                'pico_quando' => null,
                'horas_com_chuva' => 0,
                ...$this->chuvaService->classificar(null),
            ];
        }

        $picoHora = null;
        $picoHoraMm = 0.0;
        $horasComChuva = 0;

        ksort($chuvaPorHora);
        foreach ($chuvaPorHora as $hora => $somaHora) {
            if ($somaHora > 0) {
                $horasComChuva++;
            }
            if ($picoHora === null || $somaHora > $picoHoraMm) {
                $picoHora = $hora;
                $picoHoraMm = $somaHora;
            }
        }

        $picoArredondado = round($picoHoraMm, 2);

        return [
            'teve_chuva' => true,
            'total_mm' => $totalArredondado,
            'pico_hora_mm' => $picoArredondado,
            'pico_quando' => $picoHora !== null ? sprintf('%02d:00', $picoHora) : null,
            'horas_com_chuva' => $horasComChuva,
            ...$this->chuvaService->classificar($picoArredondado),
        ];
    }

    private function resumoChuvaDias(Collection $dias): array
    {
        $chuvaQtd = $dias->sum('chuva_mm_qtd');
        $totalMm = $chuvaQtd > 0 ? round((float) $dias->sum('chuva_mm_soma'), 2) : null;

        if ($totalMm === null || $totalMm <= 0.0) {
            return [
                'teve_chuva' => false,
                'total_mm' => $totalMm,
                'dias_com_chuva' => 0,
                'pico_dia_mm' => null,
                'pico_dia_quando' => null,
                'pico_hora_mm' => null,
                'pico_quando' => null,
                'chuva_classificacao' => null,
                'chuva_label' => null,
                'chuva_nivel' => null,
            ];
        }

        $diasComChuva = $dias->filter(fn ($d) => $d->chuva_mm_qtd > 0 && $d->chuva_mm_soma > 0);
        $diaPico = $diasComChuva->sortByDesc('chuva_mm_soma')->first();

        return [
            'teve_chuva' => true,
            'total_mm' => $totalMm,
            'dias_com_chuva' => $diasComChuva->count(),
            'pico_dia_mm' => $diaPico ? round((float) $diaPico->chuva_mm_soma, 2) : null,
            'pico_dia_quando' => $diaPico ? Carbon::parse($diaPico->dia)->format('d/m') : null,
            'pico_hora_mm' => null,
            'pico_quando' => null,
            'chuva_classificacao' => null,
            'chuva_label' => null,
            'chuva_nivel' => null,
        ];
    }

    private function seriesPorDia(Collection $porData, Carbon $inicio, Carbon $fim): array
    {
        $series = [];
        foreach (self::METRICAS as $metrica) {
            $coluna = "{$metrica}_max";
            $maximos = $porData->pluck($coluna)->filter(fn ($v) => $v !== null);
            $mediaGeral = $maximos->isNotEmpty() ? round($maximos->avg(), 2) : null;

            $serie = [];
            $cursor = $inicio->copy()->startOfDay();
            while ($cursor->lte($fim)) {
                $valor = $porData->get($cursor->format('Y-m-d'))?->$coluna;
                $serie[] = [
                    'rotulo' => $cursor->format('d/m'),
                    'valor' => $this->arredondar($valor, 2),
                    'media' => $mediaGeral,
                ];
                $cursor->addDay();
            }
            $series[$metrica] = $serie;
        }

        return $series;
    }

    private function seriesPorMes(Collection $dias): array
    {
        $porMes = $dias->groupBy(fn ($d) => (int) substr($d->dia, 5, 2));

        $series = [];
        foreach (self::METRICAS as $metrica) {
            $serie = [];
            for ($m = 1; $m <= 12; $m++) {
                $grupo = $porMes->get($m);
                $qtd = $grupo?->sum("{$metrica}_qtd") ?? 0;
                $serie[] = [
                    'rotulo' => self::NOMES_MESES_ABREV[$m],
                    'valor' => $qtd > 0 ? round($grupo->sum("{$metrica}_soma") / $qtd, 2) : null,
                ];
            }
            $series[$metrica] = $serie;
        }

        return $series;
    }

    private function tabelaPorMes(Collection $dias): array
    {
        $linhas = [];
        foreach ($dias->groupBy(fn ($d) => (int) substr($d->dia, 5, 2))->sortKeys() as $mes => $grupo) {
            $maximos = $grupo->pluck('temperatura_ar_max')->filter(fn ($v) => $v !== null);
            $minimos = $grupo->pluck('temperatura_ar_min')->filter(fn ($v) => $v !== null);
            $umidQtd = $grupo->sum('umidade_ar_qtd');

            $linhas[] = [
                'rotulo' => self::NOMES_MESES_ABREV[$mes],
                'maximo' => $maximos->isNotEmpty() ? round((float) $maximos->max(), 1) : null,
                'minimo' => $minimos->isNotEmpty() ? round((float) $minimos->min(), 1) : null,
                'umid_media' => $umidQtd > 0 ? round($grupo->sum('umidade_ar_soma') / $umidQtd, 1) : null,
                'dias_alerta' => $grupo->where('teve_alerta', true)->count(),
            ];
        }

        return $linhas;
    }

    private function mapaCalorDoMes(Collection $porData, Carbon $inicio, Carbon $fim): array
    {
        $celulas = [];
        for ($d = 1; $d <= $fim->day; $d++) {
            $chave = sprintf('%s-%02d', $inicio->format('Y-m'), $d);
            $celulas[] = [
                'dia' => $d,
                'valor' => $this->arredondar($porData->get($chave)?->temperatura_ar_max, 1),
            ];
        }

        $valores = collect($celulas)->pluck('valor')->filter(fn ($v) => $v !== null);

        return [
            'celulas' => $celulas,
            'minimo' => $valores->min(),
            'maximo' => $valores->max(),
        ];
    }

    // ---------------------------------------------------------------------
    // Comparação com o período anterior
    // ---------------------------------------------------------------------

    /**
     * Uma consulta agregada (antes eram 3 por período, 6 no total).
     */
    private function resumoPeriodo(int $estacaoId, Carbon $inicio, Carbon $fim): array
    {
        $r = $this->consultaPeriodo($estacaoId, $inicio, $fim)
            ->selectRaw(
                'MAX(temperatura_ar) as temp_max, AVG(umidade_ar) as umid_media, ' .
                "COUNT(DISTINCT CASE WHEN itgu_classificacao = 'perigo' THEN DATE(registrado_em) END) as dias_alerta"
            )
            ->first();

        return [
            'temp_max' => isset($r->temp_max) ? (float) $r->temp_max : null,
            'umid_media' => isset($r->umid_media) ? (float) $r->umid_media : null,
            'dias_alerta' => (int) ($r->dias_alerta ?? 0),
        ];
    }

    private function compararComPeriodoAnterior(array $atual, array $anterior): array
    {
        $delta = fn ($a, $b) => ($a !== null && $b !== null) ? round($a - $b, 1) : null;

        return [
            'temp_max' => $delta($atual['temp_max'], $anterior['temp_max']),
            'umid_media' => $delta($atual['umid_media'], $anterior['umid_media']),
            'dias_alerta' => $delta($atual['dias_alerta'], $anterior['dias_alerta']),
        ];
    }

    private function dataPeriodoAnterior(string $periodo, Carbon $dataReferencia): Carbon
    {
        return match ($periodo) {
            'semana' => $dataReferencia->copy()->subWeek(),
            'mes' => $dataReferencia->copy()->subMonthNoOverflow(),
            'ano' => $dataReferencia->copy()->subYear(),
            default => $dataReferencia->copy()->subDay(),
        };
    }

    // ---------------------------------------------------------------------
    // Utilitários
    // ---------------------------------------------------------------------

    /**
     * Query Builder "cru" (sem hidratação Eloquent) já filtrado pelo índice
     * composto (estacao_id, registrado_em). Sempre usar intervalo (sargable),
     * nunca whereYear()/whereDate(), que impedem o uso do índice.
     */
    private function consultaPeriodo(int $estacaoId, Carbon $inicio, Carbon $fim): Builder
    {
        return Leitura::query()->toBase()
            ->where('estacao_id', $estacaoId)
            ->whereBetween('registrado_em', [$inicio, $fim]);
    }

    /** Média de todas as métricas por hora do dia, agregada no banco. */
    private function mediaPorHora(int $estacaoId, Carbon $inicio, Carbon $fim): Collection
    {
        $hora = $this->expressaoHora();

        return $this->consultaPeriodo($estacaoId, $inicio, $fim)
            ->selectRaw("$hora as hora, " . implode(', ', array_map(fn ($m) => "AVG($m) as $m", self::METRICAS)))
            ->groupByRaw($hora)
            ->get()
            ->keyBy(fn ($r) => (int) $r->hora);
    }

    private function expressaoHora(): string
    {
        return match (Leitura::query()->getConnection()->getDriverName()) {
            'sqlite' => "CAST(strftime('%H', registrado_em) AS INTEGER)",
            'pgsql' => 'EXTRACT(HOUR FROM registrado_em)',
            default => 'HOUR(registrado_em)',
        };
    }

    /**
     * Varre as linhas uma única vez (O(n)) e devolve, por critério, a primeira
     * linha com o valor extremo. Substitui os 7 sortBy() (O(7·n log n)) anteriores.
     *
     * @param  iterable<object>  $linhas
     * @param  array<string, array{0: string, 1: bool}>  $criterios
     * @return array<string, object|null>
     */
    private function extremos(iterable $linhas, array $criterios): array
    {
        $melhor = array_fill_keys(array_keys($criterios), null);
        $valor = [];

        foreach ($linhas as $linha) {
            foreach ($criterios as $chave => [$coluna, $maior]) {
                if ($linha->$coluna === null) {
                    continue;
                }
                $v = (float) $linha->$coluna;
                if ($melhor[$chave] === null || ($maior ? $v > $valor[$chave] : $v < $valor[$chave])) {
                    $melhor[$chave] = $linha;
                    $valor[$chave] = $v;
                }
            }
        }

        return $melhor;
    }

    /** Mantém o formato "31.20" que o cast decimal:2 do model entregava ao front. */
    private function decimal(mixed $valor): ?string
    {
        return $valor === null ? null : number_format((float) $valor, 2, '.', '');
    }

    private function arredondar(mixed $valor, int $casas): ?float
    {
        return $valor === null ? null : round((float) $valor, $casas);
    }

    private function intervaloDoPeriodo(string $periodo, Carbon $dataReferencia): array
    {
        return match ($periodo) {
            'semana' => [$dataReferencia->copy()->startOfWeek(), $dataReferencia->copy()->endOfWeek()],
            'mes' => [$dataReferencia->copy()->startOfMonth(), $dataReferencia->copy()->endOfMonth()],
            'ano' => [$dataReferencia->copy()->startOfYear(), $dataReferencia->copy()->endOfYear()],
            default => [$dataReferencia->copy()->startOfDay(), $dataReferencia->copy()->endOfDay()],
        };
    }

    private function rotuloPeriodo(string $periodo, Carbon $data): string
    {
        return match ($periodo) {
            'semana' => $data->copy()->startOfWeek()->format('d/m') . ' a ' . $data->copy()->endOfWeek()->format('d/m/Y'),
            'mes' => $data->translatedFormat('F \d\e Y'),
            'ano' => $data->format('Y'),
            default => $data->translatedFormat('d \d\e F \d\e Y'),
        };
    }
}
