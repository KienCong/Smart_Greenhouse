package com.smartgreenhouse.automation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateCommandRequest(
        @NotBlank String fieldId,

        @NotBlank
        @Pattern(regexp = "ON|OFF")
        String action
) {}
