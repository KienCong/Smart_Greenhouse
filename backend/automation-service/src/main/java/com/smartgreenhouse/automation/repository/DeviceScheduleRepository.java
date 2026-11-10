package com.smartgreenhouse.automation.repository;

import com.smartgreenhouse.automation.model.DeviceSchedule;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;

public interface DeviceScheduleRepository
        extends MongoRepository<DeviceSchedule, String> {

    List<DeviceSchedule> findByStartTimeLessThanEqual(
            Instant now
    );

    List<DeviceSchedule> findByFieldIdOrderByStartTimeDesc(
            String fieldId
    );
}
