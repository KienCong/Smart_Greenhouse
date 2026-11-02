package com.smartgreenhouse.automation.mqtt;

import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MqttConfig {

    @Bean(destroyMethod = "disconnect")
    public MqttClient mqttClient(
            @Value("${mqtt.broker}") String broker,
            @Value("${mqtt.client-id}") String clientId
    ) throws Exception {

        MqttClient client = new MqttClient(
                broker,
                clientId,
                new org.eclipse.paho.client.mqttv3.persist
                        .MemoryPersistence()
        );

        MqttConnectOptions options = new MqttConnectOptions();
        options.setAutomaticReconnect(true);
        options.setCleanSession(false);

        client.connect(options);
        System.out.println("Connected to MQTT Broker: " + broker);
        return client;
    }
}