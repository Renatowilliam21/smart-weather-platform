/***************************************************************************
 * SMART WEATHER PLATFORM
 * Firmware v1.1 (ESP32 WROOM-32 / WeMos com RTC + EEPROM)
 *
 * Sensores: DHT22 (globo negro), AHT10 (ambiente), GUVA-S12SD (UV), LDR
 * Modulos: RTC DS3231, EEPROM AT24C32
 *
 * v1.1: adiciona Watchdog Timer (reinicia sozinho se travar), checksum
 * nos registros da EEPROM (detecta corrupcao por queda de energia durante
 * a gravacao) e validacao de faixa fisica dos sensores.
 ***************************************************************************/

//==============================
// BIBLIOTECAS
//==============================
#include <WiFi.h>
#include <WiFiManager.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_AHTX0.h>
#include <RTClib.h>
#include <Preferences.h>
#include <esp_task_wdt.h>
#include <math.h>

//==============================
// PINOS ESP32 WROOM-32
//==============================
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define LDR_PIN 34
#define UV_PIN 35
#define SDA_PIN 18
#define SCL_PIN 22
#define BOTAO_RESET_PIN 0

//==============================
// WATCHDOG
//==============================
const int WDT_TIMEOUT_SEGUNDOS = 90;

//==============================
// FAIXAS FISICAS PLAUSIVEIS (validacao de sensores)
//==============================
const float TEMP_MIN_VALIDA = -10.0;
const float TEMP_MAX_VALIDA = 65.0;
const float UMIDADE_MIN_VALIDA = 0.0;
const float UMIDADE_MAX_VALIDA = 100.0;
const float UV_MAX_VALIDO = 15.0;

//==============================
// OBJETOS
//==============================
DHT dht(DHT_PIN, DHT_TYPE);
Adafruit_AHTX0 aht;
RTC_DS3231 rtc;
Preferences preferencias;
WebServer servidorAdmin(80);

//==============================
// ESTADOS
//==============================
bool ahtDisponivel = false;
bool rtcDisponivel = false;

//==============================
// CONFIGURACAO SERVIDORES (LOCAL + PRODUCAO)
//==============================
String servidorUrlLocal, tokenLocal;
String servidorUrlProducao, tokenProducao;

String ultimoStatusLocal = "aguardando";
String ultimoStatusProducao = "aguardando";

//==============================
// INTERVALOS
//==============================
const unsigned long INTERVALO_COLETA_MS = 60000;
const unsigned long INTERVALO_AGREGACAO_MS = 600000;
const unsigned long INTERVALO_TENTATIVA_ENVIO_MS = 60000;

unsigned long ultimaColeta = 0;
unsigned long ultimaAgregacao = 0;
unsigned long ultimaTentativaEnvio = 0;

//==============================
// ACUMULADORES
//==============================
struct Acumulador {
    double soma = 0;
    int quantidade = 0;

    void adicionar(float valor) {
        if (!isnan(valor)) {
            soma += valor;
            quantidade++;
        }
    }

    float media() const {
        return quantidade > 0 ? (float)(soma / quantidade) : NAN;
    }

    void limpar() {
        soma = 0;
        quantidade = 0;
    }
};

Acumulador acTempDHT, acUmidDHT, acTempAHT, acUmidAHT, acUV, acLDR;

//==============================
// CONTADORES DE LEITURAS DESCARTADAS
//==============================
unsigned long leiturasDescartadasFaixa = 0;
unsigned long registrosDescartadosChecksum = 0;

//==============================
// REGISTRO PERSISTIDO NA EEPROM (fila de envio)
//==============================
struct RegistroMeteorologico {
    uint16_t ano;
    uint8_t mes, dia, hora, minuto, segundo;
    float tempDHT, umidDHT;
    float tempAHT, umidAHT;
    float indiceUV, luminosidade;
    float ITGU, ITU;
    bool enviado;
    uint32_t checksum;
};

const int TAM_REGISTRO = sizeof(RegistroMeteorologico);
const int ENDERECO_CONTROLE = 0;
const int ENDERECO_DADOS = 32;
const int CAPACIDADE_EEPROM_BYTES = 4096;
const int MAX_REGISTROS = (CAPACIDADE_EEPROM_BYTES - ENDERECO_DADOS) / TAM_REGISTRO;

int totalRegistros = 0;
int proximoRegistro = 0;

//==============================
// PROTOTIPOS
//==============================
void inicializarSensores();
void coletarAmostra();
float lerUV();
float lerLDR();
bool faixaValida(float valor, float minimo, float maximo);
void escreverEEPROM(int endereco, byte valor);
byte lerEEPROM(int endereco);
void salvarControleEEPROM();
void carregarControleEEPROM();
uint32_t calcularChecksum(const RegistroMeteorologico &r);
void gravarRegistroPendente();
bool lerRegistro(int indice, RegistroMeteorologico &registro);
void gravarRegistro(int indice, RegistroMeteorologico registro);
void tentarDrenarFila();
String montarJSON(const RegistroMeteorologico &r);
bool enviarParaUmServidor(const char* url, const char* token, const String& json, String& status);
float calcularPontoOrvalho(float temperatura, float umidade);
float calcularITGU(float temperatura, float umidade);
float calcularITU(float temperatura, float umidade);
String classificar(float indice);
void carregarConfiguracao();
void configurarWiFi();
void configurarServidorAdmin();

//====================================================
// SETUP
//====================================================
void setup() {
    Serial.begin(115200);
    delay(1000);

    pinMode(BOTAO_RESET_PIN, INPUT_PULLUP);

    Serial.println("\n==============================");
    Serial.println(" SMART WEATHER PLATFORM v1.1 ");
    Serial.printf(" Capacidade da fila: %d registros\n", MAX_REGISTROS);
    Serial.println("==============================");

    esp_task_wdt_config_t configuracaoWdt = {
        .timeout_ms = (uint32_t)(WDT_TIMEOUT_SEGUNDOS * 1000),
        .idle_core_mask = (1 << portNUM_PROCESSORS) - 1,
        .trigger_panic = true,
    };
    esp_task_wdt_init(&configuracaoWdt);
    esp_task_wdt_add(NULL);
    Serial.printf("Watchdog ativo (timeout %ds).\n", WDT_TIMEOUT_SEGUNDOS);

    inicializarSensores();
    carregarControleEEPROM();
    carregarConfiguracao();
    configurarWiFi();
    configurarServidorAdmin();

    Serial.println("Sistema pronto!");
}

//====================================================
// LOOP PRINCIPAL
//====================================================
void loop() {
    esp_task_wdt_reset();

    servidorAdmin.handleClient();

    if (Serial.available()) {
        String comando = Serial.readStringUntil('\n');
        comando.trim();
        if (comando == "resetar_wifi") {
            WiFiManager wm;
            wm.resetSettings();
            delay(1000);
            ESP.restart();
        }
        if (comando == "status_fila") {
            Serial.printf("Fila: %d/%d | Descartes por faixa invalida: %lu | Descartes por checksum: %lu\n",
                totalRegistros, MAX_REGISTROS, leiturasDescartadasFaixa, registrosDescartadosChecksum);
        }
    }

    if (WiFi.status() != WL_CONNECTED) {
        WiFi.reconnect();
        delay(5000);
        return;
    }

    unsigned long agora = millis();

    if (agora - ultimaColeta >= INTERVALO_COLETA_MS || ultimaColeta == 0) {
        coletarAmostra();
        ultimaColeta = agora;
    }

    if (agora - ultimaAgregacao >= INTERVALO_AGREGACAO_MS || ultimaAgregacao == 0) {
        gravarRegistroPendente();
        ultimaAgregacao = agora;
    }

    if (agora - ultimaTentativaEnvio >= INTERVALO_TENTATIVA_ENVIO_MS || ultimaTentativaEnvio == 0) {
        tentarDrenarFila();
        ultimaTentativaEnvio = agora;
    }
}

//====================================================
// SENSORES
//====================================================
void inicializarSensores() {
    Wire.begin(SDA_PIN, SCL_PIN);
    dht.begin();

    ahtDisponivel = aht.begin();
    Serial.println(ahtDisponivel ? "AHT10 encontrado (0x38)." : "AVISO: AHT10 nao encontrado.");

    rtcDisponivel = rtc.begin();
    if (rtcDisponivel) {
        Serial.println("RTC DS3231 encontrado (0x68).");
        if (rtc.lostPower()) {
            Serial.println("RTC sem hora valida: ajustando pelo horario de compilacao.");
            rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
        }
    } else {
        Serial.println("AVISO: RTC nao encontrado. Timestamps usarao millis() como aproximacao.");
    }

    analogReadResolution(12);
    analogSetAttenuation(ADC_11db);
}

float lerUV() {
    float tensao = (analogRead(UV_PIN) * 3.3) / 4095.0;
    float uv = tensao / 0.1;
    return max(0.0f, uv);
}

float lerLDR() {
    return map(analogRead(LDR_PIN), 0, 4095, 100, 0);
}

bool faixaValida(float valor, float minimo, float maximo) {
    return !isnan(valor) && valor >= minimo && valor <= maximo;
}

void coletarAmostra() {
    float tempDHT = dht.readTemperature();
    float umidDHT = dht.readHumidity();

    if (isnan(tempDHT) || isnan(umidDHT)) {
        Serial.println("Falha ao ler DHT22 nesta amostra. Ignorando.");
    } else if (!faixaValida(tempDHT, TEMP_MIN_VALIDA, TEMP_MAX_VALIDA) ||
               !faixaValida(umidDHT, UMIDADE_MIN_VALIDA, UMIDADE_MAX_VALIDA)) {
        Serial.printf("DHT22 fora da faixa plausivel (temp=%.1f umid=%.1f). Descartando amostra.\n", tempDHT, umidDHT);
        leiturasDescartadasFaixa++;
    } else {
        acTempDHT.adicionar(tempDHT);
        acUmidDHT.adicionar(umidDHT);
    }

    if (ahtDisponivel) {
        sensors_event_t umid, temp;
        aht.getEvent(&umid, &temp);

        if (!faixaValida(temp.temperature, TEMP_MIN_VALIDA, TEMP_MAX_VALIDA) ||
            !faixaValida(umid.relative_humidity, UMIDADE_MIN_VALIDA, UMIDADE_MAX_VALIDA)) {
            Serial.printf("AHT10 fora da faixa plausivel (temp=%.1f umid=%.1f). Descartando amostra.\n",
                temp.temperature, umid.relative_humidity);
            leiturasDescartadasFaixa++;
        } else {
            acTempAHT.adicionar(temp.temperature);
            acUmidAHT.adicionar(umid.relative_humidity);
        }
    }

    float uv = lerUV();
    if (faixaValida(uv, 0.0, UV_MAX_VALIDO)) {
        acUV.adicionar(uv);
    } else {
        Serial.printf("UV fora da faixa plausivel (%.1f). Descartando amostra.\n", uv);
        leiturasDescartadasFaixa++;
    }

    acLDR.adicionar(lerLDR());

    Serial.printf("Amostra coletada (%d acumuladas)\n", acUV.quantidade);
}

//====================================================
// CALCULOS (Buffington)
//====================================================
float calcularPontoOrvalho(float temperatura, float umidade) {
    float a = 17.27, b = 237.7;
    float alpha = ((a * temperatura) / (b + temperatura)) + log(umidade / 100.0);
    return (b * alpha) / (a - alpha);
}

float calcularITGU(float temperatura, float umidade) {
    return temperatura + (0.36 * calcularPontoOrvalho(temperatura, umidade)) + 41.5;
}

float calcularITU(float temperatura, float umidade) {
    return temperatura + (0.36 * calcularPontoOrvalho(temperatura, umidade)) + 41.5;
}

String classificar(float indice) {
    if (isnan(indice)) return "";
    if (indice > 78.0) return "perigo";
    if (indice > 72.0) return "alerta";
    return "normal";
}

//====================================================
// EEPROM - LEITURA/ESCRITA BRUTA (AT24C32, endereco I2C 0x50)
//====================================================
void escreverEEPROM(int endereco, byte valor) {
    Wire.beginTransmission(0x50);
    Wire.write(endereco >> 8);
    Wire.write(endereco & 0xFF);
    Wire.write(valor);
    Wire.endTransmission();
    delay(5);
}

byte lerEEPROM(int endereco) {
    Wire.beginTransmission(0x50);
    Wire.write(endereco >> 8);
    Wire.write(endereco & 0xFF);
    Wire.endTransmission();
    Wire.requestFrom(0x50, 1);
    return Wire.available() ? Wire.read() : 0;
}

void salvarControleEEPROM() {
    Wire.beginTransmission(0x50);
    Wire.write(0);
    Wire.write((totalRegistros >> 8) & 0xFF);
    Wire.write(totalRegistros & 0xFF);
    Wire.write((proximoRegistro >> 8) & 0xFF);
    Wire.write(proximoRegistro & 0xFF);
    Wire.endTransmission();
    delay(5);
}

void carregarControleEEPROM() {
    totalRegistros = (lerEEPROM(0) << 8) | lerEEPROM(1);
    proximoRegistro = (lerEEPROM(2) << 8) | lerEEPROM(3);

    if (totalRegistros > MAX_REGISTROS || totalRegistros < 0) {
        totalRegistros = 0;
        proximoRegistro = 0;
    }

    Serial.printf("Fila recuperada da EEPROM: %d registros pendentes/historicos.\n", totalRegistros);
}

uint32_t calcularChecksum(const RegistroMeteorologico &r) {
    const byte *dados = (const byte *)&r;
    int tamanhoSemChecksum = TAM_REGISTRO - sizeof(uint32_t);

    uint32_t soma = 0;
    for (int i = 0; i < tamanhoSemChecksum; i++) {
        soma = (soma * 31) + dados[i];
    }
    return soma;
}

void gravarRegistro(int indice, RegistroMeteorologico registro) {
    registro.checksum = calcularChecksum(registro);

    int endereco = ENDERECO_DADOS + (indice * TAM_REGISTRO);
    const byte *dados = (const byte *)&registro;
    for (int i = 0; i < TAM_REGISTRO; i++) {
        escreverEEPROM(endereco + i, dados[i]);
    }
}

bool lerRegistro(int indice, RegistroMeteorologico &registro) {
    int endereco = ENDERECO_DADOS + (indice * TAM_REGISTRO);
    byte *dados = (byte *)&registro;
    for (int i = 0; i < TAM_REGISTRO; i++) {
        dados[i] = lerEEPROM(endereco + i);
    }

    return registro.checksum == calcularChecksum(registro);
}

//====================================================
// GRAVA A MEDIA DO CICLO NA FILA
//====================================================
void gravarRegistroPendente() {
    if (acUV.quantidade == 0) {
        Serial.println("Nenhuma amostra acumulada. Pulando agregacao deste ciclo.");
        return;
    }

    RegistroMeteorologico registro = {};

    if (rtcDisponivel) {
        DateTime agora = rtc.now();
        registro.ano = agora.year();
        registro.mes = agora.month();
        registro.dia = agora.day();
        registro.hora = agora.hour();
        registro.minuto = agora.minute();
        registro.segundo = agora.second();
    }

    registro.tempDHT = acTempDHT.media();
    registro.umidDHT = acUmidDHT.media();
    registro.tempAHT = acTempAHT.media();
    registro.umidAHT = acUmidAHT.media();
    registro.indiceUV = acUV.media();
    registro.luminosidade = acLDR.media();

    registro.ITGU = (!isnan(registro.tempDHT) && !isnan(registro.umidDHT))
        ? calcularITGU(registro.tempDHT, registro.umidDHT) : NAN;

    registro.ITU = (ahtDisponivel && !isnan(registro.tempAHT) && !isnan(registro.umidAHT))
        ? calcularITU(registro.tempAHT, registro.umidAHT) : NAN;

    registro.enviado = false;

    int indice = proximoRegistro;
    gravarRegistro(indice, registro);

    proximoRegistro = (proximoRegistro + 1) % MAX_REGISTROS;
    if (totalRegistros < MAX_REGISTROS) {
        totalRegistros++;
    }
    salvarControleEEPROM();

    acTempDHT.limpar();
    acUmidDHT.limpar();
    acTempAHT.limpar();
    acUmidAHT.limpar();
    acUV.limpar();
    acLDR.limpar();

    Serial.printf("Registro persistido na fila (indice %d). Total pendentes/historico: %d\n", indice, totalRegistros);
}

//====================================================
// MONTA O JSON NO FORMATO ESPERADO PELA API LARAVEL
//====================================================
String montarJSON(const RegistroMeteorologico &r) {
    JsonDocument json;

    if (!isnan(r.tempDHT)) json["temp_globo_negro"] = r.tempDHT;
    if (!isnan(r.umidDHT)) json["umid_globo_negro"] = r.umidDHT;
    if (!isnan(r.tempAHT)) json["temperatura_ar"] = r.tempAHT;
    if (!isnan(r.umidAHT)) json["umidade_ar"] = r.umidAHT;
    json["indice_uv"] = r.indiceUV;
    json["luminosidade"] = r.luminosidade;

    if (!isnan(r.ITGU)) {
        json["itgu"] = r.ITGU;
        json["itgu_classificacao"] = classificar(r.ITGU);
    }
    if (!isnan(r.ITU)) {
        json["itu"] = r.ITU;
        json["itu_classificacao"] = classificar(r.ITU);
    }

    json["tipo_agregacao"] = "agregado";

    if (r.ano > 0) {
        char timestamp[20];
        snprintf(timestamp, sizeof(timestamp), "%04d-%02d-%02d %02d:%02d:%02d",
                 r.ano, r.mes, r.dia, r.hora, r.minuto, r.segundo);
        json["registrado_em"] = timestamp;
    }

    String saida;
    serializeJson(json, saida);
    return saida;
}

//====================================================
// ENVIO HTTP PARA UM DESTINO
//====================================================
bool enviarParaUmServidor(const char* url, const char* token, const String& json, String& status) {
    if (strlen(url) == 0 || strlen(token) == 0) {
        status = "nao configurado";
        return true;
    }

    HTTPClient http;
    WiFiClientSecure clienteSeguro;
    bool usarHttps = String(url).startsWith("https://");

    if (usarHttps) {
        clienteSeguro.setInsecure();
        http.begin(clienteSeguro, url);
    } else {
        http.begin(url);
    }

    http.setConnectTimeout(8000);
    http.setTimeout(60000);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Token", token);

    int codigo = http.POST(json);
    bool sucesso = codigo >= 200 && codigo < 300;

    status = sucesso
        ? ("HTTP " + String(codigo) + " OK")
        : ("erro: " + (codigo > 0 ? String(codigo) : http.errorToString(codigo)));

    Serial.printf("[%s] %s\n", url, status.c_str());

    http.end();
    return sucesso;
}

//====================================================
// TENTA ENVIAR O REGISTRO PENDENTE MAIS ANTIGO DA FILA
//====================================================
void tentarDrenarFila() {
    if (totalRegistros == 0) {
        return;
    }

    int indiceMaisAntigo = (proximoRegistro - totalRegistros + MAX_REGISTROS) % MAX_REGISTROS;

    RegistroMeteorologico registro;
    bool integro = lerRegistro(indiceMaisAntigo, registro);

    if (!integro) {
        Serial.printf("Registro no indice %d esta corrompido (checksum invalido). Descartando.\n", indiceMaisAntigo);
        registrosDescartadosChecksum++;
        totalRegistros--;
        salvarControleEEPROM();
        return;
    }

    if (registro.enviado) {
        totalRegistros--;
        salvarControleEEPROM();
        return;
    }

    String json = montarJSON(registro);
    Serial.println("Tentando enviar registro pendente da fila...");

    bool sucessoLocal = enviarParaUmServidor(servidorUrlLocal.c_str(), tokenLocal.c_str(), json, ultimoStatusLocal);
    bool sucessoProducao = enviarParaUmServidor(servidorUrlProducao.c_str(), tokenProducao.c_str(), json, ultimoStatusProducao);

    if (sucessoLocal && sucessoProducao) {
        registro.enviado = true;
        gravarRegistro(indiceMaisAntigo, registro);

        totalRegistros--;
        salvarControleEEPROM();

        Serial.printf("Registro enviado com sucesso. Restam %d na fila.\n", totalRegistros);
    } else {
        Serial.println("Falha no envio. Registro permanece na fila para nova tentativa.");
    }
}

//====================================================
// CONFIGURACAO (WiFi + Preferences)
//====================================================
void carregarConfiguracao() {
    preferencias.begin("estacao", false);
    servidorUrlLocal = preferencias.getString("server_local", "");
    tokenLocal = preferencias.getString("token_local", "");
    servidorUrlProducao = preferencias.getString("server_prod", "");
    tokenProducao = preferencias.getString("token_prod", "");
}

void configurarWiFi() {
    WiFiManager wm;
    wm.setConfigPortalTimeout(180);

    if (!wm.autoConnect("EstacaoMeteo-Config")) {
        Serial.println("Falha ao conectar WiFi. Reiniciando em 3s...");
        delay(3000);
        ESP.restart();
    }

    Serial.print("WiFi conectado! Acesse a pagina de administracao em: http://");
    Serial.println(WiFi.localIP());
}

//====================================================
// PAGINA DE ADMINISTRACAO
//====================================================
void configurarServidorAdmin() {
    servidorAdmin.on("/", HTTP_GET, []() {
        String html = "<!DOCTYPE html><html lang='pt-BR'><head><meta charset='UTF-8'>";
        html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
        html += "<title>Estacao Meteorologica - Config</title>";
        html += "<style>body{font-family:Arial,sans-serif;max-width:600px;margin:2rem auto;padding:0 1rem;background:#f4f4f4;}";
        html += ".card{background:#fff;border-radius:8px;padding:1.5rem;margin-bottom:1rem;box-shadow:0 1px 3px rgba(0,0,0,.1);}";
        html += "label{display:block;font-weight:bold;margin-top:1rem;font-size:.9rem;}";
        html += "input{width:100%;padding:.5rem;margin-top:.3rem;box-sizing:border-box;border:1px solid #ccc;border-radius:4px;}";
        html += "button{margin-top:1.5rem;padding:.7rem 1.5rem;background:#1f2937;color:#fff;border:none;border-radius:4px;cursor:pointer;}";
        html += ".status{font-size:.85rem;color:#555;}</style></head><body>";
        html += "<h1>Estacao Meteorologica &mdash; Administracao</h1>";

        html += "<div class='card status'><strong>Status atual</strong><br>";
        html += "IP: " + WiFi.localIP().toString() + "<br>";
        html += "Fila pendente: " + String(totalRegistros) + " / " + String(MAX_REGISTROS) + "<br>";
        html += "Descartes (faixa invalida): " + String(leiturasDescartadasFaixa) + "<br>";
        html += "Descartes (checksum): " + String(registrosDescartadosChecksum) + "<br>";
        html += "Ultimo envio local: " + ultimoStatusLocal + "<br>";
        html += "Ultimo envio producao: " + ultimoStatusProducao + "</div>";

        html += "<form class='card' method='POST' action='/salvar'><strong>Servidores</strong>";
        html += "<label>URL do servidor LOCAL</label><input name='local_url' value='" + servidorUrlLocal + "'>";
        html += "<label>Token da estacao LOCAL</label><input name='local_token' value='" + tokenLocal + "'>";
        html += "<label>URL do servidor de PRODUCAO</label><input name='prod_url' value='" + servidorUrlProducao + "'>";
        html += "<label>Token da estacao de PRODUCAO</label><input name='prod_token' value='" + tokenProducao + "'>";
        html += "<button type='submit'>Salvar configuracao</button></form>";

        html += "</body></html>";
        servidorAdmin.send(200, "text/html; charset=utf-8", html);
    });

    servidorAdmin.on("/salvar", HTTP_POST, []() {
        servidorUrlLocal = servidorAdmin.arg("local_url");
        tokenLocal = servidorAdmin.arg("local_token");
        servidorUrlProducao = servidorAdmin.arg("prod_url");
        tokenProducao = servidorAdmin.arg("prod_token");

        preferencias.putString("server_local", servidorUrlLocal);
        preferencias.putString("token_local", tokenLocal);
        preferencias.putString("server_prod", servidorUrlProducao);
        preferencias.putString("token_prod", tokenProducao);

        servidorAdmin.sendHeader("Location", "/");
        servidorAdmin.send(303);
    });

    servidorAdmin.begin();
}
