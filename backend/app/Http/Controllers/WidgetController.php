<?php

namespace App\Http\Controllers;

use App\Models\Estacao;
use Illuminate\Http\Response;

class WidgetController extends Controller
{
    public function estacao(Estacao $estacao): Response
    {
        abort_unless($estacao->ativo, 404);

        $ultimaLeitura = $estacao->leituras()->latest('registrado_em')->first();

        $response = response()->view('widgets.estacao', [
            'estacao' => $estacao,
            'leitura' => $ultimaLeitura,
        ]);

        $response->headers->remove('X-Frame-Options');
        $response->headers->set('Content-Security-Policy', "frame-ancestors *;");

        return $response;
    }
}
