#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <math.h>

// ==================== CONFIGURAÇÃO ====================
const char* WIFI_SSID     = "SEU_WIFI_AQUI";
const char* WIFI_PASSWORD = "SUA_SENHA_AQUI";

const char* SERVER_URL = "http://192.168.0.33:8000/api/leituras";
const char* API_TOKEN  = "COLE_O_TOKEN_DA_ESTACAO_AQUI";

const unsigned long INTERVALO_ENVIO_MS = 300000; // 5 minutos

// ==================== PINOS ====================
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define UV_PIN 34
#define LDR_PIN 35

DHT dht(DHT_PIN, DHT_TYPE);
Adafruit_BME280 bme;
bool bmeDisponivel = false;

unsigned long ultimoEnvio = 0;

// ==================== SETUP ====================
void setup() {
    Serial.begin(115200);
    delay(1000);

    dht.begin();
    analogReadResolution(12);

    Wire.begin(21, 22);
    if (bme.begin(0x76)) {
        bmeDisponivel = true;
        Serial.println("BME280 inicializado com sucesso (0x76).");
    } else if (bme.begin(0x77)) {
        bmeDisponivel = true;
        Serial.println("BME280 inicializado com sucesso (0x77).");
    } else {
        Serial.println("ERRO: BME280 nao encontrado. Leituras de ambiente externo serao omitidas.");
    }

    conectarWiFi();
}

// ==================== LOOP ====================
void loop() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi desconectado. Reconectando...");
        conectarWiFi();
    }

    if (millis() - ultimoEnvio >= INTERVALO_ENVIO_MS || ultimoEnvio == 0) {
        coletarEEnviar();
        ultimoEnvio = millis();
    }

    delay(1000);
}

// ==================== WIFI ====================
void conectarWiFi() {
    Serial.print("Conectando ao WiFi");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int tentativas = 0;
    while (WiFi.status() != WL_CONNECTED && tentativas < 30) {
        delay(500);
        Serial.print(".");
        tentativas++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi conectado!");
        Serial.print("IP: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("\nFalha ao conectar WiFi. Tentando novamente no proximo ciclo.");
    }
}

// ==================== CÁLCULOS ====================
float calcularPontoDeOrvalho(float tempC, float umidadeRel) {
    float a = 17.27;
    float b = 237.7;
    float alpha = ((a * tempC) / (b + tempC)) + log(umidadeRel / 100.0);
    return (b * alpha) / (a - alpha);
}

// ITGU: usa temperatura de globo negro (considera radiação solar)
float calcularItgu(float tempGloboNegro, float umidade) {
    float pontoOrvalho = calcularPontoDeOrvalho(tempGloboNegro, umidade);
    return tempGloboNegro + (0.36 * pontoOrvalho) + 41.5;
}

// ITU: usa temperatura do ar ambiente (sem efeito de radiação solar)
float calcularItu(float tempAr, float umidade) {
    float pontoOrvalho = calcularPontoDeOrvalho(tempAr, umidade);
    return tempAr + (0.36 * pontoOrvalho) + 41.5;
}

String classificarIndiceTermico(float indice) {
    if (indice > 78.0) return "perigo";
    if (indice > 72.0) return "alerta";
    return "normal";
}

float lerIndiceUV() {
    int leituraBruta = analogRead(UV_PIN);
    float tensao = (leituraBruta / 4095.0) * 3.3;
    float indiceUV = tensao / 0.1;
    return max(0.0f, indiceUV);
}

float lerLuminosidade() {
    int leituraBruta = analogRead(LDR_PIN);
    return (leituraBruta / 4095.0) * 100.0;
}

// ==================== COLETA ====================
void coletarEEnviar() {
    float tempGloboNegro = dht.readTemperature();
    float umidGloboNegro = dht.readHumidity();

    if (isnan(tempGloboNegro) || isnan(umidGloboNegro)) {
        Serial.println("Falha ao ler o DHT22. Pulando este ciclo.");
        return;
    }

    float indiceUV = lerIndiceUV();
    float luminosidade = lerLuminosidade();

    float itgu = calcularItgu(tempGloboNegro, umidGloboNegro);
    String itguClassificacao = classificarIndiceTermico(itgu);

    float tempAr = NAN, umidAr = NAN, pressao = NAN, altitude = NAN;
    float itu = NAN;
    String ituClassificacao = "";

    if (bmeDisponivel) {
        tempAr = bme.readTemperature();
        umidAr = bme.readHumidity();
        pressao = bme.readPressure() / 100.0F;
        altitude = bme.readAltitude(1013.25);

        itu = calcularItu(tempAr, umidAr);
        ituClassificacao = classificarIndiceTermico(itu);
    }

    Serial.println("--- Leitura coletada ---");
    Serial.printf("Temp. Globo Negro: %.2f C | Umid: %.2f %%\n", tempGloboNegro, umidGloboNegro);
    if (bmeDisponivel) {
        Serial.printf("Temp. Ar: %.2f C | Umid: %.2f %% | Pressao: %.2f hPa\n", tempAr, umidAr, pressao);
    }
    Serial.printf("Indice UV: %.2f | Luminosidade: %.2f %%\n", indiceUV, luminosidade);
    Serial.printf("ITGU: %.2f (%s)\n", itgu, itguClassificacao.c_str());
    if (bmeDisponivel) {
        Serial.printf("ITU: %.2f (%s)\n", itu, ituClassificacao.c_str());
    }

    enviarParaServidor(
        tempGloboNegro, umidGloboNegro,
        tempAr, umidAr, pressao, altitude,
        indiceUV, luminosidade,
        itgu, itguClassificacao,
        itu, ituClassificacao
    );
}

// ==================== ENVIO HTTP ====================
void enviarParaServidor(
    float tempGloboNegro, float umidGloboNegro,
    float tempAr, float umidAr, float pressao, float altitude,
    float indiceUV, float luminosidade,
    float itgu, String itguClassificacao,
    float itu, String ituClassificacao
) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("Sem WiFi. Envio cancelado.");
        return;
    }

    HTTPClient http;
    http.begin(SERVER_URL);
    http.setConnectTimeout(5000);
    http.setTimeout(8000);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Token", API_TOKEN);

    JsonDocument payload;
    payload["temp_globo_negro"] = tempGloboNegro;
    payload["umid_globo_negro"] = umidGloboNegro;
    payload["indice_uv"] = indiceUV;
    payload["luminosidade"] = luminosidade;
    payload["itgu"] = itgu;
    payload["itgu_classificacao"] = itguClassificacao;
    payload["tipo_agregacao"] = "amostra";

    if (!isnan(tempAr)) {
        payload["temperatura_ar"] = tempAr;
        payload["umidade_ar"] = umidAr;
        payload["pressao"] = pressao;
        payload["altitude"] = altitude;
        payload["itu"] = itu;
        payload["itu_classificacao"] = ituClassificacao;
    }

    String corpoJson;
    serializeJson(payload, corpoJson);

    Serial.println("Enviando: " + corpoJson);

    int codigoResposta = http.POST(corpoJson);

    if (codigoResposta > 0) {
        String resposta = http.getString();
        Serial.printf("Resposta HTTP %d: %s\n", codigoResposta, resposta.c_str());
    } else {
        Serial.printf("Erro no envio: %s\n", http.errorToString(codigoResposta).c_str());
    }

    http.end();
}