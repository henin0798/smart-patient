package com.smartpatient.report.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ReportComparisonResultDto {

    private Long comparisonId;
    private Long olderReportId;
    private String olderReportTitle;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate olderReportDate;

    private Long newerReportId;
    private String newerReportTitle;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate newerReportDate;

    private String reportType = "LAB";
    private String summary;
    private String detailedDescription;
    private String unmatchedReason;
    private boolean hasComparableData = true;

    private Integer increasedCount;
    private Integer decreasedCount;
    private Integer stableCount;
    private Integer outOfRangeCount;

    private String disclaimer = "This report summarizes recorded laboratory values for comparison purposes only. It is not a medical diagnosis or treatment recommendation. Reference ranges may vary by laboratory, and results should be interpreted by a qualified healthcare professional in the context of the patient’s clinical history.";

    private List<ComparedTestMetric> matchedMetrics = new ArrayList<>();
    private List<ReportValueDto> olderOnlyMetrics = new ArrayList<>();
    private List<ReportValueDto> newerOnlyMetrics = new ArrayList<>();

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ComparedTestMetric {
        private String testName;
        private String normalizedTestKey;
        private String unit;
        private BigDecimal olderValue;
        private BigDecimal newerValue;
        private BigDecimal difference;
        private BigDecimal percentageDifference;
        private String percentageDifferenceString; // e.g. "+18.42%", "-17.78%", "N/A"
        private String trend; // 'INCREASED', 'DECREASED', 'UNCHANGED'
        private BigDecimal referenceRangeMin;
        private BigDecimal referenceRangeMax;
        private String olderStatus; // 'LOW', 'NORMAL', 'HIGH', 'UNSPECIFIED'
        private String newerStatus; // 'LOW', 'NORMAL', 'HIGH', 'UNSPECIFIED'
        private String statusTransition; // e.g. 'HIGH → NORMAL', 'NORMAL → NORMAL'
        private boolean isOutOfRange;

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

        public String getPercentageDifferenceString() { return percentageDifferenceString; }
        public void setPercentageDifferenceString(String percentageDifferenceString) { this.percentageDifferenceString = percentageDifferenceString; }

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

        public String getStatusTransition() { return statusTransition; }
        public void setStatusTransition(String statusTransition) { this.statusTransition = statusTransition; }

        public boolean isOutOfRange() { return isOutOfRange; }
        public boolean getIsOutOfRange() { return isOutOfRange; }
        public void setOutOfRange(boolean outOfRange) { this.isOutOfRange = outOfRange; }
        public void setIsOutOfRange(boolean isOutOfRange) { this.isOutOfRange = isOutOfRange; }
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
    public void setOlderReportDate(String olderReportDate) {
        if (olderReportDate != null && !olderReportDate.trim().isEmpty()) {
            this.olderReportDate = LocalDate.parse(olderReportDate.trim());
        }
    }

    public Long getNewerReportId() { return newerReportId; }
    public void setNewerReportId(Long newerReportId) { this.newerReportId = newerReportId; }

    public String getNewerReportTitle() { return newerReportTitle; }
    public void setNewerReportTitle(String newerReportTitle) { this.newerReportTitle = newerReportTitle; }

    public LocalDate getNewerReportDate() { return newerReportDate; }
    public void setNewerReportDate(LocalDate newerReportDate) { this.newerReportDate = newerReportDate; }
    public void setNewerReportDate(String newerReportDate) {
        if (newerReportDate != null && !newerReportDate.trim().isEmpty()) {
            this.newerReportDate = LocalDate.parse(newerReportDate.trim());
        }
    }

    public String getReportType() { return reportType; }
    public void setReportType(String reportType) { this.reportType = reportType; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getDetailedDescription() { return detailedDescription; }
    public void setDetailedDescription(String detailedDescription) { this.detailedDescription = detailedDescription; }

    public String getUnmatchedReason() { return unmatchedReason; }
    public void setUnmatchedReason(String unmatchedReason) { this.unmatchedReason = unmatchedReason; }

    public boolean isHasComparableData() { return hasComparableData; }
    public boolean getHasComparableData() { return hasComparableData; }
    public void setHasComparableData(boolean hasComparableData) { this.hasComparableData = hasComparableData; }

    public Integer getIncreasedCount() { return increasedCount; }
    public void setIncreasedCount(Integer increasedCount) { this.increasedCount = increasedCount; }

    public Integer getDecreasedCount() { return decreasedCount; }
    public void setDecreasedCount(Integer decreasedCount) { this.decreasedCount = decreasedCount; }

    public Integer getStableCount() { return stableCount; }
    public void setStableCount(Integer stableCount) { this.stableCount = stableCount; }

    public Integer getOutOfRangeCount() { return outOfRangeCount; }
    public void setOutOfRangeCount(Integer outOfRangeCount) { this.outOfRangeCount = outOfRangeCount; }

    public String getDisclaimer() { return disclaimer; }
    public void setDisclaimer(String disclaimer) { this.disclaimer = disclaimer; }

    public List<ComparedTestMetric> getMatchedMetrics() { return matchedMetrics; }
    public void setMatchedMetrics(List<ComparedTestMetric> matchedMetrics) { this.matchedMetrics = matchedMetrics; }

    public List<ReportValueDto> getOlderOnlyMetrics() { return olderOnlyMetrics; }
    public void setOlderOnlyMetrics(List<ReportValueDto> olderOnlyMetrics) { this.olderOnlyMetrics = olderOnlyMetrics; }

    public List<ReportValueDto> getNewerOnlyMetrics() { return newerOnlyMetrics; }
    public void setNewerOnlyMetrics(List<ReportValueDto> newerOnlyMetrics) { this.newerOnlyMetrics = newerOnlyMetrics; }
}
