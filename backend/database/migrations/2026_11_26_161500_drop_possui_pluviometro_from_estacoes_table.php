<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('estacoes', 'possui_pluviometro')) {
            Schema::table('estacoes', function (Blueprint $table) {
                $table->dropColumn('possui_pluviometro');
            });
        }

        try {
            Cache::flush();
        } catch (\Throwable) {
            // Ignora caso a tabela de cache ainda não esteja pronta no ambiente de teste.
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('estacoes', 'possui_pluviometro')) {
            Schema::table('estacoes', function (Blueprint $table) {
                $table->boolean('possui_pluviometro')->default(true)->after('ativo');
            });
        }
    }
};
