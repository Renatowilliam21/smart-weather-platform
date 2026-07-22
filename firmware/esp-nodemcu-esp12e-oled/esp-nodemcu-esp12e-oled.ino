/***************************************************************************
 * ESTACAO METEOROLOGICA - ESP8266 (NodeMCU ESP-12E) + DHT22 + LDR + OLED
 * Adaptado para enviar dados para o SISTEMA WEB (Smart Weather Platform)
 *
 * Baseado nas boas praticas do firmware v2.2 (ESP32), adaptadas ao
 * hardware real desta estacao (DHT22 + LDR + OLED, sem BME280/UV/RTC):
 *   - Configuracao de WiFi via WiFiManager (portal cativo)
 *   - Nome da estacao configuravel, exibido no OLED e enviado no JSON
 *   - Pagina de administracao web (http://IP-do-ESP/) para configurar
 *     nome da estacao, URL do servidor e token, sem precisar regravar o
 *     firmware
 *   - Envio HTTP POST em JSON, autenticado por token (X-API-Token)
 *   - Fila persistente em EEPROM (memoria flash do proprio ESP8266):
 *     se o envio falhar (sem internet, servidor fora do ar, etc.), a
 *     leitura fica guardada e novas tentativas sao feitas automaticamente,
 *     sem perder dados nem travar o loop principal
 *   - Validacao de faixa fisica plausivel (descarta leitura corrompida
 *     do sensor antes de acumular/enviar)
 *   - Agregacao por media (evita enviar 1 leitura ruidosa a cada 2s;
 *     envia a media do periodo, como no v2.2)
 *
 * Envio para um unico servidor (nao duplo local+producao, diferente dos
 * firmwares ESP32) - decisao confirmada para esta estacao especifica.
 ***************************************************************************/

//==============================
// BIBLIOTECAS
//==============================
#include <ESP8266WiFi.h>
#include <WiFiManager.h>          // https://github.com/tzapu/WiFiManager
#include <ESP8266WebServer.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <U8g2lib.h>
#include <DHT.h>
#include <math.h>

//==============================
// OLED
//==============================
U8G2_SSD1306_128X64_NONAME_F_SW_I2C u8g2(
  U8G2_R0,
  12,  // SCL D5 GPIO12
  14,  // SDA D6 GPIO14
  U8X8_PIN_NONE
);

//==============================
// DHT22
//==============================
#define DHT_PIN D4
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

//==============================
// LDR
//==============================
#define LDR_PIN A0

//==============================
// FAIXAS FISICAS PLAUSIVEIS (mesmo criterio do v2.2)
//==============================
const float TEMP_MIN_VALIDA = -10.0;
const float TEMP_MAX_VALIDA = 65.0;
const float UMIDADE_MIN_VALIDA = 5.0;
const float UMIDADE_MAX_VALIDA = 100.0;

//==============================
// INTERVALOS (nao bloqueantes, baseados em millis())
//==============================
const unsigned long INTERVALO_LEITURA_MS    = 2000;    // le sensores e atualiza o OLED
const unsigned long INTERVALO_AGREGACAO_MS  = 600000;  // fecha a media do periodo (10 min)
const unsigned long INTERVALO_ENVIO_MS      = 60000;   // tenta drenar a fila

unsigned long ultimaLeitura = 0;
unsigned long ultimaAgregacao = 0;
unsigned long ultimaTentativaEnvio = 0;

//==============================
// ACUMULADOR (media do periodo, como no v2.2)
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

Acumulador acTemperatura, acUmidade, acLuminosidade;

unsigned long leiturasDescartadasFaixa = 0;

//==============================
// CONFIGURACAO PERSISTENTE (EEPROM / flash)
//==============================
#define EEPROM_TAMANHO 4096
#define ENDERECO_CONFIG 0
#define ENDERECO_CONTROLE 220
#define ENDERECO_DADOS 240

struct ConfiguracaoEstacao {
  char nomeEstacao[32];
  char servidorUrl[80];
  char tokenEstacao[40];
  uint32_t checksum;
};

struct ControleFila {
  uint16_t totalRegistros;
  uint16_t proximoRegistro;
  uint32_t checksum;
};

struct RegistroMeteorologico {
  float temperatura;
  float umidade;
  float luminosidade;
  float itu;
  bool enviado;
  uint32_t checksum;
};

const int TAM_REGISTRO = sizeof(RegistroMeteorologico);
const int MAX_REGISTROS = (EEPROM_TAMANHO - ENDERECO_DADOS) / TAM_REGISTRO;

ConfiguracaoEstacao config;
ControleFila controle;

ESP8266WebServer servidorAdmin(80);

String ultimoStatusEnvio = "aguardando";

//==============================
// PROTOTIPOS
//==============================
uint32_t calcularChecksumConfig(const ConfiguracaoEstacao &c);
uint32_t calcularChecksumControle(const ControleFila &c);
uint32_t calcularChecksumRegistro(const RegistroMeteorologico &r);
void carregarConfiguracao();
void salvarConfiguracao();
void carregarControle();
void salvarControle();
void gravarRegistro(int indice, RegistroMeteorologico registro);
bool lerRegistro(int indice, RegistroMeteorologico &registro);
bool faixaValida(float valor, float minimo, float maximo);
void lerEAtualizarDisplay();
void fecharAgregacaoEEnfileirar();
String montarJSON(const RegistroMeteorologico &r);
bool enviarParaServidor(const String &json, String &status);
void tentarDrenarFila();
float calcularPontoOrvalho(float temperatura, float umidade);
float calcularITU(float temperatura, float umidade);
String classificar(float indice);
void configurarWiFi();
void configurarServidorAdmin();
void mostrarTelaInicial(const String &mensagem);

//====================================================
// SETUP
//====================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("ESTACAO METEOROLOGICA ESP8266 - DHT22 + LDR");

  EEPROM.begin(EEPROM_TAMANHO);

  u8g2.begin();
  dht.begin();

  carregarConfiguracao();
  carregarControle();

  mostrarTelaInicial("Conectando WiFi...");

  configurarWiFi();
  configurarServidorAdmin();

  mostrarTelaInicial("Pronto!");
  delay(1500);

  Serial.printf("Estacao: %s\n", config.nomeEstacao);
  Serial.printf("Fila persistente ativa. Capacidade: %d registros.\n", MAX_REGISTROS);
  Serial.printf("Pagina de administracao: http://%s/\n", WiFi.localIP().toString().c_str());
}

//====================================================
// LOOP PRINCIPAL (nao bloqueante)
//====================================================
void loop() {
  servidorAdmin.handleClient();

  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
  }

  unsigned long agora = millis();

  if (agora - ultimaLeitura >= INTERVALO_LEITURA_MS || ultimaLeitura == 0) {
    lerEAtualizarDisplay();
    ultimaLeitura = agora;
  }

  if (agora - ultimaAgregacao >= INTERVALO_AGREGACAO_MS || ultimaAgregacao == 0) {
    fecharAgregacaoEEnfileirar();
    ultimaAgregacao = agora;
  }

  if (agora - ultimaTentativaEnvio >= INTERVALO_ENVIO_MS || ultimaTentativaEnvio == 0) {
    if (WiFi.status() == WL_CONNECTED) {
      tentarDrenarFila();
    }
    ultimaTentativaEnvio = agora;
  }
}

//====================================================
// LEITURA DOS SENSORES + ATUALIZACAO DO OLED
//====================================================
void lerEAtualizarDisplay() {
  float temperatura = dht.readTemperature();
  float umidade = dht.readHumidity();
  int leituraLdr = analogRead(LDR_PIN);
  float luminosidade = map(leituraLdr, 0, 1023, 100, 0); // 0-100%, igual criterio do v2.2

  Serial.println("----------------");

  bool leituraValida = faixaValida(temperatura, TEMP_MIN_VALIDA, TEMP_MAX_VALIDA) &&
                        faixaValida(umidade, UMIDADE_MIN_VALIDA, UMIDADE_MAX_VALIDA);

  if (!leituraValida) {
    Serial.println("Erro no DHT22 ou fora da faixa plausivel. Leitura descartada.");
    leiturasDescartadasFaixa++;
  } else {
    Serial.printf("Temperatura: %.1f C\n", temperatura);
    Serial.printf("Umidade: %.1f %%\n", umidade);
    acTemperatura.adicionar(temperatura);
    acUmidade.adicionar(umidade);
  }

  Serial.printf("Luminosidade: %.0f %%\n", luminosidade);
  acLuminosidade.adicionar(luminosidade);

  char linhaTemp[20];
  char linhaUmid[20];
  char linhaLdr[20];

  if (leituraValida) {
    dtostrf(temperatura, 4, 1, linhaTemp);
    strcat(linhaTemp, " C");
    dtostrf(umidade, 4, 1, linhaUmid);
    strcat(linhaUmid, " %");
  } else {
    strcpy(linhaTemp, "-- C");
    strcpy(linhaUmid, "-- %");
  }
  sprintf(linhaLdr, "Luz: %.0f %%", luminosidade);

  char linhaFila[24];
  sprintf(linhaFila, "Fila: %d/%d", controle.totalRegistros, MAX_REGISTROS);

  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_6x10_tf);

  u8g2.drawStr(0, 12, config.nomeEstacao);

  u8g2.drawStr(0, 28, linhaTemp);
  u8g2.drawStr(0, 40, linhaUmid);
  u8g2.drawStr(0, 52, linhaLdr);

  u8g2.setFont(u8g2_font_5x7_tf);
  u8g2.drawStr(0, 63, (WiFi.status() == WL_CONNECTED) ? linhaFila : "WiFi desconectado");

  u8g2.sendBuffer();
}

//====================================================
// FECHA A MEDIA DO PERIODO E COLOCA NA FILA (EEPROM)
//====================================================
void fecharAgregacaoEEnfileirar() {
  if (acTemperatura.quantidade == 0 && acLuminosidade.quantidade == 0) {
    Serial.println("Nenhuma amostra valida acumulada. Pulando agregacao deste ciclo.");
    return;
  }

  RegistroMeteorologico registro = {};
  registro.temperatura = acTemperatura.media();
  registro.umidade = acUmidade.media();
  registro.luminosidade = acLuminosidade.media();

  registro.itu = (!isnan(registro.temperatura) && !isnan(registro.umidade))
                     ? calcularITU(registro.temperatura, registro.umidade)
                     : NAN;

  registro.enviado = false;

  if (controle.totalRegistros >= MAX_REGISTROS) {
    Serial.println("AVISO: fila cheia. Descartando o registro mais antigo para abrir espaco.");
    controle.totalRegistros--;
  }

  int indice = controle.proximoRegistro;
  gravarRegistro(indice, registro);

  controle.proximoRegistro = (controle.proximoRegistro + 1) % MAX_REGISTROS;
  controle.totalRegistros++;
  salvarControle();

  Serial.printf("Registro agregado e persistido na fila (indice %d). Pendentes: %d\n",
                indice, controle.totalRegistros);

  acTemperatura.limpar();
  acUmidade.limpar();
  acLuminosidade.limpar();
}

//====================================================
// CALCULOS (Buffington) - mesmo criterio do v2.2
//====================================================
float calcularPontoOrvalho(float temperatura, float umidade) {
  float a = 17.27, b = 237.7;
  float alpha = ((a * temperatura) / (b + temperatura)) + log(umidade / 100.0);
  return (b * alpha) / (a - alpha);
}

float calcularITU(float temperatura, float umidade) {
  // Buffington et al. (1982) - formula especifica de ITU, amplamente
  // citada na literatura brasileira de bioclimatologia zootecnica
  // (bovinos leiteiros, semiarido/caatinga). Usa umidade relativa
  // diretamente, diferente da forma do ITGU (que usa ponto de orvalho).
  return (0.8 * temperatura) + ((umidade / 100.0) * (temperatura - 14.3)) + 46.3;
}

String classificar(float indice) {
  if (isnan(indice)) return "";
  if (indice > 78.0) return "perigo";
  if (indice > 72.0) return "alerta";
  return "normal";
}

bool faixaValida(float valor, float minimo, float maximo) {
  return !isnan(valor) && valor >= minimo && valor <= maximo;
}

//====================================================
// MONTA O JSON PARA O SISTEMA WEB
//====================================================
String montarJSON(const RegistroMeteorologico &r) {
  JsonDocument json;

  json["nome_estacao"] = config.nomeEstacao;

  if (!isnan(r.temperatura)) json["temperatura_ar"] = r.temperatura;
  if (!isnan(r.umidade)) json["umidade_ar"] = r.umidade;
  json["luminosidade"] = r.luminosidade;

  if (!isnan(r.itu)) {
    json["itu"] = r.itu;
    json["itu_classificacao"] = classificar(r.itu);
  }

  json["tipo_agregacao"] = "agregado";

  String saida;
  serializeJson(json, saida);
  return saida;
}

//====================================================
// ENVIO HTTP PARA O SERVIDOR WEB
//====================================================
bool enviarParaServidor(const String &json, String &status) {
  if (strlen(config.servidorUrl) == 0 || strlen(config.tokenEstacao) == 0) {
    status = "nao configurado";
    return false;
  }

  HTTPClient http;
  WiFiClientSecure clienteSeguro;
  bool usarHttps = String(config.servidorUrl).startsWith("https://");

  bool iniciou;
  if (usarHttps) {
    clienteSeguro.setInsecure();
    iniciou = http.begin(clienteSeguro, config.servidorUrl);
  } else {
    WiFiClient cliente;
    iniciou = http.begin(cliente, config.servidorUrl);
  }

  if (!iniciou) {
    status = "falha ao iniciar conexao";
    return false;
  }

  http.setTimeout(15000);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Token", config.tokenEstacao);

  int codigo = http.POST(json);
  bool sucesso = codigo >= 200 && codigo < 300;

  status = sucesso ? ("HTTP " + String(codigo) + " OK")
                    : ("erro: " + String(codigo));

  Serial.printf("[%s] %s\n", config.servidorUrl, status.c_str());

  http.end();
  return sucesso;
}

//====================================================
// TENTA ENVIAR O REGISTRO PENDENTE MAIS ANTIGO DA FILA
//====================================================
void tentarDrenarFila() {
  if (controle.totalRegistros == 0) return;

  int indiceMaisAntigo = (controle.proximoRegistro - controle.totalRegistros + MAX_REGISTROS) % MAX_REGISTROS;

  RegistroMeteorologico registro;
  bool integro = lerRegistro(indiceMaisAntigo, registro);

  if (!integro) {
    Serial.printf("Registro no indice %d esta corrompido (checksum invalido). Descartando.\n", indiceMaisAntigo);
    controle.totalRegistros--;
    salvarControle();
    return;
  }

  if (registro.enviado) {
    controle.totalRegistros--;
    salvarControle();
    return;
  }

  String json = montarJSON(registro);
  Serial.println("Tentando enviar registro pendente da fila...");

  bool sucesso = enviarParaServidor(json, ultimoStatusEnvio);

  if (sucesso) {
    registro.enviado = true;
    gravarRegistro(indiceMaisAntigo, registro);
    controle.totalRegistros--;
    salvarControle();
    Serial.printf("Registro enviado com sucesso. Restam %d na fila.\n", controle.totalRegistros);
  } else {
    Serial.println("Falha no envio. Registro permanece na fila para nova tentativa.");
  }
}

//====================================================
// EEPROM - CONFIGURACAO, CONTROLE E REGISTROS
//====================================================
uint32_t calcularChecksumConfig(const ConfiguracaoEstacao &c) {
  const byte *dados = (const byte *)&c;
  int tamanho = sizeof(ConfiguracaoEstacao) - sizeof(uint32_t);
  uint32_t soma = 0;
  for (int i = 0; i < tamanho; i++) soma = (soma * 31) + dados[i];
  return soma;
}

uint32_t calcularChecksumControle(const ControleFila &c) {
  const byte *dados = (const byte *)&c;
  int tamanho = sizeof(ControleFila) - sizeof(uint32_t);
  uint32_t soma = 0;
  for (int i = 0; i < tamanho; i++) soma = (soma * 31) + dados[i];
  return soma;
}

uint32_t calcularChecksumRegistro(const RegistroMeteorologico &r) {
  const byte *dados = (const byte *)&r;
  int tamanho = sizeof(RegistroMeteorologico) - sizeof(uint32_t);
  uint32_t soma = 0;
  for (int i = 0; i < tamanho; i++) soma = (soma * 31) + dados[i];
  return soma;
}

void carregarConfiguracao() {
  EEPROM.get(ENDERECO_CONFIG, config);

  if (calcularChecksumConfig(config) != config.checksum) {
    Serial.println("Configuracao invalida ou primeiro boot. Aplicando valores padrao.");
    strcpy(config.nomeEstacao, "Estacao Meteo");
    strcpy(config.servidorUrl, "");
    strcpy(config.tokenEstacao, "");
    salvarConfiguracao();
  }
}

void salvarConfiguracao() {
  config.checksum = calcularChecksumConfig(config);
  EEPROM.put(ENDERECO_CONFIG, config);
  EEPROM.commit();
}

void carregarControle() {
  EEPROM.get(ENDERECO_CONTROLE, controle);

  if (calcularChecksumControle(controle) != controle.checksum ||
      controle.totalRegistros > MAX_REGISTROS) {
    controle.totalRegistros = 0;
    controle.proximoRegistro = 0;
    salvarControle();
  } else {
    Serial.printf("Fila recuperada da EEPROM: %d registros pendentes.\n", controle.totalRegistros);
  }
}

void salvarControle() {
  controle.checksum = calcularChecksumControle(controle);
  EEPROM.put(ENDERECO_CONTROLE, controle);
  EEPROM.commit();
}

void gravarRegistro(int indice, RegistroMeteorologico registro) {
  registro.checksum = calcularChecksumRegistro(registro);
  int endereco = ENDERECO_DADOS + (indice * TAM_REGISTRO);
  EEPROM.put(endereco, registro);
  EEPROM.commit();
}

bool lerRegistro(int indice, RegistroMeteorologico &registro) {
  int endereco = ENDERECO_DADOS + (indice * TAM_REGISTRO);
  EEPROM.get(endereco, registro);
  return registro.checksum == calcularChecksumRegistro(registro);
}

//====================================================
// WIFI (WiFiManager - portal cativo "EstacaoMeteo-Config")
//====================================================
void configurarWiFi() {
  WiFiManager wm;
  wm.setConfigPortalTimeout(180);

  if (!wm.autoConnect("EstacaoMeteo-Config")) {
    Serial.println("Falha ao conectar WiFi. Reiniciando em 3s...");
    delay(3000);
    ESP.restart();
  }

  Serial.print("WiFi conectado! IP: ");
  Serial.println(WiFi.localIP());
}

//====================================================
// TELA INICIAL DE BOOT
//====================================================
void mostrarTelaInicial(const String &mensagem) {
  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_6x10_tf);
  u8g2.drawStr(0, 15, config.nomeEstacao);
  u8g2.drawStr(0, 35, "DHT22 + LDR");
  u8g2.drawStr(0, 50, mensagem.c_str());
  u8g2.sendBuffer();
}

//====================================================
// PAGINA DE ADMINISTRACAO (nome da estacao + servidor/token)
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
    html += "Fila pendente: " + String(controle.totalRegistros) + " / " + String(MAX_REGISTROS) + "<br>";
    html += "Descartes (faixa invalida): " + String(leiturasDescartadasFaixa) + "<br>";
    html += "Ultimo envio: " + ultimoStatusEnvio + "</div>";

    html += "<form class='card' method='POST' action='/salvar'><strong>Configuracao</strong>";
    html += "<label>Nome da estacao</label><input name='nome_estacao' maxlength='31' value='" + String(config.nomeEstacao) + "'>";
    html += "<label>URL do servidor (sistema web)</label><input name='servidor_url' maxlength='79' value='" + String(config.servidorUrl) + "'>";
    html += "<label>Token da estacao</label><input name='token' maxlength='39' value='" + String(config.tokenEstacao) + "'>";
    html += "<button type='submit'>Salvar configuracao</button></form>";

    html += "</body></html>";
    servidorAdmin.send(200, "text/html; charset=utf-8", html);
  });

  servidorAdmin.on("/salvar", HTTP_POST, []() {
    servidorAdmin.arg("nome_estacao").toCharArray(config.nomeEstacao, sizeof(config.nomeEstacao));
    servidorAdmin.arg("servidor_url").toCharArray(config.servidorUrl, sizeof(config.servidorUrl));
    servidorAdmin.arg("token").toCharArray(config.tokenEstacao, sizeof(config.tokenEstacao));

    salvarConfiguracao();

    servidorAdmin.sendHeader("Location", "/");
    servidorAdmin.send(303);
  });

  servidorAdmin.begin();
}
