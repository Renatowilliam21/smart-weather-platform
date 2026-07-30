<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leituras', function (Blueprint $table) {
            $table->decimal('indice_calor', 6, 2)->nullable()->after('itu_classificacao')
                ->comment('Indice de Calor NOAA (Rothfusz), em graus Celsius - seguranca humana');
            $table->string('indice_calor_classificacao', 30)->nullable()->after('indice_calor');
        });
    }

    public function down(): void
    {
        Schema::table('leituras', function (Blueprint $table) {
            $table->dropColumn(['indice_calor', 'indice_calor_classificacao']);
        });
    }
};
