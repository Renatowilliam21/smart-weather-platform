# Firmware — Estação Meteorológica ESP32

Firmware para ESP32 DevKit V1 (30 pinos) que coleta dados de sensores meteorológicos,
calcula médias agregadas e envia para um ou dois servidores (local e/ou produção) via
HTTP/JSON. Configuração feita inteiramente por uma página web de administração — não é
necessário editar o código-fonte para configurar WiFi, servidores ou tokens.

## Sensores suportados

| Sensor / Módulo | Tipo / Barramento | Pinos no ESP32 | Função / Observação |
|---|---|---|---|
| **AHT10 (globo negro)** | I2C secundário (`Wire1`, 50 kHz) | **GPIO 25 (SDA) / GPIO 33 (SCL)** | Temp. e umidade do globo negro → ITGU (prioridade automática nas novas estações; isolado do `Wire` principal para não travar o BMP280; `SCL` no 33 para manter o 26 livre p/ pluviômetro) |
| **DHT22 (globo negro)** | Digital | **GPIO 4** | Temp. e umidade do globo negro → ITGU (fallback automático caso o AHT10 não seja detectado no `Wire1`) |
| **BMP280 / BME280** | I2C principal (`Wire`) | GPIO 21 (SDA) / GPIO 22 (SCL) | Pressão e altitude (`0x76`/`0x77`, identificados por chip ID `0x58`/`0x60`; BME280 também mede temp./umidade do ar) |
| **SHT41 / AHT10-AHT21 (ambiente)** | I2C principal (`Wire`) | GPIO 21 (SDA) / GPIO 22 (SCL) | Temperatura e umidade do ar → ITU (prioridade: `SHT41 > BME280 > AHT10/21 > Globo Negro`) |
| **ENS160** | I2C principal (`Wire`) | GPIO 21 (SDA) / GPIO 22 (SCL) | Qualidade do ar: CO2eq, TVOC e AQI (`0x52` ou `0x53`) |
| **LDR** | Analógico (ADC1) | GPIO 34 | Luminosidade (0–100%, fallback padrão) |
| **VEML7700** | I2C principal (`Wire`) | GPIO 21 (SDA) / GPIO 22 (SCL) | Luminosidade em lux (`0x10`, opcional) |
| **GUVA-S12SD** | Analógico (ADC1) | GPIO 35 | Índice UV |
| **Pluviômetro de báscula** | Pulso digital (`FALLING`) | GPIO 26 | Volume de chuva (`chuva_mm`) |
| **Anemômetro** | Pulso digital (`FALLING`) | GPIO 27 | Velocidade do vento (`vel_vento`) |
| **RTC DS3231 / EEPROM AT24C32** | I2C principal (`Wire`) | GPIO 21 (SDA) / GPIO 22 (SCL) | Opcionais: timestamp real (`0x68`) e fila offline de ~90 registros (`0x50`) |

## Bibliotecas necessárias (Arduino IDE)

- WiFiManager (tzapu)
- Adafruit AHTX0 (requer **Adafruit BusIO** e **Adafruit Unified Sensor**)
- DHT sensor library (Adafruit)
- Adafruit BMP280 Library
- Adafruit BME280 Library
- Adafruit SHT4x Library
- ENS160 - Adafruit Fork (`ScioSense_ENS160.h`)
- RTClib (Adafruit)
- ArduinoJson (v6.x ou v7.x)
- Adafruit VEML7700 Library *(opcional — compilada automaticamente apenas se instalada)*
- WebServer (já incluída no core do ESP32, não precisa instalar)

## Como configurar (sem editar código)

### 1. Conectar à rede WiFi

Na primeira vez ligado (ou após `resetar_wifi`), o ESP32 cria uma rede temporária
"EstacaoMeteo-Config". Conecte-se a ela pelo celular ou notebook — deve abrir um
portal automaticamente pedindo para escolher sua rede WiFi e digitar a senha.

### 2. Configurar servidores e tokens

Depois de conectado à rede, abra o Serial Monitor (115200 baud) e localize a linha:
```
Acesse a pagina de administracao em: http://192.168.X.X
```

Abra esse endereço no navegador do computador (mais confiável que o celular para
esta etapa). A página mostra:
- Status atual (IP, amostras acumuladas, resultado do último envio)
- Formulário para configurar até dois destinos: local e produção, cada um com
  sua própria URL e token de estação

Preencha o que for necessário e clique em "Salvar configuração" — os valores ficam
guardados na memória do ESP32 (Preferences), sobrevivendo a reinicializações e
quedas de energia.

### 3. Trocar de rede WiFi (se necessário)

Envie o comando `resetar_wifi` pelo Serial Monitor — isso apaga a rede WiFi salva e
reinicia o ESP32, reabrindo o portal de conexão.

## Coleta e agregação

- Coleta interna: a cada **15 segundos** (`INTERVALO_COLETA_MS = 15000` — acumula 4 amostras por minuto na memória RAM para filtrar ruídos pontuais)
- Envio agregado ao sistema web: a cada **1 minuto** (`INTERVALO_AGREGACAO_MS = 60000`), calcula a média das amostras acumuladas no minuto e envia imediatamente uma leitura consolidada (`tipo_agregacao: "agregado"`)
- Retentativa em caso de falha: se a rede oscilar, o registro permanece na fila (EEPROM ou RAM) e uma nova tentativa é feita a cada **15 segundos** (`INTERVALO_TENTATIVA_ENVIO_MS = 15000`) até obter `HTTP 201`

## Envio duplo (local + produção)

Cada destino é independente. Se só um dos dois estiver configurado (URL e token
preenchidos), o outro é ignorado silenciosamente — não é obrigatório usar os dois ao
mesmo tempo.

## Índices calculados

- ITGU (Índice de Temperatura de Globo e Umidade): usa temperatura do globo negro,
  considera radiação solar/térmica. Fórmula de Buffington: ITGU = Tgn + 0.36*Tpo + 41.5
- ITU (Índice de Temperatura e Umidade): usa temperatura do ar ambiente e umidade
  relativa direta (não ponto de orvalho). Fórmula de Buffington et al. (1982),
  a mais citada na literatura brasileira de bioclimatologia zootécnica para
  bovinos leiteiros em regiões semiáridas: ITU = 0.8*Ta + (UR/100)*(Ta - 14.3) + 46.3

Classificação: normal (≤72), alerta (72-78), perigo (>78).

## Histórico de versões

- v1.0 (jul/2026): primeira versão funcional. Configuração fixa no código-fonte,
  envio simples a cada 5 minutos, um único servidor.
- v2.0 (jul/2026): reescrita completa —
  - Configuração via WiFiManager + página web de administração (sem editar código)
  - Envio duplo simultâneo (local + produção)
  - Coleta a cada 1 min, agregação (média) e envio a cada 10 min
  - Timeout estendido (60s) para tolerar cold-start do servidor de produção
  - Preservação de dados em caso de falha de envio
- v2.1/v2.2 (jul/2026): suporte a múltiplos sensores com detecção automática —
  - BME280 > AHT10 > DHT22 (fallback) para temperatura/umidade do ar, com
    redundância em tempo real (troca de fonte se o sensor ativo parar)
  - BME280 ou BMP280 para pressão/altitude, identificados pelo registrador
    de chip ID (0xD0), evitando confundir os dois sensores
  - Watchdog Timer e validação de faixa física dos sensores
  - RTC e EEPROM agora opcionais: detectados automaticamente no boot. Sem
    EEPROM, usa buffer de 1 registro na RAM; assim que instalada, passa a
    usar a fila persistente completa (~90 registros) sem alteração de código

## API — Endpoint e payload

### Endpoint
URLs:
- Local: `http://<IP_DO_SERVIDOR>:8000/api/leituras`
- Produção: `https://smart-weather-platform.onrender.com/api/leituras`

### Headers obrigatórios
### Exemplo de payload

```json
{
  "temp_globo_negro": 27.18,
  "umid_globo_negro": 58.88,
  "temperatura_ar": 27.18,
  "umidade_ar": 58.88,
  "pressao": 979.84,
  "altitude": 281.98,
  "indice_uv": 2.45,
  "luminosidade": 67,
  "itgu": 75.31,
  "itgu_classificacao": "alerta",
  "itu": 75.31,
  "itu_classificacao": "alerta",
  "tipo_agregacao": "agregado"
}
```

Quando não há BME280/AHT10, `temp_globo_negro`/`umid_globo_negro` (DHT22) e
`temperatura_ar`/`umidade_ar` (fallback, também do DHT22) coincidem. Com um
sensor de ambiente dedicado, esses dois pares normalmente diferem.

### Campos opcionais (dependem do hardware detectado)

| Campo | Aparece quando... |
|---|---|
| `pressao` / `altitude` | BME280 ou BMP280 detectado e funcionando |
| `itgu` / `itgu_classificacao` | Sensor do globo negro — AHT10 (`Wire1`) ou DHT22 (`GPIO 4`) — leu com sucesso |
| `itu` / `itu_classificacao` | Algum sensor de ambiente (ou fallback do globo negro) leu com sucesso |
| `registrado_em` | Só se o RTC estiver presente (`YYYY-MM-DD HH:MM:SS`); senão, o servidor usa o horário de recebimento |

### Resposta de sucesso

```json
{
  "message": "Leitura registrada com sucesso.",
  "leitura_id": 2156
}
```
`HTTP 201 Created`

### Outras respostas possíveis

| Código | Situação |
|---|---|
| 401 | Token inválido ou estação inativa |
| 422 | Payload malformado ou campo com tipo errado |
| 429 | Mais de 30 requisições/minuto desse token |
- v2.3 (jul/2026): corrige a fórmula do ITU para Buffington et al. (1982) —
  a mais citada na literatura brasileira de bioclimatologia zootécnica para
  bovinos leiteiros em regiões semiáridas. Antes usava uma variante
  Thom-adaptada (mesma forma do ITGU), que também é usada na literatura mas
  com menos frequência para especificamente o ITU.
- v2.4: corrige bug real no Watchdog Timer — o core Arduino-ESP32 ja
  inicializa um watchdog padrao (timeout curto) antes do setup() do
  usuario rodar, fazendo nossa configuracao de 90s falhar silenciosamente
  ("TWDT already initialized"). O watchdog padrao (mais curto) reiniciava
  o ESP32 prematuramente durante esperas legitimas, como o servidor de
  producao "acordando" de hibernacao (ate 50s). Corrigido chamando
  esp_task_wdt_deinit() antes de inicializar o watchdog personalizado.
- v2.5: adiciona suporte ao sensor SHT41 (0x44, Sensirion, alta precisao),
  que passa a ser a nova prioridade maxima na cadeia de sensores de
  ambiente: SHT41 > BME280 > AHT10 > DHT22 (fallback).
- v2.6: adiciona sensor ENS160 (qualidade do ar: CO2 equivalente, TVOC,
  AQI). Usa a biblioteca "ENS160 - Adafruit Fork" (arquivo real:
  ScioSense_ENS160.h) — API baseada em construtor com endereco fixo
  (0x52 ou 0x53), diferente do padrao "Adafruit unified sensor" usado
  pelos demais sensores. O AHT21 do modulo combo e detectado
  automaticamente pelo mesmo codigo do AHT10 (endereco 0x38
  compartilhado — nao ligar os dois juntos no mesmo barramento).
- v2.7: corrige a condicao de "pular agregacao" — antes dependia so do
  sensor UV ter dado leitura valida no ciclo, descartando temperatura/
  umidade/ITGU/pressao junto quando so o UV falhava. Agora so pula o
  ciclo se NENHUM sensor teve leitura valida.
- v2.9: corrige validacao do indice "proximoRegistro" da fila EEPROM —
  antes so "totalRegistros" era validado no boot, permitindo um indice
  fora dos limites fisicos da EEPROM se os dados vierem corrompidos ou
  nao inicializados, travando o envio silenciosamente (sem nenhuma
  mensagem de erro) por gravar em endereco de memoria invalido.
- v2.10: adiciona pluviometro de bascula (chuva_mm, GPIO26, contagem por
  interrupcao com debounce), anemometro (vel_vento, GPIO27, mesma tecnica),
  e sensor VEML7700 (luminosidade em lux via I2C, endereco 0x10, prioridade
  sobre o LDR analogico quando presente).
- v2.11: adiciona suporte ao sensor AHT10 dentro do globo negro isolado no
  segundo barramento I2C por hardware do ESP32 (`Wire1`: `SDA = GPIO 25`,
  `SCL = GPIO 33`, clock reduzido para `50 kHz` para maior estabilidade em
  cabos mais compridos e para evitar travamento do BMP280 no `Wire` padrao
  dos pinos 21/22). Usa o `GPIO 33` no `SCL` para manter o `GPIO 26` livre
  para o pluviometro. Mantem deteccao automatica no `setup()` com fallback
  transparente para o DHT22 (`GPIO 4`) nas placas antigas, auto-recuperacao
  do `Wire1` em caso de ruido eletrico e inclusao condicional da biblioteca
  `Adafruit_VEML7700.h` (`__has_include`).
