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
        dto.setSummary("Cholesterol improved by 17.8%");
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
        metric.setTrend("DECREASED");
        metric.setOlderStatus("HIGH");
        metric.setNewerStatus("NORMAL");
        metric.setReferenceRangeMin(new BigDecimal("125.0"));
        metric.setReferenceRangeMax(new BigDecimal("200.0"));

        dto.setMatchedMetrics(List.of(metric));

        // Serialize to JSON string (stored in report_comparisons.comparison_data_json)
        String json = objectMapper.writeValueAsString(dto);
        assertNotNull(json);
        assertTrue(json.contains("TOTAL_CHOLESTEROL"));
        assertTrue(json.contains("-17.78"));

        // Deserialize back
        ReportComparisonResultDto deserialized = objectMapper.readValue(json, ReportComparisonResultDto.class);
        assertEquals(101L, deserialized.getOlderReportId());
        assertEquals("Lipid Profile 2025", deserialized.getOlderReportTitle());
        assertEquals(1, deserialized.getMatchedMetrics().size());

        ComparedTestMetric dMetric = deserialized.getMatchedMetrics().get(0);
        assertEquals("Total Cholesterol", dMetric.getTestName());
        assertEquals(new BigDecimal("-40.0"), dMetric.getDifference());
        assertEquals("DECREASED", dMetric.getTrend());
        assertEquals("NORMAL", dMetric.getNewerStatus());
    }
}
