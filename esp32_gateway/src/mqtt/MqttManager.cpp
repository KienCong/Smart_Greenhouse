#include "MqttManager.h"

#include <ArduinoJson.h>

#include "app_config.h"
#include "TopicBuilder.h"
#include "../commands/CommandDispatcher.h"

#include "../network/WifiManager.h"

MqttManager::MqttManager()
    : mqttClient(wifiClient), lastReconnectAttempt(0) {
}

void MqttManager::begin() {
    mqttClient.setServer(MQTT_HOST, MQTT_PORT);
    mqttClient.setCallback(callback);

    // Payload command JSON có kích thước nhỏ.
    mqttClient.setBufferSize(512);

    commandTopic = TopicBuilder::commandTopic(
        FIELD_ID,
        "PUMP_01"
    );

    Serial.println("[MQTT] Command topic:");
    Serial.println(commandTopic);
}

bool MqttManager::isConnected() {
    return mqttClient.connected();
}

bool MqttManager::reconnect() {
    Serial.println("[MQTT] Connecting...");

    if (mqttClient.connect(MQTT_CLIENT_ID)) {
        Serial.println("[MQTT] Connected");

        if (mqttClient.subscribe(commandTopic.c_str(), 1)) {
            Serial.println("[MQTT] Subscribed successfully");
        } else {
            Serial.println("[MQTT] Subscribe failed");
        }
        return true;
    } else {
        Serial.print("[MQTT] Failed, state=");
        Serial.println(mqttClient.state());
        return false;
    }
}

void MqttManager::loop() {
    if (!mqttClient.connected()) {
        // Chỉ thử kết nối MQTT khi WiFi đã sẵn sàng
        if (WifiManager::isConnected()) {
            unsigned long now = millis();
            // Thử kết nối lại mỗi 5 giây (non-blocking)
            if (now - lastReconnectAttempt >= 5000) {
                lastReconnectAttempt = now;
                if (reconnect()) {
                    lastReconnectAttempt = 0;
                }
            }
        }
    } else {
        mqttClient.loop();
    }
}

void MqttManager::callback(
    char* topic,
    byte* payload,
    unsigned int length
) {
    Serial.println();
    Serial.println("[MQTT] Message received");
    Serial.println("[MQTT] Topic: " + String(topic));

    // Chuyển payload thành chuỗi JSON.
    String message;

    for (unsigned int i = 0; i < length; i++) {
        message += (char)payload[i];
    }

    Serial.println("[MQTT] Payload:");
    Serial.println(message);

    JsonDocument doc;

    DeserializationError error = deserializeJson(doc, message);

    if (error) {
        Serial.println("[MQTT] JSON parse failed");
        return;
    }

    String deviceId = doc["deviceId"] | "";
    String action = doc["action"] | "";

    if (deviceId.isEmpty() || action.isEmpty()) {
        Serial.println("[MQTT] Missing deviceId/action");
        return;
    }

    CommandDispatcher::dispatch(deviceId, action);
}