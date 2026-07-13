<?php

namespace Tests\Feature;

use App\Models\Estacao;
use App\Models\Leitura;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiV1Test extends TestCase
{
    use RefreshDatabase;

    public function test_rejeita_requisicao_sem_token(): void
    {
        $response = $this->getJson('/api/v1/estacoes');

        $response->assertStatus(401);
    }

    public function test_lista_estacoes_com_token_valido(): void
    {
        $user = User::factory()->create();
        Estacao::factory()->count(2)->create(['ativo' => true]);
        Estacao::factory()->create(['ativo' => false]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/estacoes');

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'data');
    }

    public function test_lista_estacoes_nao_inclui_token_api(): void
    {
        $user = User::factory()->create();
        Estacao::factory()->create(['ativo' => true]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/estacoes');

        $response->assertStatus(200);
        $response->assertJsonMissingPath('data.0.token_api');
    }

    public function test_detalhe_de_estacao_inclui_ultima_leitura(): void
    {
        $user = User::factory()->create();
        $estacao = Estacao::factory()->create(['ativo' => true]);

        Leitura::create([
            'estacao_id' => $estacao->id,
            'itgu' => 70,
            'registrado_em' => now()->subHour(),
        ]);
        $ultima = Leitura::create([
            'estacao_id' => $estacao->id,
            'itgu' => 75,
            'registrado_em' => now(),
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/v1/estacoes/{$estacao->id}");

        $response->assertStatus(200);
        $response->assertJsonPath('data.ultima_leitura.id', $ultima->id);
    }

    public function test_estacao_inexistente_retorna_404(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/estacoes/9999');

        $response->assertStatus(404);
    }

    public function test_lista_leituras_paginada(): void
    {
        $user = User::factory()->create();
        $estacao = Estacao::factory()->create();

        Leitura::factory()->count(30)->create(['estacao_id' => $estacao->id]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/estacoes/{$estacao->id}/leituras?por_pagina=10");

        $response->assertStatus(200);
        $response->assertJsonCount(10, 'data');
        $response->assertJsonPath('per_page', 10);
        $response->assertJsonPath('total', 30);
    }

    public function test_lista_leituras_filtra_por_data(): void
    {
        $user = User::factory()->create();
        $estacao = Estacao::factory()->create();

        Leitura::create([
            'estacao_id' => $estacao->id,
            'itgu' => 70,
            'registrado_em' => now()->subDays(10),
        ]);
        Leitura::create([
            'estacao_id' => $estacao->id,
            'itgu' => 75,
            'registrado_em' => now(),
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/estacoes/{$estacao->id}/leituras?data_inicio=" . now()->subDay()->toDateString());

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
    }

    public function test_token_com_bearer_real_funciona_end_to_end(): void
    {
        $user = User::factory()->create();
        Estacao::factory()->create();

        $token = $user->createToken('teste', ['read'])->plainTextToken;

        $response = $this->withHeaders(['Authorization' => "Bearer {$token}"])
            ->getJson('/api/v1/estacoes');

        $response->assertStatus(200);
    }

    public function test_token_revogado_nao_funciona_mais(): void
    {
        $user = User::factory()->create();
        Estacao::factory()->create();

        $tokenObj = $user->createToken('teste');
        $token = $tokenObj->plainTextToken;

        $tokenObj->accessToken->delete();

        $response = $this->withHeaders(['Authorization' => "Bearer {$token}"])
            ->getJson('/api/v1/estacoes');

        $response->assertStatus(401);
    }
}
