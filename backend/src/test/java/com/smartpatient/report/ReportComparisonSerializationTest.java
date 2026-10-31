package com.smartpatient.report;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.smartpatient.report.dto.ReportComparisonResultDto;
import com.smartpatient.report.dto.ReportComparisonResultDto.ComparedTestMetric;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class ReportComparisonSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Test
    @DisplayName("Should serialize and deserialize longitudinal comparison results without data loss")
    void testSerializationRoundTrip() throws Exception {
        ReportComparisonResultDto dto = new ReportComparisonResultDto();
        dto.setOlderReportId(101L);
        dto.setOlderReportTitle("Lipid Profile 2025");
        dto.setOlderReportDate(LocalDate.parse("2025-05-10"));
        dto.setNewerReportId(102L);
        dto.setNewerReportTitle("Lipid Profile 2026");
        dto.setNewerReportDate(LocalDate.parse("2026-05-10"));
        dto.setReportType("LAB");
        dto.setSummary("Cholesterol improved by 17.8%");
        dto.setDetailedDescription("Longitudinal analysis between Lipid Profile 2025 and 2026 demonstrates positive lipid control.");
        dto.setHasComparableData(true);
        dto.setIncreasedCount(1);
        dto.setDecreasedCount(2);
        dto.setStableCount(1);
        dto.setOutOfRangeCount(0);
        dto.setDisclaimer("For informational and academic review only.");

        ComparedTestMetric metric = new ComparedTestMetric();
        metric.setTestName("Total Cholesterol");
        metric.setNormalizedTestKey("TOTAL_CHOLESTEROL");
        metric.setUnit("mg/dL");
        metric.setOlderValue(new BigDecimal("225.0"));
        metric.setNewerValue(new BigDecimal("185.0"));
        metric.setDifference(new BigDecimal("-40.0"));
        metric.setPercentageDifference(new BigDecimal("-17.78"));
        metric.setPercentageDifferenceString("-17.78%");
        metric.setTrend("DECREASED");
        metric.setOlderStatus("HIGH");
        metric.setNewerStatus("NORMAL");
        metric.setStatusTransition("HIGH → NORMAL");
        metric.setIsOutOfRange(false);
        metric.setReferenceRangeMin(new BigDecimal("125.0"));
        metric.setReferenceRangeMax(new BigDecimal("200.0"));

        dto.setMatchedMetrics(List.of(metric));

        // Serialize to JSON string (stored in report_comparisons.comparison_data_json)
        String json = objectMapper.writeValueAsString(dto);
        assertNotNull(json);
        assertTrue(json.contains("TOTAL_CHOLESTEROL"));
        assertTrue(json.contains("-17.78%"));
        assertTrue(json.contains("HIGH → NORMAL"));
        assertTrue(json.contains("detailedDescription"));

        // Deserialize back
        ReportComparisonResultDto deserialized = objectMapper.readValue(json, ReportComparisonResultDto.class);
        assertEquals(101L, deserialized.getOlderReportId());
        assertEquals("Lipid Profile 2025", deserialized.getOlderReportTitle());
        assertEquals(Boolean.TRUE, deserialized.getHasComparableData());
        assertEquals("Longitudinal analysis between Lipid Profile 2025 and 2026 demonstrates positive lipid control.", deserialized.getDetailedDescription());
        assertEquals(1, deserialized.getMatchedMetrics().size());

        ComparedTestMetric dMetric = deserialized.getMatchedMetrics().get(0);
        assertEquals("Total Cholesterol", dMetric.getTestName());
        assertEquals(new BigDecimal("-40.0"), dMetric.getDifference());
        assertEquals("-17.78%", dMetric.getPercentageDifferenceString());
        assertEquals("HIGH → NORMAL", dMetric.getStatusTransition());
        assertEquals("DECREASED", dMetric.getTrend());
        assertEquals("NORMAL", dMetric.getNewerStatus());
        assertEquals(Boolean.FALSE, dMetric.getIsOutOfRange());
    }

    @Test
    @DisplayName("Should handle missing or unknown JSON fields gracefully without deserialization exception")
    void testBackwardCompatibleDeserialization() throws Exception {
        // Simulates an older JSON record stored in database before new fields were added
        String legacyJson = """
            {
                "olderReportId": 50,
                "olderReportTitle": "Blood Glucose Test",
                "olderReportDate": "2024-01-15",
                "newerReportId": 51,
                "newerReportTitle": "Blood Glucose Follow-up",
                "newerReportDate": "2024-06-15",
                "summary": "Glucose decreased",
                "increasedCount": 0,
                "decreasedCount": 1,
                "stableCount": 0,
                "outOfRangeCount": 0,
                "disclaimer": "Informational",
                "unknownFutureField": "something_new",
                "matchedMetrics": [
                    {
                        "testName": "Fasting Blood Glucose",
                        "normalizedTestKey": "GLUCOSE",
                        "unit": "mg/dL",
                        "olderValue": 110,
                        "newerValue": 95,
                        "difference": -15,
                        "percentageDifference": -13.64,
                        "trend": "DECREASED",
                        "olderStatus": "HIGH",
                        "newerStatus": "NORMAL",
                        "referenceRangeMin": 70,
                        "referenceRangeMax": 100
                    }
                ]
            }
            """;

        ReportComparisonResultDto dto = objectMapper.readValue(legacyJson, ReportComparisonResultDto.class);
        assertNotNull(dto);
        assertEquals(50L, dto.getOlderReportId());
        assertEquals(LocalDate.parse("2024-01-15"), dto.getOlderReportDate());
        assertEquals(1, dto.getMatchedMetrics().size());
        assertEquals("Fasting Blood Glucose", dto.getMatchedMetrics().get(0).getTestName());
    }
}
