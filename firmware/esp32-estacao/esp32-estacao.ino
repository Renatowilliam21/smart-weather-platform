#include <WiFi.h>
#include <WiFiManager.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <Preferences.h>
#include <math.h>

// ==================== PINOS ====================
#define BOTAO_RESET_PIN 0
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define UV_PIN 34
#define LDR_PIN 35

// ==================== INTERVALOS ====================
// Coleta interna frequente (nao transmite), agregacao reduz trafego e mantem
// o envio abaixo do limite de hibernacao do Render (15 min), evitando cold-start.
const unsigned long INTERVALO_COLETA_MS = 60000;   // 1 minuto
const unsigned long INTERVALO_ENVIO_MS  = 600000;  // 10 minutos

DHT dht(DHT_PIN, DHT_TYPE);
Adafruit_BME280 bme;
bool bmeDisponivel = false;
Preferences preferencias;
WebServer servidorAdmin(80);

String servidorUrlLocal, tokenLocal;
String servidorUrlProducao, tokenProducao;

String ultimoStatusLocal = "ainda nao enviado";
String ultimoStatusProducao = "ainda nao enviado";

unsigned long ultimaColeta = 0;
unsigned long ultimoEnvio = 0;

// ==================== ACUMULADORES (para calcular a media) ====================
struct Acumulador {
    double soma = 0;
    int contagem = 0;

    void adicionar(float valor) {
        if (!isnan(valor)) {
            soma += valor;
            contagem++;
        }
    }

    float media() const {
        return contagem > 0 ? (float)(soma / contagem) : NAN;
    }

    void resetar() {
        soma = 0;
        contagem = 0;
    }
};

Acumulador acTempGloboNegro, acUmidGloboNegro, acTempAr, acUmidAr;
Acumulador acPressao, acAltitude, acIndiceUV, acLuminosidade;

// ==================== DECLARACOES ANTECIPADAS ====================
void configurarWiFi();
void configurarServidorAdmin();
void tratarPaginaInicial();
void tratarSalvar();
void coletarAmostra();
void enviarMediaAgregada();
String montarPayloadJson();
bool enviarParaUmServidor(const char* url, const char* token, const String& corpoJson, String& statusResultado);
float calcularPontoDeOrvalho(float tempC, float umidadeRel);
float calcularItgu(float tempGloboNegro, float umidade);
float calcularItu(float tempAr, float umidade);
String classificarIndiceTermico(float indice);
float lerIndiceUV();
float lerLuminosidade();
String htmlEscapar(const String& texto);

// ==================== SETUP ====================
void setup() {
    Serial.begin(115200);
    delay(1000);

    pinMode(BOTAO_RESET_PIN, INPUT_PULLUP);

    preferencias.begin("estacao", false);
    servidorUrlLocal = preferencias.getString("server_url_local", "");
    tokenLocal = preferencias.getString("token_local", "");
    servidorUrlProducao = preferencias.getString("server_url_prod", "");
    tokenProducao = preferencias.getString("token_prod", "");

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
        Serial.println("AVISO: BME280 nao encontrado. Leituras de ambiente externo serao omitidas.");
    }

    configurarWiFi();
    configurarServidorAdmin();
}

// ==================== LOOP ====================
void loop() {
    servidorAdmin.handleClient();

    if (Serial.available()) {
        String comando = Serial.readStringUntil('\n');
        comando.trim();
        if (comando == "resetar_wifi") {
            Serial.println("Apagando WiFi salvo e reiniciando...");
            WiFiManager wm;
            wm.resetSettings();
            delay(1000);
            ESP.restart();
        }
    }

    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi desconectado. Tentando reconectar...");
        WiFi.reconnect();
        delay(5000);
        return;
    }

    unsigned long agora = millis();

    if (agora - ultimaColeta >= INTERVALO_COLETA_MS || ultimaColeta == 0) {
        coletarAmostra();
        ultimaColeta = agora;
    }

    if (agora - ultimoEnvio >= INTERVALO_ENVIO_MS || ultimoEnvio == 0) {
        enviarMediaAgregada();
        ultimoEnvio = agora;
    }
}

// ==================== WIFI (WiFiManager cuida so da rede) ====================
void configurarWiFi() {
    WiFiManager wm;
    wm.setConfigPortalTimeout(180);

    if (!wm.autoConnect("EstacaoMeteo-Config")) {
        Serial.println("Falha ao conectar WiFi. Reiniciando em 3s...");
        delay(3000);
        ESP.restart();
    }

    Serial.println("WiFi conectado!");
    Serial.print("Acesse a pagina de administracao em: http://");
    Serial.println(WiFi.localIP());
}

// ==================== PAGINA DE ADMINISTRACAO ====================
String htmlEscapar(const String& texto) {
    String resultado = texto;
    resultado.replace("&", "&amp;");
    resultado.replace("\"", "&quot;");
    resultado.replace("<", "&lt;");
    resultado.replace(">", "&gt;");
    return resultado;
}

void configurarServidorAdmin() {
    servidorAdmin.on("/", HTTP_GET, tratarPaginaInicial);
    servidorAdmin.on("/salvar", HTTP_POST, tratarSalvar);
    servidorAdmin.begin();
    Serial.println("Servidor de administracao iniciado.");
}

void tratarPaginaInicial() {
    String html = "<!DOCTYPE html><html lang='pt-BR'><head><meta charset='UTF-8'>";
    html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
    html += "<title>Estacao Meteorologica - Config</title>";
    html += "<style>";
    html += "body{font-family:Arial,sans-serif;max-width:600px;margin:2rem auto;padding:0 1rem;background:#f4f4f4;}";
    html += "h1{font-size:1.3rem;} .card{background:#fff;border-radius:8px;padding:1.5rem;margin-bottom:1rem;box-shadow:0 1px 3px rgba(0,0,0,.1);}";
    html += "label{display:block;font-weight:bold;margin-top:1rem;font-size:.9rem;}";
    html += "input{width:100%;padding:.5rem;margin-top:.3rem;box-sizing:border-box;border:1px solid #ccc;border-radius:4px;}";
    html += "button{margin-top:1.5rem;padding:.7rem 1.5rem;background:#1f2937;color:#fff;border:none;border-radius:4px;cursor:pointer;}";
    html += ".status{font-size:.85rem;color:#555;}";
    html += "</style></head><body>";
    html += "<h1>Estacao Meteorologica &mdash; Administracao</h1>";

    html += "<div class='card status'>";
    html += "<strong>Status atual</strong><br>";
    html += "IP da estacao: " + WiFi.localIP().toString() + "<br>";
    html += "Amostras acumuladas: " + String(acIndiceUV.contagem) + "<br>";
    html += "Ultimo envio local: " + htmlEscapar(ultimoStatusLocal) + "<br>";
    html += "Ultimo envio producao: " + htmlEscapar(ultimoStatusProducao);
    html += "</div>";

    html += "<form class='card' method='POST' action='/salvar'>";
    html += "<strong>Configuracao dos servidores</strong>";

    html += "<label>URL do servidor LOCAL</label>";
    html += "<input name='local_url' value='" + htmlEscapar(servidorUrlLocal) + "'>";

    html += "<label>Token da estacao LOCAL</label>";
    html += "<input name='local_token' value='" + htmlEscapar(tokenLocal) + "'>";

    html += "<label>URL do servidor de PRODUCAO</label>";
    html += "<input name='prod_url' value='" + htmlEscapar(servidorUrlProducao) + "'>";

    html += "<label>Token da estacao de PRODUCAO</label>";
    html += "<input name='prod_token' value='" + htmlEscapar(tokenProducao) + "'>";

    html += "<button type='submit'>Salvar configuracao</button>";
    html += "</form>";

    html += "</body></html>";

    servidorAdmin.send(200, "text/html; charset=utf-8", html);
}

void tratarSalvar() {
    servidorUrlLocal = servidorAdmin.arg("local_url");
    tokenLocal = servidorAdmin.arg("local_token");
    servidorUrlProducao = servidorAdmin.arg("prod_url");
    tokenProducao = servidorAdmin.arg("prod_token");

    preferencias.putString("server_url_local", servidorUrlLocal);
    preferencias.putString("token_local", tokenLocal);
    preferencias.putString("server_url_prod", servidorUrlProducao);
    preferencias.putString("token_prod", tokenProducao);

    String html = "<!DOCTYPE html><html lang='pt-BR'><head><meta charset='UTF-8'>";
    html += "<meta http-equiv='refresh' content='2;url=/'>";
    html += "<style>body{font-family:Arial,sans-serif;text-align:center;margin-top:3rem;}</style>";
    html += "</head><body><h2>Configuracao salva com sucesso!</h2>";
    html += "<p>Redirecionando...</p></body></html>";

    servidorAdmin.send(200, "text/html; charset=utf-8", html);

    Serial.println("Configuracao atualizada via pagina de administracao:");
    Serial.println("  Local: " + servidorUrlLocal);
    Serial.println("  Producao: " + servidorUrlProducao);
}

// ==================== CALCULOS ====================
float calcularPontoDeOrvalho(float tempC, float umidadeRel) {
    float a = 17.27;
    float b = 237.7;
    float alpha = ((a * tempC) / (b + tempC)) + log(umidadeRel / 100.0);
    return (b * alpha) / (a - alpha);
}

float calcularItgu(float tempGloboNegro, float umidade) {
    float pontoOrvalho = calcularPontoDeOrvalho(tempGloboNegro, umidade);
    return tempGloboNegro + (0.36 * pontoOrvalho) + 41.5;
}

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

// ==================== COLETA (acumula, nao transmite) ====================
void coletarAmostra() {
    float tempGloboNegro = dht.readTemperature();
    float umidGloboNegro = dht.readHumidity();

    if (isnan(tempGloboNegro) || isnan(umidGloboNegro)) {
        Serial.println("Falha ao ler o DHT22 nesta amostra. Ignorando.");
    } else {
        acTempGloboNegro.adicionar(tempGloboNegro);
        acUmidGloboNegro.adicionar(umidGloboNegro);
    }

    acIndiceUV.adicionar(lerIndiceUV());
    acLuminosidade.adicionar(lerLuminosidade());

    if (bmeDisponivel) {
        acTempAr.adicionar(bme.readTemperature());
        acUmidAr.adicionar(bme.readHumidity());
        acPressao.adicionar(bme.readPressure() / 100.0F);
        acAltitude.adicionar(bme.readAltitude(1013.25));
    }

    Serial.printf("Amostra coletada (%d acumuladas)\n", acIndiceUV.contagem);
}

// ==================== MONTA O JSON (compartilhado pelos dois envios) ====================
String montarPayloadJson() {
    float tempGloboNegro = acTempGloboNegro.media();
    float umidGloboNegro = acUmidGloboNegro.media();
    float indiceUV = acIndiceUV.media();
    float luminosidade = acLuminosidade.media();

    float itgu = NAN, itu = NAN;
    String itguClassificacao = "", ituClassificacao = "";

    if (!isnan(tempGloboNegro) && !isnan(umidGloboNegro)) {
        itgu = calcularItgu(tempGloboNegro, umidGloboNegro);
        itguClassificacao = classificarIndiceTermico(itgu);
    }

    float tempAr = acTempAr.media();
    float umidAr = acUmidAr.media();
    float pressao = acPressao.media();
    float altitude = acAltitude.media();

    if (bmeDisponivel && !isnan(tempAr) && !isnan(umidAr)) {
        itu = calcularItu(tempAr, umidAr);
        ituClassificacao = classificarIndiceTermico(itu);
    }

    JsonDocument payload;
    if (!isnan(tempGloboNegro)) payload["temp_globo_negro"] = tempGloboNegro;
    if (!isnan(umidGloboNegro)) payload["umid_globo_negro"] = umidGloboNegro;
    payload["indice_uv"] = indiceUV;
    payload["luminosidade"] = luminosidade;
    if (!isnan(itgu)) {
        payload["itgu"] = itgu;
        payload["itgu_classificacao"] = itguClassificacao;
    }
    payload["tipo_agregacao"] = "agregado";

    if (bmeDisponivel && !isnan(tempAr)) {
        payload["temperatura_ar"] = tempAr;
        payload["umidade_ar"] = umidAr;
        payload["pressao"] = pressao;
        payload["altitude"] = altitude;
        if (!isnan(itu)) {
            payload["itu"] = itu;
            payload["itu_classificacao"] = ituClassificacao;
        }
    }

    String corpoJson;
    serializeJson(payload, corpoJson);
    return corpoJson;
}

// ==================== ENVIO PARA UM DESTINO ====================
bool enviarParaUmServidor(const char* url, const char* token, const String& corpoJson, String& statusResultado) {
    if (strlen(url) == 0 || strlen(token) == 0) {
        statusResultado = "nao configurado";
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

    Serial.printf("Enviando para %s\n", url);

    int codigoResposta = http.POST(corpoJson);
    bool sucesso = codigoResposta >= 200 && codigoResposta < 300;

    if (codigoResposta > 0) {
        Serial.printf("Resposta HTTP %d: %s\n", codigoResposta, http.getString().c_str());
        statusResultado = "HTTP " + String(codigoResposta) + " em " + String(millis() / 1000) + "s de uptime";
    } else {
        Serial.printf("Erro no envio: %s\n", http.errorToString(codigoResposta).c_str());
        statusResultado = "erro: " + http.errorToString(codigoResposta);
    }

    http.end();
    return sucesso;
}

// ==================== ORQUESTRA O ENVIO PARA OS DOIS DESTINOS ====================
void enviarMediaAgregada() {
    if (acIndiceUV.contagem == 0) {
        Serial.println("Nenhuma amostra acumulada ainda. Pulando envio.");
        return;
    }

    String corpoJson = montarPayloadJson();

    Serial.println("--- Enviando media agregada ---");
    Serial.printf("Amostras acumuladas: %d\n", acIndiceUV.contagem);

    Serial.println("[LOCAL]");
    bool sucessoLocal = enviarParaUmServidor(servidorUrlLocal.c_str(), tokenLocal.c_str(), corpoJson, ultimoStatusLocal);

    Serial.println("[PRODUCAO]");
    bool sucessoProducao = enviarParaUmServidor(servidorUrlProducao.c_str(), tokenProducao.c_str(), corpoJson, ultimoStatusProducao);

    // So limpa os acumuladores se AMBOS os envios (os que estao configurados)
    // tiverem sucesso, evitando perder dados de um destino por falha no outro.
    if (sucessoLocal && sucessoProducao) {
        acTempGloboNegro.resetar();
        acUmidGloboNegro.resetar();
        acTempAr.resetar();
        acUmidAr.resetar();
        acPressao.resetar();
        acAltitude.resetar();
        acIndiceUV.resetar();
        acLuminosidade.resetar();
        Serial.println("Acumuladores zerados (envio confirmado nos dois destinos).");
    } else {
        Serial.println("Pelo menos um envio falhou. Amostras mantidas para nova tentativa.");
    }
}
