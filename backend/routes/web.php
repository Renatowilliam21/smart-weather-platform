<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\EstacaoController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return view('landing');
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
    Route::get('/documentacao/sensores', [App\Http\Controllers\DocumentacaoController::class, 'sensores'])
        ->name('documentacao.sensores');
});

Route::get('/debug-alertas-temp-8k2j9x', function () {
    return response()->json([
        'configs' => \App\Models\AlertaConfig::all(['id', 'estacao_id', 'parametro', 'operador', 'valor_limite', 'ativo']),
        'disparados_ativos' => \App\Models\AlertaDisparado::where('resolvido', false)
            ->get(['id', 'alerta_config_id', 'valor_lido', 'created_at']),
        'total_usuarios' => \App\Models\User::count(),
        'emails_usuarios' => \App\Models\User::pluck('email'),
    ]);
});

require __DIR__.'/auth.php';
