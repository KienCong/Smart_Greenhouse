#pragma once

#include <Arduino.h>
#include <PubSubClient.h>
#include <WiFi.h>

class MqttManager {
private:
    WiFiClient wifiClient;
    PubSubClient mqttClient;

    String commandTopic;
    unsigned long lastReconnectAttempt;

    static void callback(
        char* topic,
        byte* payload,
        unsigned int length
    );

    bool reconnect();

public:
    MqttManager();

    void begin();
    void loop();
    bool isConnected();
};