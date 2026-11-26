<?php

namespace Tests\Feature;

use App\Models\AlertaConfig;
use App\Models\AlertaDisparado;
use App\Models\Estacao;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class LeituraApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_rejeita_requisicao_sem_token(): void
    {
        $response = $this->postJson('/api/leituras', [
            'itgu' => 75.0,
        ]);

        $response->assertStatus(401);
    }

    public function test_rejeita_token_invalido(): void
    {
        $response = $this->postJson('/api/leituras', [
            'itgu' => 75.0,
        ], [
            'X-API-Token' => 'token-inexistente',
        ]);

        $response->assertStatus(401);
    }

    public function test_rejeita_estacao_inativa(): void
    {
        $estacao = Estacao::factory()->create([
            'token_api' => Str::random(32),
            'ativo' => false,
        ]);

        $response = $this->postJson('/api/leituras', [
            'itgu' => 75.0,
        ], [
            'X-API-Token' => $estacao->token_api,
        ]);

        $response->assertStatus(401);
    }

    public function test_cria_leitura_com_token_valido(): void
    {
        $estacao = Estacao::factory()->create([
            'token_api' => Str::random(32),
            'ativo' => true,
        ]);

        $response = $this->postJson('/api/leituras', [
            'temp_globo_negro' => 32.5,
            'umidade_ar' => 58.5,
            'itgu' => 75.0,
            'itgu_classificacao' => 'normal',
        ], [
            'X-API-Token' => $estacao->token_api,
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure(['message', 'leitura_id']);

        $this->assertDatabaseHas('leituras', [
            'estacao_id' => $estacao->id,
            'itgu' => 75.0,
        ]);
    }

    public function test_valida_campos_com_tipos_invalidos(): void
    {
        $estacao = Estacao::factory()->create([
            'token_api' => Str::random(32),
            'ativo' => true,
        ]);

        $response = $this->postJson('/api/leituras', [
            'itgu' => 'nao-e-um-numero',
        ], [
            'X-API-Token' => $estacao->token_api,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['itgu']);
    }

    public function test_dispara_alerta_quando_limite_e_ultrapassado(): void
    {
        $estacao = Estacao::factory()->create([
            'token_api' => Str::random(32),
            'ativo' => true,
        ]);

        AlertaConfig::create([
            'estacao_id' => $estacao->id,
            'parametro' => 'itgu',
            'operador' => '>',
            'valor_limite' => 78,
            'ativo' => true,
        ]);

        $this->postJson('/api/leituras', [
            'itgu' => 85.0,
        ], [
            'X-API-Token' => $estacao->token_api,
        ]);

        $this->assertDatabaseHas('alertas_disparados', [
            'valor_lido' => 85.0000,
        ]);
    }

    public function test_nao_dispara_alerta_quando_dentro_do_limite(): void
    {
        $estacao = Estacao::factory()->create([
            'token_api' => Str::random(32),
            'ativo' => true,
        ]);

        AlertaConfig::create([
            'estacao_id' => $estacao->id,
            'parametro' => 'itgu',
            'operador' => '>',
            'valor_limite' => 78,
            'ativo' => true,
        ]);

        $this->postJson('/api/leituras', [
            'itgu' => 70.0,
        ], [
            'X-API-Token' => $estacao->token_api,
        ]);

        $this->assertDatabaseCount('alertas_disparados', 0);
    }

    public function test_nao_envia_email_repetido_para_alerta_ja_ativo(): void
    {
        Mail::fake();

        $estacao = Estacao::factory()->create([
            'token_api' => Str::random(32),
            'ativo' => true,
        ]);

        User::factory()->create(['email' => 'admin@teste.com']);

        $config = AlertaConfig::create([
            'estacao_id' => $estacao->id,
            'parametro' => 'itgu',
            'operador' => '>',
            'valor_limite' => 78,
            'ativo' => true,
        ]);

        // Primeira leitura que ultrapassa o limite: deve notificar
        $this->postJson('/api/leituras', ['itgu' => 85.0], [
            'X-API-Token' => $estacao->token_api,
        ]);

        // Segunda leitura, ainda ultrapassando: NÃO deve notificar de novo
        $this->postJson('/api/leituras', ['itgu' => 90.0], [
            'X-API-Token' => $estacao->token_api,
        ]);

        Mail::assertSent(\App\Mail\AlertaDisparadoMail::class, 1);
    }

    public function test_ignora_chuva_mm_em_estacao_sem_pluviometro_preservando_demais_sensores(): void
    {
        $estacao = Estacao::factory()->create([
            'token_api' => Str::random(32),
            'ativo' => true,
            'possui_pluviometro' => false,
        ]);

        $response = $this->postJson('/api/leituras', [
            'temperatura_ar' => 31.2,
            'umidade_ar' => 48.0,
            'itgu' => 76.4,
            'chuva_mm' => 9500.0, // Ruído severo de pino aberto no ESP32
        ], [
            'X-API-Token' => $estacao->token_api,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('leituras', [
            'estacao_id' => $estacao->id,
            'temperatura_ar' => 31.2,
            'chuva_mm' => null,
        ]);
    }

    public function test_descarta_pico_de_chuva_implausivel_em_estacao_com_pluviometro(): void
    {
        $estacao = Estacao::factory()->create([
            'token_api' => Str::random(32),
            'ativo' => true,
            'possui_pluviometro' => true,
        ]);

        $response = $this->postJson('/api/leituras', [
            'temperatura_ar' => 26.0,
            'chuva_mm' => 300.0, // Acima do teto físico plausível por ciclo (150 mm)
        ], [
            'X-API-Token' => $estacao->token_api,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('leituras', [
            'estacao_id' => $estacao->id,
            'temperatura_ar' => 26.0,
            'chuva_mm' => null,
        ]);
    }
}