<?php

namespace Database\Seeders;

use App\Models\AlertaConfig;
use App\Models\AlertaDisparado;
use App\Models\Estacao;
use App\Models\Leitura;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DadosTesteSeeder extends Seeder
{
    public function run(): void
    {
        $e1 = Estacao::create([
            'nome' => 'Estação IFCE Boa Viagem',
            'localizacao' => 'Campus Boa Viagem',
            'latitude' => -5.1281,
            'longitude' => -39.7286,
            'token_api' => Str::random(32),
            'ativo' => true,
        ]);

        $e2 = Estacao::create([
            'nome' => 'Estação Sítio Semiárido',
            'localizacao' => 'Zona Rural, Boa Viagem-CE',
            'latitude' => -5.1450,
            'longitude' => -39.7500,
            'token_api' => Str::random(32),
            'ativo' => true,
        ]);

        foreach ([$e1, $e2] as $estacao) {
            for ($i = 24; $i >= 0; $i--) {
                $hora = now()->subHours($i);
                $horaDia = (int) $hora->format('H');

                $tempBase = 24 + (8 * sin(($horaDia - 6) * pi() / 12));
                $temp = round($tempBase + rand(-15, 15) / 10, 1);
                $umidade = round(70 - ($tempBase - 24) * 2 + rand(-5, 5), 1);
                $itgu = round(70 + ($tempBase - 24) * 1.5 + rand(-3, 3), 1);

                Leitura::create([
                    'estacao_id' => $estacao->id,
                    'temp_globo_negro' => $temp + rand(0, 20) / 10,
                    'temperatura_ar' => $temp,
                    'umidade_ar' => max(30, min(90, $umidade)),
                    'itgu' => $itgu,
                    'itgu_classificacao' => $itgu > 78 ? 'perigo' : ($itgu > 72 ? 'alerta' : 'normal'),
                    'tipo_agregacao' => 'amostra',
                    'registrado_em' => $hora,
                ]);
            }
        }

        $config1 = AlertaConfig::create([
            'estacao_id' => $e1->id,
            'parametro' => 'itgu',
            'operador' => '>',
            'valor_limite' => 78,
            'ativo' => true,
        ]);

        $config2 = AlertaConfig::create([
            'estacao_id' => $e2->id,
            'parametro' => 'itgu',
            'operador' => '>',
            'valor_limite' => 78,
            'ativo' => true,
        ]);

        foreach ([[$e1, $config1], [$e2, $config2]] as [$estacao, $config]) {
            $leiturasAltas = Leitura::where('estacao_id', $estacao->id)
                ->where('itgu', '>', 78)
                ->get();

            foreach ($leiturasAltas as $leitura) {
                AlertaDisparado::create([
                    'alerta_config_id' => $config->id,
                    'leitura_id' => $leitura->id,
                    'valor_lido' => $leitura->itgu,
                    'resolvido' => false,
                ]);
            }
        }

        $this->command->info('Estações: ' . Estacao::count());
        $this->command->info('Leituras: ' . Leitura::count());
        $this->command->info('Alertas disparados: ' . AlertaDisparado::count());
    }
}