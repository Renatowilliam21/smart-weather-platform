<?php

namespace App\Http\Controllers;

use App\Models\Estacao;
use App\Services\BoletimService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BoletimController extends Controller
{
    public function __construct(
        private BoletimService $servico
    ) {}

    public function show(Estacao $estacao, Request $request): Response
    {
        $periodo = $request->string('periodo', 'dia')->toString();
        $data = $request->string('data')->toString();
        $metrica = $request->string('metrica', 'temperatura_ar')->toString();

        try {
            $dataReferencia = $data ? \Carbon\Carbon::parse($data) : now();
        } catch (\Throwable $e) {
            $dataReferencia = now();
        }

        $boletim = $this->servico->gerar($estacao->id, $periodo, $dataReferencia, $metrica);

        return Inertia::render('Boletim/Show', [
            // Closure: só é serializada na visita inicial; nas navegações parciais
            // (only: [...]) do front ela nem é avaliada. A tela usa apenas id e nome.
            'estacao' => fn () => $estacao->only(['id', 'nome']),
            'periodo' => $boletim['periodo'],
            'dataReferencia' => $dataReferencia->toDateString(),
            'metrica' => $boletim['metrica'],
            'boletim' => $boletim,
        ]);
    }
}
