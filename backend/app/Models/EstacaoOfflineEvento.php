<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EstacaoOfflineEvento extends Model
{
    protected $table = 'estacao_offline_eventos';

    protected $fillable = [
        'estacao_id',
        'detectado_em',
        'resolvido',
        'resolvido_em',
    ];

    protected $casts = [
        'detectado_em' => 'datetime',
        'resolvido' => 'boolean',
        'resolvido_em' => 'datetime',
    ];

    public function estacao(): BelongsTo
    {
        return $this->belongsTo(Estacao::class);
    }
}
