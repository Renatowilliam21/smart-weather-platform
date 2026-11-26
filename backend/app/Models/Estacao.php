<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Estacao extends Model
{
    use HasFactory, LogsActivity;

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

    protected static function booted(): void
    {
        static::saved(fn () => Cache::forget('api_v1_estacoes_lista'));
        static::deleted(fn () => Cache::forget('api_v1_estacoes_lista'));
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['nome', 'localizacao', 'latitude', 'longitude', 'ativo'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('estacao');
    }

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
