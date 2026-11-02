#include <Arduino.h>

#include "network/WifiManager.h"
#include "mqtt/MqttManager.h"
#include "system/LedStatus.h"

MqttManager mqttManager;

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println();
    Serial.println("================================");
    Serial.println(" ESP32 GREENHOUSE GATEWAY");
    Serial.println("================================");

    // 1. Khởi tạo LED
    LedStatus::begin();

    // 2. Kết nối WiFi
    WifiManager::begin();

    // 3. Khởi tạo MQTT
    mqttManager.begin();
}

void loop() {
    WifiManager::reconnect();

    mqttManager.loop();

    delay(10);
}