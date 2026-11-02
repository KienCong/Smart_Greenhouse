package com.smartgreenhouse.automation.mqtt;

import com.smartgreenhouse.automation.model.deviceCommand;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

@Component
public class MqttCommandPublisher {

    private final MqttClient mqttClient;
    private final ObjectMapper objectMapper;
    private final String topicPrefix;

    public MqttCommandPublisher(
            MqttClient mqttClient,
            ObjectMapper objectMapper,
            @Value("${mqtt.topic-prefix}") String topicPrefix) {

        this.mqttClient = mqttClient;
        this.objectMapper = objectMapper;
        this.topicPrefix = topicPrefix;
    }

    public void publish(deviceCommand command) throws Exception {

        String topic = topicPrefix + "/"
                + command.getFieldId()
                + "/devices/"
                + command.getDeviceId()
                + "/command";

        byte[] payload = objectMapper.writeValueAsBytes(
                Map.of(
                        "commandId", command.getId(),
                        "deviceId", command.getDeviceId(),
                        "action", command.getAction()
                )
        );

        MqttMessage message = new MqttMessage(payload);
        message.setQos(1);
        message.setRetained(false);

        mqttClient.publish(topic, message);
    }
}
