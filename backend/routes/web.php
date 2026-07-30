<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\EstacaoController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return view('landing');
});

Route::get('/documentacao-api', function () {
    return view('documentacao-api');
})->name('documentacao.api.publica');

Route::get('/privacidade', function () {
    return view('privacidade');
})->name('privacidade');

Route::get('/termos-de-uso', function () {
    return view('termos-de-uso');
})->name('termos-de-uso');

Route::get('/widget/estacoes/{estacao}', [App\Http\Controllers\WidgetController::class, 'estacao'])
    ->name('widget.estacao');

Route::get('/dashboard', [App\Http\Controllers\DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::resource('estacoes', EstacaoController::class)
        ->parameters(['estacoes' => 'estacao']);

    Route::post('/estacoes/{estacao}/regenerar-token', [EstacaoController::class, 'regenerarToken'])
        ->name('estacoes.regenerar-token');



    Route::resource('alertas-config', App\Http\Controllers\AlertaConfigController::class)
    ->parameters(['alertas-config' => 'alertaConfig'])
    ->except(['show']);

    Route::get('/leituras', [App\Http\Controllers\LeituraController::class, 'index'])->name('leituras.index');
    Route::get('/leituras/export', [App\Http\Controllers\LeituraController::class, 'export'])->name('leituras.export');

    Route::post('/alertas/{alertaDisparado}/resolver', [App\Http\Controllers\AlertaDisparadoController::class, 'resolver'])
        ->name('alertas.resolver');
    Route::post('/alertas/{alertaDisparado}/reabrir', [App\Http\Controllers\AlertaDisparadoController::class, 'reabrir'])
        ->name('alertas.reabrir');
    Route::get('/documentacao/sensores', [App\Http\Controllers\DocumentacaoController::class, 'sensores'])
        ->name('documentacao.sensores');

    Route::get('/documentacao/api', function () {
        return \Inertia\Inertia::render('Documentacao/Api');
    })->name('documentacao.api');

    Route::get('/auditoria', [App\Http\Controllers\AuditoriaController::class, 'index'])->name('auditoria.index');

    Route::get('/api-tokens', [App\Http\Controllers\ApiTokenController::class, 'index'])->name('api-tokens.index');
    Route::post('/api-tokens', [App\Http\Controllers\ApiTokenController::class, 'store'])->name('api-tokens.store');
    Route::delete('/api-tokens/{tokenId}', [App\Http\Controllers\ApiTokenController::class, 'destroy'])->name('api-tokens.destroy');
});


require __DIR__.'/auth.php';
