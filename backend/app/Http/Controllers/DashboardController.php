<?php

namespace App\Http\Controllers;

use App\Models\Estacao;
use App\Models\AlertaDisparado;
use App\Models\EstacaoOfflineEvento;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $estacaoId = $request->integer('estacao_id') ?: null;

        return Inertia::render('Dashboard', [
            'estacoes' => $this->estacoesComUltimaLeitura(),
            'serieItgu' => $this->serieItguUltimas24h($estacaoId),
            'alertasRecentes' => $this->alertasRecentes($estacaoId),
            'estacaoSelecionada' => $estacaoId,
        ]);
    }

    public function refresh(Request $request)
    {
        $estacaoId = $request->integer('estacao_id') ?: null;

        return response()->json([
            'estacoes' => $this->estacoesComUltimaLeitura(),
            'serieItgu' => $this->serieItguUltimas24h($estacaoId),
            'alertasRecentes' => $this->alertasRecentes($estacaoId),
        ]);
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

    private function serieItguUltimas24h(?int $estacaoId = null)
    {
        $inicioHoje = now()->startOfDay();

        $estacoes = \App\Models\Estacao::where('ativo', true)
            ->when($estacaoId, fn ($query) => $query->where('id', $estacaoId))
            ->get(['id', 'nome']);

        $leituras = \App\Models\Leitura::where('registrado_em', '>=', $inicioHoje)
            ->whereNotNull('itgu')
            ->when($estacaoId, fn ($query) => $query->where('estacao_id', $estacaoId))
            ->get(['estacao_id', 'itgu', 'registrado_em']);

        // Agrupa leituras por estacao + hora, calculando a media de cada bucket
        $mediasPorHoraEEstacao = $leituras
            ->groupBy(fn ($leitura) => $leitura->estacao_id . '_' . $leitura->registrado_em->format('H'))
            ->map(function ($grupo) {
                return [
                    'estacao_id' => $grupo->first()->estacao_id,
                    'hora' => (int) $grupo->first()->registrado_em->format('H'),
                    'itgu' => round($grupo->avg('itgu'), 2),
                ];
            });

        // Monta as 24 horas fixas (00 a 23), preenchendo com null onde nao ha dado
        $serie = [];
        foreach (range(0, 23) as $hora) {
            foreach ($estacoes as $estacao) {
                $bucket = $mediasPorHoraEEstacao->first(function ($item) use ($hora, $estacao) {
                    return $item['hora'] === $hora && $item['estacao_id'] === $estacao->id;
                });

                $serie[] = [
                    'estacao_id' => $estacao->id,
                    'hora' => sprintf('%02d:00', $hora),
                    'itgu' => $bucket['itgu'] ?? null,
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
