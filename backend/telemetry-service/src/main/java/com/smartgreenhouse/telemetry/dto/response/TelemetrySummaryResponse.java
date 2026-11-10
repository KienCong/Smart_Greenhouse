package com.smartgreenhouse.telemetry.dto.response;

import java.time.Instant;
import java.util.Map;

public record TelemetrySummaryResponse(
        String fieldId,
        Instant from,
        Instant to,
        long totalReadings,
        Map<String, SensorStatistics> statistics
) {
    public record SensorStatistics(
            Double average,
            Double min,
            Double max
    ) {}
}