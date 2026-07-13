<?php

namespace App\Mail;

use App\Models\EstacaoOfflineEvento;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EstacaoOfflineMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public EstacaoOfflineEvento $evento
    ) {}

    public function envelope(): Envelope
    {
        $estacao = $this->evento->estacao->nome ?? 'Estação desconhecida';

        return new Envelope(
            subject: "🔴 Estação sem comunicação — {$estacao}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.estacao-offline',
        );
    }
}
