<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLeituraRequest;
use App\Models\Estacao;
use App\Models\Leitura;
use App\Services\AlertaService;
use Illuminate\Http\JsonResponse;

class LeituraController extends Controller
{
    public function __construct(
        private AlertaService $alertaService
    ) {}

    public function store(StoreLeituraRequest $request): JsonResponse
    {
        /** @var Estacao $estacao */
        $estacao = $request->attributes->get('estacao');

        $dados = $request->validated();
        $dados['estacao_id'] = $estacao->id;
        $dados['registrado_em'] = $dados['registrado_em'] ?? now();
        $dados['tipo_agregacao'] = $dados['tipo_agregacao'] ?? 'amostra';

        $leitura = Leitura::create($dados);

        $this->alertaService->verificar($leitura);

        return response()->json([
            'message' => 'Leitura registrada com sucesso.',
            'leitura_id' => $leitura->id,
        ], 201);
    }
}