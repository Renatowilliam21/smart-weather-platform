<?php

namespace App\Services;

use App\Models\Estacao;
use App\Models\Leitura;
use Carbon\Carbon;

class SerieMetricaService
{
    public const METRICAS_PERMITIDAS = [
        'itgu', 'itu', 'temperatura_ar', 'umidade_ar', 'luminosidade', 'indice_uv',
        'co2_ppm', 'tvoc_ppb', 'aqi', 'indice_calor',
    ];

    public const PERIODOS_PERMITIDOS = ['dia', 'mes', 'ano'];

    private const NOMES_MESES = [
        '01' => 'Janeiro', '02' => 'Fevereiro', '03' => 'Março', '04' => 'Abril',
        '05' => 'Maio', '06' => 'Junho', '07' => 'Julho', '08' => 'Agosto',
        '09' => 'Setembro', '10' => 'Outubro', '11' => 'Novembro', '12' => 'Dezembro',
    ];

    private const NOMES_MESES_ABREV = [
        '01' => 'Jan', '02' => 'Fev', '03' => 'Mar', '04' => 'Abr', '05' => 'Mai', '06' => 'Jun',
        '07' => 'Jul', '08' => 'Ago', '09' => 'Set', '10' => 'Out', '11' => 'Nov', '12' => 'Dez',
    ];

    public function resolverDataReferencia(?string $data): Carbon
    {
        if (empty($data)) {
            return now()->startOfDay();
        }

        try {
            return Carbon::parse($data)->startOfDay();
        } catch (\Throwable $e) {
            return now()->startOfDay();
        }
    }

    public function infoNavegacaoPeriodo(string $periodo, Carbon $dataReferencia): array
    {
        $hoje = now()->startOfDay();

        if ($periodo === 'mes') {
            $rotulo = self::NOMES_MESES[$dataReferencia->format('m')] . ' de ' . $dataReferencia->format('Y');
            $podeAvancar = ! $dataReferencia->isSameMonth($hoje);
        } elseif ($periodo === 'ano') {
            $rotulo = $dataReferencia->format('Y');
            $podeAvancar = ! $dataReferencia->isSameYear($hoje);
        } else {
            $rotulo = $dataReferencia->isToday()
                ? 'Hoje, ' . $dataReferencia->translatedFormat('d \d\e F \d\e Y')
                : $dataReferencia->translatedFormat('d \d\e F \d\e Y');
            $podeAvancar = ! $dataReferencia->isToday();
        }

        return [
            'rotulo' => $rotulo,
            'pode_avancar' => $podeAvancar,
        ];
    }

    public function serieMetricaPorPeriodo(?int $estacaoId, string $metrica, string $periodo, Carbon $dataReferencia): array
    {
        if (! in_array($metrica, self::METRICAS_PERMITIDAS)) {
            $metrica = 'itgu';
        }

        if (! in_array($periodo, self::PERIODOS_PERMITIDOS)) {
            $periodo = 'dia';
        }

        $estacoes = Estacao::where('ativo', true)
            ->when($estacaoId, fn ($query) => $query->where('id', $estacaoId))
            ->get(['id', 'nome']);

        if ($periodo === 'mes') {
            $inicio = $dataReferencia->copy()->startOfMonth();
            $fim = $dataReferencia->copy()->endOfMonth();
            $formatoAgrupamento = 'd';
            $rotulos = collect(range(1, $fim->day))
                ->mapWithKeys(fn ($dia) => [sprintf('%02d', $dia) => sprintf('%02d', $dia)]);
        } elseif ($periodo === 'ano') {
            $inicio = $dataReferencia->copy()->startOfYear();
            $fim = $dataReferencia->copy()->endOfYear();
            $formatoAgrupamento = 'm';
            $rotulos = collect(self::NOMES_MESES_ABREV);
        } else {
            $inicio = $dataReferencia->copy()->startOfDay();
            $fim = $dataReferencia->copy()->endOfDay();
            $formatoAgrupamento = 'H';
            $rotulos = collect(range(0, 23))
                ->mapWithKeys(fn ($hora) => [sprintf('%02d', $hora) => sprintf('%02d:00', $hora)]);
        }

        $leituras = Leitura::whereBetween('registrado_em', [$inicio, $fim])
            ->whereNotNull($metrica)
            ->when($estacaoId, fn ($query) => $query->where('estacao_id', $estacaoId))
            ->get(['estacao_id', $metrica, 'registrado_em']);

        $mediasIndexadas = [];
        foreach ($leituras->groupBy(fn ($leitura) => $leitura->estacao_id . '_' . $leitura->registrado_em->format($formatoAgrupamento)) as $chaveComposta => $grupo) {
            $mediasIndexadas[$chaveComposta] = round($grupo->avg($metrica), 2);
        }

        $serie = [];
        foreach ($rotulos as $chave => $rotulo) {
            foreach ($estacoes as $estacao) {
                $indice = $estacao->id . '_' . $chave;

                $serie[] = [
                    'estacao_id' => $estacao->id,
                    'rotulo' => $rotulo,
                    'valor' => $mediasIndexadas[$indice] ?? null,
                ];
            }
        }

        return $serie;
    }

    public function minMaxDoDia(int $estacaoId, string $metrica, \Carbon\Carbon $data): array
    {
        return $this->minMaxMultiplasMetricas($estacaoId, [$metrica], $data)[$metrica]
            ?? ['maximo' => null, 'minimo' => null];
    }

    // Busca a leitura inteira do dia em UMA consulta e calcula o min/max de
    // varias metricas em memoria - evita N consultas separadas quando
    // varios campos precisam de min/max ao mesmo tempo (ex: pagina de
    // detalhe da estacao).
    public function minMaxMultiplasMetricas(int $estacaoId, array $metricas, \Carbon\Carbon $data): array
    {
        $metricasValidas = array_values(array_intersect(
            $metricas,
            array_merge(self::METRICAS_PERMITIDAS, ['temp_globo_negro', 'umid_globo_negro'])
        ));

        if (empty($metricasValidas)) {
            return [];
        }

        $inicio = $data->copy()->startOfDay();
        $fim = $data->copy()->endOfDay();

        $colunas = array_merge(['registrado_em'], $metricasValidas);

        $leituras = \App\Models\Leitura::where('estacao_id', $estacaoId)
            ->whereBetween('registrado_em', [$inicio, $fim])
            ->get($colunas);

        $resultado = [];

        foreach ($metricasValidas as $metrica) {
            $comValor = $leituras->whereNotNull($metrica);

            $maximo = $comValor->sortByDesc($metrica)->first();
            $minimo = $comValor->sortBy($metrica)->first();

            $resultado[$metrica] = [
                'maximo' => $maximo ? [
                    'valor' => $maximo->{$metrica},
                    'hora' => $maximo->registrado_em->format('H:i'),
                ] : null,
                'minimo' => $minimo ? [
                    'valor' => $minimo->{$metrica},
                    'hora' => $minimo->registrado_em->format('H:i'),
                ] : null,
            ];
        }

        return $resultado;
    }
}
