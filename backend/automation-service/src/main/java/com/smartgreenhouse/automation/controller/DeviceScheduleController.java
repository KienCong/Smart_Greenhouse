package com.smartgreenhouse.automation.controller;

import com.smartgreenhouse.automation.dto.CreateScheduleRequest;
import com.smartgreenhouse.automation.model.DeviceSchedule;
import com.smartgreenhouse.automation.service.DeviceScheduleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/automation/schedules")
@CrossOrigin(origins = "*")
public class DeviceScheduleController {

    private final DeviceScheduleService service;

    public DeviceScheduleController(DeviceScheduleService service) {
        this.service = service;
    }

    @PostMapping("/{fieldId}")
    public ResponseEntity<DeviceSchedule> create(
            @PathVariable String fieldId,
            @Valid @RequestBody CreateScheduleRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(fieldId, request));
    }

    @GetMapping("/{fieldId}")
    public ResponseEntity<List<DeviceSchedule>> getByField(
            @PathVariable String fieldId) {

        return ResponseEntity.ok(service.getSchedulesByField(fieldId));
    }

    @DeleteMapping("/{scheduleId}")
    public ResponseEntity<Void> delete(
            @PathVariable String scheduleId) {

        service.delete(scheduleId);
        return ResponseEntity.noContent().build();
    }
}
