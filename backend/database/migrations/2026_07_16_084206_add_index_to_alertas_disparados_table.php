<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('alertas_disparados', function (Blueprint $table) {
            $table->index(['alerta_config_id', 'resolvido']);
        });
    }

    public function down(): void
    {
        Schema::table('alertas_disparados', function (Blueprint $table) {
            $table->dropIndex(['alerta_config_id', 'resolvido']);
        });
    }
};
