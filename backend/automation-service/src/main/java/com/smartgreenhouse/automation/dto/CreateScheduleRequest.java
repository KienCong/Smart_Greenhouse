package com.smartgreenhouse.automation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.OffsetDateTime;

public record CreateScheduleRequest(
        @NotBlank String deviceRef,
        @NotNull OffsetDateTime startTime,
        @NotNull @Positive Long durationSeconds,
        @NotBlank String triggerType
) {}
