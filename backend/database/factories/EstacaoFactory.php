<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class EstacaoFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nome' => 'Estação ' . fake()->city(),
            'localizacao' => fake()->address(),
            'latitude' => fake()->latitude(-10, -3),
            'longitude' => fake()->longitude(-42, -37),
            'token_api' => Str::random(32),
            'ativo' => true,
        ];
    }
}