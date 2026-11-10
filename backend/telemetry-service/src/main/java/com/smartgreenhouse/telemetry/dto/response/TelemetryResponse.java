package com.smartgreenhouse.telemetry.dto.response;

import java.time.Instant;
import java.util.Map;

public record TelemetryResponse(
        String id,
        String fieldId,
        String messageId,
        Map<String, Object> raw,
        Map<String, Object> quality,
        Map<String, Object> decisionValues,
        Instant measuredAt,
        Instant receivedAt
) {}