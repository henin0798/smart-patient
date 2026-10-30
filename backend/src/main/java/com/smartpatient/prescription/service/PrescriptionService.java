package com.smartpatient.prescription.service;

import com.smartpatient.appointment.entity.Appointment;
import com.smartpatient.appointment.repository.AppointmentRepository;
import com.smartpatient.audit.service.AuditService;
import com.smartpatient.common.exception.BadRequestException;
import com.smartpatient.common.exception.ResourceNotFoundException;
import com.smartpatient.doctor.entity.Doctor;
import com.smartpatient.doctor.repository.DoctorRepository;
import com.smartpatient.followup.entity.FollowUp;
import com.smartpatient.followup.repository.FollowUpRepository;
import com.smartpatient.medicine.entity.MedicineSchedule;
import com.smartpatient.medicine.entity.TimePeriod;
import com.smartpatient.medicine.repository.MedicineScheduleRepository;
import com.smartpatient.notification.service.NotificationService;
import com.smartpatient.patient.entity.Patient;
import com.smartpatient.patient.repository.PatientRepository;
import com.smartpatient.prescription.dto.CreatePrescriptionRequest;
import com.smartpatient.prescription.entity.Prescription;
import com.smartpatient.prescription.repository.PrescriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicineScheduleRepository medicineScheduleRepository;
    private final FollowUpRepository followUpRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public PrescriptionService(PrescriptionRepository prescriptionRepository,
                               PatientRepository patientRepository,
                               DoctorRepository doctorRepository,
                               AppointmentRepository appointmentRepository,
                               MedicineScheduleRepository medicineScheduleRepository,
                               FollowUpRepository followUpRepository,
                               NotificationService notificationService,
                               AuditService auditService) {
        this.prescriptionRepository = prescriptionRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.medicineScheduleRepository = medicineScheduleRepository;
        this.followUpRepository = followUpRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Transactional
    public Prescription createPrescription(Long doctorUserId, CreatePrescriptionRequest request) {
        if (request.getPatientId() == null) {
            throw new BadRequestException("Patient ID is required for doctor prescriptions.");
        }

        Doctor doctor = doctorRepository.findByUser_UserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for user: " + doctorUserId));

        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + request.getPatientId()));

        Appointment appointment = null;
        if (request.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(request.getAppointmentId()).orElse(null);
        }

        Prescription prescription = new Prescription(
                patient, doctor, appointment,
                request.getMedicine(), request.getDosage(), request.getRoute(),
                request.getFrequency(), request.getStartDate(), request.getEndDate(),
                request.getFoodInstruction(), request.getAdditionalInstructions(),
                request.getFollowUpDate()
        );

        Prescription saved = prescriptionRepository.save(prescription);

        generateDailySchedules(saved, request);

        // If follow-up date is provided, create follow-up
        if (request.getFollowUpDate() != null) {
            FollowUp followUp = new FollowUp(
                    patient, doctor, appointment,
                    request.getFollowUpDate(),
                    "Follow-up consultation for medication: " + request.getMedicine()
            );
            followUpRepository.save(followUp);
        }

        notificationService.createNotification(
                patient.getUser(),
                "PRESCRIPTION",
                "New Prescription Added",
                "Dr. " + doctor.getFullName() + " prescribed " + request.getMedicine() + " (" + request.getDosage() + "). Daily schedules generated."
        );

        auditService.log(doctorUserId, "CREATE_PRESCRIPTION", "PRESCRIPTION", saved.getPrescriptionId().toString(), "SUCCESS", "Prescribed: " + request.getMedicine());

        return saved;
    }

    @Transactional
    public Prescription createPatientPrescription(Long patientUserId, CreatePrescriptionRequest request) {
        Patient patient = patientRepository.findByUser_UserId(patientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for user: " + patientUserId));

        Doctor doctor = null;
        if (request.getDoctorId() != null) {
            doctor = doctorRepository.findById(request.getDoctorId()).orElse(null);
        }
        if (doctor == null) {
            doctor = doctorRepository.findAll().stream().findFirst().orElse(null);
        }

        Appointment appointment = null;
        if (request.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(request.getAppointmentId()).orElse(null);
        }

        Prescription prescription = new Prescription(
                patient, doctor, appointment,
                request.getMedicine(), request.getDosage(), request.getRoute(),
                request.getFrequency(), request.getStartDate(), request.getEndDate(),
                request.getFoodInstruction(), request.getAdditionalInstructions(),
                request.getFollowUpDate()
        );

        Prescription saved = prescriptionRepository.save(prescription);

        generateDailySchedules(saved, request);

        notificationService.createNotification(
                patient.getUser(),
                "PRESCRIPTION",
                "New Medication Added",
                "Medication " + request.getMedicine() + " (" + request.getDosage() + ") added to your daily schedule."
        );

        auditService.log(patientUserId, "CREATE_MEDICINE", "PRESCRIPTION", saved.getPrescriptionId().toString(), "SUCCESS", "Patient added medicine: " + request.getMedicine());

        return saved;
    }

    private void generateDailySchedules(Prescription saved, CreatePrescriptionRequest request) {
        LocalDate end = request.getEndDate() != null ? request.getEndDate() : request.getStartDate().plusDays(7);
        LocalDate cur = request.getStartDate();

        String foodStr = request.getFoodInstruction() != null ? request.getFoodInstruction().name().replace('_', ' ') : "AFTER FOOD";
        String freqLower = request.getFrequency() != null ? request.getFrequency().toLowerCase() : "";

        while (!cur.isAfter(end) && !cur.isAfter(request.getStartDate().plusDays(30))) {
            if (freqLower.contains("bedtime") || freqLower.contains("night")) {
                saveDose(saved, cur, LocalTime.of(21, 30), TimePeriod.BEDTIME, foodStr);
            } else if (freqLower.contains("three") || freqLower.contains("thrice") || freqLower.contains("3")) {
                saveDose(saved, cur, LocalTime.of(8, 30), TimePeriod.MORNING, foodStr);
                saveDose(saved, cur, LocalTime.of(13, 30), TimePeriod.AFTERNOON, foodStr);
                saveDose(saved, cur, LocalTime.of(20, 30), TimePeriod.EVENING, foodStr);
            } else if (freqLower.contains("once") || freqLower.contains("1")) {
                if (freqLower.contains("evening") || freqLower.contains("night")) {
                    saveDose(saved, cur, LocalTime.of(20, 30), TimePeriod.EVENING, foodStr);
                } else if (freqLower.contains("afternoon")) {
                    saveDose(saved, cur, LocalTime.of(13, 30), TimePeriod.AFTERNOON, foodStr);
                } else {
                    saveDose(saved, cur, LocalTime.of(8, 30), TimePeriod.MORNING, foodStr);
                }
            } else {
                // Default: 2 doses a day: Morning and Evening
                saveDose(saved, cur, LocalTime.of(8, 30), TimePeriod.MORNING, foodStr);
                saveDose(saved, cur, LocalTime.of(20, 30), TimePeriod.EVENING, foodStr);
            }
            cur = cur.plusDays(1);
        }
    }

    private void saveDose(Prescription rx, LocalDate date, LocalTime time, TimePeriod period, String food) {
        try {
            MedicineSchedule schedule = new MedicineSchedule(rx, date, time, period, food);
            medicineScheduleRepository.save(schedule);
        } catch (Exception ignored) {
            // Ignore duplicate constraint if already exists
        }
    }

    @Transactional(readOnly = true)
    public List<Prescription> getPatientPrescriptions(Long userId) {
        Patient patient = patientRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found."));
        return prescriptionRepository.findByPatient_PatientIdOrderByStartDateDesc(patient.getPatientId());
    }

    @Transactional(readOnly = true)
    public List<Prescription> getDoctorPrescriptions(Long doctorUserId) {
        Doctor doctor = doctorRepository.findByUser_UserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found."));
        return prescriptionRepository.findByDoctor_DoctorIdOrderByStartDateDesc(doctor.getDoctorId());
    }

    @Transactional(readOnly = true)
    public Prescription getPrescriptionById(Long prescriptionId) {
        return prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + prescriptionId));
    }
}
