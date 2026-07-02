import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

function TabelaPinos({ pinos }) {
    return (
        <table className="w-full text-sm text-left mt-3">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                    <th className="px-4 py-2">Pino do Sensor</th>
                    <th className="px-4 py-2">Pino do ESP32</th>
                    <th className="px-4 py-2">Observação</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {pinos.map((pino, i) => (
                    <tr key={i}>
                        <td className="px-4 py-2 font-mono text-gray-800">{pino.origem}</td>
                        <td className="px-4 py-2 font-mono font-semibold text-blue-700">{pino.destino}</td>
                        <td className="px-4 py-2 text-gray-500">{pino.obs}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function SensorCard({ titulo, status, descricao, campos, pinos, notas }) {
    const corStatus = status === 'instalado'
        ? 'bg-green-100 text-green-800'
        : 'bg-gray-100 text-gray-600';

    return (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-gray-800">{titulo}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${corStatus}`}>
                    {status === 'instalado' ? 'Instalado' : 'Previsto (não instalado)'}
                </span>
            </div>

            <p className="text-sm text-gray-600">{descricao}</p>

            <p className="text-xs text-gray-500 mt-2">
                <strong>Campos no banco:</strong> {campos.join(', ')}
            </p>

            {pinos && <TabelaPinos pinos={pinos} />}

            {notas && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded p-3">
                    <p className="text-xs text-amber-800">{notas}</p>
                </div>
            )}
        </div>
    );
}

export default function Sensores() {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Documentação de Sensores — ESP32
                </h2>
            }
        >
            <Head title="Documentação de Sensores" />

            <div className="py-12">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="font-semibold text-lg text-gray-800 mb-2">
                            Referência Rápida de Pinos (ESP32)
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Use sempre pinos <strong>ADC1</strong> (GPIO 32-39) para sensores analógicos —
                            os pinos ADC2 têm conflito conhecido com o rádio WiFi e retornam leituras
                            instáveis quando a rede está ativa.
                        </p>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-2">Sensor</th>
                                    <th className="px-4 py-2">Tipo</th>
                                    <th className="px-4 py-2">Pino ESP32</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <tr>
                                    <td className="px-4 py-2">DHT22 (globo negro)</td>
                                    <td className="px-4 py-2 text-gray-500">Digital</td>
                                    <td className="px-4 py-2 font-mono font-semibold text-blue-700">GPIO 4</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2">BME280 (ambiente)</td>
                                    <td className="px-4 py-2 text-gray-500">I2C</td>
                                    <td className="px-4 py-2 font-mono font-semibold text-blue-700">GPIO 21 (SDA) / GPIO 22 (SCL)</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2">GUVA-S12SD (UV)</td>
                                    <td className="px-4 py-2 text-gray-500">Analógico</td>
                                    <td className="px-4 py-2 font-mono font-semibold text-blue-700">GPIO 34 (ADC1)</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2">LDR (luminosidade)</td>
                                    <td className="px-4 py-2 text-gray-500">Analógico</td>
                                    <td className="px-4 py-2 font-mono font-semibold text-blue-700">GPIO 35 (ADC1)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide pt-2">
                        Sensores Instalados
                    </h3>

                    <SensorCard
                        titulo="DHT22 — Temperatura e Umidade (Globo Negro)"
                        status="instalado"
                        descricao="Posicionado dentro de uma esfera de globo negro (normalmente uma esfera oca pintada de preto fosco), captura o efeito da radiação solar/térmica absorvida — usado para calcular o ITGU."
                        campos={['temp_globo_negro', 'umid_globo_negro']}
                        pinos={[
                            { origem: 'VCC', destino: '3.3V', obs: 'Alimentação' },
                            { origem: 'GND', destino: 'GND', obs: 'Terra' },
                            { origem: 'DATA', destino: 'GPIO 4', obs: 'Sinal digital (biblioteca DHT)' },
                        ]}
                        notas="Recomenda-se resistor de pull-up de 10kΩ entre DATA e VCC se o módulo não tiver um embutido. A maioria dos módulos DHT22 já vem com esse resistor na placa."
                    />

                    <SensorCard
                        titulo="BME280 — Temperatura, Umidade e Pressão (Ambiente)"
                        status="instalado"
                        descricao="Fica exposto ao ambiente externo, fora do globo negro — mede a temperatura de bulbo seco (sem efeito de radiação solar direta), usada para calcular o ITU."
                        campos={['temperatura_ar', 'umidade_ar', 'pressao', 'altitude']}
                        pinos={[
                            { origem: 'VCC', destino: '3.3V', obs: 'Alimentação (NÃO use 5V, o BME280 é 3.3V)' },
                            { origem: 'GND', destino: 'GND', obs: 'Terra' },
                            { origem: 'SCL', destino: 'GPIO 22', obs: 'Clock I2C' },
                            { origem: 'SDA', destino: 'GPIO 21', obs: 'Dados I2C' },
                        ]}
                        notas="Endereço I2C padrão: 0x76. Alguns módulos usam 0x77 — o firmware tenta os dois automaticamente na inicialização. Proteja da chuva direta (use um abrigo tipo Stevenson simplificado ou tampa perfurada)."
                    />

                    <SensorCard
                        titulo="GUVA-S12SD — Índice UV"
                        status="instalado"
                        descricao="Sensor analógico que mede radiação ultravioleta. A conversão para Índice UV é uma aproximação linear — para precisão científica, recomenda-se calibração com um medidor de referência."
                        campos={['indice_uv']}
                        pinos={[
                            { origem: 'VCC', destino: '3.3V', obs: 'Alimentação' },
                            { origem: 'GND', destino: 'GND', obs: 'Terra' },
                            { origem: 'SIG (OUT)', destino: 'GPIO 34', obs: 'Saída analógica (ADC1, obrigatório com WiFi ativo)' },
                        ]}
                    />

                    <SensorCard
                        titulo="LDR — Luminosidade"
                        status="instalado"
                        descricao="Módulo de 4 pinos com resistor dependente de luz. Usa-se apenas a saída analógica (AO) — a saída digital (DO) tem granularidade muito baixa (só liga/desliga) para fins de monitoramento contínuo."
                        campos={['luminosidade']}
                        pinos={[
                            { origem: 'VCC', destino: '3.3V', obs: 'Alimentação' },
                            { origem: 'GND', destino: 'GND', obs: 'Terra' },
                            { origem: 'AO', destino: 'GPIO 35', obs: 'Saída analógica (ADC1) — usada pelo firmware' },
                            { origem: 'DO', destino: 'Não conectado', obs: 'Saída digital — não utilizada' },
                        ]}
                        notas="A lógica de 'mais luz = leitura maior' pode variar entre módulos. Compare os valores no Serial Monitor entre sol e sombra para confirmar antes de calibrar alertas."
                    />

                    <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide pt-4">
                        Sensores Previstos (não instalados ainda)
                    </h3>

                    <SensorCard
                        titulo="CCS811 ou SGP30 — CO2 e TVOC"
                        status="previsto"
                        descricao="Sensor de qualidade do ar via I2C, mede dióxido de carbono equivalente e compostos orgânicos voláteis totais."
                        campos={['co2_ppm', 'tvoc_ppb']}
                    />

                    <SensorCard
                        titulo="Pluviômetro de Báscula (Tipping Bucket)"
                        status="previsto"
                        descricao="Mede volume de chuva por meio de um contador de pulsos magnéticos — cada 'báscula' representa uma quantidade fixa de mm de chuva (tipicamente 0.2mm ou 0.5mm por pulso)."
                        campos={['chuva_mm']}
                    />

                    <SensorCard
                        titulo="Anemômetro + Biruta"
                        status="previsto"
                        descricao="Anemômetro de copo mede velocidade do vento (geralmente via sensor de efeito Hall/pulsos); biruta com potenciômetro mede direção."
                        campos={['vel_vento', 'dir_vento']}
                    />

                    <SensorCard
                        titulo="Sensores de Solo"
                        status="previsto"
                        descricao="Sensor capacitivo de umidade do solo, sonda DS18B20 para temperatura do solo, e sensor de condutividade elétrica."
                        campos={['solo_umidade', 'solo_temperatura', 'solo_condutividade']}
                    />

                    <SensorCard
                        titulo="Monitoramento de Bateria"
                        status="previsto"
                        descricao="Para estações alimentadas por painel solar, um divisor de tensão resistivo conectado a um pino ADC permite monitorar o nível de carga da bateria."
                        campos={['tensao_bateria']}
                    />

                </div>
            </div>
        </AuthenticatedLayout>
    );
}