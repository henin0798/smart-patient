-- =============================================================================
-- SMART PATIENT HEALTH & HOSPITAL MANAGEMENT SYSTEM
-- Schema Migration V2: Longitudinal Report Comparisons & Document Types
-- Applicable to: TiDB Cloud, MySQL 8.x, MariaDB 10.4+, Railway, Render
-- =============================================================================

-- 1. Safely expand reports.report_type enum to support all 5 document categories
ALTER TABLE `reports` 
MODIFY COLUMN `report_type` ENUM('LAB', 'SCAN', 'PRESCRIPTION', 'CERTIFICATE', 'OTHER') NOT NULL;

-- 2. Create longitudinal report_comparisons table if it does not already exist
CREATE TABLE IF NOT EXISTS `report_comparisons` (
    `comparison_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `patient_id` BIGINT NOT NULL,
    `older_report_id` BIGINT NOT NULL,
    `newer_report_id` BIGINT NOT NULL,
    `comparison_title` VARCHAR(255) NOT NULL,
    `summary` TEXT NULL,
    `comparison_data_json` LONGTEXT NOT NULL,
    `disclaimer` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_comp_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_comp_older` FOREIGN KEY (`older_report_id`) REFERENCES `reports` (`report_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_comp_newer` FOREIGN KEY (`newer_report_id`) REFERENCES `reports` (`report_id`) ON DELETE CASCADE,
    INDEX `idx_comp_patient` (`patient_id`),
    INDEX `idx_comp_older` (`older_report_id`),
    INDEX `idx_comp_newer` (`newer_report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
