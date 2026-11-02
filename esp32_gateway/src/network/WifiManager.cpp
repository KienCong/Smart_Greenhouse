#include "WifiManager.h"

#include <Arduino.h>
#include <WiFi.h>

#include "app_config.h"

unsigned long WifiManager::lastReconnectAttempt = 0;

void WifiManager::begin() {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    Serial.print("[WIFI] Connecting to ");
    Serial.println(WIFI_SSID);

    unsigned long startAttemptTime = millis();
    const unsigned long timeoutMs = 10000; // Timeout 10s khi khởi động

    while (WiFi.status() != WL_CONNECTED && (millis() - startAttemptTime < timeoutMs)) {
        delay(500);
        Serial.print(".");
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("[WIFI] Connected");
        Serial.print("[WIFI] IP: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("[WIFI] Initial connection timeout. Will retry in background.");
    }
}

bool WifiManager::isConnected() {
    return WiFi.status() == WL_CONNECTED;
}

void WifiManager::reconnect() {
    if (isConnected()) {
        return;
    }

    unsigned long now = millis();
    // Thử kết nối lại mỗi 5 giây, tránh spam WiFi stack liên tục
    if (now - lastReconnectAttempt >= 5000) {
        lastReconnectAttempt = now;
        Serial.println("[WIFI] Reconnecting...");
        WiFi.disconnect();
        WiFi.reconnect();
    }
}