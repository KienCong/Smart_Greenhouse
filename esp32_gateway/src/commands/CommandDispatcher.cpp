#include "CommandDispatcher.h"
#include "../system/LedStatus.h"

void CommandDispatcher::dispatch(
    const String& deviceId,
    const String& action
) {
    Serial.println("[COMMAND] Device: " + deviceId);
    Serial.println("[COMMAND] Action: " + action);

    // Trong giai đoạn test, chỉ điều khiển PUMP_01.
    if (deviceId != "PUMP_01") {
        Serial.println("[COMMAND] Unknown device");
        return;
    }

    if (action == "ON") {
        LedStatus::turnOn();
    }
    else if (action == "OFF") {
        LedStatus::turnOff();
    }
    else {
        Serial.println("[COMMAND] Invalid action");
    }
}