#pragma once

#include <Arduino.h>

class TopicBuilder {
public:
    static String commandTopic(const String& fieldId,
                               const String& deviceId);
};