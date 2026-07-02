# Firmware — Estação Meteorológica ESP32

Firmware para ESP32 DevKit V1 (30 pinos) que coleta dados de sensores meteorológicos e envia para o backend Laravel via HTTP/JSON.

## Sensores suportados

| Sensor | Tipo | Pino | Status |
|---|---|---|---|
| DHT22 (globo negro) | Digital | GPIO 4 | Instalado |
| BME280 (ambiente) | I2C | GPIO 21 (SDA) / GPIO 22 (SCL) | Instalado |
| GUVA-S12SD (UV) | Analógico | GPIO 34 (ADC1) | Instalado |
| LDR (luminosidade) | Analógico | GPIO 35 (ADC1) | Instalado |

Pinout completo e detalhado disponível em `/documentacao/sensores` no dashboard do sistema.

## Bibliotecas necessárias (Arduino IDE)

- DHT sensor library (Adafruit)
- Adafruit Unified Sensor
- Adafruit BME280 Library
- Adafruit BusIO
- ArduinoJson (v6.x ou v7.x)

## Configuração antes de gravar

Edite as constantes no topo do arquivo `esp32-estacao.ino`:

```cpp
const char* WIFI_SSID     = "SEU_WIFI_AQUI";
const char* WIFI_PASSWORD = "SUA_SENHA_AQUI";
const char* SERVER_URL    = "http://SEU_IP_LOCAL:8000/api/leituras";
const char* API_TOKEN     = "TOKEN_DA_ESTACAO";
```

O `API_TOKEN` é gerado automaticamente ao criar uma estação pelo dashboard, disponível na tela de edição da estação (botão "Mostrar").

## Índices calculados

- **ITGU** (Índice de Temperatura de Globo e Umidade): usa temperatura do globo negro, considera radiação solar/térmica. Fórmula de Buffington: `ITGU = Tgn + 0.36*Tpo + 41.5`
- **ITU** (Índice de Temperatura e Umidade): usa temperatura do ar ambiente (sem efeito de radiação). Mesma fórmula, com temperatura de bulbo seco.

Classificação: `normal` (≤72), `alerta` (72-78), `perigo` (>78).

## Histórico de versões

- **v1.0** (jul/2026): primeira versão funcional. DHT22 + BME280 + UV + LDR, cálculo de ITGU/ITU, envio HTTP com timeout configurado (5s conexão / 8s resposta).