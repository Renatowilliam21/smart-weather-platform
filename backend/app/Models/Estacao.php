<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Estacao extends Model
{
    use HasFactory;

    protected $table = 'estacoes';

    protected $fillable = [
        'nome',
        'localizacao',
        'latitude',
        'longitude',
        'token_api',
        'ativo',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'ativo' => 'boolean',
    ];

    protected $hidden = [
        'token_api',
    ];

    public function leituras(): HasMany
    {
        return $this->hasMany(Leitura::class);
    }

    public function leituraEstatisticas(): HasMany
    {
        return $this->hasMany(LeituraEstatistica::class);
    }

    public function alertasConfig(): HasMany
    {
        return $this->hasMany(AlertaConfig::class);
    }
}