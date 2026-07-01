<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Leitura extends Model
{
    use HasFactory;

    protected $fillable = [
        'estacao_id',
        'temp_globo_negro',
        'umid_globo_negro',
        'temperatura_ar',
        'umidade_ar',
        'pressao',
        'altitude',
        'indice_uv',
        'co2_ppm',
        'tvoc_ppb',
        'chuva_mm',
        'vel_vento',
        'dir_vento',
        'solo_umidade',
        'solo_temperatura',
        'solo_condutividade',
        'tensao_bateria',
        'itgu',
        'itgu_classificacao',
        'tipo_agregacao',
        'registrado_em',
    ];

    protected $casts = [
        'registrado_em' => 'datetime',
        'temp_globo_negro' => 'decimal:2',
        'umid_globo_negro' => 'decimal:2',
        'temperatura_ar' => 'decimal:2',
        'umidade_ar' => 'decimal:2',
        'pressao' => 'decimal:2',
        'altitude' => 'decimal:2',
        'indice_uv' => 'decimal:2',
        'co2_ppm' => 'decimal:2',
        'tvoc_ppb' => 'decimal:2',
        'chuva_mm' => 'decimal:2',
        'vel_vento' => 'decimal:2',
        'dir_vento' => 'decimal:2',
        'solo_umidade' => 'decimal:2',
        'solo_temperatura' => 'decimal:2',
        'solo_condutividade' => 'decimal:4',
        'tensao_bateria' => 'decimal:2',
        'itgu' => 'decimal:2',
    ];

    public function estacao(): BelongsTo
    {
        return $this->belongsTo(Estacao::class);
    }

    public function estatisticas(): HasMany
    {
        return $this->hasMany(LeituraEstatistica::class);
    }

    public function alertasDisparados(): HasMany
    {
        return $this->hasMany(AlertaDisparado::class);
    }
}