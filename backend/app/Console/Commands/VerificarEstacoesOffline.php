<?php

namespace App\Console\Commands;

use App\Mail\EstacaoOfflineMail;
use App\Mail\EstacaoRecuperadaMail;
use App\Models\Estacao;
use App\Models\EstacaoOfflineEvento;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class VerificarEstacoesOffline extends Command
{
    protected $signature = 'estacoes:verificar-offline';

    protected $description = 'Verifica estacoes sem comunicacao ha mais de 30 minutos e notifica por e-mail';

    private const MINUTOS_LIMITE = 30;

    public function handle(): void
    {
        $estacoes = Estacao::where('ativo', true)->get();

        foreach ($estacoes as $estacao) {
            $ultimaLeitura = $estacao->leituras()->latest('registrado_em')->first();

            $offline = $ultimaLeitura === null
                || $ultimaLeitura->registrado_em->diffInMinutes(now()) >= self::MINUTOS_LIMITE;

            $eventoAtivo = EstacaoOfflineEvento::where('estacao_id', $estacao->id)
                ->where('resolvido', false)
                ->first();

            if ($offline && ! $eventoAtivo) {
                $evento = EstacaoOfflineEvento::create([
                    'estacao_id' => $estacao->id,
                    'detectado_em' => now(),
                ]);

                $this->notificar(new EstacaoOfflineMail($evento));
                $this->info("Estacao offline detectada: {$estacao->nome}");
            }

            if (! $offline && $eventoAtivo) {
                $eventoAtivo->update([
                    'resolvido' => true,
                    'resolvido_em' => now(),
                ]);

                $this->notificar(new EstacaoRecuperadaMail($eventoAtivo));
                $this->info("Estacao recuperada: {$estacao->nome}");
            }
        }
    }

    private function notificar($mailable): void
    {
        $destinatarios = User::pluck('email');

        if ($destinatarios->isEmpty()) {
            return;
        }

        Mail::to($destinatarios->first())
            ->cc($destinatarios->slice(1))
            ->send($mailable);
    }
}
