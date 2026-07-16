<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Estacao;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class EstacaoController extends Controller
{
    public function index(): JsonResponse
    {
        $estacoes = Cache::remember('api_v1_estacoes_lista', now()->addMinutes(5), function () {
            return Estacao::where('ativo', true)
                ->get(['id', 'nome', 'localizacao', 'latitude', 'longitude', 'ativo', 'created_at']);
        });

        return response()->json(['data' => $estacoes]);
    }

    public function show(Estacao $estacao): JsonResponse
    {
        $estacao->loadMissing(['leituras' => function ($query) {
            $query->latest('registrado_em')->limit(1);
        }]);

        return response()->json([
            'data' => [
                'id' => $estacao->id,
                'nome' => $estacao->nome,
                'localizacao' => $estacao->localizacao,
                'latitude' => $estacao->latitude,
                'longitude' => $estacao->longitude,
                'ativo' => $estacao->ativo,
                'ultima_leitura' => $estacao->leituras->first(),
            ],
        ]);
    }
}
