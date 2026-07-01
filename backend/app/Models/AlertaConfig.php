<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AlertaConfig extends Model
{
    use HasFactory;

    protected $table = 'alertas_config';

    protected $fillable = [
        'estacao_id',
        'parametro',
        'operador',
        'valor_limite',
        'ativo',
    ];

    protected $casts = [
        'valor_limite' => 'decimal:4',
        'ativo' => 'boolean',
    ];

    public function estacao(): BelongsTo
    {
        return $this->belongsTo(Estacao::class);
    }

    public function disparos(): HasMany
    {
        return $this->hasMany(AlertaDisparado::class, 'alerta_config_id');
    }
}