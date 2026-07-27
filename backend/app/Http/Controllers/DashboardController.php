<?php

namespace App\Http\Controllers;

use App\Models\Estacao;
use App\Models\AlertaDisparado;
use App\Models\EstacaoOfflineEvento;
use App\Models\Leitura;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    private const METRICAS_PERMITIDAS = [
        'itgu', 'itu', 'temperatura_ar', 'umidade_ar', 'luminosidade', 'indice_uv',
        'co2_ppm', 'tvoc_ppb', 'aqi',
    ];

    private const PERIODOS_PERMITIDOS = ['dia', 'mes', 'ano'];

    private const NOMES_MESES = [
        '01' => 'Janeiro', '02' => 'Fevereiro', '03' => 'Março', '04' => 'Abril',
        '05' => 'Maio', '06' => 'Junho', '07' => 'Julho', '08' => 'Agosto',
        '09' => 'Setembro', '10' => 'Outubro', '11' => 'Novembro', '12' => 'Dezembro',
    ];

    private const NOMES_MESES_ABREV = [
        '01' => 'Jan', '02' => 'Fev', '03' => 'Mar', '04' => 'Abr', '05' => 'Mai', '06' => 'Jun',
        '07' => 'Jul', '08' => 'Ago', '09' => 'Set', '10' => 'Out', '11' => 'Nov', '12' => 'Dez',
    ];

    public function index(Request $request): Response
    {
        $estacaoId = $request->integer('estacao_id') ?: null;
        $metrica = $request->string('metrica', 'itgu')->toString();
        $periodo = $request->string('periodo', 'dia')->toString();
        $dataReferencia = $this->resolverDataReferencia($request->string('data')->toString());

        return Inertia::render('Dashboard', [
            'estacoes' => $this->estacoesComUltimaLeitura(),
            'serieMetrica' => $this->serieMetricaPorPeriodo($estacaoId, $metrica, $periodo, $dataReferencia),
            'metricasDisponiveis' => self::METRICAS_PERMITIDAS,
            'metricaSelecionada' => $metrica,
            'periodosDisponiveis' => self::PERIODOS_PERMITIDOS,
            'periodoSelecionado' => $periodo,
            'dataReferencia' => $dataReferencia->toDateString(),
            'navegacaoPeriodo' => $this->infoNavegacaoPeriodo($periodo, $dataReferencia),
            'alertasRecentes' => $this->alertasRecentes($estacaoId),
            'estacaoSelecionada' => $estacaoId,
        ]);
    }

    public function refresh(Request $request)
    {
        $estacaoId = $request->integer('estacao_id') ?: null;
        $metrica = $request->string('metrica', 'itgu')->toString();
        $periodo = $request->string('periodo', 'dia')->toString();
        $dataReferencia = $this->resolverDataReferencia($request->string('data')->toString());

        return response()->json([
            'estacoes' => $this->estacoesComUltimaLeitura(),
            'serieMetrica' => $this->serieMetricaPorPeriodo($estacaoId, $metrica, $periodo, $dataReferencia),
            'navegacaoPeriodo' => $this->infoNavegacaoPeriodo($periodo, $dataReferencia),
            'alertasRecentes' => $this->alertasRecentes($estacaoId),
        ]);
    }

    private function resolverDataReferencia(?string $data): Carbon
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

    private function infoNavegacaoPeriodo(string $periodo, Carbon $dataReferencia): array
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

    private function estacoesComUltimaLeitura()
    {
        $idsOffline = EstacaoOfflineEvento::where('resolvido', false)
            ->pluck('estacao_id')
            ->toArray();

        return Estacao::where('ativo', true)
            ->with(['leituras' => function ($query) {
                $query->latest('registrado_em')->limit(1);
            }])
            ->get()
            ->map(function ($estacao) use ($idsOffline) {
                $ultima = $estacao->leituras->first();

                return [
                    'id' => $estacao->id,
                    'nome' => $estacao->nome,
                    'localizacao' => $estacao->localizacao,
                    'latitude' => $estacao->latitude,
                    'longitude' => $estacao->longitude,
                    'offline' => in_array($estacao->id, $idsOffline),
                    'ultima_leitura' => $ultima ? [
                        'temperatura_ar' => $ultima->temperatura_ar,
                        'umidade_ar' => $ultima->umidade_ar,
                        'itgu' => $ultima->itgu,
                        'itgu_classificacao' => $ultima->itgu_classificacao,
                        'registrado_em' => $ultima->registrado_em,
                    ] : null,
                ];
            });
    }

    private function serieMetricaPorPeriodo(?int $estacaoId, string $metrica, string $periodo, Carbon $dataReferencia): array
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

    private function alertasRecentes(?int $estacaoId = null)
    {
        return AlertaDisparado::with(['alertaConfig.estacao', 'leitura'])
            ->when($estacaoId, function ($query) use ($estacaoId) {
                $query->whereHas('alertaConfig', fn ($q) => $q->where('estacao_id', $estacaoId));
            })
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($alerta) {
                return [
                    'id' => $alerta->id,
                    'estacao_nome' => $alerta->alertaConfig->estacao->nome ?? 'N/A',
                    'parametro' => $alerta->alertaConfig->parametro ?? 'N/A',
                    'valor_lido' => $alerta->valor_lido,
                    'valor_limite' => $alerta->alertaConfig->valor_limite ?? null,
                    'resolvido' => $alerta->resolvido,
                    'created_at' => $alerta->created_at,
                ];
            });
    }
}
