-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: smart_patient_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `appointments` (
  `appointment_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `appointment_reference` varchar(50) NOT NULL,
  `patient_id` bigint(20) NOT NULL,
  `doctor_id` bigint(20) NOT NULL,
  `hospital_id` bigint(20) NOT NULL,
  `appointment_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `token_number` int(11) NOT NULL,
  `reason_for_visit` text DEFAULT NULL,
  `status` enum('BOOKED','CANCELLED','COMPLETED','CONFIRMED','NO_SHOW') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`appointment_id`),
  UNIQUE KEY `appointment_reference` (`appointment_reference`),
  KEY `hospital_id` (`hospital_id`),
  KEY `idx_appointment_doctor_date` (`doctor_id`,`appointment_date`),
  KEY `idx_appointment_patient` (`patient_id`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE,
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`) ON DELETE CASCADE,
  CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`hospital_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
INSERT INTO `appointments` VALUES (1,'APT-20261027-4821',1,1,1,'2026-10-27','10:00:00','10:30:00',1,'Routine cardiovascular evaluation and lipid consultation','BOOKED','2026-10-25 08:16:40','2026-10-25 08:16:40'),(2,'APT-20261028-6E10',2,1,1,'2026-10-28','10:30:00','11:00:00',1,'Routine annual cardiovascular evaluation','BOOKED','2026-10-25 14:03:02','2026-10-25 14:03:02'),(3,'APT-20261029-8CA3',5,1,1,'2026-10-29','09:00:00','09:30:00',1,'Routine annual cardiovascular evaluation','BOOKED','2026-10-25 14:05:01','2026-10-25 14:05:01'),(4,'APT-20261029-4AA9',6,1,1,'2026-10-29','09:30:00','10:00:00',2,'Routine annual cardiovascular evaluation','BOOKED','2026-10-25 14:05:36','2026-10-25 14:05:36'),(5,'APT-20261105-C868',7,1,1,'2026-11-05','10:00:00','10:30:00',1,'Cardiovascular checkup','BOOKED','2026-10-29 15:28:05','2026-10-29 15:28:05'),(6,'APT-20261105-8A4C',8,1,1,'2026-11-05','10:30:00','11:00:00',2,'Cardiology routine check-up','BOOKED','2026-10-29 18:12:20','2026-10-29 18:12:20');
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_logs` (
  `audit_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `actor_user_id` bigint(20) DEFAULT NULL,
  `action_type` varchar(100) NOT NULL,
  `resource_type` varchar(100) NOT NULL,
  `resource_id` varchar(100) DEFAULT NULL,
  `outcome` varchar(20) NOT NULL,
  `metadata` text DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`audit_id`),
  KEY `idx_audit_timestamp` (`timestamp`),
  KEY `idx_audit_action` (`action_type`)
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 08:16:59'),(2,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 08:17:07'),(3,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 08:18:17'),(4,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 08:19:33'),(5,5,'COMPARE_REPORTS','REPORT','1-2','SUCCESS','Comparison generated','2026-10-25 08:19:33'),(6,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 09:27:09'),(7,5,'COMPARE_REPORTS','REPORT','1-2','SUCCESS','Comparison generated','2026-10-25 09:27:09'),(8,2,'LOGIN','USER','2','SUCCESS','Role: DOCTOR','2026-10-25 09:27:09'),(9,1,'LOGIN','USER','1','SUCCESS','Role: ADMIN','2026-10-25 09:27:09'),(10,1,'APPROVE_DOCTOR','DOCTOR','3','SUCCESS','Approved doctor: Dr. Anita Nair','2026-10-25 09:27:09'),(11,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 09:29:22'),(12,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 09:33:00'),(13,5,'COMPARE_REPORTS','REPORT','1-2','SUCCESS','Comparison generated','2026-10-25 09:33:00'),(14,2,'LOGIN','USER','2','SUCCESS','Role: DOCTOR','2026-10-25 09:33:00'),(15,1,'LOGIN','USER','1','SUCCESS','Role: ADMIN','2026-10-25 09:33:00'),(16,5,'UPDATE_DOSE_STATUS','MEDICINE_SCHEDULE','1','SUCCESS','Status: TAKEN','2026-10-25 09:33:00'),(17,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 09:33:40'),(18,5,'CREATE_RECORD_SHARE','RECORD_SHARE','2','SUCCESS','Code: SH-PVJHHZ','2026-10-25 09:33:40'),(19,2,'LOGIN','USER','2','SUCCESS','Role: DOCTOR','2026-10-25 09:33:40'),(20,2,'REDEEM_SHARE_CODE','RECORD_SHARE','2','SUCCESS','Redeemed by Dr. Dr. Rajesh Sharma','2026-10-25 09:33:40'),(21,5,'REVOKE_RECORD_SHARE','RECORD_SHARE','2','SUCCESS','Revoked share ID: 2','2026-10-25 09:33:40'),(22,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 11:02:05'),(23,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 11:02:05'),(24,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 11:04:01'),(25,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 11:04:01'),(26,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 11:06:55'),(27,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 11:11:47'),(28,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 11:11:47'),(29,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 11:11:47'),(30,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 11:13:04'),(31,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 11:13:04'),(32,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 11:13:04'),(33,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 11:13:04'),(34,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 11:13:14'),(35,5,'COMPARE_REPORTS','REPORT','1-2','SUCCESS','Comparison generated','2026-10-25 11:13:14'),(36,2,'LOGIN','USER','2','SUCCESS','Role: DOCTOR','2026-10-25 11:13:14'),(37,1,'LOGIN','USER','1','SUCCESS','Role: ADMIN','2026-10-25 11:13:14'),(38,5,'UPDATE_DOSE_STATUS','MEDICINE_SCHEDULE','1','SUCCESS','Status: TAKEN','2026-10-25 11:13:14'),(39,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 11:13:20'),(40,5,'CREATE_RECORD_SHARE','RECORD_SHARE','3','SUCCESS','Code: SH-E8E52A','2026-10-25 11:13:20'),(41,2,'LOGIN','USER','2','SUCCESS','Role: DOCTOR','2026-10-25 11:13:20'),(42,2,'REDEEM_SHARE_CODE','RECORD_SHARE','3','SUCCESS','Redeemed by Dr. Dr. Rajesh Sharma','2026-10-25 11:13:20'),(43,5,'REVOKE_RECORD_SHARE','RECORD_SHARE','3','SUCCESS','Revoked share ID: 3','2026-10-25 11:13:20'),(44,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 13:08:06'),(45,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 13:08:44'),(46,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 13:09:24'),(47,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 13:09:29'),(48,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 13:09:35'),(49,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 13:27:42'),(50,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 13:41:02'),(51,2,'LOGIN','USER','2','SUCCESS','Role: DOCTOR','2026-10-25 13:41:11'),(52,1,'LOGIN','USER','1','SUCCESS','Role: ADMIN','2026-10-25 13:41:11'),(53,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 14:02:21'),(54,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 14:03:01'),(55,6,'REGISTER_PATIENT','USER','6','SUCCESS','Patient ID: PT-2026-2486','2026-10-25 14:03:02'),(56,6,'BOOK_APPOINTMENT','APPOINTMENT','2','SUCCESS','Ref: APT-20261028-6E10','2026-10-25 14:03:02'),(57,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 14:04:26'),(58,7,'REGISTER_PATIENT','USER','7','SUCCESS','Patient ID: PT-2026-2234','2026-10-25 14:04:26'),(59,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 14:04:46'),(60,8,'REGISTER_PATIENT','USER','8','SUCCESS','Patient ID: PT-2026-4496','2026-10-25 14:04:47'),(61,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 14:05:01'),(62,9,'REGISTER_PATIENT','USER','9','SUCCESS','Patient ID: PT-2026-6201','2026-10-25 14:05:01'),(63,9,'BOOK_APPOINTMENT','APPOINTMENT','3','SUCCESS','Ref: APT-20261029-8CA3','2026-10-25 14:05:01'),(64,5,'LOGIN','USER','5','SUCCESS','Role: PATIENT','2026-10-25 14:05:36'),(65,10,'REGISTER_PATIENT','USER','10','SUCCESS','Patient ID: PT-2026-2553','2026-10-25 14:05:36'),(66,10,'BOOK_APPOINTMENT','APPOINTMENT','4','SUCCESS','Ref: APT-20261029-4AA9','2026-10-25 14:05:36'),(67,10,'UPLOAD_REPORT','REPORT','3','SUCCESS','Uploaded: Baseline Lipid Profile Test','2026-10-25 14:05:36'),(68,11,'REGISTER_PATIENT','USER','11','SUCCESS','Patient ID: PT-2026-3634','2026-10-29 15:24:48'),(69,11,'LOGIN','USER','11','SUCCESS','Role: PATIENT','2026-10-29 15:25:39'),(70,11,'LOGIN','USER','11','SUCCESS','Role: PATIENT','2026-10-29 15:28:05'),(71,11,'BOOK_APPOINTMENT','APPOINTMENT','5','SUCCESS','Ref: APT-20261105-C868','2026-10-29 15:28:05'),(72,12,'REGISTER_PATIENT','USER','12','SUCCESS','Patient ID: PT-2026-2456','2026-10-29 18:10:23'),(73,12,'LOGIN','USER','12','SUCCESS','Role: PATIENT','2026-10-29 18:11:49'),(74,12,'LOGIN','USER','12','SUCCESS','Role: PATIENT','2026-10-29 18:12:20'),(75,12,'BOOK_APPOINTMENT','APPOINTMENT','6','SUCCESS','Ref: APT-20261105-8A4C','2026-10-29 18:12:20'),(76,12,'LOGIN','USER','12','SUCCESS','Role: PATIENT','2026-10-29 18:22:23');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultations`
--

DROP TABLE IF EXISTS `consultations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `consultations` (
  `consultation_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `appointment_id` bigint(20) NOT NULL,
  `patient_id` bigint(20) NOT NULL,
  `doctor_id` bigint(20) NOT NULL,
  `notes` text NOT NULL,
  `consultation_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`consultation_id`),
  UNIQUE KEY `appointment_id` (`appointment_id`),
  KEY `patient_id` (`patient_id`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `consultations_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`) ON DELETE CASCADE,
  CONSTRAINT `consultations_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE,
  CONSTRAINT `consultations_ibfk_3` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultations`
--

LOCK TABLES `consultations` WRITE;
/*!40000 ALTER TABLE `consultations` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctor_hospitals`
--

DROP TABLE IF EXISTS `doctor_hospitals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `doctor_hospitals` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `doctor_id` bigint(20) NOT NULL,
  `hospital_id` bigint(20) NOT NULL,
  `active_status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_doctor_hospital` (`doctor_id`,`hospital_id`),
  KEY `hospital_id` (`hospital_id`),
  CONSTRAINT `doctor_hospitals_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`) ON DELETE CASCADE,
  CONSTRAINT `doctor_hospitals_ibfk_2` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`hospital_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor_hospitals`
--

LOCK TABLES `doctor_hospitals` WRITE;
/*!40000 ALTER TABLE `doctor_hospitals` DISABLE KEYS */;
/*!40000 ALTER TABLE `doctor_hospitals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctors`
--

DROP TABLE IF EXISTS `doctors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `doctors` (
  `doctor_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `hospital_id` bigint(20) DEFAULT NULL,
  `full_name` varchar(150) NOT NULL,
  `specialty` varchar(100) NOT NULL,
  `qualification` varchar(150) NOT NULL,
  `license_or_registration_reference` varchar(100) DEFAULT NULL,
  `verification_status` enum('PENDING','REJECTED','VERIFIED') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`doctor_id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `hospital_id` (`hospital_id`),
  KEY `idx_doctor_specialty` (`specialty`),
  KEY `idx_doctor_verification` (`verification_status`),
  CONSTRAINT `doctors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `doctors_ibfk_2` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`hospital_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctors`
--

LOCK TABLES `doctors` WRITE;
/*!40000 ALTER TABLE `doctors` DISABLE KEYS */;
INSERT INTO `doctors` VALUES (1,2,1,'Dr. Rajesh Sharma','Cardiology','MBBS, MD (Medicine), DM (Cardiology)','KMC-DOC-48291','VERIFIED','2026-10-25 08:16:40','2026-10-25 08:16:40'),(2,3,2,'Dr. Priya Menon','General Medicine','MBBS, MD (Internal Medicine)','KMC-DOC-59302','VERIFIED','2026-10-25 08:16:40','2026-10-25 08:16:40'),(3,4,3,'Dr. Anita Nair','Neurology','MBBS, DM (Neurology)','KMC-DOC-61029','VERIFIED','2026-10-25 08:16:40','2026-10-25 09:27:09');
/*!40000 ALTER TABLE `doctors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `follow_ups`
--

DROP TABLE IF EXISTS `follow_ups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `follow_ups` (
  `follow_up_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `patient_id` bigint(20) NOT NULL,
  `doctor_id` bigint(20) NOT NULL,
  `appointment_id` bigint(20) DEFAULT NULL,
  `follow_up_date` date NOT NULL,
  `reason` text NOT NULL,
  `status` enum('ACKNOWLEDGED','CANCELLED','COMPLETED','UPCOMING') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`follow_up_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `appointment_id` (`appointment_id`),
  KEY `idx_followup_patient` (`patient_id`),
  CONSTRAINT `follow_ups_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE,
  CONSTRAINT `follow_ups_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`) ON DELETE CASCADE,
  CONSTRAINT `follow_ups_ibfk_3` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `follow_ups`
--

LOCK TABLES `follow_ups` WRITE;
/*!40000 ALTER TABLE `follow_ups` DISABLE KEYS */;
INSERT INTO `follow_ups` VALUES (1,1,1,1,'2026-11-09','Review lipid levels and evaluate dosage response','UPCOMING','2026-10-25 08:16:40','2026-10-25 08:16:40');
/*!40000 ALTER TABLE `follow_ups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hospitals`
--

DROP TABLE IF EXISTS `hospitals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `hospitals` (
  `hospital_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `address` varchar(255) NOT NULL,
  `city` varchar(100) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `digital_reports_supported` tinyint(1) DEFAULT 1,
  `application_booking_supported` tinyint(1) DEFAULT 1,
  `active_status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`hospital_id`),
  KEY `idx_hospital_city` (`city`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hospitals`
--

LOCK TABLES `hospitals` WRITE;
/*!40000 ALTER TABLE `hospitals` DISABLE KEYS */;
INSERT INTO `hospitals` VALUES (1,'Apollo Speciality Hospital','Seaport - Airport Road, Kakkanad','Kochi','+91 484 290 5000','NABH accredited multi-speciality tertiary care hospital specializing in cardiology, oncology, and advanced surgery.',1,1,1,'2026-10-25 08:16:40','2026-10-25 08:16:40'),(2,'City Care Hospital','College Road, Market Junction','Thiruvalla','+91 469 260 1200','Modern multi-speciality hospital with digital records and specialized departments for general medicine and pediatrics.',1,1,1,'2026-10-25 08:16:40','2026-10-25 08:16:40'),(3,'Metro General Hospital','Collectorate P.O., K.K. Road','Kottayam','+91 481 256 7890','Comprehensive regional hospital providing 24/7 emergency care, laboratory imaging, and outpatient consultation.',1,1,1,'2026-10-25 08:16:40','2026-10-25 08:16:40');
/*!40000 ALTER TABLE `hospitals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medicine_schedules`
--

DROP TABLE IF EXISTS `medicine_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `medicine_schedules` (
  `schedule_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `prescription_id` bigint(20) NOT NULL,
  `scheduled_date` date NOT NULL,
  `scheduled_time` time NOT NULL,
  `time_period` enum('AFTERNOON','BEDTIME','EVENING','MORNING') NOT NULL,
  `food_instruction` varchar(50) NOT NULL,
  `status` enum('MISSED','PENDING','TAKEN') NOT NULL,
  `status_updated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`schedule_id`),
  UNIQUE KEY `uq_medicine_slot` (`prescription_id`,`scheduled_date`,`time_period`),
  KEY `idx_schedule_date_status` (`scheduled_date`,`status`),
  CONSTRAINT `medicine_schedules_ibfk_1` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`prescription_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicine_schedules`
--

LOCK TABLES `medicine_schedules` WRITE;
/*!40000 ALTER TABLE `medicine_schedules` DISABLE KEYS */;
INSERT INTO `medicine_schedules` VALUES (1,1,'2026-10-25','08:30:00','MORNING','AFTER FOOD','TAKEN','2026-10-25 11:13:14','2026-10-25 08:16:40'),(2,1,'2026-10-25','20:30:00','EVENING','AFTER FOOD','PENDING',NULL,'2026-10-25 08:16:40');
/*!40000 ALTER TABLE `medicine_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `notification_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `notification_type` varchar(50) NOT NULL,
  `title` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`notification_id`),
  KEY `idx_notif_user_read` (`user_id`,`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,4,'VERIFICATION','Doctor Account Approved','Congratulations! Your doctor profile has been verified by the administrator.',0,'2026-10-25 09:27:09',NULL),(2,2,'SHARE','Patient Record Access Granted','Patient Deepak Biju (PT-2026-0001) has granted you access to their medical records.',0,'2026-10-25 09:33:40',NULL),(3,5,'SHARE','Sharing Code Redeemed','Dr. Dr. Rajesh Sharma has accessed your shared medical records.',0,'2026-10-25 09:33:40',NULL),(4,2,'SHARE','Record Access Revoked','Patient Deepak Biju has revoked medical record access.',0,'2026-10-25 09:33:40',NULL),(5,2,'SHARE','Patient Record Access Granted','Patient Deepak Biju (PT-2026-0001) has granted you access to their medical records.',0,'2026-10-25 11:13:20',NULL),(6,5,'SHARE','Sharing Code Redeemed','Dr. Dr. Rajesh Sharma has accessed your shared medical records.',0,'2026-10-25 11:13:20',NULL),(7,2,'SHARE','Record Access Revoked','Patient Deepak Biju has revoked medical record access.',0,'2026-10-25 11:13:20',NULL),(8,6,'SYSTEM','Welcome to Smart Patient!','Your centralized digital health account is ready. Your unique Patient ID is: PT-2026-2486',0,'2026-10-25 14:03:02',NULL),(9,6,'APPOINTMENT','Appointment Booked','Your appointment with Dr. Dr. Rajesh Sharma at Apollo Speciality Hospital on 2026-10-28 at 10:30 is confirmed. Token #1',0,'2026-10-25 14:03:02',NULL),(10,2,'APPOINTMENT','New Appointment Scheduled','Patient Aarav Pillai booked slot on 2026-10-28 at 10:30 (Token #1)',0,'2026-10-25 14:03:02',NULL),(11,7,'SYSTEM','Welcome to Smart Patient!','Your centralized digital health account is ready. Your unique Patient ID is: PT-2026-2234',0,'2026-10-25 14:04:26',NULL),(12,8,'SYSTEM','Welcome to Smart Patient!','Your centralized digital health account is ready. Your unique Patient ID is: PT-2026-4496',0,'2026-10-25 14:04:47',NULL),(13,9,'SYSTEM','Welcome to Smart Patient!','Your centralized digital health account is ready. Your unique Patient ID is: PT-2026-6201',0,'2026-10-25 14:05:01',NULL),(14,9,'APPOINTMENT','Appointment Booked','Your appointment with Dr. Dr. Rajesh Sharma at Apollo Speciality Hospital on 2026-10-29 at 09:00 is confirmed. Token #1',0,'2026-10-25 14:05:01',NULL),(15,2,'APPOINTMENT','New Appointment Scheduled','Patient Aarav Pillai booked slot on 2026-10-29 at 09:00 (Token #1)',0,'2026-10-25 14:05:01',NULL),(16,10,'SYSTEM','Welcome to Smart Patient!','Your centralized digital health account is ready. Your unique Patient ID is: PT-2026-2553',0,'2026-10-25 14:05:36',NULL),(17,10,'APPOINTMENT','Appointment Booked','Your appointment with Dr. Dr. Rajesh Sharma at Apollo Speciality Hospital on 2026-10-29 at 09:30 is confirmed. Token #2',0,'2026-10-25 14:05:36',NULL),(18,2,'APPOINTMENT','New Appointment Scheduled','Patient Aarav Pillai booked slot on 2026-10-29 at 09:30 (Token #2)',0,'2026-10-25 14:05:36',NULL),(19,11,'SYSTEM','Welcome to Smart Patient!','Your centralized digital health account is ready. Your unique Patient ID is: PT-2026-3634',0,'2026-10-29 15:24:48',NULL),(20,11,'APPOINTMENT','Appointment Booked','Your appointment with Dr. Rajesh Sharma at Apollo Speciality Hospital on 2026-11-05 at 10:00 is confirmed. Token #1',0,'2026-10-29 15:28:05',NULL),(21,2,'APPOINTMENT','New Appointment Scheduled','Patient John Doe booked slot on 2026-11-05 at 10:00 (Token #1)',0,'2026-10-29 15:28:05',NULL),(22,12,'SYSTEM','Welcome to Smart Patient!','Your centralized digital health account is ready. Your unique Patient ID is: PT-2026-2456',0,'2026-10-29 18:10:23',NULL),(23,12,'APPOINTMENT','Appointment Booked','Your appointment with Dr. Rajesh Sharma at Apollo Speciality Hospital on 2026-11-05 at 10:30 is confirmed. Token #2',0,'2026-10-29 18:12:20',NULL),(24,2,'APPOINTMENT','New Appointment Scheduled','Patient Kavya Nair booked slot on 2026-11-05 at 10:30 (Token #2)',0,'2026-10-29 18:12:20',NULL);
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patients`
--

DROP TABLE IF EXISTS `patients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `patients` (
  `patient_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `patient_code` varchar(30) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `date_of_birth` date NOT NULL,
  `phone` varchar(30) NOT NULL,
  `blood_group` varchar(10) DEFAULT NULL,
  `allergies` text DEFAULT NULL,
  `emergency_contact_name` varchar(150) DEFAULT NULL,
  `emergency_contact_phone` varchar(30) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`patient_id`),
  UNIQUE KEY `patient_code` (`patient_code`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `idx_patient_code` (`patient_code`),
  CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patients`
--

LOCK TABLES `patients` WRITE;
/*!40000 ALTER TABLE `patients` DISABLE KEYS */;
INSERT INTO `patients` VALUES (1,'PT-2026-0001',5,'Deepak Biju','2004-05-14','+91 98765 43210','O+','Penicillin, Dust mites','George Biju','+91 94471 23456','2026-10-25 08:16:40','2026-10-25 08:16:40'),(2,'PT-2026-2486',6,'Aarav Pillai','1998-07-15','+91 98471 1792956782','O+','None','Sunita Pillai','+91 94472 99887','2026-10-25 14:03:02','2026-10-25 14:03:02'),(3,'PT-2026-2234',7,'Aarav Pillai','1998-07-15','+91 98471 1792956866','O+','None','Sunita Pillai','+91 94472 99887','2026-10-25 14:04:26','2026-10-25 14:04:26'),(4,'PT-2026-4496',8,'Aarav Pillai','1998-07-15','+91 98471 1792956886','O+','None','Sunita Pillai','+91 94472 99887','2026-10-25 14:04:47','2026-10-25 14:04:47'),(5,'PT-2026-6201',9,'Aarav Pillai','1998-07-15','+91 98471 1792956901','O+','None','Sunita Pillai','+91 94472 99887','2026-10-25 14:05:01','2026-10-25 14:05:01'),(6,'PT-2026-2553',10,'Aarav Pillai','1998-07-15','+91 98471 1792956936','O+','None','Sunita Pillai','+91 94472 99887','2026-10-25 14:05:36','2026-10-25 14:05:36'),(7,'PT-2026-3634',11,'John Doe','2000-01-01','+91 99999 88888','B+','None','Family Member','+91 94000 00000','2026-10-29 15:24:48','2026-10-29 15:24:48'),(8,'PT-2026-2456',12,'Kavya Nair','1998-05-15','+91 94471 23456','A+','None','Family Member','+91 94000 00000','2026-10-29 18:10:23','2026-10-29 18:10:23');
/*!40000 ALTER TABLE `patients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prescriptions`
--

DROP TABLE IF EXISTS `prescriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `prescriptions` (
  `prescription_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `patient_id` bigint(20) NOT NULL,
  `doctor_id` bigint(20) NOT NULL,
  `appointment_id` bigint(20) DEFAULT NULL,
  `medicine` varchar(200) NOT NULL,
  `dosage` varchar(100) NOT NULL,
  `route` varchar(50) DEFAULT 'Oral',
  `frequency` varchar(100) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `food_instruction` enum('AFTER_FOOD','BEFORE_FOOD','NO_RESTRICTION','WITH_FOOD') NOT NULL,
  `additional_instructions` text DEFAULT NULL,
  `follow_up_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`prescription_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `appointment_id` (`appointment_id`),
  KEY `idx_prescription_patient` (`patient_id`),
  CONSTRAINT `prescriptions_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE,
  CONSTRAINT `prescriptions_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`) ON DELETE CASCADE,
  CONSTRAINT `prescriptions_ibfk_3` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescriptions`
--

LOCK TABLES `prescriptions` WRITE;
/*!40000 ALTER TABLE `prescriptions` DISABLE KEYS */;
INSERT INTO `prescriptions` VALUES (1,1,1,1,'Atorvastatin','20 mg','Oral','Once daily at bedtime','2026-10-10','2026-11-09','AFTER_FOOD','Take with water at bedtime. Maintain low sodium diet.','2026-11-09','2026-10-25 08:16:40','2026-10-25 08:16:40');
/*!40000 ALTER TABLE `prescriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `record_share_items`
--

DROP TABLE IF EXISTS `record_share_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `record_share_items` (
  `item_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `share_id` bigint(20) NOT NULL,
  `item_type` varchar(30) NOT NULL,
  `item_reference_id` bigint(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`item_id`),
  KEY `share_id` (`share_id`),
  CONSTRAINT `record_share_items_ibfk_1` FOREIGN KEY (`share_id`) REFERENCES `record_shares` (`share_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `record_share_items`
--

LOCK TABLES `record_share_items` WRITE;
/*!40000 ALTER TABLE `record_share_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `record_share_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `record_shares`
--

DROP TABLE IF EXISTS `record_shares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `record_shares` (
  `share_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `patient_id` bigint(20) NOT NULL,
  `doctor_id` bigint(20) DEFAULT NULL,
  `sharing_code` varchar(30) DEFAULT NULL,
  `sharing_code_hash` varchar(255) DEFAULT NULL,
  `category_scope` varchar(100) NOT NULL DEFAULT 'ALL',
  `status` enum('ACTIVE','EXPIRED','REVOKED') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `last_accessed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`share_id`),
  KEY `patient_id` (`patient_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `idx_sharing_code` (`sharing_code`),
  CONSTRAINT `record_shares_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE,
  CONSTRAINT `record_shares_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `record_shares`
--

LOCK TABLES `record_shares` WRITE;
/*!40000 ALTER TABLE `record_shares` DISABLE KEYS */;
INSERT INTO `record_shares` VALUES (1,1,1,'SH-48K2Q9','SH-48K2Q9','ALL','ACTIVE','2026-10-25 08:16:40','2026-11-08 13:46:40',NULL,NULL),(2,1,1,'SH-PVJHHZ','SH-PVJHHZ','LAB_REPORTS,PRESCRIPTIONS','REVOKED','2026-10-25 09:33:40','2026-10-26 15:03:40','2026-10-25 15:03:40','2026-10-25 15:03:40'),(3,1,1,'SH-E8E52A','SH-E8E52A','LAB_REPORTS,PRESCRIPTIONS','REVOKED','2026-10-25 11:13:20','2026-10-26 16:43:20','2026-10-25 16:43:20','2026-10-25 16:43:20');
/*!40000 ALTER TABLE `record_shares` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `report_comparisons`
--

DROP TABLE IF EXISTS `report_comparisons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `report_comparisons` (
  `comparison_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `patient_id` bigint(20) NOT NULL,
  `older_report_id` bigint(20) NOT NULL,
  `newer_report_id` bigint(20) NOT NULL,
  `comparison_title` varchar(255) NOT NULL,
  `summary` text DEFAULT NULL,
  `comparison_data_json` longtext NOT NULL,
  `disclaimer` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`comparison_id`),
  KEY `patient_id` (`patient_id`),
  KEY `older_report_id` (`older_report_id`),
  KEY `newer_report_id` (`newer_report_id`),
  CONSTRAINT `report_comparisons_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE,
  CONSTRAINT `report_comparisons_ibfk_2` FOREIGN KEY (`older_report_id`) REFERENCES `reports` (`report_id`) ON DELETE CASCADE,
  CONSTRAINT `report_comparisons_ibfk_3` FOREIGN KEY (`newer_report_id`) REFERENCES `reports` (`report_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `report_comparisons`
--

LOCK TABLES `report_comparisons` WRITE;
/*!40000 ALTER TABLE `report_comparisons` DISABLE KEYS */;
/*!40000 ALTER TABLE `report_comparisons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `report_values`
--

DROP TABLE IF EXISTS `report_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `report_values` (
  `value_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `report_id` bigint(20) NOT NULL,
  `test_name` varchar(150) NOT NULL,
  `normalized_test_key` varchar(100) NOT NULL,
  `numeric_value` decimal(10,3) NOT NULL,
  `unit` varchar(50) NOT NULL,
  `reference_range_min` decimal(10,3) DEFAULT NULL,
  `reference_range_max` decimal(10,3) DEFAULT NULL,
  `interpretation` varchar(100) DEFAULT NULL,
  `entered_by_user_id` bigint(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`value_id`),
  KEY `report_id` (`report_id`),
  KEY `entered_by_user_id` (`entered_by_user_id`),
  KEY `idx_test_key` (`normalized_test_key`),
  CONSTRAINT `report_values_ibfk_1` FOREIGN KEY (`report_id`) REFERENCES `reports` (`report_id`) ON DELETE CASCADE,
  CONSTRAINT `report_values_ibfk_2` FOREIGN KEY (`entered_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `report_values`
--

LOCK TABLES `report_values` WRITE;
/*!40000 ALTER TABLE `report_values` DISABLE KEYS */;
INSERT INTO `report_values` VALUES (1,1,'Total Cholesterol','TOTAL_CHOLESTEROL',225.000,'mg/dL',125.000,200.000,'High',2,'2026-10-25 08:16:40'),(2,1,'HDL Cholesterol','HDL_CHOLESTEROL',38.000,'mg/dL',40.000,60.000,'Low',2,'2026-10-25 08:16:40'),(3,1,'LDL Cholesterol','LDL_CHOLESTEROL',155.000,'mg/dL',50.000,100.000,'High',2,'2026-10-25 08:16:40'),(4,1,'Triglycerides','TRIGLYCERIDES',160.000,'mg/dL',50.000,150.000,'High',2,'2026-10-25 08:16:40'),(5,1,'Fasting Blood Sugar','FASTING_BLOOD_SUGAR',108.000,'mg/dL',70.000,100.000,'Borderline High',2,'2026-10-25 08:16:40'),(6,2,'Total Cholesterol','TOTAL_CHOLESTEROL',185.000,'mg/dL',125.000,200.000,'Normal',5,'2026-10-25 08:16:40'),(7,2,'HDL Cholesterol','HDL_CHOLESTEROL',45.000,'mg/dL',40.000,60.000,'Normal',5,'2026-10-25 08:16:40'),(8,2,'LDL Cholesterol','LDL_CHOLESTEROL',110.000,'mg/dL',50.000,100.000,'Borderline Normal',5,'2026-10-25 08:16:40'),(9,2,'Triglycerides','TRIGLYCERIDES',140.000,'mg/dL',50.000,150.000,'Normal',5,'2026-10-25 08:16:40'),(10,2,'Fasting Blood Sugar','FASTING_BLOOD_SUGAR',95.000,'mg/dL',70.000,100.000,'Normal',5,'2026-10-25 08:16:40');
/*!40000 ALTER TABLE `report_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reports` (
  `report_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `patient_id` bigint(20) NOT NULL,
  `uploaded_by_user_id` bigint(20) NOT NULL,
  `doctor_id` bigint(20) DEFAULT NULL,
  `appointment_id` bigint(20) DEFAULT NULL,
  `report_title` varchar(200) NOT NULL,
  `report_type` enum('LAB','SCAN','PRESCRIPTION','CERTIFICATE','OTHER') NOT NULL DEFAULT 'LAB',
  `report_date` date NOT NULL,
  `original_filename` varchar(255) NOT NULL,
  `storage_key` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `file_size` bigint(20) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`report_id`),
  KEY `uploaded_by_user_id` (`uploaded_by_user_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `appointment_id` (`appointment_id`),
  KEY `idx_report_patient` (`patient_id`),
  KEY `idx_report_type` (`report_type`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE,
  CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `reports_ibfk_3` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`) ON DELETE SET NULL,
  CONSTRAINT `reports_ibfk_4` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
INSERT INTO `reports` VALUES (1,1,2,1,NULL,'Comprehensive Lipid Profile - Initial Evaluation','LAB','2026-09-25','Initial_Lipid_Panel_Sep.pdf','sample-lipid-initial.pdf','application/pdf',148480,'Baseline fasting blood investigation prior to initiating lipid therapy.','2026-10-25 08:16:40',NULL),(2,1,5,1,NULL,'Follow-up Lipid Profile & Glycemic Review','LAB','2026-10-23','Followup_Lipid_Panel_Oct.pdf','sample-lipid-followup.pdf','application/pdf',161792,'Post-medication progress test demonstrating favorable reduction in cholesterol parameters.','2026-10-25 08:16:40',NULL),(3,6,10,NULL,NULL,'Baseline Lipid Profile Test','LAB','2026-10-26','tmpEAC4.pdf','2abfb490-f2f8-4126-a520-1c042179f278.pdf','application/pdf',50,'Synthetic baseline health test for verification','2026-10-25 14:05:36',NULL);
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `user_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('ADMIN','DOCTOR','PATIENT') NOT NULL,
  `account_status` enum('ACTIVE','DISABLED','PENDING_VERIFICATION','SUSPENDED') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_user_username` (`username`),
  KEY `idx_user_email` (`email`),
  KEY `idx_user_role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','admin@smartpatient.edu','$2a$10$sBhFMFNpcJ7/0Cozx8VqKO.X0vmykEOYOYvirntms0m8n.77xmKOC','ADMIN','ACTIVE','2026-10-25 08:16:40','2026-10-25 13:41:11','2026-10-25 13:41:11'),(2,'dr.sharma','dr.sharma@apollo.org','$2a$10$Yb6k7bsp4wLu1KXX.P5fze7xrJoTlyIjD2hxh36WdwBduo3ru5xxC','DOCTOR','ACTIVE','2026-10-25 08:16:40','2026-10-25 13:41:11','2026-10-25 13:41:11'),(3,'dr.priya','dr.priya@citycare.org','$2a$10$KEeAB9uGMEedw3MiiH2YEecwfqok4dy99ZlTWDH8uCTMngF9mhsXO','DOCTOR','ACTIVE','2026-10-25 08:16:40','2026-10-25 08:16:40',NULL),(4,'dr.anita','dr.anita@neurocare.org','$2a$10$.df6.cagpoy8TMFuVkaU6eall7Fz8N1Fod96VRGDqYYLpVzJR22MW','DOCTOR','ACTIVE','2026-10-25 08:16:40','2026-10-25 09:27:09',NULL),(5,'patient1','deepak.biju@student.edu','$2a$10$t0jnTsdc9p/ldygc5ioG9egoV/wIoXfi0vfyLs0f7gT1p8JjzzwFm','PATIENT','ACTIVE','2026-10-25 08:16:40','2026-10-25 14:05:36','2026-10-25 14:05:36'),(6,'test_patient_1792956782','test_1792956782@smartpatient.edu','$2a$10$z79y.dDTfSG43avw08iPfOuHoxKLjGcgePQhuQTO/rWB.onCQpJsW','PATIENT','ACTIVE','2026-10-25 14:03:02','2026-10-25 14:03:02',NULL),(7,'test_patient_1792956866','test_1792956866@smartpatient.edu','$2a$10$RM8io96I75FAnlE1R7.uQugXd3eXahGR4AlVsrKNE7AyQ/2aoUINO','PATIENT','ACTIVE','2026-10-25 14:04:26','2026-10-25 14:04:26',NULL),(8,'test_patient_1792956886','test_1792956886@smartpatient.edu','$2a$10$F3Dhq/du0WnSNJyCcmO/Pe3H4jF7JsuVHWaDwYI3o6.TR5r6D180m','PATIENT','ACTIVE','2026-10-25 14:04:47','2026-10-25 14:04:47',NULL),(9,'test_patient_1792956901','test_1792956901@smartpatient.edu','$2a$10$uuSMgTWn8feQ3aYWqD6hyOu7Sfkj6xBxkV5vUM2BJB4H2kIbH.7eO','PATIENT','ACTIVE','2026-10-25 14:05:01','2026-10-25 14:05:01',NULL),(10,'test_patient_1792956936','test_1792956936@smartpatient.edu','$2a$10$MnR6TOAe3NKppHUi73JDq.nfhz8rYp.eHhZmhL5lT.Tp5aoFsXX2e','PATIENT','ACTIVE','2026-10-25 14:05:36','2026-10-25 14:05:36',NULL),(11,'johndoe_8502','johndoe@test.com','$2a$10$zk3tfXfFfFTGTgc60HQnxuDJ.GvXwn6ntwz5A4BNYeGdTCjqkwQOu','PATIENT','ACTIVE','2026-10-29 15:24:48','2026-10-29 15:24:48','2026-10-29 15:28:05'),(12,'kavya.1793297423234_2958','kavya.1793297423234@test.edu','$2a$10$uiqbIQ0CYjmLmeZ8MPRAcOm/8CeuoDVVlgQwtz449y4a.l1OD0u9u','PATIENT','ACTIVE','2026-10-29 18:10:23','2026-10-29 18:10:23','2026-10-29 18:22:23');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-31  3:49:04
