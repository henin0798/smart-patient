package com.smartpatient.report.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class ReportComparisonResultDto {

    private Long comparisonId;
    private Long olderReportId;
    private String olderReportTitle;
    private LocalDate olderReportDate;

    private Long newerReportId;
    private String newerReportTitle;
    private LocalDate newerReportDate;

    private String summary;
    private int increasedCount;
    private int decreasedCount;
    private int stableCount;
    private int outOfRangeCount;

    private String disclaimer = "IMPORTANT MEDICAL DISCLAIMER: This comparison is provided for informational and educational purposes only. It is an automated analysis of the recorded report values and is not a medical diagnosis, clinical assessment, or substitute for professional medical advice. Always consult a qualified physician or healthcare provider for clinical evaluation.";

    private List<ComparedTestMetric> matchedMetrics = new ArrayList<>();
    private List<ReportValueDto> olderOnlyMetrics = new ArrayList<>();
    private List<ReportValueDto> newerOnlyMetrics = new ArrayList<>();

    public static class ComparedTestMetric {
        private String testName;
        private String normalizedTestKey;
        private String unit;
        private BigDecimal olderValue;
        private BigDecimal newerValue;
        private BigDecimal difference;
        private BigDecimal percentageDifference;
        private String trend; // 'INCREASED', 'DECREASED', 'UNCHANGED'
        private BigDecimal referenceRangeMin;
        private BigDecimal referenceRangeMax;
        private String olderStatus; // 'LOW', 'NORMAL', 'HIGH', 'UNSPECIFIED'
        private String newerStatus; // 'LOW', 'NORMAL', 'HIGH', 'UNSPECIFIED'

        public ComparedTestMetric() {}

        public String getTestName() { return testName; }
        public void setTestName(String testName) { this.testName = testName; }
        public String getNormalizedTestKey() { return normalizedTestKey; }
        public void setNormalizedTestKey(String normalizedTestKey) { this.normalizedTestKey = normalizedTestKey; }
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
        public BigDecimal getOlderValue() { return olderValue; }
        public void setOlderValue(BigDecimal olderValue) { this.olderValue = olderValue; }
        public BigDecimal getNewerValue() { return newerValue; }
        public void setNewerValue(BigDecimal newerValue) { this.newerValue = newerValue; }
        public BigDecimal getDifference() { return difference; }
        public void setDifference(BigDecimal difference) { this.difference = difference; }
        public BigDecimal getPercentageDifference() { return percentageDifference; }
        public void setPercentageDifference(BigDecimal percentageDifference) { this.percentageDifference = percentageDifference; }
        public String getTrend() { return trend; }
        public void setTrend(String trend) { this.trend = trend; }
        public BigDecimal getReferenceRangeMin() { return referenceRangeMin; }
        public void setReferenceRangeMin(BigDecimal referenceRangeMin) { this.referenceRangeMin = referenceRangeMin; }
        public BigDecimal getReferenceRangeMax() { return referenceRangeMax; }
        public void setReferenceRangeMax(BigDecimal referenceRangeMax) { this.referenceRangeMax = referenceRangeMax; }
        public String getOlderStatus() { return olderStatus; }
        public void setOlderStatus(String olderStatus) { this.olderStatus = olderStatus; }
        public String getNewerStatus() { return newerStatus; }
        public void setNewerStatus(String newerStatus) { this.newerStatus = newerStatus; }
    }

    public ReportComparisonResultDto() {}

    public Long getComparisonId() { return comparisonId; }
    public void setComparisonId(Long comparisonId) { this.comparisonId = comparisonId; }
    public Long getOlderReportId() { return olderReportId; }
    public void setOlderReportId(Long olderReportId) { this.olderReportId = olderReportId; }
    public String getOlderReportTitle() { return olderReportTitle; }
    public void setOlderReportTitle(String olderReportTitle) { this.olderReportTitle = olderReportTitle; }
    public LocalDate getOlderReportDate() { return olderReportDate; }
    public void setOlderReportDate(LocalDate olderReportDate) { this.olderReportDate = olderReportDate; }
    public Long getNewerReportId() { return newerReportId; }
    public void setNewerReportId(Long newerReportId) { this.newerReportId = newerReportId; }
    public String getNewerReportTitle() { return newerReportTitle; }
    public void setNewerReportTitle(String newerReportTitle) { this.newerReportTitle = newerReportTitle; }
    public LocalDate getNewerReportDate() { return newerReportDate; }
    public void setNewerReportDate(LocalDate newerReportDate) { this.newerReportDate = newerReportDate; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public int getIncreasedCount() { return increasedCount; }
    public void setIncreasedCount(int increasedCount) { this.increasedCount = increasedCount; }
    public int getDecreasedCount() { return decreasedCount; }
    public void setDecreasedCount(int decreasedCount) { this.decreasedCount = decreasedCount; }
    public int getStableCount() { return stableCount; }
    public void setStableCount(int stableCount) { this.stableCount = stableCount; }
    public int getOutOfRangeCount() { return outOfRangeCount; }
    public void setOutOfRangeCount(int outOfRangeCount) { this.outOfRangeCount = outOfRangeCount; }
    public String getDisclaimer() { return disclaimer; }
    public void setDisclaimer(String disclaimer) { this.disclaimer = disclaimer; }
    public List<ComparedTestMetric> getMatchedMetrics() { return matchedMetrics; }
    public void setMatchedMetrics(List<ComparedTestMetric> matchedMetrics) { this.matchedMetrics = matchedMetrics; }
    public List<ReportValueDto> getOlderOnlyMetrics() { return olderOnlyMetrics; }
    public void setOlderOnlyMetrics(List<ReportValueDto> olderOnlyMetrics) { this.olderOnlyMetrics = olderOnlyMetrics; }
    public List<ReportValueDto> getNewerOnlyMetrics() { return newerOnlyMetrics; }
    public void setNewerOnlyMetrics(List<ReportValueDto> newerOnlyMetrics) { this.newerOnlyMetrics = newerOnlyMetrics; }
}
