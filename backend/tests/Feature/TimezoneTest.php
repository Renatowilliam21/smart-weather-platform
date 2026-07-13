<?php

namespace Tests\Feature;

use App\Models\Estacao;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimezoneTest extends TestCase
{
    use RefreshDatabase;

    public function test_timezone_configurado_e_america_fortaleza(): void
    {
        $this->assertEquals('America/Fortaleza', config('app.timezone'));
    }

    public function test_locale_configurado_e_pt_br(): void
    {
        $this->assertEquals('pt_BR', config('app.locale'));
    }

    public function test_php_default_timezone_bate_com_config(): void
    {
        $this->assertEquals(config('app.timezone'), date_default_timezone_get());
    }

    public function test_now_retorna_horario_no_fuso_correto(): void
    {
        $agora = now();

        $this->assertEquals('America/Fortaleza', $agora->getTimezone()->getName());
    }

    public function test_leitura_criada_via_api_usa_timezone_local(): void
    {
        $estacao = Estacao::factory()->create([
            'token_api' => 'token-teste-timezone',
            'ativo' => true,
        ]);

        $antesDoEnvio = now();

        $this->postJson('/api/leituras', [
            'itgu' => 70,
        ], [
            'X-API-Token' => $estacao->token_api,
        ]);

        $depoisDoEnvio = now();

        $leitura = $estacao->leituras()->latest()->first();

        // O horario de registro deve estar dentro da janela de execucao do teste,
        // confirmando que nao ha deslocamento indevido de fuso (ex: +3h de erro).
        $this->assertTrue(
            $leitura->registrado_em->between($antesDoEnvio->subSecond(), $depoisDoEnvio->addSecond())
        );
    }

    public function test_leitura_nao_fica_no_futuro_por_erro_de_fuso(): void
    {
        $estacao = Estacao::factory()->create([
            'token_api' => 'token-teste-futuro',
            'ativo' => true,
        ]);

        $this->postJson('/api/leituras', [
            'itgu' => 70,
        ], [
            'X-API-Token' => $estacao->token_api,
        ]);

        $leitura = $estacao->leituras()->latest()->first();

        // Uma leitura recem-criada nunca deveria aparecer no futuro (isso e o sintoma
        // exato do bug de timezone que tivemos: dados com 3h a mais que o real).
        $this->assertLessThanOrEqual(
            now()->addMinute()->timestamp,
            $leitura->registrado_em->timestamp
        );
    }
}
