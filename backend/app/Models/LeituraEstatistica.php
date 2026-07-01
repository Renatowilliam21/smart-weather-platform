<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeituraEstatistica extends Model
{
    use HasFactory;

    protected $table = 'leituras_estatisticas';

    protected $fillable = [
        'leitura_id',
        'estacao_id',
        'parametro',
        'periodo_inicio',
        'periodo_fim',
        'valor_max',
        'valor_min',
        'valor_medio',
        'desvio_padrao',
    ];

    protected $casts = [
        'periodo_inicio' => 'datetime',
        'periodo_fim' => 'datetime',
        'valor_max' => 'decimal:4',
        'valor_min' => 'decimal:4',
        'valor_medio' => 'decimal:4',
        'desvio_padrao' => 'decimal:4',
    ];

    public function leitura(): BelongsTo
    {
        return $this->belongsTo(Leitura::class);
    }

    public function estacao(): BelongsTo
    {
        return $this->belongsTo(Estacao::class);
    }
}