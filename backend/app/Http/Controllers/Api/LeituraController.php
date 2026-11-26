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

        // Proteção contra reenvios duplicados do ESP32 (ex.: quando o servidor local falha
        // e o de produção responde 201, ou em timeout de rede após commit), evitando que
        // SUM(chuva_mm) some o mesmo ciclo várias vezes seguidas ("milímetros do nada").
        $leituraDuplicada = $this->encontrarReenvioDuplicado($estacao->id, $dados, $request->filled('registrado_em'));
        if ($leituraDuplicada !== null) {
            return response()->json([
                'message' => 'Leitura já registrada anteriormente (reenvio ignorado).',
                'leitura_id' => $leituraDuplicada->id,
            ], 200);
        }

        $leitura = Leitura::create($dados);

        $this->alertaService->verificar($leitura);

        return response()->json([
            'message' => 'Leitura registrada com sucesso.',
            'leitura_id' => $leitura->id,
        ], 201);
    }

    private function encontrarReenvioDuplicado(int $estacaoId, array $dados, bool $possuiTimestampExplicito): ?Leitura
    {
        // 1) Com RTC (registrado_em enviado pelo firmware): (estacao_id, registrado_em) identifica o ciclo.
        if ($possuiTimestampExplicito) {
            return Leitura::where('estacao_id', $estacaoId)
                ->where('registrado_em', $dados['registrado_em'])
                ->first();
        }

        // 2) Sem RTC em pacote agregado com chuva > 0: detecta reenvio idêntico do buffer RAM/EEPROM
        //    nos últimos 9 minutos (quando um dos destinos HTTP do ESP32 falha e ele reenvia o mesmo pacote).
        if (
            ($dados['tipo_agregacao'] ?? null) === 'agregado'
            && isset($dados['chuva_mm'])
            && (float) $dados['chuva_mm'] > 0
        ) {
            $ultimaRecente = Leitura::where('estacao_id', $estacaoId)
                ->where('tipo_agregacao', 'agregado')
                ->where('registrado_em', '>=', now()->subMinutes(9))
                ->latest('registrado_em')
                ->first();

            if ($ultimaRecente && $this->pacoteAgregadoIdentico($ultimaRecente, $dados)) {
                return $ultimaRecente;
            }
        }

        return null;
    }

    private function pacoteAgregadoIdentico(Leitura $existente, array $novo): bool
    {
        $camposComparacao = ['temperatura_ar', 'umidade_ar', 'temp_globo_negro', 'itgu', 'chuva_mm', 'vel_vento'];

        foreach ($camposComparacao as $campo) {
            $valorExistente = $existente->{$campo};
            $valorNovo = $novo[$campo] ?? null;

            if ($valorExistente === null && $valorNovo === null) {
                continue;
            }
            if ($valorExistente === null || $valorNovo === null) {
                return false;
            }
            if (round((float) $valorExistente, 2) !== round((float) $valorNovo, 2)) {
                return false;
            }
        }

        return true;
    }
}