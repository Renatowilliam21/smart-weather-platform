<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leituras_estatisticas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('leitura_id')->constrained('leituras')->cascadeOnDelete();
            $table->foreignId('estacao_id')->constrained('estacoes')->cascadeOnDelete();
            $table->string('parametro', 50);
            $table->dateTime('periodo_inicio')->nullable();
            $table->dateTime('periodo_fim')->nullable();
            $table->decimal('valor_max', 10, 4)->nullable();
            $table->decimal('valor_min', 10, 4)->nullable();
            $table->decimal('valor_medio', 10, 4)->nullable();
            $table->decimal('desvio_padrao', 10, 4)->nullable();
            $table->timestamps();

            $table->index(['estacao_id', 'parametro']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leituras_estatisticas');
    }
};