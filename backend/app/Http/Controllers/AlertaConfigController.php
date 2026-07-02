<?php

namespace App\Http\Controllers;

use App\Models\AlertaConfig;
use App\Models\Estacao;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AlertaConfigController extends Controller
{
    private const PARAMETROS_DISPONIVEIS = [
        'temp_globo_negro' => 'Temp. Globo Negro',
        'umid_globo_negro' => 'Umid. Globo Negro',
        'temperatura_ar' => 'Temperatura do Ar',
        'umidade_ar' => 'Umidade do Ar',
        'pressao' => 'Pressão',
        'indice_uv' => 'Índice UV',
        'luminosidade' => 'Luminosidade',
        'co2_ppm' => 'CO2 (ppm)',
        'tvoc_ppb' => 'TVOC (ppb)',
        'chuva_mm' => 'Chuva (mm)',
        'vel_vento' => 'Velocidade do Vento',
        'solo_umidade' => 'Umidade do Solo',
        'solo_temperatura' => 'Temperatura do Solo',
        'tensao_bateria' => 'Tensão da Bateria',
        'itgu' => 'ITGU',
        'itu' => 'ITU',
    ];

    public function index(): Response
    {
        return Inertia::render('AlertasConfig/Index', [
            'alertasConfig' => AlertaConfig::with('estacao')
                ->orderBy('estacao_id')
                ->get()
                ->map(fn ($config) => [
                    'id' => $config->id,
                    'estacao_nome' => $config->estacao->nome ?? 'N/A',
                    'parametro' => $config->parametro,
                    'parametro_label' => self::PARAMETROS_DISPONIVEIS[$config->parametro] ?? $config->parametro,
                    'operador' => $config->operador,
                    'valor_limite' => $config->valor_limite,
                    'ativo' => $config->ativo,
                ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('AlertasConfig/Create', [
            'estacoes' => Estacao::orderBy('nome')->get(['id', 'nome']),
            'parametros' => self::PARAMETROS_DISPONIVEIS,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $dados = $request->validate([
            'estacao_id' => 'required|exists:estacoes,id',
            'parametro' => 'required|string|in:' . implode(',', array_keys(self::PARAMETROS_DISPONIVEIS)),
            'operador' => 'required|in:>,>=,<,<=,=',
            'valor_limite' => 'required|numeric',
            'ativo' => 'boolean',
        ]);

        AlertaConfig::create($dados);

        return redirect()->route('alertas-config.index')
            ->with('success', 'Configuração de alerta criada com sucesso.');
    }

    public function edit(AlertaConfig $alertaConfig): Response
    {
        return Inertia::render('AlertasConfig/Edit', [
            'alertaConfig' => $alertaConfig,
            'estacoes' => Estacao::orderBy('nome')->get(['id', 'nome']),
            'parametros' => self::PARAMETROS_DISPONIVEIS,
        ]);
    }

    public function update(Request $request, AlertaConfig $alertaConfig): RedirectResponse
    {
        $dados = $request->validate([
            'estacao_id' => 'required|exists:estacoes,id',
            'parametro' => 'required|string|in:' . implode(',', array_keys(self::PARAMETROS_DISPONIVEIS)),
            'operador' => 'required|in:>,>=,<,<=,=',
            'valor_limite' => 'required|numeric',
            'ativo' => 'boolean',
        ]);

        $alertaConfig->update($dados);

        return redirect()->route('alertas-config.index')
            ->with('success', 'Configuração de alerta atualizada com sucesso.');
    }

    public function destroy(AlertaConfig $alertaConfig): RedirectResponse
    {
        $alertaConfig->delete();

        return redirect()->route('alertas-config.index')
            ->with('success', 'Configuração de alerta removida com sucesso.');
    }
}