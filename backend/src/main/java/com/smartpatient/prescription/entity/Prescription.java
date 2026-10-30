package com.smartpatient.prescription.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.smartpatient.appointment.entity.Appointment;
import com.smartpatient.doctor.entity.Doctor;
import com.smartpatient.patient.entity.Patient;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "prescriptions")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "prescription_id")
    private Long prescriptionId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Patient patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "doctor_id", nullable = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Doctor doctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "patient", "doctor"})
    private Appointment appointment;


    @Column(nullable = false, length = 200)
    private String medicine;

    @Column(nullable = false, length = 100)
    private String dosage;

    @Column(length = 50)
    private String route = "Oral";

    @Column(nullable = false, length = 100)
    private String frequency;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "food_instruction", nullable = false, length = 50)
    private FoodInstruction foodInstruction = FoodInstruction.AFTER_FOOD;

    @Column(name = "additional_instructions", columnDefinition = "TEXT")
    private String additionalInstructions;

    @Column(name = "follow_up_date")
    private LocalDate followUpDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Prescription() {}

    public Prescription(Patient patient, Doctor doctor, Appointment appointment, String medicine,
                        String dosage, String route, String frequency, LocalDate startDate,
                        LocalDate endDate, FoodInstruction foodInstruction,
                        String additionalInstructions, LocalDate followUpDate) {
        this.patient = patient;
        this.doctor = doctor;
        this.appointment = appointment;
        this.medicine = medicine;
        this.dosage = dosage;
        this.route = route != null ? route : "Oral";
        this.frequency = frequency;
        this.startDate = startDate;
        this.endDate = endDate;
        this.foodInstruction = foodInstruction != null ? foodInstruction : FoodInstruction.AFTER_FOOD;
        this.additionalInstructions = additionalInstructions;
        this.followUpDate = followUpDate;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getPrescriptionId() {
        return prescriptionId;
    }

    public void setPrescriptionId(Long prescriptionId) {
        this.prescriptionId = prescriptionId;
    }

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }

    public Doctor getDoctor() {
        return doctor;
    }

    public void setDoctor(Doctor doctor) {
        this.doctor = doctor;
    }

    public Appointment getAppointment() {
        return appointment;
    }

    public void setAppointment(Appointment appointment) {
        this.appointment = appointment;
    }

    public String getMedicine() {
        return medicine;
    }

    public void setMedicine(String medicine) {
        this.medicine = medicine;
    }

    public String getDosage() {
        return dosage;
    }

    public void setDosage(String dosage) {
        this.dosage = dosage;
    }

    public String getRoute() {
        return route;
    }

    public void setRoute(String route) {
        this.route = route;
    }

    public String getFrequency() {
        return frequency;
    }

    public void setFrequency(String frequency) {
        this.frequency = frequency;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public FoodInstruction getFoodInstruction() {
        return foodInstruction;
    }

    public void setFoodInstruction(FoodInstruction foodInstruction) {
        this.foodInstruction = foodInstruction;
    }

    public String getAdditionalInstructions() {
        return additionalInstructions;
    }

    public void setAdditionalInstructions(String additionalInstructions) {
        this.additionalInstructions = additionalInstructions;
    }

    public LocalDate getFollowUpDate() {
        return followUpDate;
    }

    public void setFollowUpDate(LocalDate followUpDate) {
        this.followUpDate = followUpDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}

