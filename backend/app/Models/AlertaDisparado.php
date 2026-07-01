<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlertaDisparado extends Model
{
    use HasFactory;

    protected $table = 'alertas_disparados';

    protected $fillable = [
        'alerta_config_id',
        'leitura_id',
        'valor_lido',
        'notificado_em',
        'resolvido',
    ];

    protected $casts = [
        'valor_lido' => 'decimal:4',
        'notificado_em' => 'datetime',
        'resolvido' => 'boolean',
    ];

    public function alertaConfig(): BelongsTo
    {
        return $this->belongsTo(AlertaConfig::class, 'alerta_config_id');
    }

    public function leitura(): BelongsTo
    {
        return $this->belongsTo(Leitura::class);
    }
}