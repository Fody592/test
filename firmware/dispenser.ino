// ESP32-S3 reference firmware: BLE (Nordic UART) -> JSON -> pumps.
// Libraries: NimBLE-Arduino (1.4.x), ArduinoJson (7.x)
// Pumps run in parallel for their time_ms, then the R385 water pump rinses for flush_water_ms.
#include <NimBLEDevice.h>
#include <ArduinoJson.h>

#define NUM_PUMPS 19
// TODO: set to your MOSFET/driver GPIOs (avoid strapping pins). Or swap setPump() for a shift register / I2C expander.
const int PUMP_PINS[NUM_PUMPS] = {1,2,4,5,6,7,15,16,17,18,8,9,10,11,12,13,14,38,39};
const int WATER_PIN = 40;

#define SVC "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define RX  "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
#define TX  "6e400003-b5a3-f393-e0a9-e50e24dcca9e"

NimBLECharacteristic* txChar;
String inbox;
uint32_t pumpOffAt[NUM_PUMPS];
uint32_t waterMs = 0, waterOffAt = 0;
enum { IDLE, POURING, RINSING } phase = IDLE;

void notify(const char* json) { txChar->setValue(String(json) + "\n"); txChar->notify(); }
void allOff() { for (int i = 0; i < NUM_PUMPS; i++) digitalWrite(PUMP_PINS[i], LOW); digitalWrite(WATER_PIN, LOW); }

void handleCommand(const String& line) {
  JsonDocument doc;
  if (deserializeJson(doc, line)) { notify("{\"status\":\"ERROR\",\"message\":\"bad json\"}"); return; }
  if (phase != IDLE) { notify("{\"status\":\"ERROR\",\"message\":\"busy\"}"); return; }

  const char* cmd = doc["command"] | "";
  if (strcmp(cmd, "DISPENSE") && strcmp(cmd, "FLUSH")) { notify("{\"status\":\"ERROR\",\"message\":\"unknown command\"}"); return; }

  uint32_t now = millis(), longest = 0;
  for (JsonObject p : doc["pumps"].as<JsonArray>()) {
    int id = p["id"] | 0; uint32_t t = p["time_ms"] | 0;
    if (id < 1 || id > NUM_PUMPS || t == 0 || t > 15000) continue;   // safety clamp
    pumpOffAt[id - 1] = now + t;
    digitalWrite(PUMP_PINS[id - 1], HIGH);
    if (t > longest) longest = t;
  }
  waterMs = min<uint32_t>(doc["flush_water_ms"] | 0, 30000);
  phase = POURING;
  if (longest == 0) { phase = RINSING; waterOffAt = now + waterMs; digitalWrite(WATER_PIN, waterMs ? HIGH : LOW); }
}

class RxCb : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* c) override {
    inbox += String(c->getValue().c_str());
    int nl;
    while ((nl = inbox.indexOf('\n')) >= 0) { handleCommand(inbox.substring(0, nl)); inbox = inbox.substring(nl + 1); }
  }
};
class SrvCb : public NimBLEServerCallbacks {
  void onDisconnect(NimBLEServer*) override { allOff(); phase = IDLE; inbox = ""; NimBLEDevice::startAdvertising(); }  // fail-safe
};

void setup() {
  for (int i = 0; i < NUM_PUMPS; i++) pinMode(PUMP_PINS[i], OUTPUT);
  pinMode(WATER_PIN, OUTPUT);
  allOff();

  NimBLEDevice::init("DRINK-DISPENSER");
  NimBLEServer* srv = NimBLEDevice::createServer();
  srv->setCallbacks(new SrvCb());
  NimBLEService* svc = srv->createService(SVC);
  svc->createCharacteristic(RX, NIMBLE_PROPERTY::WRITE)->setCallbacks(new RxCb());
  txChar = svc->createCharacteristic(TX, NIMBLE_PROPERTY::NOTIFY);
  svc->start();
  NimBLEAdvertising* adv = NimBLEDevice::getAdvertising();
  adv->addServiceUUID(SVC);
  adv->start();
}

void loop() {
  uint32_t now = millis();
  if (phase == POURING) {
    bool any = false;
    for (int i = 0; i < NUM_PUMPS; i++) {
      if (pumpOffAt[i] && now >= pumpOffAt[i]) { digitalWrite(PUMP_PINS[i], LOW); pumpOffAt[i] = 0; }
      if (pumpOffAt[i]) any = true;
    }
    if (!any) {
      if (waterMs) { phase = RINSING; waterOffAt = now + waterMs; digitalWrite(WATER_PIN, HIGH); }
      else { phase = IDLE; notify("{\"status\":\"DONE\"}"); }
    }
  } else if (phase == RINSING && now >= waterOffAt) {
    digitalWrite(WATER_PIN, LOW); phase = IDLE; notify("{\"status\":\"DONE\"}");
  }
}
