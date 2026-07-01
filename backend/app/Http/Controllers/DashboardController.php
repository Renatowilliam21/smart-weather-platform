<?php

namespace App\Http\Controllers;

use App\Models\Estacao;
use App\Models\AlertaDisparado;
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
        return Estacao::where('ativo', true)
            ->with(['leituras' => function ($query) {
                $query->latest('registrado_em')->limit(1);
            }])
            ->get()
            ->map(function ($estacao) {
                $ultima = $estacao->leituras->first();

                return [
                    'id' => $estacao->id,
                    'nome' => $estacao->nome,
                    'localizacao' => $estacao->localizacao,
                    'latitude' => $estacao->latitude,
                    'longitude' => $estacao->longitude,
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
        return \App\Models\Leitura::where('registrado_em', '>=', now()->subHours(24))
            ->whereNotNull('itgu')
            ->when($estacaoId, fn ($query) => $query->where('estacao_id', $estacaoId))
            ->orderBy('registrado_em')
            ->get(['estacao_id', 'itgu', 'registrado_em']);
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