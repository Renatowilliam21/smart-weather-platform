# Firmware — ESP32 WROOM-32 (WeMos) com RTC + EEPROM

Variante do firmware da Smart Weather Platform para o hardware com módulo
RTC DS3231 e EEPROM AT24C32, permitindo fila de envio persistente (não
perde dados em queda de energia ou de internet).

## Diferença em relação ao firmware `esp32-estacao/`

| | `esp32-estacao/` | `esp32-wemos-rtc-eeprom/` (este) |
|---|---|---|
| Sensor de ambiente | BME280 (I2C) | AHT10 (I2C) |
| Pressão/altitude | Sim (via BME280) | Não (AHT10 não mede) |
| RTC | Não | Sim (DS3231) |
| Fila de envio persistente | Não (só RAM) | Sim (EEPROM, ~90 registros) |
| Pino SDA | GPIO 21 | GPIO 18 (este ESP32 não expõe o 21) |

## Sensores

| Sensor | Tipo | Pino | Função |
|---|---|---|---|
| DHT22 (globo negro) | Digital | GPIO 4 | Temperatura + umidade → ITGU |
| AHT10 (ambiente) | I2C | SDA=18, SCL=22 | Temperatura + umidade → ITU |
| GUVA-S12SD (UV) | Analógico | GPIO 35 | Índice UV |
| LDR (luminosidade) | Analógico | GPIO 34 | Luminosidade |

## Módulos

| Módulo | Endereço I2C | Função |
|---|---|---|
| RTC DS3231 | 0x68 | Timestamp real, mesmo offline |
| EEPROM AT24C32 | 0x50 | Fila de envio persistente (~90 registros) |

## Bibliotecas necessárias (Arduino IDE)

- WiFiManager (tzapu)
- DHT sensor library (Adafruit)
- Adafruit AHTX0
- RTClib (Adafruit)
- ArduinoJson (v6.x ou v7.x)
- WebServer (já incluída no core do ESP32)

## Como funciona a fila de envio persistente

1. **Coleta** (a cada 1 min): lê os sensores, acumula na RAM. Leituras fora
   de faixa fisicamente plausível são descartadas antes de entrar na média
   (proteção contra ruído elétrico momentâneo).
2. **Agregação** (a cada 10 min): calcula a média do ciclo e **grava
   imediatamente na EEPROM**, com um checksum de integridade. Só depois de
   gravado com segurança, limpa os acumuladores da RAM — a partir daqui, o
   dado sobrevive a uma queda de energia.
3. **Tentativa de envio** (a cada 1 min): pega o registro mais antigo
   pendente na fila e tenta enviar para os servidores configurados (local
   e/ou produção). Só remove da fila se o(s) envio(s) configurado(s)
   confirmar(em) sucesso — senão, tenta de novo no próximo ciclo.
4. Se um registro for lido da EEPROM com **checksum inválido** (indicando
   que a gravação foi interrompida por uma queda de energia no meio do
   processo), ele é descartado automaticamente, sem poluir o histórico
   com dado corrompido.

Capacidade: ~90 registros de 10 minutos cada → aproximadamente **15 horas**
de autonomia offline antes de começar a sobrescrever os mais antigos.

## Robustez adicional (v1.1)

- **Watchdog Timer**: se o `loop()` travar por mais de 90 segundos (ex:
  sensor não responde, trava numa espera), o ESP32 reinicia sozinho.
- **Validação de faixa física**: temperatura fora de -10°C a 65°C, umidade
  fora de 0-100%, ou UV acima de 15 são descartados antes de entrar na
  média.

## Configuração (sem editar código)

Igual ao firmware `esp32-estacao/`: WiFiManager para a rede, página web de
administração (acessível pelo IP do ESP32) para URL/token dos servidores.
Comandos disponíveis no Serial Monitor: `resetar_wifi`, `status_fila`.

## Compatibilidade com a API Laravel

Usa exatamente o mesmo endpoint e formato de payload que o firmware
`esp32-estacao/`, incluindo `itgu_classificacao`/`itu_classificacao` e o
campo `registrado_em` (preenchido com o horário real do RTC, não o
horário de quando o envio finalmente foi confirmado).

**Fórmula do ITU**: usa Buffington et al. (1982) — ITU = 0.8*Ta + (UR/100)*(Ta - 14.3) + 46.3,
a mais citada na literatura brasileira de bioclimatologia zootécnica para
bovinos leiteiros em regiões semiáridas (diferente da forma do ITGU).

## Histórico de versões

- **v1.0**: coleta + agregação + fila persistente em EEPROM com checksum,
  RTC para timestamp real, envio duplo (local + produção).
- **v1.1**: adiciona Watchdog Timer e validação de faixa física dos
  sensores antes de acumular na média.
- **v2.2**: suporte a múltiplos sensores com detecção automática —
  - BME280 > AHT10 > DHT22 (fallback) para temperatura/umidade do ar, com
    redundância em tempo real (troca de fonte se o sensor ativo parar)
  - BME280 ou BMP280 para pressão/altitude, identificados pelo registrador
    de chip ID (0xD0), evitando confundir os dois sensores
  - RTC e EEPROM agora opcionais: detectados automaticamente no boot. Sem
    EEPROM, usa buffer de 1 registro na RAM; assim que instalada, passa a
    usar a fila persistente completa (~90 registros) sem alteração de código
- v2.3: corrige a fórmula do ITU para Buffington et al. (1982), alinhada
  com a literatura de bioclimatologia zootécnica para bovinos leiteiros em
  regiões semiáridas.
