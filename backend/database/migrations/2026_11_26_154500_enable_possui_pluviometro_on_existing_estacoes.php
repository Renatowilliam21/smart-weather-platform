<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Reativa possui_pluviometro em todas as estações existentes para restaurar
        // imediatamente todos os dados históricos e atuais de chuva após o deploy,
        // mantendo a opção de desmarcar individualmente pelo painel quando desejado.
        DB::table('estacoes')->update(['possui_pluviometro' => true]);

        try {
            Cache::flush();
        } catch (\Throwable) {
            // Ignora caso a tabela de cache ainda não esteja pronta no ambiente de teste.
        }
    }

    public function down(): void
    {
        // Sem reversão destrutiva sobre a escolha do usuário em cada estação.
    }
};
