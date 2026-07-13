<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApiTokenController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('ApiTokens/Index', [
            'tokens' => $request->user()->tokens()
                ->select('id', 'name', 'last_used_at', 'created_at')
                ->orderByDesc('created_at')
                ->get(),
            'tokenGerado' => session('token_gerado'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:60',
        ]);

        $token = $request->user()->createToken($request->input('name'), ['read']);

        return redirect()->route('api-tokens.index')
            ->with('token_gerado', $token->plainTextToken);
    }

    public function destroy(Request $request, int $tokenId): RedirectResponse
    {
        $request->user()->tokens()->where('id', $tokenId)->delete();

        return redirect()->route('api-tokens.index')
            ->with('success', 'Token revogado com sucesso.');
    }
}
