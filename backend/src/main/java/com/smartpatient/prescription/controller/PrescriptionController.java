package com.smartpatient.prescription.controller;

import com.smartpatient.common.response.ApiResponse;
import com.smartpatient.prescription.dto.CreatePrescriptionRequest;
import com.smartpatient.prescription.entity.Prescription;
import com.smartpatient.prescription.service.PrescriptionService;
import com.smartpatient.security.UserPrincipal;
import com.smartpatient.user.entity.UserRole;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    public PrescriptionController(PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Prescription>>> getMyPrescriptions(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal.getRole() == UserRole.DOCTOR) {
            List<Prescription> list = prescriptionService.getDoctorPrescriptions(principal.getUserId());
            return ResponseEntity.ok(ApiResponse.success(list));
        } else {
            List<Prescription> list = prescriptionService.getPatientPrescriptions(principal.getUserId());
            return ResponseEntity.ok(ApiResponse.success(list));
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'PATIENT')")
    public ResponseEntity<ApiResponse<Prescription>> createPrescription(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreatePrescriptionRequest request) {
        Prescription created;
        if (principal.getRole() == UserRole.DOCTOR) {
            created = prescriptionService.createPrescription(principal.getUserId(), request);
        } else {
            created = prescriptionService.createPatientPrescription(principal.getUserId(), request);
        }
        return ResponseEntity.ok(ApiResponse.success("Prescription created and daily schedule initiated.", created));
    }

    @GetMapping("/{prescriptionId}")
    public ResponseEntity<ApiResponse<Prescription>> getPrescriptionById(@PathVariable Long prescriptionId) {
        Prescription prescription = prescriptionService.getPrescriptionById(prescriptionId);
        return ResponseEntity.ok(ApiResponse.success(prescription));
    }
}
