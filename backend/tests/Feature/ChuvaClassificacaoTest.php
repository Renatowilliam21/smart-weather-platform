<?php

namespace Tests\Feature;

use App\Models\Estacao;
use App\Models\Leitura;
use App\Models\User;
use App\Services\ChuvaService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ChuvaClassificacaoTest extends TestCase
{
    use RefreshDatabase;

    private ChuvaService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(Carbon::parse('2026-11-19 14:30:00'));
        $this->service = app(ChuvaService::class);
    }

    public static function limitesOmmInmetProvider(): array
    {
        return [
            'nulo' => [null, 'sem_chuva', 'Sem chuva', 0, false],
            'zero' => [0.0, 'sem_chuva', 'Sem chuva', 0, false],
            'minima_fraca' => [0.01, 'fraca', 'Chuva fraca', 1, true],
            'meio_milimetro_fraca' => [0.5, 'fraca', 'Chuva fraca', 1, true],
            'limite_superior_fraca' => [2.49, 'fraca', 'Chuva fraca', 1, true],
            'inicio_moderada' => [2.5, 'moderada', 'Chuva moderada', 2, true],
            'meio_moderada' => [6.0, 'moderada', 'Chuva moderada', 2, true],
            'limite_superior_moderada' => [9.99, 'moderada', 'Chuva moderada', 2, true],
            'inicio_intensa' => [10.0, 'intensa', 'Chuva intensa', 3, true],
            'meio_intensa' => [30.0, 'intensa', 'Chuva intensa', 3, true],
            'limite_superior_intensa' => [49.99, 'intensa', 'Chuva intensa', 3, true],
            'inicio_muito_intensa' => [50.0, 'muito_intensa', 'Chuva muito intensa', 4, true],
            'extrema_muito_intensa' => [92.5, 'muito_intensa', 'Chuva muito intensa', 4, true],
        ];
    }

    #[DataProvider('limitesOmmInmetProvider')]
    public function test_classifica_todos_os_limites_da_escala_omm_inmet(
        ?float $mmHora,
        string $classificacaoEsperada,
        string $labelEsperado,
        int $nivelEsperado,
        bool $chovendoEsperado
    ): void {
        $resultado = $this->service->classificar($mmHora);

        $this->assertSame($classificacaoEsperada, $resultado['chuva_classificacao']);
        $this->assertSame($labelEsperado, $resultado['chuva_label']);
        $this->assertSame($nivelEsperado, $resultado['chuva_nivel']);
        $this->assertSame($chovendoEsperado, $resultado['chovendo']);
    }

    public function test_calcula_acumulado_dos_ultimos_60_minutos_somando_ciclos_e_ignorando_leituras_antigas(): void
    {
        $estacao = Estacao::factory()->create();

        // 6 ciclos de 10 minutos na última hora com 0.5 mm cada = 3.0 mm/h (Chuva moderada),
        // embora nenhuma leitura isolada passe de 2.5 mm.
        foreach ([5, 15, 25, 35, 45, 55] as $minutosAtras) {
            Leitura::factory()->create([
                'estacao_id' => $estacao->id,
                'chuva_mm' => 0.50,
                'registrado_em' => now()->subMinutes($minutosAtras),
            ]);
        }

        // Leitura fora da janela de 60 minutos (61 min atrás) não deve entrar no cálculo.
        Leitura::factory()->create([
            'estacao_id' => $estacao->id,
            'chuva_mm' => 25.00,
            'registrado_em' => now()->subMinutes(61),
        ]);

        $resumo = $this->service->resumoUltimaHora($estacao->id);

        $this->assertSame(3.0, $resumo['chuva_ultima_hora_mm']);
        $this->assertSame('moderada', $resumo['chuva_classificacao']);
        $this->assertSame('Chuva moderada', $resumo['chuva_label']);
        $this->assertSame(2, $resumo['chuva_nivel']);
        $this->assertTrue($resumo['chovendo']);
    }

    public function test_estacao_sem_leituras_ou_com_chuva_nula_retorna_sem_chuva(): void
    {
        $estacaoSemLeituras = Estacao::factory()->create();
        $estacaoSemPluviometro = Estacao::factory()->create();

        Leitura::factory()->create([
            'estacao_id' => $estacaoSemPluviometro->id,
            'chuva_mm' => null,
            'registrado_em' => now()->subMinutes(10),
        ]);

        $porEstacao = $this->service->resumoUltimaHoraPorEstacoes([
            $estacaoSemLeituras->id,
            $estacaoSemPluviometro->id,
        ]);

        foreach ([$estacaoSemLeituras->id, $estacaoSemPluviometro->id] as $id) {
            $this->assertNull($porEstacao[$id]['chuva_ultima_hora_mm']);
            $this->assertSame('sem_chuva', $porEstacao[$id]['chuva_classificacao']);
            $this->assertSame('Sem chuva', $porEstacao[$id]['chuva_label']);
            $this->assertSame(0, $porEstacao[$id]['chuva_nivel']);
            $this->assertFalse($porEstacao[$id]['chovendo']);
        }
    }

    public function test_estacao_com_leituras_zeradas_retorna_zero_e_sem_chuva(): void
    {
        $estacao = Estacao::factory()->create();

        Leitura::factory()->create([
            'estacao_id' => $estacao->id,
            'chuva_mm' => 0.00,
            'registrado_em' => now()->subMinutes(10),
        ]);

        $resumo = $this->service->resumoUltimaHora($estacao->id);

        $this->assertSame(0.0, $resumo['chuva_ultima_hora_mm']);
        $this->assertSame('sem_chuva', $resumo['chuva_classificacao']);
        $this->assertSame('Sem chuva', $resumo['chuva_label']);
        $this->assertFalse($resumo['chovendo']);
    }

    public function test_detalhe_da_estacao_e_dashboard_retornam_classificacao_de_chuva_no_inertia(): void
    {
        $user = User::factory()->create();
        $estacaoChuvosa = Estacao::factory()->create(['ativo' => true]);
        $estacaoSeca = Estacao::factory()->create(['ativo' => true]);

        Leitura::factory()->create([
            'estacao_id' => $estacaoChuvosa->id,
            'chuva_mm' => 6.00,
            'registrado_em' => now()->subMinutes(20),
        ]);
        Leitura::factory()->create([
            'estacao_id' => $estacaoChuvosa->id,
            'chuva_mm' => 6.50,
            'registrado_em' => now()->subMinutes(10),
        ]);
        Leitura::factory()->create([
            'estacao_id' => $estacaoSeca->id,
            'chuva_mm' => 0.00,
            'registrado_em' => now()->subMinutes(5),
        ]);

        $this->actingAs($user)
            ->get(route('estacoes.show', $estacaoChuvosa->id))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Estacoes/Detalhe')
                ->where('chuvaAtual.chuva_ultima_hora_mm', 12.5)
                ->where('chuvaAtual.chuva_classificacao', 'intensa')
                ->where('chuvaAtual.chuva_label', 'Chuva intensa')
                ->where('chuvaAtual.chuva_nivel', 3)
                ->where('chuvaAtual.chovendo', true)
            );

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard')
                ->where('estacoes', function ($estacoes) use ($estacaoChuvosa, $estacaoSeca) {
                    $chuvosa = $estacoes->firstWhere('id', $estacaoChuvosa->id);
                    $seca = $estacoes->firstWhere('id', $estacaoSeca->id);

                    return $chuvosa !== null
                        && (float) $chuvosa['chuva_atual']['chuva_ultima_hora_mm'] === 12.5
                        && $chuvosa['chuva_atual']['chuva_classificacao'] === 'intensa'
                        && $chuvosa['chuva_atual']['chovendo'] === true
                        && $seca !== null
                        && (float) $seca['chuva_atual']['chuva_ultima_hora_mm'] === 0.0
                        && $seca['chuva_atual']['chuva_classificacao'] === 'sem_chuva'
                        && $seca['chuva_atual']['chovendo'] === false;
                })
            );

        $respostaRefresh = $this->actingAs($user, 'sanctum')
            ->getJson('/api/dashboard/refresh')
            ->assertOk();

        $estacoesRefresh = collect($respostaRefresh->json('estacoes'))->keyBy('id');
        $this->assertSame('intensa', $estacoesRefresh[$estacaoChuvosa->id]['chuva_atual']['chuva_classificacao']);
        $this->assertSame('sem_chuva', $estacoesRefresh[$estacaoSeca->id]['chuva_atual']['chuva_classificacao']);
    }
}
