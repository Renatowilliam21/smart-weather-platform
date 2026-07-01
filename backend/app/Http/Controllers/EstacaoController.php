<?php

namespace App\Http\Controllers;

use App\Models\Estacao;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class EstacaoController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Estacoes/Index', [
            'estacoes' => Estacao::withCount('leituras')
                ->orderBy('nome')
                ->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Estacoes/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $dados = $request->validate([
            'nome' => 'required|string|max:255',
            'localizacao' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'ativo' => 'boolean',
        ]);

        $dados['token_api'] = Str::random(32);

        Estacao::create($dados);

        return redirect()->route('estacoes.index')
            ->with('success', 'Estação criada com sucesso.');
    }

    public function edit(Estacao $estacao): Response
    {
        return Inertia::render('Estacoes/Edit', [
            'estacao' => [
                ...$estacao->toArray(),
                'token_api' => $estacao->token_api, // acesso explícito, ignora $hidden
            ],
        ]);
    }

    public function update(Request $request, Estacao $estacao): RedirectResponse
    {
        $dados = $request->validate([
            'nome' => 'required|string|max:255',
            'localizacao' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'ativo' => 'boolean',
        ]);

        $estacao->update($dados);

        return redirect()->route('estacoes.index')
            ->with('success', 'Estação atualizada com sucesso.');
    }

    public function destroy(Estacao $estacao): RedirectResponse
    {
        $estacao->delete();

        return redirect()->route('estacoes.index')
            ->with('success', 'Estação removida com sucesso.');
    }

    public function regenerarToken(Estacao $estacao): RedirectResponse
    {
        $estacao->update(['token_api' => Str::random(32)]);

        return redirect()->route('estacoes.edit', $estacao)
            ->with('success', 'Token regenerado com sucesso.');
    }
}