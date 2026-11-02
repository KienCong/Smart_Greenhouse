#include "LedStatus.h"
#include "app_config.h"

void LedStatus::begin() {
    pinMode(LED_PIN, OUTPUT);
    turnOff();
}

void LedStatus::turnOn() {
#if LED_ACTIVE_HIGH
    digitalWrite(LED_PIN, HIGH);
#else
    digitalWrite(LED_PIN, LOW);
#endif

    Serial.println("[LED] ON");
}

void LedStatus::turnOff() {
#if LED_ACTIVE_HIGH
    digitalWrite(LED_PIN, LOW);
#else
    digitalWrite(LED_PIN, HIGH);
#endif

    Serial.println("[LED] OFF");
}