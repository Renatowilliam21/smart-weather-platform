<?php

namespace App\Http\Middleware;

use App\Models\Estacao;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateEstacao
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->header('X-API-Token');

        if (! is_string($token) || trim($token) === '') {
            return response()->json(['message' => 'Token não fornecido.'], 401);
        }

        // Proteção contra Timing Attacks via comparação em tempo constante com hash_equals()
        $estacaoAutenticada = null;
        $estacoes = Estacao::where('ativo', true)->get();

        foreach ($estacoes as $estacao) {
            if (is_string($estacao->token_api) && hash_equals($estacao->token_api, $token)) {
                $estacaoAutenticada = $estacao;
            }
        }

        if (! $estacaoAutenticada) {
            return response()->json(['message' => 'Token inválido ou estação inativa.'], 401);
        }

        // Disponibiliza a estação autenticada para o controller
        $request->attributes->set('estacao', $estacaoAutenticada);

        return $next($request);
    }
}