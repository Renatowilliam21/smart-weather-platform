<?php

namespace Tests\Feature;

use App\Models\Estacao;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EstacaoCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_visitante_nao_autenticado_e_redirecionado_para_login(): void
    {
        $response = $this->get('/estacoes');

        $response->assertRedirect('/login');
    }

    public function test_usuario_autenticado_ve_listagem_de_estacoes(): void
    {
        $user = User::factory()->create();
        Estacao::factory()->count(3)->create();

        $response = $this->actingAs($user)->get('/estacoes');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Estacoes/Index')
            ->has('estacoes', 3)
        );
    }

    public function test_usuario_autenticado_cria_estacao(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/estacoes', [
            'nome' => 'Estação de Teste',
            'localizacao' => 'Boa Viagem-CE',
            'latitude' => -5.1281,
            'longitude' => -39.7286,
            'ativo' => true,
        ]);

        $response->assertRedirect('/estacoes');

        $this->assertDatabaseHas('estacoes', [
            'nome' => 'Estação de Teste',
        ]);

        // O token_api deve ter sido gerado automaticamente (não enviado no request)
        $estacao = Estacao::where('nome', 'Estação de Teste')->first();
        $this->assertNotNull($estacao->token_api);
        $this->assertEquals(32, strlen($estacao->token_api));
    }

    public function test_nao_cria_estacao_sem_nome(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/estacoes', [
            'localizacao' => 'Boa Viagem-CE',
        ]);

        $response->assertSessionHasErrors('nome');
        $this->assertDatabaseCount('estacoes', 0);
    }

    public function test_usuario_autenticado_atualiza_estacao(): void
    {
        $user = User::factory()->create();
        $estacao = Estacao::factory()->create(['nome' => 'Nome Antigo']);

        $response = $this->actingAs($user)->put("/estacoes/{$estacao->id}", [
            'nome' => 'Nome Atualizado',
            'localizacao' => $estacao->localizacao,
            'latitude' => $estacao->latitude,
            'longitude' => $estacao->longitude,
            'ativo' => true,
        ]);

        $response->assertRedirect('/estacoes');
        $this->assertDatabaseHas('estacoes', [
            'id' => $estacao->id,
            'nome' => 'Nome Atualizado',
        ]);
    }

    public function test_usuario_autenticado_remove_estacao(): void
    {
        $user = User::factory()->create();
        $estacao = Estacao::factory()->create();

        $response = $this->actingAs($user)->delete("/estacoes/{$estacao->id}");

        $response->assertRedirect('/estacoes');
        $this->assertDatabaseMissing('estacoes', ['id' => $estacao->id]);
    }

    public function test_usuario_autenticado_regenera_token(): void
    {
        $user = User::factory()->create();
        $estacao = Estacao::factory()->create(['token_api' => 'token-antigo-fixo-32-caracteres!']);

        $response = $this->actingAs($user)->post("/estacoes/{$estacao->id}/regenerar-token");

        $response->assertRedirect();

        $estacao->refresh();
        $this->assertNotEquals('token-antigo-fixo-32-caracteres!', $estacao->token_api);
    }
}