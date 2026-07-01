<?php

namespace App\Services;

use App\Models\AlertaConfig;
use App\Models\AlertaDisparado;
use App\Models\Leitura;

class AlertaService
{
    public function verificar(Leitura $leitura): void
    {
        $configs = AlertaConfig::where('estacao_id', $leitura->estacao_id)
            ->where('ativo', true)
            ->get();

        foreach ($configs as $config) {
            $valor = $leitura->{$config->parametro} ?? null;

            if ($valor === null) {
                continue;
            }

            if ($this->violaLimite($valor, $config->operador, $config->valor_limite)) {
                AlertaDisparado::create([
                    'alerta_config_id' => $config->id,
                    'leitura_id' => $leitura->id,
                    'valor_lido' => $valor,
                ]);
            }
        }
    }

    private function violaLimite(float $valor, string $operador, float $limite): bool
    {
        return match ($operador) {
            '>' => $valor > $limite,
            '>=' => $valor >= $limite,
            '<' => $valor < $limite,
            '<=' => $valor <= $limite,
            '=' => $valor == $limite,
            default => false,
        };
    }
}