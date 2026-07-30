<?php

use App\Http\Controllers\Api\LeituraController;
use App\Http\Controllers\Api\V1\EstacaoController;
use App\Http\Controllers\Api\V1\LeituraController as LeituraControllerV1;
use Illuminate\Support\Facades\Route;

Route::middleware(['estacao.auth', 'throttle:leituras'])->group(function () {
    Route::post('/leituras', [LeituraController::class, 'store']);
});

Route::middleware('auth:sanctum')->get('/dashboard/refresh', [App\Http\Controllers\DashboardController::class, 'refresh']);

// API pública de consumo (somente leitura, para terceiros)
Route::prefix('v1')
    ->middleware(['auth:sanctum', 'throttle:60,1'])
    ->group(function () {
        Route::get('/estacoes', [EstacaoController::class, 'index']);
        Route::get('/estacoes/{estacao}', [EstacaoController::class, 'show']);
        Route::get('/estacoes/{estacao}/leituras', [LeituraControllerV1::class, 'index']);
    });

