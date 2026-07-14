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
- ITU (Índice de Temperatura e Umidade): usa temperatura do ar ambiente (sem efeito
  de radiação). Mesma fórmula, com temperatura de bulbo seco.

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
