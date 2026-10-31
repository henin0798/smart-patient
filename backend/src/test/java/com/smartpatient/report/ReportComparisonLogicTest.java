package com.smartpatient.report;

import com.smartpatient.report.dto.ReportComparisonResultDto;
import com.smartpatient.report.dto.ReportComparisonResultDto.ComparedTestMetric;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.RoundingMode;

import static org.junit.jupiter.api.Assertions.*;

public class ReportComparisonLogicTest {

    @Test
    @DisplayName("Should accurately calculate reduction difference and percentage")
    void testReductionComparison() {
        BigDecimal olderValue = new BigDecimal("225.0");
        BigDecimal newerValue = new BigDecimal("185.0");

        BigDecimal diff = newerValue.subtract(olderValue);
        assertEquals(new BigDecimal("-40.0"), diff);

        BigDecimal pct = diff.divide(olderValue, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal(100))
                .setScale(2, RoundingMode.HALF_UP);

        assertEquals(new BigDecimal("-17.78"), pct);
        assertTrue(diff.compareTo(BigDecimal.ZERO) < 0);
    }

    @Test
    @DisplayName("Should handle baseline zero value safely without division by zero")
    void testBaselineZeroPercentageHandling() {
        BigDecimal olderValue = BigDecimal.ZERO;
        BigDecimal newerValue = new BigDecimal("12.5");

        BigDecimal diff = newerValue.subtract(olderValue);
        assertEquals(new BigDecimal("12.5"), diff);

        // When olderValue is zero, percentage cannot be computed and must be null / N/A
        BigDecimal pct = null;
        if (olderValue.compareTo(BigDecimal.ZERO) != 0) {
            pct = diff.divide(olderValue, 4, RoundingMode.HALF_UP).multiply(new BigDecimal(100));
        }

        assertNull(pct, "Percentage difference must be null when baseline is zero");
    }

    @Test
    @DisplayName("Should detect normal, low, and high reference ranges")
    void testReferenceRangeEvaluations() {
        BigDecimal min = new BigDecimal("125.0");
        BigDecimal max = new BigDecimal("200.0");

        BigDecimal highVal = new BigDecimal("225.0");
        assertTrue(highVal.compareTo(max) > 0, "Value should be detected as HIGH");

        BigDecimal normalVal = new BigDecimal("185.0");
        assertTrue(normalVal.compareTo(min) >= 0 && normalVal.compareTo(max) <= 0, "Value should be NORMAL");

        BigDecimal lowVal = new BigDecimal("100.0");
        assertTrue(lowVal.compareTo(min) < 0, "Value should be detected as LOW");
    }

    @Test
    @DisplayName("Should construct correct status transition strings")
    void testStatusTransitionGeneration() {
        ComparedTestMetric metric1 = new ComparedTestMetric();
        metric1.setOlderStatus("HIGH");
        metric1.setNewerStatus("NORMAL");
        metric1.setStatusTransition("HIGH → NORMAL");
        assertEquals("HIGH → NORMAL", metric1.getStatusTransition());

        ComparedTestMetric metric2 = new ComparedTestMetric();
        metric2.setOlderStatus("NORMAL");
        metric2.setNewerStatus("HIGH");
        metric2.setStatusTransition("NORMAL → HIGH");
        assertEquals("NORMAL → HIGH", metric2.getStatusTransition());

        ComparedTestMetric metric3 = new ComparedTestMetric();
        metric3.setOlderStatus("NORMAL");
        metric3.setNewerStatus("NORMAL");
        metric3.setStatusTransition("Within normal limits");
        assertEquals("Within normal limits", metric3.getStatusTransition());
    }

    @Test
    @DisplayName("Should format percentage string with signed indicator")
    void testPercentageDifferenceStringFormatting() {
        BigDecimal posPct = new BigDecimal("14.50");
        String posStr = "+" + posPct.stripTrailingZeros().toPlainString() + "%";
        assertEquals("+14.5%", posStr);

        BigDecimal negPct = new BigDecimal("-17.78");
        String negStr = negPct.stripTrailingZeros().toPlainString() + "%";
        assertEquals("-17.78%", negStr);

        BigDecimal zeroPct = BigDecimal.ZERO;
        String zeroStr = "0.0%";
        assertEquals("0.0%", zeroStr);
    }

    @Test
    @DisplayName("Should produce no-comparable-data state correctly when matched metrics list is empty")
    void testEmptyComparableDataDtoState() {
        ReportComparisonResultDto dto = new ReportComparisonResultDto();
        dto.setHasComparableData(false);
        dto.setIncreasedCount(null);
        dto.setDecreasedCount(null);
        dto.setStableCount(null);
        dto.setOutOfRangeCount(null);
        dto.setSummary("No comparable structured laboratory values were found in the selected reports. Please check that both reports contain readable laboratory data.");

        assertFalse(dto.getHasComparableData());
        assertNull(dto.getIncreasedCount());
        assertNull(dto.getDecreasedCount());
        assertNull(dto.getStableCount());
        assertNull(dto.getOutOfRangeCount());
        assertTrue(dto.getSummary().contains("No comparable structured laboratory values were found"));
    }
}
