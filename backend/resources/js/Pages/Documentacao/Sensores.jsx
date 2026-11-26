import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

function TabelaPinos({ pinos }) {
    return (
        <table className="w-full text-sm text-left mt-3">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                    <th className="px-4 py-2">Pino do Sensor</th>
                    <th className="px-4 py-2">Pino</th>
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

function SensorCard({ titulo, status, descricao, campos, pinos, notas, aviso }) {
    const corStatus = status === 'instalado'
        ? 'bg-green-100 text-green-800'
        : 'bg-gray-100 text-gray-600';

    return (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-gray-800">{titulo}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${corStatus} shrink-0 ml-2`}>
                    {status === 'instalado' ? 'Instalado' : 'Previsto (não instalado)'}
                </span>
            </div>

            <p className="text-sm text-gray-600">{descricao}</p>

            {campos && (
                <p className="text-xs text-gray-500 mt-2">
                    <strong>Campos no banco:</strong> {campos.join(', ')}
                </p>
            )}

            {pinos && <TabelaPinos pinos={pinos} />}

            {notas && (
                <div className="mt-3 bg-gray-50 border border-gray-200 rounded p-3">
                    <p className="text-xs text-gray-600">{notas}</p>
                </div>
            )}

            {aviso && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded p-3">
                    <p className="text-xs text-amber-800">⚠️ {aviso}</p>
                </div>
            )}
        </div>
    );
}

function Secao({ titulo, children }) {
    return (
        <>
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide pt-4">
                {titulo}
            </h3>
            {children}
        </>
    );
}

export default function Sensores() {
    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: 'Documentação' }, { label: 'Sensores' }]}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Documentação de Sensores e Hardware
                </h2>
            }
        >
            <Head title="Documentação de Sensores" />

            <div className="py-12">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="font-semibold text-lg text-gray-800 mb-2">
                            Modelos de Hardware Suportados
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            O sistema hoje suporta 3 firmwares diferentes, cada um com sua própria
                            combinação de chip, pinagem e sensores. Todos enviam para o mesmo endpoint
                            da API (<code className="text-xs bg-gray-100 px-1 rounded">POST /api/leituras</code>),
                            então dá pra misturar modelos diferentes na mesma rede de estações sem problema.
                        </p>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-2">Firmware</th>
                                    <th className="px-4 py-2">Chip</th>
                                    <th className="px-4 py-2">Pino I2C (SDA/SCL)</th>
                                    <th className="px-4 py-2">Diferencial</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <tr>
                                    <td className="px-4 py-2 font-mono text-xs">esp32-estacao</td>
                                    <td className="px-4 py-2 text-gray-500">ESP32 WROOM-32 tradicional</td>
                                    <td className="px-4 py-2 font-mono font-semibold text-blue-700">GPIO 21 / GPIO 22</td>
                                    <td className="px-4 py-2 text-gray-500">Detecção automática de sensores por chip ID</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2 font-mono text-xs">esp32-wemos-rtc-eeprom</td>
                                    <td className="px-4 py-2 text-gray-500">ESP32 WROOM-32 (WeMos)</td>
                                    <td className="px-4 py-2 font-mono font-semibold text-blue-700">GPIO 18 / GPIO 22</td>
                                    <td className="px-4 py-2 text-gray-500">SDA no 18 — essa placa específica não expõe o GPIO 21</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2 font-mono text-xs">esp-nodemcu-esp12e-oled</td>
                                    <td className="px-4 py-2 text-gray-500">ESP8266 (NodeMCU ESP-12E)</td>
                                    <td className="px-4 py-2 font-mono font-semibold text-blue-700">D6 / D5 (I2C via software)</td>
                                    <td className="px-4 py-2 text-gray-500">Só DHT22 + LDR + display OLED local, sem sensores I2C ambientais</td>
                                </tr>
                            </tbody>
                        </table>
                        <p className="text-xs text-gray-500 mt-3">
                            Para sensores analógicos nos modelos ESP32, use sempre pinos <strong>ADC1</strong> (GPIO 32-39) —
                            os pinos ADC2 têm conflito conhecido com o rádio WiFi e retornam leituras
                            instáveis quando a rede está ativa.
                        </p>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="font-semibold text-lg text-gray-800 mb-2">
                            Prioridade de Sensores de Ambiente (Temperatura/Umidade do Ar)
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Os firmwares ESP32 detectam automaticamente quais sensores estão presentes
                            e escolhem a fonte mais precisa disponível, com troca automática em tempo
                            real se o sensor ativo parar de responder:
                        </p>
                        <div className="flex items-center gap-2 flex-wrap text-sm font-mono">
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded">SHT41</span>
                            <span className="text-gray-400">&gt;</span>
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">BME280</span>
                            <span className="text-gray-400">&gt;</span>
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded">AHT10</span>
                            <span className="text-gray-400">&gt;</span>
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded">DHT22 (fallback)</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                            Nenhum desses sensores é obrigatório — o sistema funciona com qualquer
                            combinação, inclusive só com o DHT22.
                        </p>
                    </div>

                    <Secao titulo="Sensores Instalados e Validados">
                        <SensorCard
                            titulo="DHT22 — Temperatura e Umidade (Globo Negro)"
                            status="instalado"
                            descricao="Posicionado dentro de uma esfera de globo negro, captura o efeito da radiação solar/térmica absorvida — usado para calcular o ITGU. É o único sensor obrigatório em todos os firmwares."
                            campos={['temp_globo_negro', 'umid_globo_negro']}
                            pinos={[
                                { origem: 'VCC', destino: '3.3V', obs: 'Alimentação' },
                                { origem: 'GND', destino: 'GND', obs: 'Terra' },
                                { origem: 'DATA', destino: 'GPIO 4 (ESP32) / D4 (ESP8266)', obs: 'Sinal digital' },
                            ]}
                            notas="Recomenda-se resistor de pull-up de 10kΩ entre DATA e VCC se o módulo não tiver um embutido. Nos firmwares ESP32, o Teste de Degrau (OMM) rejeita saltos acima de 3°C entre leituras consecutivas."
                        />

                        <SensorCard
                            titulo="SHT41 (Sensirion) — Ambiente, Alta Precisão"
                            status="instalado"
                            descricao="Sensor I2C de alta precisão (±0.1°C, ±1.5% RH) — prioridade máxima na cadeia de sensores de ambiente quando presente."
                            campos={['temperatura_ar', 'umidade_ar']}
                            pinos={[
                                { origem: 'VCC', destino: '3.3V', obs: 'Alimentação' },
                                { origem: 'GND', destino: 'GND', obs: 'Terra' },
                                { origem: 'SCL', destino: 'Pino SCL do modelo', obs: 'Clock I2C' },
                                { origem: 'SDA', destino: 'Pino SDA do modelo', obs: 'Dados I2C' },
                            ]}
                            notas="Endereço I2C fixo: 0x44 (não conflita com nenhum outro sensor usado no sistema). Biblioteca: Adafruit SHT4x. Só disponível nos firmwares ESP32 (não no NodeMCU)."
                        />

                        <SensorCard
                            titulo="BME280 / BMP280 — Ambiente e Pressão"
                            status="instalado"
                            descricao="BME280 mede temperatura, umidade e pressão; BMP280 mede só temperatura e pressão (sem umidade). O firmware identifica qual dos dois está presente pelo registrador de chip ID (0xD0), evitando confundir um com o outro."
                            campos={['temperatura_ar', 'umidade_ar', 'pressao', 'altitude']}
                            pinos={[
                                { origem: 'VCC', destino: '3.3V', obs: 'NÃO use 5V, ambos são 3.3V' },
                                { origem: 'GND', destino: 'GND', obs: 'Terra' },
                                { origem: 'SCL', destino: 'Pino SCL do modelo', obs: 'Clock I2C' },
                                { origem: 'SDA', destino: 'Pino SDA do modelo', obs: 'Dados I2C' },
                            ]}
                            notas="Endereço I2C: 0x76 ou 0x77 (o firmware tenta os dois). Chip ID: BME280=0x60, BMP280=0x58. Proteja da chuva direta (abrigo tipo Stevenson simplificado ou tampa perfurada)."
                        />

                        <SensorCard
                            titulo="AHT10/AHT20 — Ambiente (backup)"
                            status="instalado"
                            descricao="Sensor de temperatura/umidade usado como terceira opção na cadeia de prioridade, caso SHT41 e BME280 não estejam presentes ou parem de funcionar. AHT20 é eletricamente compatível (mesmo endereço I2C, mesma família de chip da ASAIR) — detectado pelo mesmo código."
                            campos={['temperatura_ar', 'umidade_ar']}
                            pinos={[
                                { origem: 'VCC', destino: '3.3V', obs: 'Alimentação' },
                                { origem: 'GND', destino: 'GND', obs: 'Terra' },
                                { origem: 'SCL', destino: 'Pino SCL do modelo', obs: 'Clock I2C' },
                                { origem: 'SDA', destino: 'Pino SDA do modelo', obs: 'Dados I2C' },
                            ]}
                            aviso="Endereço I2C 0x38 — o MESMO endereço usado pelo AHT21 embutido no módulo ENS160. Não ligar os dois no mesmo barramento."
                        />

                        <SensorCard
                            titulo="ENS160 — Qualidade do Ar (CO2eq/TVOC/AQI)"
                            status="instalado"
                            descricao="Sensor de gases (óxido metálico), mede CO2 equivalente, TVOC (compostos orgânicos voláteis totais) e um índice de qualidade do ar (AQI, escala 1-5). O módulo vem acompanhado de um AHT21 embutido, necessário para calibração interna do sensor de gás."
                            campos={['co2_ppm', 'tvoc_ppb', 'aqi']}
                            pinos={[
                                { origem: 'VCC', destino: '3.3V', obs: 'Alimentação' },
                                { origem: 'GND', destino: 'GND', obs: 'Terra' },
                                { origem: 'SCL', destino: 'Pino SCL do modelo', obs: 'Clock I2C' },
                                { origem: 'SDA', destino: 'Pino SDA do modelo', obs: 'Dados I2C' },
                            ]}
                            notas="Biblioteca: 'ENS160 - Adafruit Fork' (arquivo real: ScioSense_ENS160.h — API por construtor com endereço fixo, diferente do padrão Adafruit unified sensor dos demais sensores). Endereço: 0x52 ou 0x53."
                            aviso="O AHT21 embutido nesse módulo usa o MESMO endereço I2C (0x38) do AHT10 usado em outras estações. Não ligar os dois no mesmo barramento — o AHT21 é obrigatório para a calibração do próprio ENS160, então é ele que deve permanecer conectado."
                        />

                        <SensorCard
                            titulo="GUVA-S12SD — Índice UV"
                            status="instalado"
                            descricao="Sensor analógico que mede radiação ultravioleta. A conversão para Índice UV é uma aproximação linear."
                            campos={['indice_uv']}
                            pinos={[
                                { origem: 'VCC', destino: '3.3V', obs: 'Alimentação' },
                                { origem: 'GND', destino: 'GND', obs: 'Terra' },
                                { origem: 'SIG (OUT)', destino: 'GPIO 34/35 (ESP32) ou pino ADC do modelo', obs: 'Saída analógica' },
                            ]}
                            notas="Sensível a contato instável no fio de sinal — leituras travadas em valores fixos e fora da faixa 0-15 (ex: sempre 4095 no ADC bruto) indicam fio solto, não erro de software."
                        />

                        <SensorCard
                            titulo="VEML7700 — Luminosidade (lux)"
                            status="instalado"
                            descricao="Sensor digital de luz ambiente via I2C — mede lux (unidade científica real), com alcance de 0 a ~120.000 lux. Prioridade máxima sobre o LDR analógico quando presente."
                            campos={['luminosidade (em lux quando este sensor está presente)']}
                            pinos={[
                                { origem: 'VCC', destino: '3.3V', obs: 'Alimentação' },
                                { origem: 'GND', destino: 'GND', obs: 'Terra' },
                                { origem: 'SCL', destino: 'Pino SCL do modelo', obs: 'Clock I2C' },
                                { origem: 'SDA', destino: 'Pino SDA do modelo', obs: 'Dados I2C' },
                            ]}
                            notas="Endereço I2C fixo: 0x10 (não conflita com nenhum outro sensor do sistema). Biblioteca: Adafruit VEML7700."
                        />

                        <SensorCard
                            titulo="LDR — Luminosidade (fallback)"
                            status="instalado"
                            descricao="Módulo com resistor dependente de luz. Usado como alternativa quando o VEML7700 não está presente — nesse caso, o valor é uma escala arbitrária 0-100, não lux de verdade."
                            campos={['luminosidade (0-100, quando o VEML7700 não está presente)']}
                            pinos={[
                                { origem: 'VCC', destino: '3.3V', obs: 'Alimentação' },
                                { origem: 'GND', destino: 'GND', obs: 'Terra' },
                                { origem: 'AO', destino: 'Pino ADC do modelo', obs: 'Saída analógica — usada pelo firmware' },
                            ]}
                        />

                        <SensorCard
                            titulo="RTC DS3231 — Relógio de Tempo Real"
                            status="instalado"
                            descricao="Mantém a hora correta mesmo com a estação desligada (bateria própria). Permite que o horário exato da leitura seja preservado mesmo em envios atrasados (fila offline)."
                            campos={['registrado_em (preenchido pelo firmware, não pelo servidor)']}
                            pinos={[
                                { origem: 'VCC', destino: '3.3V', obs: 'Alimentação' },
                                { origem: 'GND', destino: 'GND', obs: 'Terra' },
                                { origem: 'SCL', destino: 'Pino SCL do modelo', obs: 'Clock I2C' },
                                { origem: 'SDA', destino: 'Pino SDA do modelo', obs: 'Dados I2C' },
                            ]}
                            notas="Endereço I2C: 0x68. Opcional — se ausente, o servidor usa o horário de recebimento da requisição em vez do horário real da leitura."
                        />

                        <SensorCard
                            titulo="EEPROM AT24C32 — Fila de Envio Persistente"
                            status="instalado"
                            descricao="Memória externa usada como fila de envio que sobrevive a quedas de energia — até ~90 registros agregados (≈15h de autonomia offline nos modelos ESP32)."
                            campos={['(não gera campo próprio — só evita perda de dados)']}
                            pinos={[
                                { origem: 'VCC', destino: '3.3V', obs: 'Alimentação' },
                                { origem: 'GND', destino: 'GND', obs: 'Terra' },
                                { origem: 'SCL', destino: 'Pino SCL do modelo', obs: 'Clock I2C' },
                                { origem: 'SDA', destino: 'Pino SDA do modelo', obs: 'Dados I2C' },
                            ]}
                            notas="Endereço I2C: 0x50. Opcional — se ausente, usa um buffer de 1 registro na RAM (sem proteção contra queda de energia, mas com nova tentativa até conseguir enviar). Assim que instalada fisicamente, o firmware passa a usar a fila completa sozinho, sem alteração de código."
                        />

                        <SensorCard
                            titulo="Display OLED SSD1306 (só no NodeMCU ESP8266)"
                            status="instalado"
                            descricao="Mostra localmente temperatura, umidade, luminosidade e status da fila de envio, sem precisar de cabo USB conectado."
                            campos={['(só exibição local, não gera campo no banco)']}
                            pinos={[
                                { origem: 'SCL', destino: 'D5 (GPIO12)', obs: 'I2C via software' },
                                { origem: 'SDA', destino: 'D6 (GPIO14)', obs: 'I2C via software' },
                            ]}
                        />

                        <SensorCard
                            titulo="Pluviômetro de Báscula (Tipping Bucket)"
                            status="instalado"
                            descricao="Mede volume de chuva por meio de um contador de pulsos magnéticos — cada 'báscula' (basculamento do balde) gera um pulso, contado via interrupção no ESP32 (com debounce de 15ms contra ruído mecânico)."
                            campos={['chuva_mm']}
                            pinos={[
                                { origem: 'VCC/Comum', destino: '3.3V ou GND (conforme o modelo)', obs: 'Chave magnética (reed switch), sem polaridade definida' },
                                { origem: 'Sinal', destino: 'GPIO 26', obs: 'Interrupção digital (FALLING), pull-up interno' },
                            ]}
                            notas="Calibração atual: 0,5mm de chuva por pulso — valor a confirmar/recalibrar com o fabricante específico do sensor."
                        />
                        <SensorCard
                            titulo="Anemômetro (Velocidade do Vento)"
                            status="instalado"
                            descricao="Anemômetro de copo, mede velocidade do vento via pulsos (efeito Hall/reed switch) — cada rotação gera um ou mais pulsos, contados via interrupção (debounce de 5ms)."
                            campos={['vel_vento']}
                            pinos={[
                                { origem: 'VCC/Comum', destino: '3.3V ou GND (conforme o modelo)', obs: 'Sensor de pulso' },
                                { origem: 'Sinal', destino: 'GPIO 27', obs: 'Interrupção digital (FALLING), pull-up interno' },
                            ]}
                            aviso="Fórmula de conversão (km/h = pulsos/s × 2,4) é um padrão comum para anemômetros de copo hobby, mas não foi calibrada com instrumento de referência para este modelo específico — tratar os valores como aproximados até a calibração."
                        />
                    </Secao>

                    <Secao titulo="Sensores Previstos (não instalados ainda)">
                        <SensorCard
                            titulo="Sensor de Bulbo Úmido Natural"
                            status="previsto"
                            descricao="Necessário para calcular o IBUTG (Índice de Bulbo Úmido Termômetro de Globo, NR-15/ISO 7243) — índice de segurança ocupacional para trabalhadores expostos ao sol, diferente do ITGU já calculado (que é focado em conforto térmico animal)."
                            campos={['ibutg (planejado)']}
                        />


                        <SensorCard
                            titulo="Biruta (Direção do Vento)"
                            status="previsto"
                            descricao="Sensor de direção do vento (potenciômetro ou reed switches) — ainda não instalado. A estação já mede a velocidade do vento (anemômetro), só falta a direção."
                            campos={['dir_vento']}
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
                            descricao="Para estações alimentadas por painel solar/bateria, um divisor de tensão resistivo conectado a um pino ADC permite monitorar o nível de carga."
                            campos={['tensao_bateria']}
                        />
                    </Secao>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
