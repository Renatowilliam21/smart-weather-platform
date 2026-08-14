<?php

namespace App\Services;

use App\Models\Leitura;
use Carbon\Carbon;

class BoletimService
{
    private const PERIODOS_PERMITIDOS = ['dia', 'semana', 'mes', 'ano'];
    private const METRICAS = ['temperatura_ar', 'umidade_ar', 'itgu', 'itu', 'indice_uv', 'pressao'];

    private const NOMES_MESES_ABREV = [
        1 => 'Jan', 2 => 'Fev', 3 => 'Mar', 4 => 'Abr', 5 => 'Mai', 6 => 'Jun',
        7 => 'Jul', 8 => 'Ago', 9 => 'Set', 10 => 'Out', 11 => 'Nov', 12 => 'Dez',
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
        $ehPorHora = $periodo === 'dia';

        $resultado = [
            'periodo' => $periodo,
            'metrica' => $metrica,
            'rotulo' => $this->rotuloPeriodo($periodo, $dataReferencia),
            'granularidade' => $ehPorHora ? 'hora' : 'dia',
            'recordes' => $ehPorHora
                ? $this->recordesPorHora($estacaoId, $inicio, $fim)
                : $this->recordesPorDia($estacaoId, $inicio, $fim),
            'serieChart' => $ehPorHora
                ? $this->seriePorHora($estacaoId, $metrica, $inicio, $fim)
                : ($periodo === 'ano' ? $this->seriePorMes($estacaoId, $metrica, $inicio, $fim) : $this->seriePorDia($estacaoId, $metrica, $inicio, $fim)),
            'comparacaoAnterior' => $this->compararComPeriodoAnterior($estacaoId, $periodo, $dataReferencia),
        ];

        if ($periodo === 'dia') {
            $resultado['tabela'] = $this->tabelaPorHora($estacaoId, $inicio, $fim);
        } elseif ($periodo === 'semana') {
            $resultado['tabela'] = $this->tabelaPorDia($estacaoId, $inicio, $fim);
        } elseif ($periodo === 'mes') {
            $resultado['mapaCalor'] = $this->mapaCalorDoMes($estacaoId, $inicio, $fim);
        } elseif ($periodo === 'ano') {
            $resultado['tabela'] = $this->tabelaPorMes($estacaoId, $dataReferencia);
        }

        return $resultado;
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

    private function recordesPorHora(int $estacaoId, Carbon $inicio, Carbon $fim): array
    {
        $leituras = Leitura::where('estacao_id', $estacaoId)
            ->whereBetween('registrado_em', [$inicio, $fim])
            ->get(array_merge(['registrado_em', 'itgu_classificacao'], self::METRICAS));

        $extremo = fn ($metrica, $maior) => $leituras->whereNotNull($metrica)
            ->sortBy([[$metrica, $maior ? 'desc' : 'asc']])->first();

        $tempMax = $extremo('temperatura_ar', true);
        $tempMin = $extremo('temperatura_ar', false);
        $umidMax = $extremo('umidade_ar', true);
        $umidMin = $extremo('umidade_ar', false);
        $uvMax = $extremo('indice_uv', true);
        $pressaoMin = $extremo('pressao', false);
        $itguMax = $extremo('itgu', true);

        $comAlerta = $leituras->where('itgu_classificacao', 'perigo');
        $faixaAlerta = null;
        if ($comAlerta->isNotEmpty()) {
            $ordenado = $comAlerta->sortBy('registrado_em');
            $faixaAlerta = $ordenado->first()->registrado_em->format('H:i') . '–' . $ordenado->last()->registrado_em->format('H:i');
        }

        return [
            'cards' => [
                ['titulo' => 'Hora mais quente', 'valor' => $tempMax?->temperatura_ar, 'unidade' => '°C', 'quando' => $tempMax?->registrado_em?->format('H:i'), 'cor' => 'quente'],
                ['titulo' => 'Hora mais fria', 'valor' => $tempMin?->temperatura_ar, 'unidade' => '°C', 'quando' => $tempMin?->registrado_em?->format('H:i'), 'cor' => 'fria'],
                ['titulo' => 'Maior umidade', 'valor' => $umidMax?->umidade_ar, 'unidade' => '%', 'quando' => $umidMax?->registrado_em?->format('H:i'), 'cor' => 'umida'],
                ['titulo' => 'Menor umidade', 'valor' => $umidMin?->umidade_ar, 'unidade' => '%', 'quando' => $umidMin?->registrado_em?->format('H:i'), 'cor' => 'seca'],
                ['titulo' => 'Pico de UV', 'valor' => $uvMax?->indice_uv, 'unidade' => '', 'quando' => $uvMax?->registrado_em?->format('H:i'), 'cor' => 'uv'],
                ['titulo' => 'Menor pressão', 'valor' => $pressaoMin?->pressao, 'unidade' => ' hPa', 'quando' => $pressaoMin?->registrado_em?->format('H:i'), 'cor' => 'pressao'],
                ['titulo' => 'Maior ITGU', 'valor' => $itguMax?->itgu, 'unidade' => '', 'quando' => $itguMax?->registrado_em?->format('H:i'), 'extra' => $itguMax?->itgu_classificacao, 'cor' => 'quente'],
                ['titulo' => 'Horas em alerta térmico', 'valor' => $comAlerta->count(), 'unidade' => 'h', 'quando' => $faixaAlerta, 'cor' => 'quente'],
            ],
        ];
    }

    private function recordesPorDia(int $estacaoId, Carbon $inicio, Carbon $fim): array
    {
        $porDia = Leitura::where('estacao_id', $estacaoId)
            ->whereBetween('registrado_em', [$inicio, $fim])
            ->selectRaw(
                'DATE(registrado_em) as dia, ' .
                implode(', ', array_map(fn ($m) => "MAX($m) as {$m}_max, MIN($m) as {$m}_min, AVG($m) as {$m}_avg", self::METRICAS))
            )
            ->groupBy('dia')
            ->get();

        $extremo = fn ($campo, $maior) => $porDia->whereNotNull($campo)
            ->sortBy([[$campo, $maior ? 'desc' : 'asc']])->first();

        $tempMax = $extremo('temperatura_ar_max', true);
        $tempMin = $extremo('temperatura_ar_min', false);
        $umidMax = $extremo('umidade_ar_max', true);
        $umidMin = $extremo('umidade_ar_min', false);
        $uvMax = $extremo('indice_uv_max', true);
        $pressaoMin = $extremo('pressao_min', false);
        $itguMax = $extremo('itgu_max', true);

        $diasComAlerta = Leitura::where('estacao_id', $estacaoId)
            ->whereBetween('registrado_em', [$inicio, $fim])
            ->where('itgu_classificacao', 'perigo')
            ->selectRaw('DATE(registrado_em) as dia')
            ->distinct()
            ->count();

        $fmt = fn ($r) => $r ? Carbon::parse($r->dia)->format('d/m') : null;

        return [
            'cards' => [
                ['titulo' => 'Dia mais quente', 'valor' => $tempMax?->temperatura_ar_max, 'unidade' => '°C', 'quando' => $fmt($tempMax), 'cor' => 'quente'],
                ['titulo' => 'Dia mais frio', 'valor' => $tempMin?->temperatura_ar_min, 'unidade' => '°C', 'quando' => $fmt($tempMin), 'cor' => 'fria'],
                ['titulo' => 'Maior umidade', 'valor' => $umidMax?->umidade_ar_max, 'unidade' => '%', 'quando' => $fmt($umidMax), 'cor' => 'umida'],
                ['titulo' => 'Menor umidade', 'valor' => $umidMin?->umidade_ar_min, 'unidade' => '%', 'quando' => $fmt($umidMin), 'cor' => 'seca'],
                ['titulo' => 'Pico de UV', 'valor' => $uvMax?->indice_uv_max, 'unidade' => '', 'quando' => $fmt($uvMax), 'cor' => 'uv'],
                ['titulo' => 'Menor pressão', 'valor' => $pressaoMin?->pressao_min, 'unidade' => ' hPa', 'quando' => $fmt($pressaoMin), 'cor' => 'pressao'],
                ['titulo' => 'Maior ITGU', 'valor' => $itguMax?->itgu_max, 'unidade' => '', 'quando' => $fmt($itguMax), 'cor' => 'quente'],
                ['titulo' => 'Dias em alerta térmico', 'valor' => $diasComAlerta, 'unidade' => ' de ' . $porDia->count(), 'quando' => null, 'cor' => 'quente'],
            ],
        ];
    }

    private function seriePorHora(int $estacaoId, string $metrica, Carbon $inicio, Carbon $fim): array
    {
        $leituras = Leitura::where('estacao_id', $estacaoId)
            ->whereBetween('registrado_em', [$inicio, $fim])
            ->whereNotNull($metrica)
            ->get(['registrado_em', $metrica]);

        $porHora = $leituras->groupBy(fn ($l) => $l->registrado_em->format('H'));

        $inicio7dias = $inicio->copy()->subDays(7)->startOfDay();
        $fim7dias = $inicio->copy()->subDay()->endOfDay();
        $leituras7dias = Leitura::where('estacao_id', $estacaoId)
            ->whereBetween('registrado_em', [$inicio7dias, $fim7dias])
            ->whereNotNull($metrica)
            ->get(['registrado_em', $metrica]);
        $mediaPorHora = $leituras7dias->groupBy(fn ($l) => $l->registrado_em->format('H'));

        $serie = [];
        for ($h = 0; $h < 24; $h++) {
            $chave = sprintf('%02d', $h);
            $grupo = $porHora->get($chave);
            $grupoMedia = $mediaPorHora->get($chave);
            $serie[] = [
                'rotulo' => $chave . ':00',
                'valor' => $grupo ? round($grupo->avg($metrica), 2) : null,
                'media' => $grupoMedia ? round($grupoMedia->avg($metrica), 2) : null,
            ];
        }

        return $serie;
    }

    private function seriePorDia(int $estacaoId, string $metrica, Carbon $inicio, Carbon $fim): array
    {
        $porDia = Leitura::where('estacao_id', $estacaoId)
            ->whereBetween('registrado_em', [$inicio, $fim])
            ->whereNotNull($metrica)
            ->selectRaw("DATE(registrado_em) as dia, MAX($metrica) as maximo")
            ->groupBy('dia')
            ->orderBy('dia')
            ->get()
            ->keyBy(fn ($r) => Carbon::parse($r->dia)->format('Y-m-d'));

        $mediaGeral = $porDia->avg('maximo');

        $serie = [];
        $cursor = $inicio->copy()->startOfDay();
        while ($cursor->lte($fim)) {
            $chave = $cursor->format('Y-m-d');
            $registro = $porDia->get($chave);
            $serie[] = [
                'rotulo' => $cursor->format('d/m'),
                'valor' => $registro ? round($registro->maximo, 2) : null,
                'media' => $mediaGeral ? round($mediaGeral, 2) : null,
            ];
            $cursor->addDay();
        }

        return $serie;
    }

    private function seriePorMes(int $estacaoId, string $metrica, Carbon $inicio, Carbon $fim): array
    {
        $porMes = Leitura::where('estacao_id', $estacaoId)
            ->whereBetween('registrado_em', [$inicio, $fim])
            ->whereNotNull($metrica)
            ->selectRaw("MONTH(registrado_em) as mes, AVG($metrica) as media")
            ->groupBy('mes')
            ->get()
            ->keyBy('mes');

        $serie = [];
        for ($m = 1; $m <= 12; $m++) {
            $registro = $porMes->get($m);
            $serie[] = [
                'rotulo' => self::NOMES_MESES_ABREV[$m],
                'valor' => $registro ? round($registro->media, 2) : null,
            ];
        }

        return $serie;
    }

    private function tabelaPorHora(int $estacaoId, Carbon $inicio, Carbon $fim): array
    {
        $leituras = Leitura::where('estacao_id', $estacaoId)
            ->whereBetween('registrado_em', [$inicio, $fim])
            ->get(['registrado_em', 'temperatura_ar', 'umidade_ar', 'itgu', 'indice_uv']);

        $porHora = $leituras->groupBy(fn ($l) => $l->registrado_em->format('H'));

        $linhas = [];
        foreach ($porHora->sortKeys() as $hora => $grupo) {
            $linhas[] = [
                'rotulo' => $hora . ':00',
                'temperatura_ar' => round($grupo->avg('temperatura_ar'), 1),
                'umidade_ar' => round($grupo->avg('umidade_ar'), 1),
                'itgu' => round($grupo->avg('itgu'), 1),
                'indice_uv' => round($grupo->avg('indice_uv'), 1),
            ];
        }

        return $linhas;
    }

    private function tabelaPorDia(int $estacaoId, Carbon $inicio, Carbon $fim): array
    {
        $porDia = Leitura::where('estacao_id', $estacaoId)
            ->whereBetween('registrado_em', [$inicio, $fim])
            ->selectRaw('DATE(registrado_em) as dia, MAX(temperatura_ar) as maximo, MIN(temperatura_ar) as minimo, AVG(umidade_ar) as umid_media, MAX(itgu_classificacao = "perigo") as teve_alerta')
            ->groupBy('dia')
            ->orderBy('dia')
            ->get();

        return $porDia->map(fn ($r) => [
            'rotulo' => Carbon::parse($r->dia)->translatedFormat('D d/m'),
            'maximo' => round($r->maximo, 1),
            'minimo' => round($r->minimo, 1),
            'umid_media' => round($r->umid_media, 1),
            'teve_alerta' => (bool) $r->teve_alerta,
        ])->values()->toArray();
    }

    private function tabelaPorMes(int $estacaoId, Carbon $dataReferencia): array
    {
        $ano = $dataReferencia->year;

        $porMes = Leitura::where('estacao_id', $estacaoId)
            ->whereYear('registrado_em', $ano)
            ->selectRaw('MONTH(registrado_em) as mes, MAX(temperatura_ar) as maximo, MIN(temperatura_ar) as minimo, AVG(umidade_ar) as umid_media, COUNT(DISTINCT CASE WHEN itgu_classificacao = "perigo" THEN DATE(registrado_em) END) as dias_alerta')
            ->groupBy('mes')
            ->get()
            ->keyBy('mes');

        $linhas = [];
        for ($m = 1; $m <= 12; $m++) {
            $r = $porMes->get($m);
            if (! $r) continue;
            $linhas[] = [
                'rotulo' => self::NOMES_MESES_ABREV[$m],
                'maximo' => round($r->maximo, 1),
                'minimo' => round($r->minimo, 1),
                'umid_media' => round($r->umid_media, 1),
                'dias_alerta' => (int) $r->dias_alerta,
            ];
        }

        return $linhas;
    }

    private function mapaCalorDoMes(int $estacaoId, Carbon $inicio, Carbon $fim): array
    {
        $porDia = Leitura::where('estacao_id', $estacaoId)
            ->whereBetween('registrado_em', [$inicio, $fim])
            ->whereNotNull('temperatura_ar')
            ->selectRaw('DAY(registrado_em) as dia, MAX(temperatura_ar) as maximo')
            ->groupBy('dia')
            ->get()
            ->keyBy('dia');

        $celulas = [];
        for ($d = 1; $d <= $fim->day; $d++) {
            $r = $porDia->get($d);
            $celulas[] = [
                'dia' => $d,
                'valor' => $r ? round($r->maximo, 1) : null,
            ];
        }

        $valores = collect($celulas)->pluck('valor')->filter();

        return [
            'celulas' => $celulas,
            'minimo' => $valores->min(),
            'maximo' => $valores->max(),
        ];
    }

    private function compararComPeriodoAnterior(int $estacaoId, string $periodo, Carbon $dataReferencia): array
    {
        [$inicioAtual, $fimAtual] = $this->intervaloDoPeriodo($periodo, $dataReferencia);

        $dataAnterior = match ($periodo) {
            'semana' => $dataReferencia->copy()->subWeek(),
            'mes' => $dataReferencia->copy()->subMonthNoOverflow(),
            'ano' => $dataReferencia->copy()->subYear(),
            default => $dataReferencia->copy()->subDay(),
        };
        [$inicioAnterior, $fimAnterior] = $this->intervaloDoPeriodo($periodo, $dataAnterior);

        $resumo = function (Carbon $inicio, Carbon $fim) use ($estacaoId) {
            $q = Leitura::where('estacao_id', $estacaoId)->whereBetween('registrado_em', [$inicio, $fim]);
            return [
                'temp_max' => (clone $q)->max('temperatura_ar'),
                'umid_media' => (clone $q)->avg('umidade_ar'),
                'dias_alerta' => (clone $q)->where('itgu_classificacao', 'perigo')
                    ->selectRaw('COUNT(DISTINCT DATE(registrado_em)) as total')->value('total'),
            ];
        };

        $atual = $resumo($inicioAtual, $fimAtual);
        $anterior = $resumo($inicioAnterior, $fimAnterior);

        $delta = fn ($a, $b) => ($a !== null && $b !== null) ? round($a - $b, 1) : null;

        return [
            'temp_max' => $delta($atual['temp_max'], $anterior['temp_max']),
            'umid_media' => $delta($atual['umid_media'], $anterior['umid_media']),
            'dias_alerta' => $delta($atual['dias_alerta'], $anterior['dias_alerta']),
        ];
    }
}
