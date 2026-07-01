<?php

use App\Http\Controllers\Api\LeituraController;
use Illuminate\Support\Facades\Route;

Route::middleware('estacao.auth')->group(function () {
    Route::post('/leituras', [LeituraController::class, 'store']);
});

Route::middleware('auth:sanctum')->get('/dashboard/refresh', [App\Http\Controllers\DashboardController::class, 'refresh']);