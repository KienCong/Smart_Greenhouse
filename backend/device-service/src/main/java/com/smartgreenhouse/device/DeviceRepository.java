package com.smartgreenhouse.device;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceRepository extends MongoRepository<Device, String> {

    Optional<Device> findByDeviceId(String deviceId);

    boolean existsByDeviceId(String deviceId);

    List<Device> findByFieldId(ObjectId fieldId);

    List<Device> findByType(String type);

    List<Device> findByFieldIdAndType(
            ObjectId fieldId,
            String type
    );
}
