#pragma once

// WiFi
#define WIFI_SSID       "CongKien"
#define WIFI_PASSWORD   "12345678"

// MQTT
// Phải là IP LAN của máy tính chạy Mosquitto,
// KHÔNG sử dụng localhost hoặc 127.0.0.1.
#define MQTT_HOST       "172.20.10.4"
#define MQTT_PORT       1883

// Gateway
#define FIELD_ID        "field01"
#define GATEWAY_ID      "gateway01"

// LED
#define LED_PIN         25
#define LED_ACTIVE_HIGH 1

// MQTT
#define MQTT_CLIENT_ID  "esp32-gateway-01"
#define MQTT_TOPIC_PREFIX "greenhouse"