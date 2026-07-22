<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Sentry\Laravel\Integration;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Confia no proxy reverso do Render, para que o Laravel detecte
        // corretamente o esquema (https) e o host originais da requisicao
        // do cliente. Sem isso, geracao de URLs (incluindo os links de
        // paginacao) pode ficar incorreta em producao.
        $middleware->trustProxies(at: '*');

        $middleware->statefulApi();
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\PreventBackHistoryCache::class,
        ]);
        $middleware->alias([
        'estacao.auth' => \App\Http\Middleware\AuthenticateEstacao::class,
    ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        Integration::handles($exceptions);
    })->create();
