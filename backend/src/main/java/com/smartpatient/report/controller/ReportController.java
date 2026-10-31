package com.smartpatient.report.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpatient.common.response.ApiResponse;
import com.smartpatient.report.dto.ReportComparisonRequest;
import com.smartpatient.report.dto.ReportComparisonResultDto;
import com.smartpatient.report.dto.ReportValueDto;
import com.smartpatient.report.entity.Report;
import com.smartpatient.report.entity.ReportComparison;
import com.smartpatient.report.entity.ReportType;
import com.smartpatient.report.service.ReportService;
import com.smartpatient.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;
    private final ObjectMapper objectMapper;

    public ReportController(ReportService reportService, ObjectMapper objectMapper) {
        this.reportService = reportService;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Report>>> getMyReports(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) ReportType type,
            @RequestParam(required = false) String search) {
        List<Report> reports;
        if (search != null && !search.trim().isEmpty()) {
            reports = reportService.searchPatientReports(principal.getUserId(), type, search);
        } else {
            reports = reportService.getPatientReports(principal.getUserId(), type);
        }
        return ResponseEntity.ok(ApiResponse.success(reports));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Report>> uploadReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file,
            @RequestParam("reportTitle") String reportTitle,
            @RequestParam("reportType") ReportType reportType,
            @RequestParam("reportDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate reportDate,
            @RequestParam(value = "targetPatientId", required = false) Long targetPatientId,
            @RequestParam(value = "doctorId", required = false) Long doctorId,
            @RequestParam(value = "appointmentId", required = false) Long appointmentId,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "structuredValuesJson", required = false) String structuredValuesJson) {

        List<ReportValueDto> structuredValues = new ArrayList<>();
        if (structuredValuesJson != null && !structuredValuesJson.trim().isEmpty()) {
            try {
                structuredValues = objectMapper.readValue(structuredValuesJson, new TypeReference<List<ReportValueDto>>() {});
            } catch (Exception ignored) {}
        }

        Report report = reportService.uploadReport(
                principal.getUserId(),
                file,
                reportTitle,
                reportType,
                reportDate,
                targetPatientId,
                doctorId,
                appointmentId,
                description,
                structuredValues
        );

        return ResponseEntity.ok(ApiResponse.success("Medical report uploaded successfully.", report));
    }

    @GetMapping("/{reportId}")
    public ResponseEntity<ApiResponse<Report>> getReportById(@PathVariable Long reportId) {
        Report report = reportService.getReportById(reportId);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/{reportId}/download")
    public ResponseEntity<Resource> downloadReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long reportId) {
        Resource file = reportService.loadReportFileAsResource(reportId, principal.getUserId());
        Report report = reportService.getReportById(reportId);

        String contentType = report.getMimeType() != null ? report.getMimeType() : "application/octet-stream";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + report.getOriginalFilename() + "\"")
                .body(file);
    }

    @DeleteMapping("/{reportId}")
    public ResponseEntity<ApiResponse<String>> deleteReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long reportId) {
        reportService.deleteReport(reportId, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Medical report deleted successfully.", null));
    }

    @PostMapping("/compare")
    public ResponseEntity<ApiResponse<ReportComparisonResultDto>> compareReports(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ReportComparisonRequest request) {
        ReportComparisonResultDto result = reportService.compareReports(principal.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Reports compared successfully", result));
    }

    @GetMapping("/comparisons")
    public ResponseEntity<ApiResponse<List<ReportComparison>>> getComparisons(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<ReportComparison> list = reportService.getPatientComparisons(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/comparisons/{comparisonId}")
    public ResponseEntity<ApiResponse<ReportComparisonResultDto>> getComparisonById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long comparisonId) {
        ReportComparisonResultDto result = reportService.getComparisonResultById(comparisonId, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @DeleteMapping("/comparisons/{comparisonId}")
    public ResponseEntity<ApiResponse<String>> deleteComparison(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long comparisonId) {
        reportService.deleteComparison(comparisonId, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Comparison removed successfully.", null));
    }
}
