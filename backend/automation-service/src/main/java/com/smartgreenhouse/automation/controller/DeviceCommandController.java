package com.smartgreenhouse.automation.controller;

import com.smartgreenhouse.automation.dto.CreateCommandRequest;
import com.smartgreenhouse.automation.dto.DeviceCommandResponse;
import com.smartgreenhouse.automation.service.DeviceCommandService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/automation")
@CrossOrigin(origins = "*")
public class DeviceCommandController {

    private final DeviceCommandService service;

    public DeviceCommandController(DeviceCommandService service) {
        this.service = service;
    }

    // API 1: Send ON/OFF command
    @PostMapping("/devices/{deviceId}/commands")
    public ResponseEntity<DeviceCommandResponse> sendCommand(
            @PathVariable String deviceId,
            @Valid @RequestBody CreateCommandRequest request) {

        DeviceCommandResponse response =
                service.sendCommand(deviceId, request);

        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(response);
    }

    // API 2: Get command status
    @GetMapping("/commands/{commandId}")
    public DeviceCommandResponse getCommand(
            @PathVariable String commandId) {

        return service.getCommand(commandId);
    }

    // API 3: Device command history
    @GetMapping("/devices/{deviceId}/history")
    public List<DeviceCommandResponse> getDeviceHistory(
            @PathVariable String deviceId) {

        return service.getDeviceHistory(deviceId);
    }

    // API 4: Field automation history
    @GetMapping("/fields/{fieldId}/history")
    public List<DeviceCommandResponse> getFieldHistory(
            @PathVariable String fieldId) {

        return service.getFieldHistory(fieldId);
    }
}
