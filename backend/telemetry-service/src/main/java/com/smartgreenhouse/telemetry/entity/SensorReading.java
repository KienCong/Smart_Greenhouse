package com.smartgreenhouse.telemetry.entity;

import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.Map;

@Data
@Document(collection = "sensor_readings")
public class SensorReading {

    @Id
    private ObjectId id;

    @Field("field_id")
    private ObjectId fieldId;

    @Field("message_id")
    private String messageId;

    @Field("raw")
    private Map<String, Object> raw;

    @Field("quality")
    private Map<String, Object> quality;

    @Field("decision_values")
    private Map<String, Object> decisionValues;

    @Field("measured_at")
    private Instant measuredAt;

    @Field("received_at")
    private Instant receivedAt;
}