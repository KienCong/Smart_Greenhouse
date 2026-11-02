package com.smartgreenhouse.device;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;


@Document(collection = "devices")
public class Device {
    @Id
    private String id;

    @Field("field_id")
    private ObjectId fieldId;

    @Field("device_id")
    private String deviceId;

    private String type;
    private String state;
    private String mode;

    public Device() {

    }

    public Device(ObjectId fieldId, String deviceId,
                  String type, String state, String mode) {
        this.deviceId = deviceId;
        this.fieldId = fieldId;
        this.mode = mode;
        this.type = type;
        this.state = state;
    }

    public ObjectId getFieldId() {
        return fieldId;
    }

    public void setFieldId(ObjectId fieldId) {
        this.fieldId = fieldId;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
}
