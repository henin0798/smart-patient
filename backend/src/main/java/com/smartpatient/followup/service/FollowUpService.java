package com.smartpatient.followup.service;

import com.smartpatient.appointment.entity.Appointment;
import com.smartpatient.appointment.repository.AppointmentRepository;
import com.smartpatient.audit.service.AuditService;
import com.smartpatient.common.exception.ResourceNotFoundException;
import com.smartpatient.doctor.entity.Doctor;
import com.smartpatient.doctor.repository.DoctorRepository;
import com.smartpatient.followup.entity.FollowUp;
import com.smartpatient.followup.entity.FollowUpStatus;
import com.smartpatient.followup.repository.FollowUpRepository;
import com.smartpatient.notification.service.NotificationService;
import com.smartpatient.patient.entity.Patient;
import com.smartpatient.patient.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class FollowUpService {

    private final FollowUpRepository followUpRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public FollowUpService(FollowUpRepository followUpRepository,
                           PatientRepository patientRepository,
                           DoctorRepository doctorRepository,
                           AppointmentRepository appointmentRepository,
                           NotificationService notificationService,
                           AuditService auditService) {
        this.followUpRepository = followUpRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Transactional
    public FollowUp createFollowUp(Long doctorUserId, Long patientId, Long appointmentId, LocalDate followUpDate, String reason) {
        Doctor doctor = doctorRepository.findByUser_UserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found."));

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        Appointment appointment = null;
        if (appointmentId != null) {
            appointment = appointmentRepository.findById(appointmentId).orElse(null);
        }

        FollowUp followUp = new FollowUp(patient, doctor, appointment, followUpDate, reason);
        FollowUp saved = followUpRepository.save(followUp);

        notificationService.createNotification(
                patient.getUser(),
                "FOLLOW_UP",
                "Follow-up Scheduled",
                "Dr. " + doctor.getFullName() + " recommended a follow-up visit on " + followUpDate + ": " + reason
        );

        auditService.log(doctorUserId, "CREATE_FOLLOW_UP", "FOLLOW_UP", saved.getFollowUpId().toString(), "SUCCESS", "Follow-up for date: " + followUpDate);

        return saved;
    }

    @Transactional(readOnly = true)
    public List<FollowUp> getPatientFollowUps(Long userId) {
        Patient patient = patientRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found."));
        return followUpRepository.findByPatient_PatientIdOrderByFollowUpDateAsc(patient.getPatientId());
    }

    @Transactional(readOnly = true)
    public List<FollowUp> getDoctorFollowUps(Long doctorUserId) {
        Doctor doctor = doctorRepository.findByUser_UserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found."));
        return followUpRepository.findByDoctor_DoctorIdOrderByFollowUpDateAsc(doctor.getDoctorId());
    }

    @Transactional
    public FollowUp updateStatus(Long followUpId, FollowUpStatus status, Long userId) {
        FollowUp followUp = followUpRepository.findById(followUpId)
                .orElseThrow(() -> new ResourceNotFoundException("Follow-up not found: " + followUpId));

        followUp.setStatus(status);
        FollowUp saved = followUpRepository.save(followUp);
        auditService.log(userId, "UPDATE_FOLLOW_UP_STATUS", "FOLLOW_UP", followUpId.toString(), "SUCCESS", "Status: " + status.name());
        return saved;
    }

    @Transactional
    public FollowUp rescheduleFollowUp(Long followUpId, LocalDate newDate, String note, Long userId) {
        FollowUp followUp = followUpRepository.findById(followUpId)
                .orElseThrow(() -> new ResourceNotFoundException("Follow-up not found: " + followUpId));

        LocalDate oldDate = followUp.getFollowUpDate();
        followUp.setFollowUpDate(newDate);
        if (note != null && !note.trim().isEmpty()) {
            followUp.setReason(followUp.getReason() + " (Rescheduled from " + oldDate + ": " + note.trim() + ")");
        }
        followUp.setStatus(FollowUpStatus.UPCOMING);
        FollowUp saved = followUpRepository.save(followUp);

        notificationService.createNotification(
                followUp.getPatient().getUser(),
                "FOLLOW_UP",
                "Follow-up Date Updated",
                "Your follow-up has been rescheduled to " + newDate + "."
        );

        auditService.log(userId, "RESCHEDULE_FOLLOW_UP", "FOLLOW_UP", followUpId.toString(), "SUCCESS", "New date: " + newDate);
        return saved;
    }
}
