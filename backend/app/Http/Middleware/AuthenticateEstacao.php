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

        if (! $token) {
            return response()->json(['message' => 'Token não fornecido.'], 401);
        }

        $estacao = Estacao::where('token_api', $token)
            ->where('ativo', true)
            ->first();

        if (! $estacao) {
            return response()->json(['message' => 'Token inválido ou estação inativa.'], 401);
        }

        // Disponibiliza a estação autenticada para o controller
        $request->attributes->set('estacao', $estacao);

        return $next($request);
    }
}