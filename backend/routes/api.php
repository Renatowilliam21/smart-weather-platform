<?php

use App\Http\Controllers\Api\LeituraController;
use Illuminate\Support\Facades\Route;

Route::middleware('estacao.auth')->group(function () {
    Route::post('/leituras', [LeituraController::class, 'store']);
});