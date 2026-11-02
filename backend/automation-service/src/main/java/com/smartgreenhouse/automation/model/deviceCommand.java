package com.smartgreenhouse.automation.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "device_commands")
public class deviceCommand {
    @Id
    private String id;

    @Indexed
    private String deviceId;

    @Indexed
    private String fieldId;

    private String action;
    private String status;
    private Instant createdAt;
    private String errorMessage;

    public deviceCommand() {}

    public deviceCommand(
            String deviceId,
            String fieldId,
            String action,
            String source) {

        this.deviceId = deviceId;
        this.fieldId = fieldId;
        this.action = action;
        this.status = "PENDING";
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public String getFieldId() { return fieldId; }
    public void setFieldId(String fieldId) {
        this.fieldId = fieldId;
    }

    public String getAction() { return action; }
    public void setAction(String action) {
        this.action = action;
    }


    public String getStatus() { return status; }
    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

}
