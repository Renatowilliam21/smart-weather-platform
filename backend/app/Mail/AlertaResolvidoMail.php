<?php

namespace App\Mail;

use App\Models\AlertaDisparado;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AlertaResolvidoMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public AlertaDisparado $alertaDisparado
    ) {}

    public function envelope(): Envelope
    {
        $estacao = $this->alertaDisparado->alertaConfig->estacao->nome ?? 'Estação desconhecida';

        return new Envelope(
            subject: "🟢 Alerta resolvido automaticamente — {$estacao}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.alerta-resolvido',
        );
    }
}
