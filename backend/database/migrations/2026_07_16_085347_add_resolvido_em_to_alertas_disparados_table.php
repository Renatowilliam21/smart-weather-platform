<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('alertas_disparados', function (Blueprint $table) {
            $table->dateTime('resolvido_em')->nullable()->after('resolvido');
        });
    }

    public function down(): void
    {
        Schema::table('alertas_disparados', function (Blueprint $table) {
            $table->dropColumn('resolvido_em');
        });
    }
};
