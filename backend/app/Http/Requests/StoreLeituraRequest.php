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
            'temp_globo_negro' => 'nullable|numeric|between:-80,100',
            'umid_globo_negro' => 'nullable|numeric|between:0,100',
            'temperatura_ar' => 'nullable|numeric|between:-80,80',
            'umidade_ar' => 'nullable|numeric|between:0,100',
            'pressao' => 'nullable|numeric|between:300,1200',
            'altitude' => 'nullable|numeric|between:-500,9000',
            'indice_uv' => 'nullable|numeric|min:0|max:25',
            'luminosidade' => 'nullable|numeric|min:0|max:100',
            'co2_ppm' => 'nullable|numeric|min:0|max:10000',
            'tvoc_ppb' => 'nullable|numeric|min:0|max:60000',
            'aqi' => 'nullable|integer|min:1|max:5',
            'indice_calor' => 'nullable|numeric|between:-50,150',
            'indice_calor_classificacao' => 'nullable|string|max:30|regex:/^[a-zA-Z0-9_\-\s]+$/',
            'chuva_mm' => 'nullable|numeric|min:0|max:2000',
            'vel_vento' => 'nullable|numeric|min:0|max:400',
            'dir_vento' => 'nullable|numeric|between:0,360',
            'solo_umidade' => 'nullable|numeric|between:0,100',
            'solo_temperatura' => 'nullable|numeric|between:-50,80',
            'solo_condutividade' => 'nullable|numeric|min:0|max:20000',
            'tensao_bateria' => 'nullable|numeric|min:0|max:30',
            'itgu' => 'nullable|numeric|between:0,150',
            'itgu_classificacao' => 'nullable|string|max:20|regex:/^[a-zA-Z0-9_\-]+$/',
            'itu' => 'nullable|numeric|between:0,150',
            'itu_classificacao' => 'nullable|string|max:20|regex:/^[a-zA-Z0-9_\-]+$/',
            'tipo_agregacao' => 'nullable|string|in:amostra,agregado',
            'registrado_em' => 'nullable|date',
        ];
    }
}