<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\EstacaoController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

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
});

require __DIR__.'/auth.php';