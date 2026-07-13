<?php

namespace Database\Factories;

use App\Models\Estacao;
use Illuminate\Database\Eloquent\Factories\Factory;

class LeituraFactory extends Factory
{
    public function definition(): array
    {
        return [
            'estacao_id' => Estacao::factory(),
            'temperatura_ar' => fake()->randomFloat(2, 18, 35),
            'umidade_ar' => fake()->randomFloat(2, 30, 90),
            'itgu' => fake()->randomFloat(2, 60, 85),
            'itgu_classificacao' => fake()->randomElement(['normal', 'alerta', 'perigo']),
            'tipo_agregacao' => 'amostra',
            'registrado_em' => fake()->dateTimeBetween('-30 days', 'now'),
        ];
    }
}
