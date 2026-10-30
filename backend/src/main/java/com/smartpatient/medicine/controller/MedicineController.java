package com.smartpatient.medicine.controller;

import com.smartpatient.common.response.ApiResponse;
import com.smartpatient.medicine.entity.DoseStatus;
import com.smartpatient.medicine.entity.MedicineSchedule;
import com.smartpatient.medicine.service.MedicineService;
import com.smartpatient.prescription.dto.CreatePrescriptionRequest;
import com.smartpatient.prescription.entity.Prescription;
import com.smartpatient.prescription.service.PrescriptionService;
import com.smartpatient.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medicine-schedules")
public class MedicineController {

    private final MedicineService medicineService;
    private final PrescriptionService prescriptionService;

    public MedicineController(MedicineService medicineService, PrescriptionService prescriptionService) {
        this.medicineService = medicineService;
        this.prescriptionService = prescriptionService;
    }

    @GetMapping("/today")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<List<MedicineSchedule>>> getTodaySchedules(@AuthenticationPrincipal UserPrincipal principal) {
        List<MedicineSchedule> schedules = medicineService.getTodaySchedules(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(schedules));
    }

    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<Prescription>> addMedicineSchedule(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreatePrescriptionRequest request) {
        Prescription created = prescriptionService.createPatientPrescription(principal.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Medicine added to tracker and daily schedule initiated.", created));
    }

    @GetMapping("/history")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<List<MedicineSchedule>>> getDoseHistory(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<MedicineSchedule> history = medicineService.getDoseHistory(principal.getUserId(), startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @PostMapping("/{scheduleId}/status")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<MedicineSchedule>> updateStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long scheduleId,
            @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        DoseStatus status = DoseStatus.valueOf(statusStr.toUpperCase());
        MedicineSchedule updated = medicineService.updateDoseStatus(scheduleId, principal.getUserId(), status);
        return ResponseEntity.ok(ApiResponse.success("Dose recorded as " + status.name(), updated));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdherenceSummary(@AuthenticationPrincipal UserPrincipal principal) {
        Map<String, Object> summary = medicineService.getAdherenceSummary(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}
