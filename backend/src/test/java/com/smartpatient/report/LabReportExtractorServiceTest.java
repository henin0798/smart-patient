package com.smartpatient.report;

import com.smartpatient.report.dto.ReportValueDto;
import com.smartpatient.report.service.LabReportExtractorService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class LabReportExtractorServiceTest {

    private final LabReportExtractorService extractor = new LabReportExtractorService();

    @Test
    @DisplayName("Should parse standard lipid panel text into structured parameters")
    void testExtractLipidPanelText() {
        String reportText = """
                PATIENT LABORATORY REPORT
                Test Name                 Result      Units      Reference Range
                Total Cholesterol         225.0       mg/dL      125.0 - 200.0
                HDL Cholesterol           45.0        mg/dL      40.0 - 60.0
                LDL Cholesterol           145.0       mg/dL      0.0 - 100.0
                Triglycerides             175.0       mg/dL      0.0 - 150.0
                Fasting Blood Sugar       105.0       mg/dL      70.0 - 99.0
                HbA1c                     6.2         %          4.0 - 5.6
                """;

        List<ReportValueDto> values = extractor.parseLabValues(reportText);
        assertNotNull(values);
        assertTrue(values.size() >= 5, "Should extract at least 5 structured tests");

        ReportValueDto chol = values.stream().filter(v -> "TOTAL_CHOLESTEROL".equals(v.getNormalizedTestKey())).findFirst().orElse(null);
        assertNotNull(chol);
        assertEquals(new BigDecimal("225.00"), chol.getNumericValue());
        assertEquals("mg/dL", chol.getUnit());
        assertEquals(new BigDecimal("125.00"), chol.getReferenceRangeMin());
        assertEquals(new BigDecimal("200.00"), chol.getReferenceRangeMax());
        assertEquals("HIGH", chol.getInterpretation());

        ReportValueDto hdl = values.stream().filter(v -> "HDL_CHOLESTEROL".equals(v.getNormalizedTestKey())).findFirst().orElse(null);
        assertNotNull(hdl);
        assertEquals(new BigDecimal("45.00"), hdl.getNumericValue());
        assertEquals("NORMAL", hdl.getInterpretation());

        ReportValueDto hba1c = values.stream().filter(v -> "HBA1C".equals(v.getNormalizedTestKey())).findFirst().orElse(null);
        assertNotNull(hba1c);
        assertEquals(new BigDecimal("6.20"), hba1c.getNumericValue());
        assertEquals("HIGH", hba1c.getInterpretation());
    }

    @Test
    @DisplayName("Should parse renal and liver panel values from doctor notes")
    void testExtractRenalAndLiverText() {
        String notes = "Patient routine review. Serum Creatinine 1.1 mg/dL, BUN 16 mg/dL, SGOT 28 U/L, SGPT 34 U/L, Hemoglobin 14.5 g/dL.";
        List<ReportValueDto> values = extractor.parseLabValues(notes);

        assertTrue(values.stream().anyMatch(v -> "CREATININE".equals(v.getNormalizedTestKey())));
        assertTrue(values.stream().anyMatch(v -> "BUN".equals(v.getNormalizedTestKey())));
        assertTrue(values.stream().anyMatch(v -> "HEMOGLOBIN".equals(v.getNormalizedTestKey())));
    }

    @Test
    @DisplayName("Should return empty list gracefully for unreadable or non-lab text without throwing exceptions")
    void testExtractUnreadableText() {
        String nonLabText = "General administrative receipt. No laboratory measurements conducted.";
        List<ReportValueDto> values = extractor.parseLabValues(nonLabText);
        assertNotNull(values);
        assertTrue(values.isEmpty(), "Should not invent or hallucinate lab values from non-lab text");
    }
}
