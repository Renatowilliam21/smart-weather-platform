<?php

namespace App\Http\Controllers;

use App\Models\Estacao;
use App\Models\Leitura;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response as ResponseFacade;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LeituraController extends Controller
{
    public function index(Request $request): Response
    {
        $leituras = $this->leiturasFiltradas($request)
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Leituras/Index', [
            'leituras' => $leituras,
            'estacoes' => Estacao::orderBy('nome')->get(['id', 'nome']),
            'filtros' => $request->only(['estacao_id', 'data_inicio', 'data_fim']),
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $leituras = $this->leiturasFiltradas($request)->get();

        $nomeArquivo = 'leituras_' . now()->format('Y-m-d_His') . '.csv';

        $callback = function () use ($leituras) {
            $handle = fopen('php://output', 'w');

            // BOM para o Excel reconhecer UTF-8 corretamente
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'Estação',
                'Data/Hora',
                'Temp. Ar (°C)',
                'Umidade Ar (%)',
                'Temp. Globo Negro (°C)',
                'ITGU',
                'Classificação ITGU',
                'Pressão (hPa)',
                'Chuva (mm)',
                'Vel. Vento',
                'Umidade Solo (%)',
                'Tensão Bateria (V)',
            ], ';');

            foreach ($leituras as $leitura) {
                fputcsv($handle, [
                    $leitura->estacao->nome ?? 'N/A',
                    $leitura->registrado_em?->format('d/m/Y H:i:s'),
                    $leitura->temperatura_ar,
                    $leitura->umidade_ar,
                    $leitura->temp_globo_negro,
                    $leitura->itgu,
                    $leitura->itgu_classificacao,
                    $leitura->pressao,
                    $leitura->chuva_mm,
                    $leitura->vel_vento,
                    $leitura->solo_umidade,
                    $leitura->tensao_bateria,
                ], ';');
            }

            fclose($handle);
        };

        return ResponseFacade::stream($callback, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$nomeArquivo}\"",
        ]);
    }

    private function leiturasFiltradas(Request $request)
    {
        return Leitura::with('estacao')
            ->when($request->filled('estacao_id'), function ($query) use ($request) {
                $query->where('estacao_id', $request->input('estacao_id'));
            })
            ->when($request->filled('data_inicio'), function ($query) use ($request) {
                $query->where('registrado_em', '>=', $request->input('data_inicio') . ' 00:00:00');
            })
            ->when($request->filled('data_fim'), function ($query) use ($request) {
                $query->where('registrado_em', '<=', $request->input('data_fim') . ' 23:59:59');
            })
            ->orderByDesc('registrado_em');
    }
}