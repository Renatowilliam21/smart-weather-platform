<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLeituraRequest;
use App\Models\Estacao;
use App\Models\Leitura;
use App\Services\AlertaService;
use App\Services\ChuvaService;
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

        // Blindagem dupla contra chuva inexistente:
        // 1) Estações sem pluviômetro físico nunca persistem chuva_mm.
        // 2) Leituras acima do teto físico plausível por ciclo (ruído elétrico severo /
        //    curto no cabo) têm apenas chuva_mm descartado, preservando os demais sensores
        //    e sem travar a fila FIFO da EEPROM do ESP32 com erro HTTP 422.
        if (
            ! $estacao->possui_pluviometro
            || (isset($dados['chuva_mm']) && (float) $dados['chuva_mm'] > ChuvaService::MAX_MM_POR_CICLO)
        ) {
            $dados['chuva_mm'] = null;
        }

        $leitura = Leitura::create($dados);

        $this->alertaService->verificar($leitura);

        return response()->json([
            'message' => 'Leitura registrada com sucesso.',
            'leitura_id' => $leitura->id,
        ], 201);
    }
}