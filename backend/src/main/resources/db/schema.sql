-- =============================================================================
-- SMART PATIENT HEALTH & HOSPITAL MANAGEMENT SYSTEM
-- Complete Relational Database Schema (MySQL 8.x / MariaDB 10.4+)
-- Database: smart_patient_db
-- =============================================================================

CREATE DATABASE IF NOT EXISTS smart_patient_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_patient_db;

-- 1. Users table (Central identity)
CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('PATIENT', 'DOCTOR', 'ADMIN') NOT NULL,
    account_status ENUM('ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    INDEX idx_user_username (username),
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB;

-- 2. Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
    hospital_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    description TEXT,
    digital_reports_supported BOOLEAN DEFAULT TRUE,
    application_booking_supported BOOLEAN DEFAULT TRUE,
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_hospital_city (city)
) ENGINE=InnoDB;

-- 3. Patients profile table
CREATE TABLE IF NOT EXISTS patients (
    patient_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_code VARCHAR(30) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    date_of_birth DATE NOT NULL,
    phone VARCHAR(30) NOT NULL,
    blood_group VARCHAR(10),
    allergies TEXT,
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_patient_code (patient_code)
) ENGINE=InnoDB;

-- 4. Doctors profile table
CREATE TABLE IF NOT EXISTS doctors (
    doctor_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    hospital_id BIGINT NULL,
    full_name VARCHAR(150) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    qualification VARCHAR(150) NOT NULL,
    license_or_registration_reference VARCHAR(100),
    verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id) ON DELETE SET NULL,
    INDEX idx_doctor_specialty (specialty),
    INDEX idx_doctor_verification (verification_status)
) ENGINE=InnoDB;

-- 5. Doctor-Hospital affiliations
CREATE TABLE IF NOT EXISTS doctor_hospitals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    doctor_id BIGINT NOT NULL,
    hospital_id BIGINT NOT NULL,
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_doctor_hospital (doctor_id, hospital_id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_reference VARCHAR(50) NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    hospital_id BIGINT NOT NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    token_number INT NOT NULL,
    reason_for_visit TEXT,
    status ENUM('BOOKED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW') NOT NULL DEFAULT 'BOOKED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
    INDEX idx_appointment_doctor_date (doctor_id, appointment_date),
    INDEX idx_appointment_patient (patient_id)
) ENGINE=InnoDB;

-- 7. Medical Reports & Scans
CREATE TABLE IF NOT EXISTS reports (
    report_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    uploaded_by_user_id BIGINT NOT NULL,
    doctor_id BIGINT NULL,
    appointment_id BIGINT NULL,
    report_title VARCHAR(200) NOT NULL,
    report_type ENUM('LAB', 'SCAN', 'PRESCRIPTION', 'CERTIFICATE', 'OTHER') NOT NULL,
    report_date DATE NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    storage_key VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    INDEX idx_report_patient (patient_id),
    INDEX idx_report_type (report_type)
) ENGINE=InnoDB;

-- 8. Structured Laboratory Test Values (for comparison & analysis)
CREATE TABLE IF NOT EXISTS report_values (
    value_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_id BIGINT NOT NULL,
    test_name VARCHAR(150) NOT NULL,
    normalized_test_key VARCHAR(100) NOT NULL,
    numeric_value DECIMAL(10, 3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    reference_range_min DECIMAL(10, 3) NULL,
    reference_range_max DECIMAL(10, 3) NULL,
    interpretation VARCHAR(100) NULL,
    entered_by_user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE,
    FOREIGN KEY (entered_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_test_key (normalized_test_key)
) ENGINE=InnoDB;

-- 9. Doctor Consultations
CREATE TABLE IF NOT EXISTS consultations (
    consultation_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id BIGINT NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    notes TEXT NOT NULL,
    consultation_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    prescription_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_id BIGINT NULL,
    medicine VARCHAR(200) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    route VARCHAR(50) DEFAULT 'Oral',
    frequency VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    food_instruction ENUM('BEFORE_FOOD', 'AFTER_FOOD', 'WITH_FOOD', 'NO_RESTRICTION') NOT NULL DEFAULT 'AFTER_FOOD',
    additional_instructions TEXT,
    follow_up_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    INDEX idx_prescription_patient (patient_id)
) ENGINE=InnoDB;

-- 11. Medicine Schedules (Daily Doses)
CREATE TABLE IF NOT EXISTS medicine_schedules (
    schedule_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_id BIGINT NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    time_period ENUM('MORNING', 'AFTERNOON', 'EVENING', 'BEDTIME') NOT NULL,
    food_instruction VARCHAR(50) NOT NULL,
    status ENUM('PENDING', 'TAKEN', 'MISSED') NOT NULL DEFAULT 'PENDING',
    status_updated_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_medicine_slot (prescription_id, scheduled_date, time_period),
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE CASCADE,
    INDEX idx_schedule_date_status (scheduled_date, status)
) ENGINE=InnoDB;

-- 12. Follow-ups
CREATE TABLE IF NOT EXISTS follow_ups (
    follow_up_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_id BIGINT NULL,
    follow_up_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('UPCOMING', 'ACKNOWLEDGED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'UPCOMING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    INDEX idx_followup_patient (patient_id)
) ENGINE=InnoDB;

-- 13. Record Shares
CREATE TABLE IF NOT EXISTS record_shares (
    share_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NULL,
    sharing_code VARCHAR(30) NULL,
    sharing_code_hash VARCHAR(255) NULL,
    category_scope VARCHAR(100) NOT NULL DEFAULT 'ALL',
    status ENUM('ACTIVE', 'EXPIRED', 'REVOKED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME NULL,
    last_accessed_at DATETIME NULL,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL,
    INDEX idx_sharing_code (sharing_code)
) ENGINE=InnoDB;

-- 14. Record Share Items (Specific linked documents)
CREATE TABLE IF NOT EXISTS record_share_items (
    item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    share_id BIGINT NOT NULL,
    item_type ENUM('REPORT', 'PRESCRIPTION', 'APPOINTMENT') NOT NULL,
    item_reference_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (share_id) REFERENCES record_shares(share_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 15. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_notif_user_read (user_id, is_read)
) ENGINE=InnoDB;

-- 16. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_user_id BIGINT NULL,
    action_type VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100) NULL,
    outcome ENUM('SUCCESS', 'FAILURE', 'DENIED') NOT NULL,
    metadata TEXT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_timestamp (timestamp),
    INDEX idx_audit_action (action_type)
) ENGINE=InnoDB;

-- 17. Longitudinal Report Comparisons
CREATE TABLE IF NOT EXISTS report_comparisons (
    comparison_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    older_report_id BIGINT NOT NULL,
    newer_report_id BIGINT NOT NULL,
    comparison_title VARCHAR(255) NOT NULL,
    summary TEXT NULL,
    comparison_data_json LONGTEXT NOT NULL,
    disclaimer TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (older_report_id) REFERENCES reports(report_id) ON DELETE CASCADE,
    FOREIGN KEY (newer_report_id) REFERENCES reports(report_id) ON DELETE CASCADE,
    INDEX idx_comp_patient (patient_id),
    INDEX idx_comp_older (older_report_id),
    INDEX idx_comp_newer (newer_report_id)
) ENGINE=InnoDB;
