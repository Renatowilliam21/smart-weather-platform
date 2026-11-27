<?php

namespace App\Http\Controllers;

use App\Models\AlertaDisparado;
use App\Models\Estacao;
use App\Models\EstacaoOfflineEvento;
use App\Services\SerieMetricaService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private SerieMetricaService $servico
    ) {}

    public function index(Request $request): Response
    {
        $estacaoId = $request->integer('estacao_id') ?: null;
        $metrica = $request->string('metrica', 'itgu')->toString();
        $periodo = $request->string('periodo', 'dia')->toString();
        $dataReferencia = $this->servico->resolverDataReferencia($request->string('data')->toString());

        return Inertia::render('Dashboard', [
            'estacoes' => fn () => $this->estacoesComUltimaLeitura(),
            'serieMetrica' => fn () => $this->servico->serieMetricaPorPeriodo($estacaoId, $metrica, $periodo, $dataReferencia),
            'metricasDisponiveis' => SerieMetricaService::METRICAS_PERMITIDAS,
            'metricaSelecionada' => $metrica,
            'periodosDisponiveis' => SerieMetricaService::PERIODOS_PERMITIDOS,
            'periodoSelecionado' => $periodo,
            'dataReferencia' => $dataReferencia->toDateString(),
            'navegacaoPeriodo' => fn () => $this->servico->infoNavegacaoPeriodo($periodo, $dataReferencia),
            'alertasRecentes' => fn () => $this->alertasRecentes($estacaoId),
            'estacaoSelecionada' => $estacaoId,
        ]);
    }

    public function refresh(Request $request)
    {
        $estacaoId = $request->integer('estacao_id') ?: null;
        $metrica = $request->string('metrica', 'itgu')->toString();
        $periodo = $request->string('periodo', 'dia')->toString();
        $dataReferencia = $this->servico->resolverDataReferencia($request->string('data')->toString());

        return response()->json([
            'estacoes' => $this->estacoesComUltimaLeitura(),
            'serieMetrica' => $this->servico->serieMetricaPorPeriodo($estacaoId, $metrica, $periodo, $dataReferencia),
            'navegacaoPeriodo' => $this->servico->infoNavegacaoPeriodo($periodo, $dataReferencia),
            'alertasRecentes' => $this->alertasRecentes($estacaoId),
        ]);
    }

    public function minMax(Request $request, Estacao $estacao)
    {
        $metrica = $request->string('metrica', 'itgu')->toString();

        return response()->json(
            $this->servico->minMaxDoDia($estacao->id, $metrica, now())
        );
    }

    private function estacoesComUltimaLeitura()
    {
        $idsOffline = EstacaoOfflineEvento::where('resolvido', false)
            ->pluck('estacao_id')
            ->toArray();

        return Estacao::where('ativo', true)
            ->with('ultimaLeitura')
            ->get()
            ->map(function ($estacao) use ($idsOffline) {
                $ultima = $estacao->ultimaLeitura;

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

    private function alertasRecentes(?int $estacaoId = null)
    {
        return AlertaDisparado::with('alertaConfig.estacao')
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
                    'operador' => $alerta->alertaConfig->operador ?? null,
                    'valor_lido' => $alerta->valor_lido,
                    'valor_limite' => $alerta->alertaConfig->valor_limite ?? null,
                    'resolvido' => $alerta->resolvido,
                    'created_at' => $alerta->created_at,
                ];
            });
    }
}
