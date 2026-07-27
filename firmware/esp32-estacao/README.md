# Firmware — Estação Meteorológica ESP32

Firmware para ESP32 DevKit V1 (30 pinos) que coleta dados de sensores meteorológicos,
calcula médias agregadas e envia para um ou dois servidores (local e/ou produção) via
HTTP/JSON. Configuração feita inteiramente por uma página web de administração — não é
necessário editar o código-fonte para configurar WiFi, servidores ou tokens.

## Sensores suportados

| Sensor | Tipo | Pino | Status |
|---|---|---|---|
| DHT22 (globo negro) | Digital | GPIO 4 | Instalado |
| BME280 (ambiente) | I2C | GPIO 21 (SDA) / GPIO 22 (SCL) | Instalado |
| GUVA-S12SD (UV) | Analógico | GPIO 34 (ADC1) | Instalado |
| LDR (luminosidade) | Analógico | GPIO 35 (ADC1) | Instalado |

## Bibliotecas necessárias (Arduino IDE)

- WiFiManager (tzapu)
- DHT sensor library (Adafruit)
- Adafruit Unified Sensor
- Adafruit BME280 Library
- Adafruit BusIO
- ArduinoJson (v6.x ou v7.x)
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

- Coleta interna: a cada 1 minuto (não transmite, só acumula na memória)
- Envio agregado: a cada 10 minutos, calcula a média das amostras acumuladas e
  envia uma única leitura, marcada como tipo_agregacao: "agregado"
- O intervalo de 10 minutos foi escolhido para manter o Render (hospedagem de
  produção, plano gratuito) sempre ativo — o plano hiberna após 15 minutos sem
  requisições
- Se o envio falhar, as amostras não são descartadas — continuam acumulando até
  o próximo ciclo funcionar

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
| `itgu` / `itgu_classificacao` | DHT22 (globo negro) leu com sucesso |
| `itu` / `itu_classificacao` | Algum sensor de ambiente leu com sucesso |
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
