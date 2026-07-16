<?php

namespace App\Services;

use App\Mail\AlertaDisparadoMail;
use App\Mail\AlertaResolvidoMail;
use App\Models\AlertaConfig;
use App\Models\AlertaDisparado;
use App\Models\Leitura;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

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
                $jaTinhaAlertaAtivo = AlertaDisparado::where('alerta_config_id', $config->id)
                    ->where('resolvido', false)
                    ->exists();

                $alertaDisparado = AlertaDisparado::create([
                    'alerta_config_id' => $config->id,
                    'leitura_id' => $leitura->id,
                    'valor_lido' => $valor,
                ]);

                // Só notifica se este for o INÍCIO de um novo alerta
                // (não havia nenhum alerta ativo/não-resolvido dessa config antes)
                if (! $jaTinhaAlertaAtivo) {
                    $this->notificarDisparo($alertaDisparado);
                }
            } else {
                // Valor voltou a ficar dentro do limite: resolve automaticamente
                // qualquer alerta ainda ativo para esta configuração.
                $alertaAtivo = AlertaDisparado::where('alerta_config_id', $config->id)
                    ->where('resolvido', false)
                    ->latest()
                    ->first();

                if ($alertaAtivo) {
                    $alertaAtivo->update([
                        'resolvido' => true,
                        'resolvido_em' => now(),
                    ]);

                    $this->notificarResolucao($alertaAtivo);
                }
            }
        }
    }

    private function notificarDisparo(AlertaDisparado $alertaDisparado): void
    {
        $alertaDisparado->load('alertaConfig.estacao');
        $this->enviarPara($alertaDisparado, new AlertaDisparadoMail($alertaDisparado));
    }

    private function notificarResolucao(AlertaDisparado $alertaDisparado): void
    {
        $alertaDisparado->load('alertaConfig.estacao');
        $this->enviarPara($alertaDisparado, new AlertaResolvidoMail($alertaDisparado));
    }

    private function enviarPara(AlertaDisparado $alertaDisparado, $mailable): void
    {
        $destinatarios = User::pluck('email');

        if ($destinatarios->isEmpty()) {
            return;
        }

        Mail::to($destinatarios->first())
            ->cc($destinatarios->slice(1))
            ->send($mailable);
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
