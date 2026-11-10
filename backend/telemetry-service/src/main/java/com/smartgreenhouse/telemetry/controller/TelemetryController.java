package com.smartgreenhouse.telemetry.controller;

import com.smartgreenhouse.telemetry.service.TelemetryService;
import com.smartgreenhouse.telemetry.dto.response.*;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/telemetry")
@CrossOrigin(origins = "*")
public class TelemetryController {

    private final TelemetryService telemetryService;

    public TelemetryController(TelemetryService telemetryService) {
        this.telemetryService = telemetryService;
    }

    // GET /api/telemetry/latest
    @GetMapping("/latest")
    public TelemetryResponse getLatest() {

        return telemetryService.getLatest();
    }


    // GET /api/telemetry/fields/{fieldId}/latest
    @GetMapping("/fields/{fieldId}/latest")
    public TelemetryResponse getLatestByField(
            @PathVariable String fieldId
    ) {

        return telemetryService.getLatestByField(fieldId);
    }


    // GET /api/telemetry/fields/{fieldId}/history
    @GetMapping("/fields/{fieldId}/history")
    public TelemetryHistoryResponse getHistory(

            @PathVariable String fieldId,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            Instant from,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            Instant to,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "100")
            int size
    ) {

        return telemetryService.getHistory(
                fieldId,
                from,
                to,
                page,
                size
        );
    }


    // GET /api/telemetry/fields/{fieldId}/summary
    @GetMapping("/fields/{fieldId}/summary")
    public TelemetrySummaryResponse getSummary(

            @PathVariable String fieldId,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            Instant from,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            Instant to
    ) {

        return telemetryService.getSummary(
                fieldId,
                from,
                to
        );
    }


    // GET /api/telemetry/fields/{fieldId}/chart
    @GetMapping("/fields/{fieldId}/chart")
    public TelemetryChartResponse getChart(

            @PathVariable String fieldId,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            Instant from,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            Instant to,

            @RequestParam(defaultValue = "1000")
            int limit
    ) {

        return telemetryService.getChart(
                fieldId,
                from,
                to,
                limit
        );
    }
}