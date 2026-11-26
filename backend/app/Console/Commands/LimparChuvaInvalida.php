<?php

namespace App\Console\Commands;

use App\Models\Estacao;
use App\Models\Leitura;
use App\Services\ChuvaService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class LimparChuvaInvalida extends Command
{
    protected $signature = 'leituras:limpar-chuva-invalida
        {--estacao=* : IDs específicos de estações para limpar todas as leituras de chuva}
        {--habilitar=* : IDs ou nomes exatos das estações que realmente possuem pluviômetro físico}
        {--dry-run : Apenas simula e mostra quantos registros seriam corrigidos}';

    protected $description = 'Anula (NULL) dados falsos de chuva de estações sem pluviômetro físico ou acima do limite plausível por ciclo';

    public function handle(): int
    {
        $habilitar = array_values(array_filter((array) $this->option('habilitar')));
        $dryRun = (bool) $this->option('dry-run');

        if ($habilitar !== []) {
            $estacoesHabilitar = Estacao::query()
                ->where(function ($q) use ($habilitar) {
                    $ids = array_values(array_filter($habilitar, 'is_numeric'));
                    $nomes = array_values(array_filter($habilitar, fn ($v) => ! is_numeric($v)));

                    if ($ids !== []) {
                        $q->orWhereIn('id', array_map('intval', $ids));
                    }
                    if ($nomes !== []) {
                        $q->orWhereIn('nome', $nomes);
                    }
                })
                ->get();

            foreach ($estacoesHabilitar as $estacao) {
                if (! $dryRun) {
                    $estacao->update(['possui_pluviometro' => true]);
                }
                $this->info(($dryRun ? '[DRY-RUN] Habilitaria' : 'Pluviômetro habilitado na') . " estação #{$estacao->id}: {$estacao->nome}");
            }
        }

        $idsForcados = array_values(array_unique(array_map('intval', (array) $this->option('estacao'))));
        $idsSemPluviometro = Estacao::where('possui_pluviometro', false)->pluck('id')->all();
        $idsLimparTudo = array_values(array_unique(array_merge($idsSemPluviometro, $idsForcados)));

        $afetadasSemSensor = 0;
        if ($idsLimparTudo !== []) {
            $querySemSensor = Leitura::whereIn('estacao_id', $idsLimparTudo)
                ->whereNotNull('chuva_mm');

            $afetadasSemSensor = $dryRun
                ? $querySemSensor->count()
                : $querySemSensor->update(['chuva_mm' => null]);
        }

        $queryForaDeFaixa = Leitura::whereNotNull('chuva_mm')
            ->where(function ($q) {
                $q->where('chuva_mm', '<', 0)
                    ->orWhere('chuva_mm', '>', ChuvaService::MAX_MM_POR_CICLO);
            });

        $afetadasForaDeFaixa = $dryRun
            ? $queryForaDeFaixa->count()
            : $queryForaDeFaixa->update(['chuva_mm' => null]);

        if (! $dryRun) {
            Cache::flush();
        }

        $prefixo = $dryRun ? '[DRY-RUN] ' : '';
        $this->info("{$prefixo}Leituras limpas em estações sem pluviômetro: {$afetadasSemSensor}");
        $this->info("{$prefixo}Leituras limpas por valor fisicamente implausível (> " . ChuvaService::MAX_MM_POR_CICLO . " mm/ciclo): {$afetadasForaDeFaixa}");

        return self::SUCCESS;
    }
}
