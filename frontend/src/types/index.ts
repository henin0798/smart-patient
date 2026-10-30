export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED' | 'DISABLED';
export type AppointmentStatus = 'BOOKED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type ReportType = 'LAB' | 'SCAN' | 'PRESCRIPTION' | 'CERTIFICATE' | 'OTHER';
export type FoodInstruction = 'BEFORE_FOOD' | 'AFTER_FOOD' | 'WITH_FOOD' | 'NO_RESTRICTION';
export type TimePeriod = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'BEDTIME';
export type DoseStatus = 'PENDING' | 'TAKEN' | 'MISSED';
export type FollowUpStatus = 'UPCOMING' | 'ACKNOWLEDGED' | 'COMPLETED' | 'CANCELLED';
export type ShareStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface UserSummary {
  userId: number;
  username: string;
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
  fullName: string;
  patientCode?: string;
  entityId?: number;
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  specialty?: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  username: string;
  email: string;
  role: UserRole;
  fullName: string;
  patientCode?: string;
  entityId?: number;
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  specialty?: string;
}

export interface Hospital {
  hospitalId: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  description: string;
  digitalReportsSupported: boolean;
  applicationBookingSupported: boolean;
  activeStatus: boolean;
}

export interface Doctor {
  doctorId: number;
  fullName: string;
  specialty: string;
  qualification: string;
  licenseOrRegistrationReference: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  hospital?: Hospital;
}

export interface Patient {
  patientId: number;
  patientCode: string;
  fullName: string;
  dateOfBirth: string;
  phone: string;
  bloodGroup: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface Appointment {
  appointmentId: number;
  appointmentReference: string;
  patient: Patient;
  doctor: Doctor;
  hospital: Hospital;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  tokenNumber: number;
  reasonForVisit?: string;
  status: AppointmentStatus;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface ReportValue {
  valueId?: number;
  testName: string;
  normalizedTestKey: string;
  numericValue: number;
  unit: string;
  referenceRangeMin?: number;
  referenceRangeMax?: number;
  interpretation?: string;
}

export interface MedicalReport {
  reportId: number;
  reportTitle: string;
  reportType: ReportType;
  reportDate: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  doctor?: Doctor;
  reportValues?: ReportValue[];
  createdAt: string;
}

export interface ComparedMetric {
  testName: string;
  normalizedTestKey: string;
  unit: string;
  olderValue: number;
  newerValue: number;
  difference: number;
  percentageDifference?: number;
  trend: 'INCREASED' | 'DECREASED' | 'UNCHANGED';
  referenceRangeMin?: number;
  referenceRangeMax?: number;
  olderStatus: string;
  newerStatus: string;
}

export interface ReportComparisonResult {
  comparisonId?: number;
  olderReportId: number;
  olderReportTitle: string;
  olderReportDate: string;
  newerReportId: number;
  newerReportTitle: string;
  newerReportDate: string;
  summary?: string;
  increasedCount?: number;
  decreasedCount?: number;
  stableCount?: number;
  outOfRangeCount?: number;
  disclaimer: string;
  matchedMetrics: ComparedMetric[];
  olderOnlyMetrics: ReportValue[];
  newerOnlyMetrics: ReportValue[];
}

export interface SavedReportComparison {
  comparisonId: number;
  olderReportId: number;
  olderReportTitle: string;
  olderReportDate?: string;
  newerReportId: number;
  newerReportTitle: string;
  newerReportDate?: string;
  comparisonTitle: string;
  summary?: string;
  createdAt: string;
}

export interface Prescription {
  prescriptionId: number;
  medicine: string;
  dosage: string;
  route: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  foodInstruction: FoodInstruction;
  additionalInstructions?: string;
  followUpDate?: string;
  doctor: Doctor;
  patient: Patient;
  createdAt: string;
}

export interface MedicineSchedule {
  scheduleId: number;
  prescription: Prescription;
  scheduledDate: string;
  scheduledTime: string;
  timePeriod: TimePeriod;
  foodInstruction: string;
  status: DoseStatus;
  statusUpdatedAt?: string;
}

export interface FollowUp {
  followUpId: number;
  followUpDate: string;
  reason: string;
  status: FollowUpStatus;
  doctor: Doctor;
  patient: Patient;
}

export interface RecordShare {
  shareId: number;
  sharingCode?: string;
  categoryScope: string;
  status: ShareStatus;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
  lastAccessedAt?: string;
  patient: Patient;
  doctor?: Doctor;
}

export interface NotificationItem {
  notificationId: number;
  notificationType: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface PatientDashboardSummary {
  patientCode: string;
  patientName: string;
  todayDate: string;
  upcomingAppointmentId?: number;
  upcomingAppointmentDoctor?: string;
  upcomingAppointmentSpecialty?: string;
  upcomingAppointmentHospital?: string;
  upcomingAppointmentDateTime?: string;
  upcomingAppointmentReference?: string;
  latestReportId?: number;
  latestReportTitle?: string;
  latestReportType?: string;
  latestReportDate?: string;
  totalDosesToday: number;
  takenDosesToday: number;
  missedDosesToday: number;
  pendingDosesToday: number;
  nextFollowUpId?: number;
  nextFollowUpDoctor?: string;
  nextFollowUpDate?: string;
  nextFollowUpReason?: string;
}

export interface PatientTimelineEvent {
  id: string;
  eventType: string;
  title: string;
  description: string;
  timestamp: string;
  badgeType: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

export interface AdminStats {
  totalPatients: number;
  totalDoctors: number;
  totalHospitals: number;
  pendingDoctorVerifications: number;
  totalAppointments: number;
  totalReports: number;
}

export interface AdminUser {
  userId: number;
  username: string;
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface AuditLog {
  auditId: number;
  actorUserId?: number;
  actionType: string;
  resourceType: string;
  resourceId?: string;
  timestamp: string;
  outcome: string;
  metadata?: string;
}
