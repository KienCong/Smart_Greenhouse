package com.smartgreenhouse.automation.service;

import com.smartgreenhouse.automation.dto.CreateCommandRequest;
import com.smartgreenhouse.automation.dto.DeviceCommandResponse;
import com.smartgreenhouse.automation.model.deviceCommand;
import com.smartgreenhouse.automation.mqtt.MqttCommandPublisher;
import com.smartgreenhouse.automation.repository.DeviceCommandRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
public class DeviceCommandService {

    private final DeviceCommandRepository repository;
    private final MqttCommandPublisher publisher;

    public DeviceCommandService(
            DeviceCommandRepository repository,
            MqttCommandPublisher publisher) {
        this.repository = repository;
        this.publisher = publisher;
    }

    public DeviceCommandResponse sendCommand(
            String deviceId,
            CreateCommandRequest request) {

        if (!deviceId.matches("[A-Za-z0-9_-]+")
                || !request.fieldId().matches("[A-Za-z0-9_-]+")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid deviceId or fieldId");
        }

        deviceCommand command = new deviceCommand(
                deviceId,
                request.fieldId(),
                request.action(),
                "MANUAL"
        );

        command = repository.save(command);

        try {
            publisher.publish(command);
            command.setStatus("SENT");
        } catch (Exception e) {
            command.setStatus("FAILED");
        }

        return DeviceCommandResponse.from(repository.save(command));
    }


    public DeviceCommandResponse sendScheduledCommand(
            String fieldId,
            String deviceId,
            String action) {

        deviceCommand command = new deviceCommand();

        command.setFieldId(fieldId);
        command.setDeviceId(deviceId);
        command.setAction(action);
        command.setCreatedAt(Instant.now());

        // Lưu trước để MongoDB tạo commandId
        command = repository.save(command);

        try {
            publisher.publish(command);

            command.setStatus("SENT");

        } catch (Exception e) {
            command.setStatus("FAILED");
        }

        command = repository.save(command);

        return DeviceCommandResponse.from(command);
    }




    public DeviceCommandResponse getCommand(String commandId) {
        deviceCommand command = repository.findById(commandId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Command not found"));

        return DeviceCommandResponse.from(command);
    }

    public List<DeviceCommandResponse> getDeviceHistory(
            String deviceId) {

        return repository
                .findByDeviceIdOrderByCreatedAtDesc(deviceId)
                .stream()
                .map(DeviceCommandResponse::from)
                .toList();
    }

    public List<DeviceCommandResponse> getFieldHistory(
            String fieldId) {

        return repository
                .findByFieldIdOrderByCreatedAtDesc(fieldId)
                .stream()
                .map(DeviceCommandResponse::from)
                .toList();
    }

    public void acknowledge(
            String commandId,
            String status) {

        if (!List.of("ACKNOWLEDGED", "FAILED").contains(status)) {
            return;
        }

        repository.findById(commandId).ifPresent(command -> {
            if (!List.of("PENDING", "SENT")
                    .contains(command.getStatus())) {
                return;
            }

            command.setStatus(status);
            repository.save(command);
        });
    }
}
