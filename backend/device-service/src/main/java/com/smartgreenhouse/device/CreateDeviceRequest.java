package com.smartgreenhouse.device;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateDeviceRequest(
    @NotBlank(message = "fieldId is required")
    @Pattern(
            regexp = "^[a-fA-F0-9]{24}$",
            message = "fieldId must be a valid MongoDB ObjectId"
    )
    String fieldId,

    @NotBlank(message = "deviceId is required")
    String deviceId,

    @NotBlank(message = "type is required")
    @Pattern(
            regexp = "PUMP|FAN",
            message = "type must be PUMP or FAN"
    )
    String type,

    @NotBlank(message = "mode is required")
    @Pattern(
            regexp = "AUTO|MANUAL",
            message = "mode must be AUTO or MANUAL"
    )
    String mode
) {
}
