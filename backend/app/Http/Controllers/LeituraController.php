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
        $request->validate([
            'estacao_id' => 'nullable|integer',
            'data_inicio' => 'nullable|date',
            'data_fim' => 'nullable|date',
        ]);

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
        $request->validate([
            'estacao_id' => 'nullable|integer',
            'data_inicio' => 'nullable|date',
            'data_fim' => 'nullable|date',
        ]);

        // Mitigação CVE-2026-109618 (RCE via OOM):
        // Usa lazy() com chunks de 500 para streaming com pegada constante de memória O(1)
        $query = $this->leiturasFiltradas($request);
        $nomeArquivo = 'leituras_' . now()->format('Y-m-d_His') . '.csv';

        $callback = function () use ($query) {
            $handle = fopen('php://output', 'w');

            // BOM para o Excel reconhecer UTF-8 corretamente
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'Estação',
                'Data/Hora',
                'Temp. Ar (°C)',
                'Umidade Ar (%)',
                'Temp. Globo Negro (°C)',
                'Umid. Globo Negro (%)',
                'ITGU',
                'Classificação ITGU',
                'ITU',
                'Classificação ITU',
                'Índice de Calor (°C)',
                'Classificação Índice de Calor',
                'Pressão (hPa)',
                'Altitude (m)',
                'Índice UV',
                'Luminosidade (%)',
                'CO2 eq. (ppm)',
                'TVOC (ppb)',
                'AQI',
                'Chuva (mm)',
                'Vel. Vento',
                'Dir. Vento',
                'Umidade Solo (%)',
                'Temp. Solo (°C)',
                'Condutividade Solo',
                'Tensão Bateria (V)',
            ], ';');

            foreach ($query->lazy(500) as $leitura) {
                fputcsv($handle, [
                    $leitura->estacao->nome ?? 'N/A',
                    $leitura->registrado_em?->format('d/m/Y H:i:s'),
                    $leitura->temperatura_ar,
                    $leitura->umidade_ar,
                    $leitura->temp_globo_negro,
                    $leitura->umid_globo_negro,
                    $leitura->itgu,
                    $leitura->itgu_classificacao,
                    $leitura->itu,
                    $leitura->itu_classificacao,
                    $leitura->indice_calor,
                    $leitura->indice_calor_classificacao,
                    $leitura->pressao,
                    $leitura->altitude,
                    $leitura->indice_uv,
                    $leitura->luminosidade,
                    $leitura->co2_ppm,
                    $leitura->tvoc_ppb,
                    $leitura->aqi,
                    $leitura->chuva_mm,
                    $leitura->vel_vento,
                    $leitura->dir_vento,
                    $leitura->solo_umidade,
                    $leitura->solo_temperatura,
                    $leitura->solo_condutividade,
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