<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alertas_disparados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alerta_config_id')->constrained('alertas_config')->cascadeOnDelete();
            $table->foreignId('leitura_id')->constrained('leituras')->cascadeOnDelete();
            $table->decimal('valor_lido', 10, 4);
            $table->dateTime('notificado_em')->nullable();
            $table->boolean('resolvido')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alertas_disparados');
    }
};
