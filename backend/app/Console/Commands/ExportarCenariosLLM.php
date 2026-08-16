<?php

namespace App\Console\Commands;

use App\Models\Estacao;
use App\Models\Leitura;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ExportarCenariosLLM extends Command
{
    protected $signature = 'boletim:exportar-cenarios-llm';
    protected $description = 'Exporta cenarios reais (normal, estresse termico, sensor ausente, mes agregado) de cada estacao para benchmark de LLMs';

    public function handle()
    {
        $estacoes = Estacao::orderBy('nome')->get(['id', 'nome']);

        if ($estacoes->isEmpty()) {
            $this->error('Nenhuma estacao encontrada.');
            return 1;
        }

        $cenarios = [];

        foreach ($estacoes as $estacao) {
            $this->info("Processando estacao: {$estacao->nome}");

            $cenarios[] = $this->cenarioDiaNormal($estacao);
            $cenarios[] = $this->cenarioDiaEstresse($estacao);
            $cenarios[] = $this->cenarioSensorAusente($estacao);
            $cenarios[] = $this->cenarioMesAgregado($estacao);
        }

        $cenarios = array_values(array_filter($cenarios));

        $path = storage_path('app/cenarios_llm.json');
        file_put_contents($path, json_encode($cenarios, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        $this->info("Exportado: {$path}");
        $this->info(count($cenarios) . ' cenarios gerados.');

        return 0;
    }

    private function cenarioDiaNormal(Estacao $estacao): ?array
    {
        $diasMax = Leitura::where('estacao_id', $estacao->id)
            ->whereNotNull('temperatura_ar')
            ->selectRaw('DATE(registrado_em) as dia, MAX(temperatura_ar) as temp_max')
            ->groupBy('dia')
            ->orderBy('dia')
            ->get();

        if ($diasMax->isEmpty()) {
            $this->warn("  [dia_normal] {$estacao->nome}: sem leituras de temperatura_ar.");
            return null;
        }

        $valores = $diasMax->pluck('temp_max')->sort()->values();
        $mediana = $valores[(int) floor($valores->count() / 2)];
        $diaEscolhido = $diasMax->sortBy(fn ($d) => abs($d->temp_max - $mediana))->first()->dia;

        return $this->montarCards($estacao, $diaEscolhido, 'dia_normal');
    }

    private function cenarioDiaEstresse(Estacao $estacao): ?array
    {
        $leitura = Leitura::where('estacao_id', $estacao->id)
            ->whereNotNull('itgu')
            ->orderByDesc('itgu')
            ->first(['registrado_em']);

        if (! $leitura) {
            $this->warn("  [dia_estresse_termico] {$estacao->nome}: sem leituras de ITGU.");
            return null;
        }

        return $this->montarCards($estacao, $leitura->registrado_em->format('Y-m-d'), 'dia_estresse_termico');
    }

    private function cenarioSensorAusente(Estacao $estacao): ?array
    {
        $leitura = Leitura::where('estacao_id', $estacao->id)
            ->whereNull('co2_ppm')
            ->orderByDesc('registrado_em')
            ->first(['registrado_em']);

        if (! $leitura) {
            $this->warn("  [sensor_ausente] {$estacao->nome}: todas as leituras tem co2_ppm preenchido - cenario pulado.");
            return null;
        }

        return $this->montarCards($estacao, $leitura->registrado_em->format('Y-m-d'), 'sensor_ausente', sensorAusente: true);
    }

    private function cenarioMesAgregado(Estacao $estacao): ?array
    {
        $ultimaLeitura = Leitura::where('estacao_id', $estacao->id)->max('registrado_em');
        if (! $ultimaLeitura) {
            $this->warn("  [mes_agregado] {$estacao->nome}: sem nenhuma leitura.");
            return null;
        }

        $mes = Carbon::parse($ultimaLeitura)->startOfMonth();
        $inicio = $mes->copy();
        $fim = $mes->copy()->endOfMonth();

        $this->warn("  [mes_agregado] {$estacao->nome}: mes de referencia = {$mes->format('m/Y')}");

        $base = fn () => Leitura::where('estacao_id', $estacao->id)->whereBetween('registrado_em', [$inicio, $fim]);

        $maxRow = $base()->whereNotNull('temperatura_ar')->orderByDesc('temperatura_ar')->first();
        $minRow = $base()->whereNotNull('temperatura_ar')->orderBy('temperatura_ar')->first();
        $umidMaxRow = $base()->whereNotNull('umidade_ar')->orderByDesc('umidade_ar')->first();
        $umidMinRow = $base()->whereNotNull('umidade_ar')->orderBy('umidade_ar')->first();

        if (! $maxRow || ! $minRow) {
            $this->warn("  [mes_agregado] {$estacao->nome}: sem dados de temperatura no mes de referencia.");
            return null;
        }

        return [
            'estacao' => $estacao->nome,
            'tipo_cenario' => 'mes_agregado',
            'periodo' => 'mes',
            'data' => $mes->format('m/Y'),
            'cards' => array_values(array_filter([
                ['titulo' => 'Dia mais quente do mes', 'valor' => (float) $maxRow->temperatura_ar, 'unidade' => '°C', 'quando' => $maxRow->registrado_em->format('d/m')],
                ['titulo' => 'Dia mais frio do mes', 'valor' => (float) $minRow->temperatura_ar, 'unidade' => '°C', 'quando' => $minRow->registrado_em->format('d/m')],
                $umidMaxRow ? ['titulo' => 'Maior umidade do mes', 'valor' => (float) $umidMaxRow->umidade_ar, 'unidade' => '%', 'quando' => $umidMaxRow->registrado_em->format('d/m')] : null,
                $umidMinRow ? ['titulo' => 'Menor umidade do mes', 'valor' => (float) $umidMinRow->umidade_ar, 'unidade' => '%', 'quando' => $umidMinRow->registrado_em->format('d/m')] : null,
            ])),
        ];
    }

    private function montarCards(Estacao $estacao, string $dia, string $tipoCenario, bool $sensorAusente = false): ?array
    {
        $inicio = Carbon::parse($dia)->startOfDay();
        $fim = Carbon::parse($dia)->endOfDay();
        $base = fn () => Leitura::where('estacao_id', $estacao->id)->whereBetween('registrado_em', [$inicio, $fim]);

        $horaMaisQuente = $base()->whereNotNull('temperatura_ar')->orderByDesc('temperatura_ar')->first();
        $horaMaisFria = $base()->whereNotNull('temperatura_ar')->orderBy('temperatura_ar')->first();
        $maiorUmidade = $base()->whereNotNull('umidade_ar')->orderByDesc('umidade_ar')->first();
        $menorUmidade = $base()->whereNotNull('umidade_ar')->orderBy('umidade_ar')->first();
        $picoUv = $base()->whereNotNull('indice_uv')->orderByDesc('indice_uv')->first();
        $maiorItgu = $base()->whereNotNull('itgu')->orderByDesc('itgu')->first();
        $horasAlerta = $base()->where('itgu_classificacao', 'perigo')
            ->get(['registrado_em'])
            ->map(fn ($l) => $l->registrado_em->format('H'))
            ->unique()
            ->count();

        if (! $horaMaisQuente || ! $horaMaisFria) {
            $this->warn("  [{$tipoCenario}] {$estacao->nome}: sem dados de temperatura_ar no dia {$dia}.");
            return null;
        }

        $cards = [
            ['titulo' => 'Hora mais quente', 'valor' => (float) $horaMaisQuente->temperatura_ar, 'unidade' => '°C', 'quando' => $horaMaisQuente->registrado_em->format('H:i')],
            ['titulo' => 'Hora mais fria', 'valor' => (float) $horaMaisFria->temperatura_ar, 'unidade' => '°C', 'quando' => $horaMaisFria->registrado_em->format('H:i')],
        ];

        if ($maiorUmidade) {
            $cards[] = ['titulo' => 'Maior umidade', 'valor' => (float) $maiorUmidade->umidade_ar, 'unidade' => '%', 'quando' => $maiorUmidade->registrado_em->format('H:i')];
        }
        if ($menorUmidade) {
            $cards[] = ['titulo' => 'Menor umidade', 'valor' => (float) $menorUmidade->umidade_ar, 'unidade' => '%', 'quando' => $menorUmidade->registrado_em->format('H:i')];
        }
        if ($picoUv) {
            $cards[] = ['titulo' => 'Pico de UV', 'valor' => (float) $picoUv->indice_uv, 'unidade' => '', 'quando' => $picoUv->registrado_em->format('H:i')];
        }
        if ($maiorItgu) {
            $cards[] = [
                'titulo' => 'Maior ITGU',
                'valor' => (float) $maiorItgu->itgu,
                'unidade' => '',
                'quando' => $maiorItgu->registrado_em->format('H:i'),
                'extra' => $maiorItgu->itgu_classificacao === 'perigo' ? 'alerta' : null,
            ];
        }
        $cards[] = ['titulo' => 'Horas em alerta termico', 'valor' => $horasAlerta, 'unidade' => 'h', 'quando' => null];

        if ($sensorAusente) {
            $cards[] = ['titulo' => 'CO2 eq.', 'valor' => null, 'unidade' => '', 'quando' => null, 'extra' => 'sem sensor'];
        }

        return [
            'estacao' => $estacao->nome,
            'tipo_cenario' => $tipoCenario,
            'periodo' => 'dia',
            'data' => Carbon::parse($dia)->format('d/m/Y'),
            'cards' => $cards,
        ];
    }
}
