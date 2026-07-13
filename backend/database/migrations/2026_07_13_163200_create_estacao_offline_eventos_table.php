<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('estacao_offline_eventos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estacao_id')->constrained('estacoes')->cascadeOnDelete();
            $table->dateTime('detectado_em');
            $table->boolean('resolvido')->default(false);
            $table->dateTime('resolvido_em')->nullable();
            $table->timestamps();

            $table->index(['estacao_id', 'resolvido']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estacao_offline_eventos');
    }
};
