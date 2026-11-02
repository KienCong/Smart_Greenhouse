#include "TopicBuilder.h"
#include "app_config.h"

String TopicBuilder::commandTopic(
    const String& fieldId,
    const String& deviceId
) {
    return String(MQTT_TOPIC_PREFIX) + "/" +
           fieldId + "/devices/" +
           deviceId + "/command";
}