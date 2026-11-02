package com.smartgreenhouse.automation.dto;

import com.smartgreenhouse.automation.model.deviceCommand;

import java.time.Instant;

public record DeviceCommandResponse(
        String commandId,
        String deviceId,
        String fieldId,
        String action,
        String source,
        Instant createdAt

) {
    public static DeviceCommandResponse from(deviceCommand c) {
        return new DeviceCommandResponse(
                c.getId(),
                c.getDeviceId(),
                c.getFieldId(),
                c.getAction(),
                c.getStatus(),
                c.getCreatedAt()
        );
    }
}
