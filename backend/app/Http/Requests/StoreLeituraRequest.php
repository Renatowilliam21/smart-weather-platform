<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeituraRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Autenticação já foi feita pelo middleware estacao.auth
        return true;
    }

    public function rules(): array
    {
        return [
            'temp_globo_negro' => 'nullable|numeric',
            'umid_globo_negro' => 'nullable|numeric',
            'temperatura_ar' => 'nullable|numeric',
            'umidade_ar' => 'nullable|numeric',
            'pressao' => 'nullable|numeric',
            'altitude' => 'nullable|numeric',
            'indice_uv' => 'nullable|numeric',
            'luminosidade' => 'nullable|numeric|min:0|max:100',
            'co2_ppm' => 'nullable|numeric',
            'tvoc_ppb' => 'nullable|numeric',
            'chuva_mm' => 'nullable|numeric',
            'vel_vento' => 'nullable|numeric',
            'dir_vento' => 'nullable|numeric',
            'solo_umidade' => 'nullable|numeric',
            'solo_temperatura' => 'nullable|numeric',
            'solo_condutividade' => 'nullable|numeric',
            'tensao_bateria' => 'nullable|numeric',
            'itgu' => 'nullable|numeric',
            'itgu_classificacao' => 'nullable|string|max:20',
            'itu' => 'nullable|numeric',
            'itu_classificacao' => 'nullable|string|max:20',
            'tipo_agregacao' => 'nullable|in:amostra,agregado',
            'registrado_em' => 'nullable|date',
        ];
    }
}