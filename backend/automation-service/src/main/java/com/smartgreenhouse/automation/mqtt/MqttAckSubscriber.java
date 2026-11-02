package com.smartgreenhouse.automation.mqtt;

import com.smartgreenhouse.automation.service.DeviceCommandService;
import jakarta.annotation.PostConstruct;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;

@Component
public class MqttAckSubscriber {

    private final MqttClient client;
    private final ObjectMapper mapper;
    private final DeviceCommandService service;
    private final String prefix;

    public MqttAckSubscriber(
            MqttClient client,
            ObjectMapper mapper,
            DeviceCommandService service,
            @Value("${mqtt.topic-prefix}") String prefix) {

        this.client = client;
        this.mapper = mapper;
        this.service = service;
        this.prefix = prefix;
    }

    @PostConstruct
    public void subscribe() throws Exception {

        String topic = prefix + "/+/devices/+/ack";

        client.subscribe(topic, 1, (receivedTopic, message) -> {
            try {
                String json = new String(
                        message.getPayload(),
                        StandardCharsets.UTF_8
                );

                JsonNode payload = mapper.readTree(json);

                String commandId =
                        payload.path("commandId").asText();

                String status =
                        payload.path("status").asText();

                service.acknowledge(commandId, status);

            } catch (Exception e) {
                System.err.println(
                        "Invalid MQTT ACK: " + e.getMessage()
                );
            }
        });
    }
}