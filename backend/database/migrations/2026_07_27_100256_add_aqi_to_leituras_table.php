<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leituras', function (Blueprint $table) {
            $table->unsignedTinyInteger('aqi')->nullable()->after('tvoc_ppb')
                ->comment('Indice de qualidade do ar UBA (ENS160): 1=excelente a 5=insalubre');
        });
    }

    public function down(): void
    {
        Schema::table('leituras', function (Blueprint $table) {
            $table->dropColumn('aqi');
        });
    }
};
