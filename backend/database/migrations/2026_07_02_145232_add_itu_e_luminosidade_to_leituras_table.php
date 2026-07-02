<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leituras', function (Blueprint $table) {
            $table->decimal('itu', 6, 2)->nullable()->after('itgu_classificacao');
            $table->string('itu_classificacao', 20)->nullable()->after('itu');
            $table->decimal('luminosidade', 8, 2)->nullable()->after('indice_uv');
        });
    }

    public function down(): void
    {
        Schema::table('leituras', function (Blueprint $table) {
            $table->dropColumn(['itu', 'itu_classificacao', 'luminosidade']);
        });
    }
};