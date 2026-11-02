package com.smartgreenhouse.automation.repository;

import com.smartgreenhouse.automation.model.deviceCommand;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface DeviceCommandRepository
        extends MongoRepository<deviceCommand, String> {

    List<deviceCommand> findByDeviceIdOrderByCreatedAtDesc(
            String deviceId
    );

    List<deviceCommand> findByFieldIdOrderByCreatedAtDesc(
            String fieldId
    );
}
