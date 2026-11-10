package com.smartgreenhouse.telemetry.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record TelemetryChartResponse(
        String fieldId,
        Instant from,
        Instant to,
        List<ChartPoint> points
) {
    public record ChartPoint(
            Instant timestamp,
            Map<String, Object> values
    ) {}
}