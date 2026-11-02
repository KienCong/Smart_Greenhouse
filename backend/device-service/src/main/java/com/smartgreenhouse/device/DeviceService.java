package com.smartgreenhouse.device;

import com.mongodb.DuplicateKeyException;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
public class DeviceService {

    private final DeviceRepository deviceRepository;

    public DeviceService(DeviceRepository deviceRepository) {
        this.deviceRepository = deviceRepository;
    }

    public DeviceResponse createDevice(CreateDeviceRequest request) {

        String deviceId = request.deviceId().trim();

        if (deviceRepository.existsByDeviceId(deviceId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Device ID already exists: " + deviceId
            );
        }

        Device device = new Device(
                new ObjectId(request.fieldId()),
                deviceId,
                request.type(),
                "UNKNOWN",
                request.mode()
        );

        try {
            Device savedDevice = deviceRepository.save(device);
            return DeviceResponse.from(savedDevice);
        } catch (DuplicateKeyException ex) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Device ID already exists: " + deviceId,
                    ex
            );
        }
    }

    public List<DeviceResponse> getAllDevices() {
        return deviceRepository.findAll()
                .stream()
                .map(DeviceResponse::from)
                .toList();
    }

    public DeviceResponse getDeviceById(String id) {
        return DeviceResponse.from(findDeviceOrThrow(id));
    }

    public DeviceResponse getDeviceByDeviceId(String deviceId) {
        Device device = deviceRepository.findByDeviceId(deviceId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Device not found: " + deviceId
                ));

        return DeviceResponse.from(device);
    }

    public List<DeviceResponse> getDevicesByField(String fieldId) {
        ObjectId objectId = parseObjectId(fieldId);

        return deviceRepository.findByFieldId(objectId)
                .stream()
                .map(DeviceResponse::from)
                .toList();
    }

    public List<DeviceResponse> getDevicesByType(String type) {
        String validType = normalizeType(type);

        return deviceRepository.findByType(validType)
                .stream()
                .map(DeviceResponse::from)
                .toList();
    }

    public DeviceResponse updateMode(String id, String mode) {
        Device device = findDeviceOrThrow(id);

        String normalizedMode = mode.toUpperCase(Locale.ROOT);

        if (!normalizedMode.equals("AUTO")
                && !normalizedMode.equals("MANUAL")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Mode must be AUTO or MANUAL"
            );
        }

        device.setMode(normalizedMode);

        return DeviceResponse.from(deviceRepository.save(device));
    }

    public void deleteDevice(String id) {
        Device device = findDeviceOrThrow(id);
        deviceRepository.delete(device);
    }

    private Device findDeviceOrThrow(String id) {
        if (!ObjectId.isValid(id)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid MongoDB ObjectId"
            );
        }

        return deviceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Device not found: " + id
                ));
    }

    private ObjectId parseObjectId(String id) {
        if (!ObjectId.isValid(id)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid fieldId"
            );
        }
        return new ObjectId(id);
    }

    private String normalizeType(String type) {
        String normalized = type.toUpperCase(Locale.ROOT);

        if (!normalized.equals("PUMP")
                && !normalized.equals("FAN")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Type must be PUMP or FAN"
            );
        }

        return normalized;
    }
}