package com.smartgreenhouse.telemetry.dto.response;

import java.util.List;

public record TelemetryHistoryResponse(
        String fieldId,
        long totalElements,
        int page,
        int size,
        List<TelemetryResponse> readings
) {}