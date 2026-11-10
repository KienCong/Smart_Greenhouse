package com.smartgreenhouse.telemetry.repository;

import com.smartgreenhouse.telemetry.entity.SensorReading;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface SensorReadingRepository
        extends MongoRepository<SensorReading, ObjectId> {

    Optional<SensorReading>
    findFirstByOrderByMeasuredAtDesc();

    Optional<SensorReading>
    findFirstByFieldIdOrderByMeasuredAtDesc(ObjectId fieldId);
}