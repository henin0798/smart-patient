package com.smartpatient.followup.controller;

import com.smartpatient.common.response.ApiResponse;
import com.smartpatient.followup.entity.FollowUp;
import com.smartpatient.followup.entity.FollowUpStatus;
import com.smartpatient.followup.service.FollowUpService;
import com.smartpatient.security.UserPrincipal;
import com.smartpatient.user.entity.UserRole;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/follow-ups")
public class FollowUpController {

    private final FollowUpService followUpService;

    public FollowUpController(FollowUpService followUpService) {
        this.followUpService = followUpService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FollowUp>>> getMyFollowUps(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal.getRole() == UserRole.DOCTOR) {
            List<FollowUp> list = followUpService.getDoctorFollowUps(principal.getUserId());
            return ResponseEntity.ok(ApiResponse.success(list));
        } else {
            List<FollowUp> list = followUpService.getPatientFollowUps(principal.getUserId());
            return ResponseEntity.ok(ApiResponse.success(list));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<FollowUp>> createFollowUp(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {
        Long patientId = Long.valueOf(body.get("patientId").toString());
        Long appointmentId = body.get("appointmentId") != null ? Long.valueOf(body.get("appointmentId").toString()) : null;
        LocalDate date = LocalDate.parse(body.get("followUpDate").toString());
        String reason = body.get("reason").toString();

        FollowUp created = followUpService.createFollowUp(principal.getUserId(), patientId, appointmentId, date, reason);
        return ResponseEntity.ok(ApiResponse.success("Follow-up scheduled successfully", created));
    }

    @PutMapping("/{followUpId}/status")
    public ResponseEntity<ApiResponse<FollowUp>> updateStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long followUpId,
            @RequestBody Map<String, String> body) {
        FollowUpStatus status = FollowUpStatus.valueOf(body.get("status").toUpperCase());
        FollowUp updated = followUpService.updateStatus(followUpId, status, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Follow-up status updated to " + status.name(), updated));
    }

    @PutMapping("/{followUpId}/reschedule")
    public ResponseEntity<ApiResponse<FollowUp>> reschedule(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long followUpId,
            @RequestBody Map<String, String> body) {
        LocalDate newDate = LocalDate.parse(body.get("followUpDate"));
        String note = body.get("note");
        FollowUp updated = followUpService.rescheduleFollowUp(followUpId, newDate, note, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Follow-up rescheduled successfully", updated));
    }
}
