<?php

namespace Tests\Feature;

use App\Models\AlertaConfig;
use App\Models\Estacao;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AlertaConfigCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_visitante_nao_autenticado_e_redirecionado_para_login(): void
    {
        $response = $this->get('/alertas-config');

        $response->assertRedirect('/login');
    }

    public function test_usuario_autenticado_ve_listagem(): void
    {
        $user = User::factory()->create();
        $estacao = Estacao::factory()->create();

        AlertaConfig::create([
            'estacao_id' => $estacao->id,
            'parametro' => 'itgu',
            'operador' => '>',
            'valor_limite' => 78,
            'ativo' => true,
        ]);

        $response = $this->actingAs($user)->get('/alertas-config');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('AlertasConfig/Index')
            ->has('alertasConfig', 1)
        );
    }

    public function test_usuario_autenticado_cria_configuracao_de_alerta(): void
    {
        $user = User::factory()->create();
        $estacao = Estacao::factory()->create();

        $response = $this->actingAs($user)->post('/alertas-config', [
            'estacao_id' => $estacao->id,
            'parametro' => 'itgu',
            'operador' => '>',
            'valor_limite' => 80,
            'ativo' => true,
        ]);

        $response->assertRedirect('/alertas-config');

        $this->assertDatabaseHas('alertas_config', [
            'estacao_id' => $estacao->id,
            'parametro' => 'itgu',
            'valor_limite' => 80,
        ]);
    }

    public function test_nao_cria_configuracao_com_parametro_invalido(): void
    {
        $user = User::factory()->create();
        $estacao = Estacao::factory()->create();

        $response = $this->actingAs($user)->post('/alertas-config', [
            'estacao_id' => $estacao->id,
            'parametro' => 'campo_que_nao_existe',
            'operador' => '>',
            'valor_limite' => 80,
        ]);

        $response->assertSessionHasErrors('parametro');
        $this->assertDatabaseCount('alertas_config', 0);
    }

    public function test_nao_cria_configuracao_com_estacao_inexistente(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/alertas-config', [
            'estacao_id' => 9999,
            'parametro' => 'itgu',
            'operador' => '>',
            'valor_limite' => 80,
        ]);

        $response->assertSessionHasErrors('estacao_id');
    }

    public function test_usuario_autenticado_atualiza_configuracao(): void
    {
        $user = User::factory()->create();
        $estacao = Estacao::factory()->create();

        $config = AlertaConfig::create([
            'estacao_id' => $estacao->id,
            'parametro' => 'itgu',
            'operador' => '>',
            'valor_limite' => 78,
            'ativo' => true,
        ]);

        $response = $this->actingAs($user)->put("/alertas-config/{$config->id}", [
            'estacao_id' => $estacao->id,
            'parametro' => 'itgu',
            'operador' => '>',
            'valor_limite' => 85,
            'ativo' => true,
        ]);

        $response->assertRedirect('/alertas-config');
        $this->assertDatabaseHas('alertas_config', [
            'id' => $config->id,
            'valor_limite' => 85,
        ]);
    }

    public function test_usuario_autenticado_remove_configuracao(): void
    {
        $user = User::factory()->create();
        $estacao = Estacao::factory()->create();

        $config = AlertaConfig::create([
            'estacao_id' => $estacao->id,
            'parametro' => 'itgu',
            'operador' => '>',
            'valor_limite' => 78,
            'ativo' => true,
        ]);

        $response = $this->actingAs($user)->delete("/alertas-config/{$config->id}");

        $response->assertRedirect('/alertas-config');
        $this->assertDatabaseMissing('alertas_config', ['id' => $config->id]);
    }
}