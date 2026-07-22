# Firmware — NodeMCU ESP-12E (ESP8266) com Display OLED

Firmware para NodeMCU ESP-12E (ESP8266) com sensor DHT22, LDR e display
OLED SSD1306 (128x64, I2C via software). Envia leituras agregadas para o
Smart Weather Platform, com fila de envio persistente na própria memória
flash do ESP8266 (sem depender de chip EEPROM externo).

## Diferenças em relação aos firmwares ESP32

| | ESP32 (`esp32-estacao/`, `esp32-wemos-rtc-eeprom/`) | NodeMCU ESP-12E (este) |
|---|---|---|
| Chip | ESP32 WROOM-32 | ESP8266 |
| Sensores de ambiente | BME280/AHT10/BMP280 (detecção automática) | Só DHT22 |
| RTC | Sim (opcional, detectado) | Não |
| EEPROM | Chip externo AT24C32 (opcional, detectado) | Flash interna do próprio ESP8266 (sempre presente) |
| Display | Não | OLED SSD1306 128x64 |
| Envio | Duplo (local + produção) | Único servidor |
| Cálculo de índice | ITGU (globo negro) + ITU (ambiente) | Só ITU (sem sensor de globo negro) |

## Sensores e periféricos

| Componente | Pino | Função |
|---|---|---|
| DHT22 | D4 (GPIO2) | Temperatura + umidade do ar |
| LDR | A0 | Luminosidade (0-100%) |
| OLED SSD1306 (I2C via software) | SCL=D5 (GPIO12), SDA=D6 (GPIO14) | Exibição local dos dados |

## Bibliotecas necessárias (Arduino IDE)

- WiFiManager (tzapu)
- DHT sensor library (Adafruit)
- U8g2 (olikraus) — driver do display OLED
- ArduinoJson (v6.x ou v7.x)
- ESP8266WiFi, ESP8266WebServer, ESP8266HTTPClient — já inclusas no core ESP8266

## Configuração (sem editar código)

### 1. Conectar à rede WiFi

Na primeira vez ligado, abre a rede temporária **"EstacaoMeteo-Config"**.
Conecte-se a ela e escolha sua rede WiFi real.

### 2. Configurar nome da estação, servidor e token

Acesse `http://<IP-do-ESP>/` no navegador. A página mostra o status atual
(fila pendente, descartes por faixa inválida, último envio) e um
formulário com 3 campos:
- **Nome da estação** — exibido no display OLED local (não renomeia a
  estação no dashboard web, que é identificada pelo token, não pelo nome)
- **URL do servidor** — endpoint único (este firmware não envia para
  local + produção simultaneamente, diferente dos firmwares ESP32)
- **Token da estação**

## Fila de envio persistente

Como a EEPROM aqui é a própria memória flash do ESP8266 (não um chip I2C
externo), ela está sempre disponível — não há o cenário de "módulo
ausente" que pode ocorrer nos firmwares ESP32 com EEPROM externa AT24C32.

- Coleta e atualiza o display a cada 2 segundos
- Fecha a média do período e grava na fila a cada 10 minutos
- Tenta drenar a fila (reenviar o mais antigo pendente) a cada 1 minuto
- Capacidade: ~160 registros (~26 horas de autonomia offline)
- Checksum próprio em config, controle e cada registro — detecta e
  descarta dados corrompidos automaticamente

## Robustez adicional

- **Diagnóstico de memória**: a cada 5 minutos, registra no Serial a
  memória livre e o percentual de fragmentação do heap
- **Reinício preventivo a cada 6 horas**: mitigação contra travamentos
  causados por fragmentação de memória em conexões HTTPS repetidas ao
  longo de muitas horas de operação contínua (padrão comum em ESP8266
  com `WiFiClientSecure`). Como a fila é persistente, reiniciar não
  causa perda de dados.

## Compatibilidade com a API Laravel

Mesmo endpoint (`POST /api/leituras`) e autenticação (`X-API-Token`) dos
demais firmwares. Payload inclui `temperatura_ar`, `umidade_ar`,
`luminosidade`, `itu`/`itu_classificacao` e `tipo_agregacao`. Sem RTC,
`registrado_em` não é enviado — o servidor usa o horário de recebimento.

O campo `nome_estacao` é enviado no payload, mas é ignorado pelo backend
(a estação já é identificada pelo token) — serve apenas para exibição no
display OLED local.

**Fórmula do ITU**: usa Buffington et al. (1982) —
`ITU = 0.8*Ta + (UR/100)*(Ta - 14.3) + 46.3`, a mais citada na literatura
brasileira de bioclimatologia zootécnica para bovinos leiteiros em
regiões semiáridas. Sem sensor de globo negro nesta estação, ITGU não é
calculado.

## Histórico de versões

- v1.0: primeira versão — DHT22 + LDR + OLED, fila persistente em flash
  interna, página de administração web, envio único para o sistema web.
- v1.1: adiciona diagnóstico de memória (heap livre + fragmentação) e
  reinício preventivo a cada 6 horas, mitigando travamentos por
  fragmentação de memória em conexões HTTPS de longa duração.
- v1.2: corrige fórmula do ITU para Buffington et al. (1982), alinhada
  com a literatura de bioclimatologia zootécnica (era uma variante
  Thom-adaptada antes, com a mesma forma do ITGU).
