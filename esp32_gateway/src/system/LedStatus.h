#pragma once

#include <Arduino.h>

class LedStatus {
public:
    static void begin();
    static void turnOn();
    static void turnOff();
};