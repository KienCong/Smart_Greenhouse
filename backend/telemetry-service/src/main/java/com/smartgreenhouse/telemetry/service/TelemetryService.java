package com.smartgreenhouse.telemetry.service;

import com.smartgreenhouse.telemetry.entity.SensorReading;
import com.smartgreenhouse.telemetry.dto.response.*;

import org.bson.types.ObjectId;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TelemetryService {

    private final MongoTemplate mongoTemplate;

    public TelemetryService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    // =========================================
    // 1. GET LATEST - ALL FIELDS
    // =========================================

    public TelemetryResponse getLatest() {

        Query query = new Query();

        query.with(Sort.by(
                Sort.Direction.DESC,
                "measuredAt"
        ));

        query.limit(1);

        SensorReading reading = mongoTemplate.findOne(
                query,
                SensorReading.class
        );

        if (reading == null) {
            throw new NoSuchElementException(
                    "No telemetry data found"
            );
        }

        return toResponse(reading);
    }


    // =========================================
    // 2. GET LATEST BY FIELD
    // =========================================

    public TelemetryResponse getLatestByField(String fieldId) {

        ObjectId objectId = validateFieldId(fieldId);

        Query query = new Query(
                Criteria.where("fieldId").is(objectId)
        );

        query.with(Sort.by(
                Sort.Direction.DESC,
                "measuredAt"
        ));

        query.limit(1);

        SensorReading reading = mongoTemplate.findOne(
                query,
                SensorReading.class
        );

        if (reading == null) {
            throw new NoSuchElementException(
                    "No telemetry data found for field: " + fieldId
            );
        }

        return toResponse(reading);
    }


    // =========================================
    // 3. GET HISTORY BY FIELD
    // =========================================

    public TelemetryHistoryResponse getHistory(
            String fieldId,
            Instant from,
            Instant to,
            int page,
            int size
    ) {

        ObjectId objectId = validateFieldId(fieldId);

        validateTimeRange(from, to);

        if (page < 0) {
            throw new IllegalArgumentException(
                    "Page must be >= 0"
            );
        }

        if (size < 1 || size > 1000) {
            throw new IllegalArgumentException(
                    "Size must be between 1 and 1000"
            );
        }

        Criteria criteria = Criteria.where("fieldId").is(objectId);

        if (from != null || to != null) {
            criteria = addTimeCriteria(criteria, from, to);
        }

        Query query = new Query(criteria);

        query.with(Sort.by(
                Sort.Direction.DESC,
                "measuredAt"
        ));

        query.skip((long) page * size);
        query.limit(size);

        List<SensorReading> readings = mongoTemplate.find(
                query,
                SensorReading.class
        );

        long totalElements = mongoTemplate.count(
                new Query(criteria),
                SensorReading.class
        );

        List<TelemetryResponse> responses = readings.stream()
                .map(this::toResponse)
                .toList();

        return new TelemetryHistoryResponse(
                fieldId,
                totalElements,
                page,
                size,
                responses
        );
    }


    // =========================================
    // 4. GET SUMMARY
    // =========================================

    public TelemetrySummaryResponse getSummary(
            String fieldId,
            Instant from,
            Instant to
    ) {

        ObjectId objectId = validateFieldId(fieldId);

        validateTimeRange(from, to);

        Criteria criteria = Criteria.where("fieldId").is(objectId);

        if (from != null || to != null) {
            criteria = addTimeCriteria(criteria, from, to);
        }

        List<SensorReading> readings = mongoTemplate.find(
                new Query(criteria),
                SensorReading.class
        );

        String[] sensors = {
                "air_temperature",
                "air_humidity",
                "soil_moisture",
                "light_intensity"
        };

        Map<String, TelemetrySummaryResponse.SensorStatistics>
                statistics = new LinkedHashMap<>();

        for (String sensor : sensors) {

            List<Double> values = readings.stream()
                    .map(reading -> getNumericValue(
                            reading.getRaw(), sensor
                    ))
                    .filter(Objects::nonNull)
                    .filter(Double::isFinite)
                    .toList();

            if (values.isEmpty()) {
                statistics.put(
                        sensor,
                        new TelemetrySummaryResponse.SensorStatistics(
                                null, null, null
                        )
                );
                continue;
            }

            double average = values.stream()
                    .mapToDouble(Double::doubleValue)
                    .average()
                    .orElse(0);

            double min = values.stream()
                    .mapToDouble(Double::doubleValue)
                    .min()
                    .orElse(0);

            double max = values.stream()
                    .mapToDouble(Double::doubleValue)
                    .max()
                    .orElse(0);

            statistics.put(
                    sensor,
                    new TelemetrySummaryResponse.SensorStatistics(
                            average,
                            min,
                            max
                    )
            );
        }

        return new TelemetrySummaryResponse(
                fieldId,
                from,
                to,
                readings.size(),
                statistics
        );
    }


    // =========================================
    // 5. GET CHART DATA
    // =========================================

    public TelemetryChartResponse getChart(
            String fieldId,
            Instant from,
            Instant to,
            int limit
    ) {

        ObjectId objectId = validateFieldId(fieldId);

        validateTimeRange(from, to);

        if (limit < 1 || limit > 5000) {
            throw new IllegalArgumentException(
                    "Limit must be between 1 and 5000"
            );
        }

        Criteria criteria = Criteria.where("fieldId").is(objectId);

        if (from != null || to != null) {
            criteria = addTimeCriteria(criteria, from, to);
        }

        Query query = new Query(criteria);

        query.with(Sort.by(
                Sort.Direction.ASC,
                "measuredAt"
        ));

        query.limit(limit);

        List<SensorReading> readings = mongoTemplate.find(
                query,
                SensorReading.class
        );

        List<TelemetryChartResponse.ChartPoint> points =
                readings.stream()
                        .map(reading ->
                                new TelemetryChartResponse.ChartPoint(
                                        reading.getMeasuredAt(),
                                        reading.getRaw()
                                )
                        )
                        .toList();

        return new TelemetryChartResponse(
                fieldId,
                from,
                to,
                points
        );
    }


    // =========================================
    // HELPER METHODS
    // =========================================

    private ObjectId validateFieldId(String fieldId) {

        if (!ObjectId.isValid(fieldId)) {
            throw new IllegalArgumentException(
                    "Invalid fieldId: " + fieldId
            );
        }

        return new ObjectId(fieldId);
    }


    private void validateTimeRange(Instant from, Instant to) {

        if (from != null && to != null && from.isAfter(to)) {
            throw new IllegalArgumentException(
                    "'from' must be before or equal to 'to'"
            );
        }
    }


    private Criteria addTimeCriteria(
            Criteria criteria,
            Instant from,
            Instant to
    ) {

        Criteria timeCriteria = Criteria.where("measuredAt");

        if (from != null && to != null) {
            timeCriteria.gte(from).lte(to);
        } else if (from != null) {
            timeCriteria.gte(from);
        } else {
            timeCriteria.lte(to);
        }

        return new Criteria().andOperator(
                criteria,
                timeCriteria
        );
    }


    private Double getNumericValue(
            Map<String, Object> raw,
            String key
    ) {

        if (raw == null) {
            return null;
        }

        Object value = raw.get(key);

        if (value instanceof Number number) {
            return number.doubleValue();
        }

        return null;
    }


    private TelemetryResponse toResponse(SensorReading reading) {

        return new TelemetryResponse(
                reading.getId() != null
                        ? reading.getId().toHexString()
                        : null,

                reading.getFieldId() != null
                        ? reading.getFieldId().toHexString()
                        : null,

                reading.getMessageId(),

                reading.getRaw(),
                reading.getQuality(),
                reading.getDecisionValues(),

                reading.getMeasuredAt(),
                reading.getReceivedAt()
        );
    }
}