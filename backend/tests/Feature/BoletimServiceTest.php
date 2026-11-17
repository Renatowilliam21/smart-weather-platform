<?php

namespace Tests\Feature;

use App\Models\Estacao;
use App\Models\Leitura;
use App\Models\User;
use App\Services\BoletimService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BoletimServiceTest extends TestCase
{
    use RefreshDatabase;

    private Estacao $estacao;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(Carbon::parse('2026-11-17 18:00:00'));
        $this->estacao = Estacao::factory()->create();
    }

    private function leitura(string $quando, array $valores = []): void
    {
        Leitura::factory()->create(array_merge([
            'estacao_id' => $this->estacao->id,
            'registrado_em' => $quando,
            'temperatura_ar' => null,
            'umidade_ar' => null,
            'itgu' => null,
            'itgu_classificacao' => null,
        ], $valores));
    }

    private function gerar(string $periodo, string $metrica = 'temperatura_ar'): array
    {
        return app(BoletimService::class)->gerar($this->estacao->id, $periodo, Carbon::parse('2026-11-17'), $metrica);
    }

    private function semearSemana(): void
    {
        $this->leitura('2026-11-17 10:00:00', ['temperatura_ar' => 30, 'umidade_ar' => 50, 'itgu_classificacao' => 'perigo']);
        $this->leitura('2026-11-17 11:00:00', ['temperatura_ar' => 32, 'umidade_ar' => 60, 'itgu_classificacao' => 'normal']);
        $this->leitura('2026-11-18 10:00:00', ['temperatura_ar' => 28, 'umidade_ar' => 70, 'itgu_classificacao' => 'normal']);
        $this->leitura('2026-11-10 10:00:00', ['temperatura_ar' => 25, 'umidade_ar' => 55]);
    }

    public function test_boletim_do_dia_calcula_recordes_series_tabela_e_comparacao(): void
    {
        $this->leitura('2026-11-17 08:10:00', ['temperatura_ar' => 25, 'umidade_ar' => 80, 'itgu' => 70, 'itgu_classificacao' => 'normal']);
        $this->leitura('2026-11-17 08:40:00', ['temperatura_ar' => 27, 'umidade_ar' => 70, 'itgu' => 72, 'itgu_classificacao' => 'normal']);
        $this->leitura('2026-11-17 14:37:00', ['temperatura_ar' => 34.5, 'umidade_ar' => 40, 'itgu' => 82, 'indice_uv' => 11, 'itgu_classificacao' => 'perigo']);
        $this->leitura('2026-11-17 15:05:00', ['temperatura_ar' => 33, 'umidade_ar' => 42, 'itgu' => 81, 'itgu_classificacao' => 'perigo']);
        // Janela de 7 dias para a linha de média (09/11 fica de fora).
        $this->leitura('2026-11-16 08:00:00', ['temperatura_ar' => 20, 'umidade_ar' => 60, 'itgu_classificacao' => 'perigo']);
        $this->leitura('2026-11-10 08:30:00', ['temperatura_ar' => 22]);
        $this->leitura('2026-11-09 08:00:00', ['temperatura_ar' => 99]);

        $b = $this->gerar('dia');

        $this->assertSame('hora', $b['granularidade']);
        $this->assertSame($b['series']['temperatura_ar'], $b['serieChart']);
        $this->assertCount(24, $b['serieChart']);
        $this->assertEquals(['rotulo' => '08:00', 'valor' => 26.0, 'media' => 21.0], $b['serieChart'][8]);
        $this->assertEquals(['rotulo' => '14:00', 'valor' => 34.5, 'media' => null], $b['serieChart'][14]);
        $this->assertNull($b['serieChart'][3]['valor']);

        $cards = collect($b['recordes']['cards'])->keyBy('titulo');
        $this->assertSame('34.50', $cards['Hora mais quente']['valor']);
        $this->assertSame('14:37', $cards['Hora mais quente']['quando']);
        $this->assertSame('25.00', $cards['Hora mais fria']['valor']);
        $this->assertSame('08:10', $cards['Hora mais fria']['quando']);
        $this->assertSame('40.00', $cards['Menor umidade']['valor']);
        $this->assertSame('11.00', $cards['Pico de UV']['valor']);
        $this->assertNull($cards['Menor pressão']['valor']);
        $this->assertSame('perigo', $cards['Maior ITGU']['extra']);
        $this->assertSame(2, $cards['Horas em alerta térmico']['valor']);
        $this->assertSame('14:37–15:05', $cards['Horas em alerta térmico']['quando']);

        $this->assertSame(['08:00', '14:00', '15:00'], array_column($b['tabela'], 'rotulo'));
        $this->assertEquals(26.0, $b['tabela'][0]['temperatura_ar']);
        $this->assertEquals(75.0, $b['tabela'][0]['umidade_ar']);
        $this->assertNull($b['tabela'][0]['indice_uv']);

        $this->assertEquals(['temp_max' => 14.5, 'umid_media' => -2.0, 'dias_alerta' => 0], $b['comparacaoAnterior']);
    }

    public function test_boletim_da_semana_agrega_por_dia(): void
    {
        $this->semearSemana();

        $b = $this->gerar('semana');

        $this->assertSame('dia', $b['granularidade']);
        $this->assertCount(2, $b['tabela']);
        $this->assertEquals([32.0, 30.0, 55.0, true], [$b['tabela'][0]['maximo'], $b['tabela'][0]['minimo'], $b['tabela'][0]['umid_media'], $b['tabela'][0]['teve_alerta']]);
        $this->assertEquals([28.0, 28.0, 70.0, false], [$b['tabela'][1]['maximo'], $b['tabela'][1]['minimo'], $b['tabela'][1]['umid_media'], $b['tabela'][1]['teve_alerta']]);

        $cards = collect($b['recordes']['cards'])->keyBy('titulo');
        $this->assertSame('32.00', $cards['Dia mais quente']['valor']);
        $this->assertSame('17/11', $cards['Dia mais quente']['quando']);
        $this->assertSame('28.00', $cards['Dia mais frio']['valor']);
        $this->assertSame(1, $cards['Dias em alerta térmico']['valor']);
        $this->assertSame(' de 2', $cards['Dias em alerta térmico']['unidade']);

        $this->assertCount(7, $b['serieChart']);
        $ponto = collect($b['serieChart'])->firstWhere('rotulo', '17/11');
        $this->assertEquals(32.0, $ponto['valor']);
        $this->assertEquals(30.0, $ponto['media']);

        $this->assertEquals(['temp_max' => 7.0, 'umid_media' => 5.0, 'dias_alerta' => 1], $b['comparacaoAnterior']);
    }

    public function test_boletim_do_mes_gera_mapa_de_calor(): void
    {
        $this->semearSemana();

        $b = $this->gerar('mes');

        $celulas = collect($b['mapaCalor']['celulas'])->keyBy('dia');
        $this->assertCount(30, $celulas);
        $this->assertEquals(32.0, $celulas[17]['valor']);
        $this->assertEquals(25.0, $celulas[10]['valor']);
        $this->assertNull($celulas[1]['valor']);
        $this->assertEquals(25.0, $b['mapaCalor']['minimo']);
        $this->assertEquals(32.0, $b['mapaCalor']['maximo']);
        $this->assertNull($b['comparacaoAnterior']['temp_max']);
    }

    public function test_boletim_do_ano_gera_tabela_e_serie_mensal(): void
    {
        $this->semearSemana();
        $this->leitura('2026-03-05 12:00:00', ['temperatura_ar' => 20, 'umidade_ar' => 90]);

        $b = $this->gerar('ano');

        $this->assertSame(['Mar', 'Nov'], array_column($b['tabela'], 'rotulo'));
        $this->assertEquals(['rotulo' => 'Nov', 'maximo' => 32.0, 'minimo' => 25.0, 'umid_media' => 58.8, 'dias_alerta' => 1], $b['tabela'][1]);

        $this->assertCount(12, $b['serieChart']);
        $this->assertEquals(28.75, $b['serieChart'][10]['valor']);
        $this->assertEquals(20.0, $b['serieChart'][2]['valor']);
        $this->assertNull($b['serieChart'][0]['valor']);
    }

    public function test_numero_de_consultas_fica_constante(): void
    {
        $this->semearSemana();

        DB::enableQueryLog();
        $this->gerar('dia');
        $this->assertCount(3, DB::getQueryLog(), 'Boletim do dia deve usar 3 consultas.');

        DB::flushQueryLog();
        $this->gerar('ano');
        $this->assertCount(2, DB::getQueryLog(), 'Boletim do ano deve usar 2 consultas.');
    }

    public function test_cache_evita_recalculo_inclusive_ao_trocar_metrica(): void
    {
        $this->semearSemana();
        $this->gerar('dia');

        DB::enableQueryLog();
        $b = $this->gerar('dia', 'umidade_ar');

        $this->assertCount(0, DB::getQueryLog());
        $this->assertSame('umidade_ar', $b['metrica']);
        $this->assertSame($b['series']['umidade_ar'], $b['serieChart']);
    }

    public function test_tela_do_boletim_envia_payload_enxuto(): void
    {
        $this->semearSemana();

        $this->actingAs(User::factory()->create())
            ->get(route('boletim.show', ['estacao' => $this->estacao->id, 'periodo' => 'dia', 'metrica' => 'invalida']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Boletim/Show')
                ->where('periodo', 'dia')
                ->where('metrica', 'temperatura_ar')
                ->where('estacao.id', $this->estacao->id)
                ->missing('estacao.token_api')
                ->missing('estacao.latitude')
                ->has('boletim.series.umidade_ar', 24)
            );
    }
}

