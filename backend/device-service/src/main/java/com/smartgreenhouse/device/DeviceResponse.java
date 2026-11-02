package com.smartgreenhouse.device;

public record DeviceResponse(
        String id,
        String fieldId,
        String deviceId,
        String type,
        String state,
        String mode

) {

    public static DeviceResponse from(Device device) {
        return new DeviceResponse(
                device.getId(),
                device.getFieldId() == null
                        ? null
                        : device.getFieldId().toHexString(),
                device.getDeviceId(),
                device.getType(),
                device.getState(),
                device.getMode()
        );
    }
}
