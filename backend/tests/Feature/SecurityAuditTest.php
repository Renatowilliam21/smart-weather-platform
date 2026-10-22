<?php

namespace Tests\Feature;

use App\Models\Estacao;
use App\Models\Leitura;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SecurityAuditTest extends TestCase
{
    use RefreshDatabase;

    public function test_autenticacao_rejeita_tokens_vazios_ou_espacos(): void
    {
        $response = $this->postJson('/api/leituras', [
            'itgu' => 75.0,
        ], [
            'X-API-Token' => '   ',
        ]);

        $response->assertStatus(401);
        $response->assertJson(['message' => 'Token não fornecido.']);
    }

    public function test_autenticacao_compara_token_corretamente_com_hash_equals(): void
    {
        $estacao1 = Estacao::factory()->create([
            'token_api' => 'token-secreto-estacao-1-abc123456789',
            'ativo' => true,
        ]);

        $estacao2 = Estacao::factory()->create([
            'token_api' => 'token-secreto-estacao-2-xyz987654321',
            'ativo' => true,
        ]);

        // Token correto da estação 2
        $response = $this->postJson('/api/leituras', [
            'itgu' => 74.5,
            'temperatura_ar' => 28.0,
        ], [
            'X-API-Token' => 'token-secreto-estacao-2-xyz987654321',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('leituras', [
            'estacao_id' => $estacao2->id,
            'itgu' => 74.5,
        ]);
    }

    public function test_protecao_mass_assignment_estacao_id_no_payload_e_ignorado_e_sobrescrito(): void
    {
        $estacaoAutenticada = Estacao::factory()->create([
            'token_api' => Str::random(32),
            'ativo' => true,
        ]);

        $outraEstacao = Estacao::factory()->create([
            'token_api' => Str::random(32),
            'ativo' => true,
        ]);

        // Atacante tenta injetar estacao_id da outra estação no JSON
        $response = $this->postJson('/api/leituras', [
            'estacao_id' => $outraEstacao->id,
            'itgu' => 76.2,
            'temperatura_ar' => 29.5,
        ], [
            'X-API-Token' => $estacaoAutenticada->token_api,
        ]);

        $response->assertStatus(201);

        // A leitura DEVE pertencer à estação autenticada pelo token, NUNCA à estação injetada
        $this->assertDatabaseHas('leituras', [
            'estacao_id' => $estacaoAutenticada->id,
            'itgu' => 76.2,
        ]);
        $this->assertDatabaseMissing('leituras', [
            'estacao_id' => $outraEstacao->id,
            'itgu' => 76.2,
        ]);
    }

    public function test_validacao_rejeita_valores_fora_dos_limites_fisicos(): void
    {
        $estacao = Estacao::factory()->create([
            'token_api' => Str::random(32),
            'ativo' => true,
        ]);

        // Umidade > 100%, ITGU fora da escala
        $response = $this->postJson('/api/leituras', [
            'umidade_ar' => 150.0,
            'itgu' => 999.0,
            'luminosidade' => -10,
        ], [
            'X-API-Token' => $estacao->token_api,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['umidade_ar', 'itgu', 'luminosidade']);
    }

    public function test_validacao_rejeita_injecao_script_em_classificacao(): void
    {
        $estacao = Estacao::factory()->create([
            'token_api' => Str::random(32),
            'ativo' => true,
        ]);

        $response = $this->postJson('/api/leituras', [
            'itgu' => 75.0,
            'itgu_classificacao' => '<script>alert(1)</script>',
        ], [
            'X-API-Token' => $estacao->token_api,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['itgu_classificacao']);
    }

    public function test_exportacao_csv_funciona_com_streaming_e_filtros_validados(): void
    {
        $user = User::factory()->create();
        $estacao = Estacao::factory()->create();

        Leitura::factory()->count(3)->create([
            'estacao_id' => $estacao->id,
            'registrado_em' => now(),
        ]);

        $response = $this->actingAs($user)->get('/leituras/export?data_inicio=' . now()->subDay()->toDateString());

        $response->assertStatus(200);
        $this->assertEquals('text/csv; charset=UTF-8', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('Estação;Data/Hora;', $response->streamedContent());
    }

    public function test_exportacao_csv_rejeita_datas_invalidas(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/leituras/export?data_inicio=data-invalida');

        $response->assertSessionHasErrors(['data_inicio']);
    }
}
