#pragma once

#include <Arduino.h>

class CommandDispatcher {
public:
    static void dispatch(
        const String& deviceId,
        const String& action
    );
};