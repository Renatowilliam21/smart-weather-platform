<?php

namespace App\Services;

use App\Models\Estacao;
use App\Models\Leitura;
use Carbon\Carbon;

/**
 * Calcula o acumulado de chuva em janela horária (mm/h) e classifica a
 * intensidade da precipitação segundo a escala OMM / INMET.
 *
 * O firmware (esp32-estacao / esp32-wemos-rtc-eeprom) acumula pulsos do
 * pluviômetro de báscula por ciclo de agregação (padrão 10 min) e zera o
 * contador ao gravar cada leitura. Portanto, cada linha em `leituras.chuva_mm`
 * guarda apenas os milímetros daquele ciclo; a taxa horária real (mm/h) é a
 * soma dos registros nos últimos 60 minutos.
 */
class ChuvaService
{
    public const LIMITE_MODERADA_MM_H = 2.5;
    public const LIMITE_INTENSA_MM_H = 10.0;
    public const LIMITE_MUITO_INTENSA_MM_H = 50.0;

    /**
     * Teto físico plausível em um único ciclo de agregação (~10 min), baseado no
     * recorde mundial histórico da OMM em 10 min (~126 mm). Acima disso em uma
     * única leitura trata-se de ruído eletromagnético ou disparo espúrio no pino.
     */
    public const MAX_MM_POR_CICLO = 150.0;

    /**
     * Classifica uma taxa de precipitação em mm/h pela escala OMM / INMET.
     *
     * @return array{
     *     chuva_classificacao: string,
     *     chuva_label: string,
     *     chuva_nivel: int,
     *     chovendo: bool
     * }
     */
    public function classificar(?float $chuvaMmHora): array
    {
        if ($chuvaMmHora === null) {
            return $this->resultadoClassificacao('sem_chuva', 'Sem chuva', 0);
        }

        // Evita desvios binários de ponto flutuante em somas decimais (ex: 2.4999999999999996).
        $valor = round($chuvaMmHora, 4);

        if ($valor <= 0.0) {
            return $this->resultadoClassificacao('sem_chuva', 'Sem chuva', 0);
        }

        if ($valor < self::LIMITE_MODERADA_MM_H) {
            return $this->resultadoClassificacao('fraca', 'Chuva fraca', 1);
        }

        if ($valor < self::LIMITE_INTENSA_MM_H) {
            return $this->resultadoClassificacao('moderada', 'Chuva moderada', 2);
        }

        if ($valor < self::LIMITE_MUITO_INTENSA_MM_H) {
            return $this->resultadoClassificacao('intensa', 'Chuva intensa', 3);
        }

        return $this->resultadoClassificacao('muito_intensa', 'Chuva muito intensa', 4);
    }

    /**
     * Monta o payload completo de chuva pronta para serialização (Inertia / JSON).
     *
     * @return array{
     *     chuva_ultima_hora_mm: float|null,
     *     chuva_classificacao: string,
     *     chuva_label: string,
     *     chuva_nivel: int,
     *     chovendo: bool
     * }
     */
    public function resumo(?float $chuvaMmHora): array
    {
        $valorNormalizado = $chuvaMmHora !== null ? round($chuvaMmHora, 2) : null;

        return [
            'chuva_ultima_hora_mm' => $valorNormalizado,
            ...$this->classificar($chuvaMmHora),
        ];
    }

    /**
     * Calcula o acumulado dos últimos 60 minutos e a classificação para uma estação,
     * aproveitando o índice composto (estacao_id, registrado_em).
     */
    public function resumoUltimaHora(int $estacaoId, ?Carbon $referencia = null): array
    {
        $porEstacao = $this->resumoUltimaHoraPorEstacoes([$estacaoId], $referencia);

        return $porEstacao[$estacaoId] ?? $this->resumo(null);
    }

    /**
     * Calcula o acumulado dos últimos 60 minutos para múltiplas estações em uma única
     * consulta SQL agregada (evita consultas N+1 no Dashboard).
     *
     * @param  array<int, int|string>  $estacaoIds
     * @return array<int, array{
     *     chuva_ultima_hora_mm: float|null,
     *     chuva_classificacao: string,
     *     chuva_label: string,
     *     chuva_nivel: int,
     *     chovendo: bool
     * }>
     */
    public function resumoUltimaHoraPorEstacoes(array $estacaoIds, ?Carbon $referencia = null): array
    {
        $ids = array_values(array_unique(array_map('intval', $estacaoIds)));
        if ($ids === []) {
            return [];
        }

        $idsComPluviometro = Estacao::query()->toBase()
            ->whereIn('id', $ids)
            ->where('possui_pluviometro', true)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $agregados = collect();
        if ($idsComPluviometro !== []) {
            $fim = ($referencia ?? now())->copy();
            $inicio = $fim->copy()->subHour();

            $agregados = Leitura::query()->toBase()
                ->whereIn('estacao_id', $idsComPluviometro)
                ->whereBetween('registrado_em', [$inicio, $fim])
                ->where(function ($q) {
                    $q->whereNull('chuva_mm')
                        ->orWhereBetween('chuva_mm', [0, self::MAX_MM_POR_CICLO]);
                })
                ->groupBy('estacao_id')
                ->selectRaw('estacao_id, SUM(chuva_mm) as chuva_soma, COUNT(chuva_mm) as leituras_com_chuva')
                ->get()
                ->keyBy('estacao_id');
        }

        $resultado = [];
        foreach ($ids as $id) {
            if (! in_array($id, $idsComPluviometro, true)) {
                $resultado[$id] = $this->resumo(null);
                continue;
            }

            $linha = $agregados->get($id);
            $temDadosChuva = $linha !== null && (int) $linha->leituras_com_chuva > 0;
            $acumulado = $temDadosChuva ? round((float) $linha->chuva_soma, 2) : null;

            $resultado[$id] = $this->resumo($acumulado);
        }

        return $resultado;
    }

    private function resultadoClassificacao(string $classificacao, string $label, int $nivel): array
    {
        return [
            'chuva_classificacao' => $classificacao,
            'chuva_label' => $label,
            'chuva_nivel' => $nivel,
            'chovendo' => $nivel > 0,
        ];
    }
}

