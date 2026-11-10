package com.smartgreenhouse.automation.service;

import com.smartgreenhouse.automation.dto.CreateScheduleRequest;
import com.smartgreenhouse.automation.model.DeviceSchedule;
import com.smartgreenhouse.automation.repository.DeviceScheduleRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class DeviceScheduleService {

    private final DeviceScheduleRepository repository;

    public DeviceScheduleService(
            DeviceScheduleRepository repository) {
        this.repository = repository;
    }

    public DeviceSchedule create(String fieldId, CreateScheduleRequest request) {

        Instant start = request.startTime().toInstant();

        if (!start.isAfter(Instant.now())) {
            throw new IllegalArgumentException(
                    "startTime must be in the future"
            );
        }

        Instant end = start.plusSeconds(
                request.durationSeconds()
        );

        DeviceSchedule schedule = new DeviceSchedule();

        schedule.setFieldId(fieldId);
        schedule.setDeviceRef(new String(request.deviceRef()));
        schedule.setStartTime(start);
        schedule.setEndTime(end);
        schedule.setDurationSeconds(request.durationSeconds());
        schedule.setTriggerType(request.triggerType());

        return repository.save(schedule);
    }

    public List<DeviceSchedule> getSchedulesByField(String fieldId) {
        return repository.findByFieldIdOrderByStartTimeDesc(fieldId);
    }

    public void delete(String scheduleId) {
        repository.deleteById(scheduleId);
    }
}
