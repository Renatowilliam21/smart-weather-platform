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
/*
Route::get('/debug-alertas-temp-8k2j9x', function () {
    return response()->json([
        'configs' => \App\Models\AlertaConfig::all(['id', 'estacao_id', 'parametro', 'operador', 'valor_limite', 'ativo']),
        'disparados_ativos' => \App\Models\AlertaDisparado::where('resolvido', false)
            ->get(['id', 'alerta_config_id', 'valor_lido', 'created_at']),
        'total_usuarios' => \App\Models\User::count(),
        'emails_usuarios' => \App\Models\User::pluck('email'),
        'brevo_key_tamanho' => strlen((string) config('services.brevo.key')),
        'brevo_key_inicio' => substr((string) config('services.brevo.key'), 0, 8),
        'env_brevo_key_existe' => env('BREVO_API_KEY') ? 'sim' : 'nao',
    ]);
});

Route::get('/debug-resolver-tudo-temp-8k2j9x', function () {
    $quantidade = \App\Models\AlertaDisparado::where('resolvido', false)->update(['resolvido' => true]);
    return response()->json(['resolvidos' => $quantidade]);
});

Route::get('/debug-testar-email-temp-8k2j9x', function () {
    try {
        \Illuminate\Support\Facades\Mail::raw('Teste de envio direto via rota de diagnostico.', function ($mensagem) {
            $mensagem->to('rwsti.com@gmail.com')->subject('Teste Direto - Smart Weather Platform');
        });
        return response()->json(['resultado' => 'sucesso', 'mensagem' => 'Email enviado sem excecoes.']);
    } catch (\Throwable $e) {
        return response()->json([
            'resultado' => 'erro',
            'classe_excecao' => get_class($e),
            'mensagem' => $e->getMessage(),
            'arquivo' => $e->getFile(),
            'linha' => $e->getLine(),
        ]);
    }
});
*/


require __DIR__.'/auth.php';
