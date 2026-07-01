<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alertas_config', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estacao_id')->constrained('estacoes')->cascadeOnDelete();
            $table->string('parametro', 50);
            $table->enum('operador', ['>', '>=', '<', '<=', '=']);
            $table->decimal('valor_limite', 10, 4);
            $table->boolean('ativo')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alertas_config');
    }
};