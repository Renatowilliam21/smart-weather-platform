<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class AlertaConfig extends Model
{
    use HasFactory, LogsActivity;

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

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['estacao_id', 'parametro', 'operador', 'valor_limite', 'ativo'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('alerta_config');
    }

    public function estacao(): BelongsTo
    {
        return $this->belongsTo(Estacao::class);
    }

    public function disparos(): HasMany
    {
        return $this->hasMany(AlertaDisparado::class, 'alerta_config_id');
    }
}
