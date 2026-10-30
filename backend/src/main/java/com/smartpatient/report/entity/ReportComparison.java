package com.smartpatient.report.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.smartpatient.patient.entity.Patient;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "report_comparisons")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ReportComparison {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "comparison_id")
    private Long comparisonId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "older_report_id", nullable = false)
    private Report olderReport;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "newer_report_id", nullable = false)
    private Report newerReport;

    @Column(name = "comparison_title", nullable = false, length = 255)
    private String comparisonTitle;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "comparison_data_json", nullable = false, columnDefinition = "LONGTEXT")
    private String comparisonDataJson;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String disclaimer;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public ReportComparison() {}

    public ReportComparison(Patient patient, Report olderReport, Report newerReport,
                            String comparisonTitle, String summary,
                            String comparisonDataJson, String disclaimer) {
        this.patient = patient;
        this.olderReport = olderReport;
        this.newerReport = newerReport;
        this.comparisonTitle = comparisonTitle;
        this.summary = summary;
        this.comparisonDataJson = comparisonDataJson;
        this.disclaimer = disclaimer;
        this.createdAt = LocalDateTime.now();
    }

    public Long getComparisonId() {
        return comparisonId;
    }

    public void setComparisonId(Long comparisonId) {
        this.comparisonId = comparisonId;
    }

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }

    public Report getOlderReport() {
        return olderReport;
    }

    public void setOlderReport(Report olderReport) {
        this.olderReport = olderReport;
    }

    public Report getNewerReport() {
        return newerReport;
    }

    public void setNewerReport(Report newerReport) {
        this.newerReport = newerReport;
    }

    public String getComparisonTitle() {
        return comparisonTitle;
    }

    public void setComparisonTitle(String comparisonTitle) {
        this.comparisonTitle = comparisonTitle;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getComparisonDataJson() {
        return comparisonDataJson;
    }

    public void setComparisonDataJson(String comparisonDataJson) {
        this.comparisonDataJson = comparisonDataJson;
    }

    public String getDisclaimer() {
        return disclaimer;
    }

    public void setDisclaimer(String disclaimer) {
        this.disclaimer = disclaimer;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

