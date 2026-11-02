package com.smartgreenhouse.automation.repository;

import com.smartgreenhouse.automation.model.DeviceSchedule;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;

public interface DeviceScheduleRepository
        extends MongoRepository<DeviceSchedule, String> {

   // List<DeviceSchedule> findByStatusAndStartTimeLessThanEqual(
  //          String status, Instant now
  //  );

 //   List<DeviceSchedule> findByStatusAndEndTimeLessThanEqual(
//            String status, Instant now
 //   );
    List<DeviceSchedule> findByStartTimeLessThanEqual(
            Instant now
    );
}
