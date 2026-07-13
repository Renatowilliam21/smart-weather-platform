<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Estacao;
use App\Models\Leitura;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeituraController extends Controller
{
    public function index(Request $request, Estacao $estacao): JsonResponse
    {
        $request->validate([
            'data_inicio' => 'nullable|date',
            'data_fim' => 'nullable|date',
            'por_pagina' => 'nullable|integer|min:1|max:100',
        ]);

        $leituras = Leitura::where('estacao_id', $estacao->id)
            ->when($request->filled('data_inicio'), function ($query) use ($request) {
                $query->where('registrado_em', '>=', $request->input('data_inicio') . ' 00:00:00');
            })
            ->when($request->filled('data_fim'), function ($query) use ($request) {
                $query->where('registrado_em', '<=', $request->input('data_fim') . ' 23:59:59');
            })
            ->orderByDesc('registrado_em')
            ->paginate($request->input('por_pagina', 25));

        return response()->json($leituras);
    }
}
