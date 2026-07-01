<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leituras', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estacao_id')->constrained('estacoes')->cascadeOnDelete();

            // Globo negro - DHT22
            $table->decimal('temp_globo_negro', 6, 2)->nullable();
            $table->decimal('umid_globo_negro', 6, 2)->nullable();

            // BME280
            $table->decimal('temperatura_ar', 6, 2)->nullable();
            $table->decimal('umidade_ar', 6, 2)->nullable();
            $table->decimal('pressao', 8, 2)->nullable();
            $table->decimal('altitude', 8, 2)->nullable();

            // UV
            $table->decimal('indice_uv', 5, 2)->nullable();

            // Qualidade do ar
            $table->decimal('co2_ppm', 8, 2)->nullable();
            $table->decimal('tvoc_ppb', 8, 2)->nullable();

            // Meteorologicos fisicos
            $table->decimal('chuva_mm', 8, 2)->nullable();
            $table->decimal('vel_vento', 6, 2)->nullable();
            $table->decimal('dir_vento', 6, 2)->nullable();

            // Solo
            $table->decimal('solo_umidade', 6, 2)->nullable();
            $table->decimal('solo_temperatura', 6, 2)->nullable();
            $table->decimal('solo_condutividade', 8, 4)->nullable();

            // Energia
            $table->decimal('tensao_bateria', 5, 2)->nullable();

            // ITGU calculado
            $table->decimal('itgu', 6, 2)->nullable();
            $table->string('itgu_classificacao', 20)->nullable();

            $table->enum('tipo_agregacao', ['amostra', 'agregado'])->default('amostra');
            $table->dateTime('registrado_em');
            $table->timestamps();

            $table->index(['estacao_id', 'registrado_em']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leituras');
    }
};