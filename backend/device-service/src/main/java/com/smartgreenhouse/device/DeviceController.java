package com.smartgreenhouse.device;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    private final DeviceService deviceService;

    public DeviceController(DeviceService deviceService) {
        this.deviceService = deviceService;
    }

    @PostMapping
    public ResponseEntity<DeviceResponse> createDevice(
            @Valid @RequestBody CreateDeviceRequest request) {

        DeviceResponse response = deviceService.createDevice(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<List<DeviceResponse>> getAllDevices() {
        return ResponseEntity.ok(deviceService.getAllDevices());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeviceResponse> getDeviceById(
            @PathVariable String id) {

        return ResponseEntity.ok(deviceService.getDeviceById(id));
    }

    @GetMapping("/code/{deviceId}")
    public ResponseEntity<DeviceResponse> getDeviceByDeviceId(
            @PathVariable String deviceId) {

        return ResponseEntity.ok(
                deviceService.getDeviceByDeviceId(deviceId)
        );
    }

    @GetMapping("/field/{fieldId}")
    public ResponseEntity<List<DeviceResponse>> getDevicesByField(
            @PathVariable String fieldId) {

        return ResponseEntity.ok(
                deviceService.getDevicesByField(fieldId)
        );
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<DeviceResponse>> getDevicesByType(
            @PathVariable String type) {

        return ResponseEntity.ok(
                deviceService.getDevicesByType(type)
        );
    }

    @PatchMapping("/{id}/mode")
    public ResponseEntity<DeviceResponse> updateMode(
            @PathVariable String id,
            @RequestParam String mode) {

        return ResponseEntity.ok(
                deviceService.updateMode(id, mode)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDevice(
            @PathVariable String id) {

        deviceService.deleteDevice(id);
        return ResponseEntity.noContent().build();
    }
}