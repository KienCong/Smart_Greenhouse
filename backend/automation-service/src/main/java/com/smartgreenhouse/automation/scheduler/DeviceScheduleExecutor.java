package com.smartgreenhouse.automation.scheduler;

import com.smartgreenhouse.automation.model.DeviceSchedule;
import com.smartgreenhouse.automation.repository.DeviceScheduleRepository;
import com.smartgreenhouse.automation.service.DeviceCommandService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class DeviceScheduleExecutor {

    private final DeviceScheduleRepository scheduleRepository;
    private final DeviceCommandService commandService;

    private final Set<String> started =
            ConcurrentHashMap.newKeySet();

    private final Set<String> stopped =
            ConcurrentHashMap.newKeySet();

    public DeviceScheduleExecutor(
            DeviceScheduleRepository scheduleRepository,
            DeviceCommandService commandService) {

        this.scheduleRepository = scheduleRepository;
        this.commandService = commandService;
    }

    @Scheduled(fixedDelay = 1000)
    @Scheduled(fixedDelay = 1000)
    public void executeSchedules() {

        Instant now = Instant.now();

        var schedules = scheduleRepository
                .findByStartTimeLessThanEqual(now);

        System.out.println("NOW: " + now);
        System.out.println("SCHEDULES FOUND: " + schedules.size());

        for (DeviceSchedule schedule : schedules) {

            String id = schedule.getId();
            Instant start = schedule.getStartTime();
            Instant end = schedule.getEndTime();

            System.out.println("SCHEDULE ID: " + id);
            System.out.println("START: " + start);
            System.out.println("END: " + end);

            // Lịch đang trong khoảng thời gian hoạt động
            if (!now.isBefore(start) && now.isBefore(end)) {

                if (!started.contains(id)) {
                    System.out.println(">>> EXECUTING ON");

                    try {
                        var response = commandService.sendScheduledCommand(
                                schedule.getFieldId(),
                                schedule.getDeviceRef(),
                                "ON"
                        );

                        System.out.println("ON RESULT: " + response);

                        started.add(id);

                    } catch (Exception e) {
                        System.err.println("ON ERROR: " + e.getMessage());
                        e.printStackTrace();
                    }
                }
            }

            // Lịch đã kết thúc
            if (!now.isBefore(end) && !stopped.contains(id)) {

                System.out.println(">>> EXECUTING OFF");

                try {
                    var response = commandService.sendScheduledCommand(
                            schedule.getFieldId(),
                            schedule.getDeviceRef(),
                            "OFF"
                    );

                    System.out.println("OFF RESULT: " + response);

                    stopped.add(id);

                } catch (Exception e) {
                    System.err.println("OFF ERROR: " + e.getMessage());
                    e.printStackTrace();
                }
            }
        }
    }
}