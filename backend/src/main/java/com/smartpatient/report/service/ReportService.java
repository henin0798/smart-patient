package com.smartpatient.report.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpatient.appointment.entity.Appointment;
import com.smartpatient.appointment.repository.AppointmentRepository;
import com.smartpatient.audit.service.AuditService;
import com.smartpatient.common.exception.AccessDeniedException;
import com.smartpatient.common.exception.BadRequestException;
import com.smartpatient.common.exception.ResourceNotFoundException;
import com.smartpatient.doctor.entity.Doctor;
import com.smartpatient.doctor.repository.DoctorRepository;
import com.smartpatient.notification.service.NotificationService;
import com.smartpatient.patient.entity.Patient;
import com.smartpatient.patient.repository.PatientRepository;
import com.smartpatient.report.dto.ReportComparisonRequest;
import com.smartpatient.report.dto.ReportComparisonResultDto;
import com.smartpatient.report.dto.ReportValueDto;
import com.smartpatient.report.entity.Report;
import com.smartpatient.report.entity.ReportComparison;
import com.smartpatient.report.entity.ReportType;
import com.smartpatient.report.entity.ReportValue;
import com.smartpatient.report.repository.ReportComparisonRepository;
import com.smartpatient.report.repository.ReportRepository;
import com.smartpatient.report.repository.ReportValueRepository;
import com.smartpatient.sharing.entity.RecordShare;
import com.smartpatient.sharing.repository.RecordShareRepository;
import com.smartpatient.user.entity.User;
import com.smartpatient.user.entity.UserRole;
import com.smartpatient.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final ReportValueRepository reportValueRepository;
    private final ReportComparisonRepository reportComparisonRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final RecordShareRepository recordShareRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;
    private final Path storageDirectory;

    public ReportService(
            ReportRepository reportRepository,
            ReportValueRepository reportValueRepository,
            ReportComparisonRepository reportComparisonRepository,
            PatientRepository patientRepository,
            DoctorRepository doctorRepository,
            AppointmentRepository appointmentRepository,
            RecordShareRepository recordShareRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            AuditService auditService,
            ObjectMapper objectMapper,
            @Value("${app.storage.upload-dir:./storage/uploads}") String uploadDir) {
        this.reportRepository = reportRepository;
        this.reportValueRepository = reportValueRepository;
        this.reportComparisonRepository = reportComparisonRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.recordShareRepository = recordShareRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
        this.storageDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.storageDirectory);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create private upload directory at: " + uploadDir, ex);
        }
    }

    @Transactional
    public Report uploadReport(Long userId, MultipartFile file, String reportTitle, ReportType reportType,
                               LocalDate reportDate, Long targetPatientId, Long doctorId, Long appointmentId,
                               String description, List<ReportValueDto> structuredValues) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please select a file to upload.");
        }

        User uploader = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // Determine patient
        Patient patient;
        if (targetPatientId != null) {
            patient = patientRepository.findById(targetPatientId)
                    .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + targetPatientId));
        } else {
            patient = patientRepository.findByUser_UserId(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for user: " + userId));
        }

        Doctor doctor = null;
        if (doctorId != null) {
            doctor = doctorRepository.findById(doctorId).orElse(null);
        }

        Appointment appointment = null;
        if (appointmentId != null) {
            appointment = appointmentRepository.findById(appointmentId).orElse(null);
        }

        // Validate file extension and MIME type
        String originalFilename = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        String lowerName = originalFilename.toLowerCase();
        if (!lowerName.endsWith(".pdf") && !lowerName.endsWith(".png") && !lowerName.endsWith(".jpg") && !lowerName.endsWith(".jpeg")) {
            throw new BadRequestException("Invalid file format. Allowed formats: PDF, PNG, JPEG.");
        }

        // Max 15MB
        if (file.getSize() > 15 * 1024 * 1024) {
            throw new BadRequestException("File size exceeds 15 MB limit.");
        }

        // Save file privately
        String storageKey = UUID.randomUUID() + "_" + originalFilename;
        Path targetPath = this.storageDirectory.resolve(storageKey);

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new RuntimeException("Failed to securely store report file.", ex);
        }

        Report report = new Report(
                patient,
                uploader,
                doctor,
                appointment,
                reportTitle,
                reportType,
                reportDate,
                originalFilename,
                storageKey,
                file.getContentType(),
                file.getSize(),
                description
        );

        Report savedReport = reportRepository.save(report);

        // Save structured test values if supplied
        if (structuredValues != null && !structuredValues.isEmpty()) {
            for (ReportValueDto dto : structuredValues) {
                if (dto.getTestName() != null && !dto.getTestName().trim().isEmpty() && dto.getNumericValue() != null) {
                    ReportValue val = new ReportValue(
                            savedReport,
                            dto.getTestName().trim(),
                            dto.getNormalizedTestKey() != null ? dto.getNormalizedTestKey() : dto.getTestName().trim().toUpperCase().replace(" ", "_"),
                            dto.getNumericValue(),
                            dto.getUnit(),
                            dto.getReferenceRangeMin(),
                            dto.getReferenceRangeMax(),
                            dto.getInterpretation(),
                            uploader
                    );
                    reportValueRepository.save(val);
                }
            }
        }

        // Notification
        notificationService.createNotification(
                patient.getUser(),
                "REPORT",
                "New Medical Document Uploaded",
                "Document '" + reportTitle + "' (" + reportType.name() + ") has been uploaded."
        );

        auditService.log(userId, "UPLOAD_REPORT", "REPORT", savedReport.getReportId().toString(), "SUCCESS", "Uploaded: " + originalFilename);

        return savedReport;
    }

    @Transactional(readOnly = true)
    public List<Report> getPatientReports(Long userId, ReportType type) {
        Patient patient = patientRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for user: " + userId));

        if (type != null) {
            return reportRepository.findByPatient_PatientIdAndReportTypeAndDeletedAtIsNullOrderByReportDateDesc(patient.getPatientId(), type);
        }
        return reportRepository.findByPatient_PatientIdAndDeletedAtIsNullOrderByReportDateDesc(patient.getPatientId());
    }

    @Transactional(readOnly = true)
    public List<Report> searchPatientReports(Long userId, ReportType type, String search) {
        Patient patient = patientRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for user: " + userId));

        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        return reportRepository.searchReports(patient.getPatientId(), type, cleanSearch);
    }

    @Transactional(readOnly = true)
    public Report getReportById(Long reportId) {
        return reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));
    }

    @Transactional(readOnly = true)
    public Resource loadReportFileAsResource(Long reportId, Long userId) {
        Report report = getReportById(reportId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // Authorization check: patient themselves, or authorized doctor, or uploader, or admin
        boolean authorized = false;

        if (report.getPatient().getUser().getUserId().equals(userId)) {
            authorized = true;
        } else if (report.getUploadedByUser() != null && report.getUploadedByUser().getUserId().equals(userId)) {
            authorized = true;
        } else if (user.getRole() == UserRole.ADMIN) {
            authorized = true;
        } else if (user.getRole() == UserRole.DOCTOR) {
            Doctor doctor = doctorRepository.findByUser_UserId(userId).orElse(null);
            if (doctor != null) {
                // Check active share authorization
                List<RecordShare> shares = recordShareRepository.findActiveSharesForDoctorAndPatient(
                        doctor.getDoctorId(), report.getPatient().getPatientId(), LocalDateTime.now());
                if (!shares.isEmpty()) {
                    authorized = true;
                }
            }
        }

        if (!authorized) {
            auditService.log(userId, "DOWNLOAD_REPORT", "REPORT", reportId.toString(), "DENIED", "Unauthorized download attempt");
            throw new AccessDeniedException("You are not authorized to download or view this medical report.");
        }

        try {
            Path filePath = this.storageDirectory.resolve(report.getStorageKey()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                auditService.log(userId, "DOWNLOAD_REPORT", "REPORT", reportId.toString(), "SUCCESS", "File downloaded: " + report.getOriginalFilename());
                return resource;
            } else {
                throw new ResourceNotFoundException("Report file could not be found on disk.");
            }
        } catch (Exception ex) {
            throw new ResourceNotFoundException("Error loading report file: " + ex.getMessage());
        }
    }

    @Transactional
    public ReportComparisonResultDto compareReports(Long userId, ReportComparisonRequest request) {
        Patient patient = patientRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found."));

        Report older = getReportById(request.getOlderReportId());
        Report newer = getReportById(request.getNewerReportId());

        // Validate ownership
        if (!older.getPatient().getPatientId().equals(patient.getPatientId()) ||
            !newer.getPatient().getPatientId().equals(patient.getPatientId())) {
            throw new AccessDeniedException("You can only compare reports belonging to your own medical records.");
        }

        // Ensure chronological order
        if (older.getReportDate().isAfter(newer.getReportDate())) {
            Report temp = older;
            older = newer;
            newer = temp;
        }

        ReportComparisonResultDto result = new ReportComparisonResultDto();
        result.setOlderReportId(older.getReportId());
        result.setOlderReportTitle(older.getReportTitle());
        result.setOlderReportDate(older.getReportDate());
        result.setNewerReportId(newer.getReportId());
        result.setNewerReportTitle(newer.getReportTitle());
        result.setNewerReportDate(newer.getReportDate());

        List<ReportValue> olderValues = reportValueRepository.findByReport_ReportId(older.getReportId());
        List<ReportValue> newerValues = reportValueRepository.findByReport_ReportId(newer.getReportId());

        Map<String, ReportValue> newerMap = new HashMap<>();
        for (ReportValue nv : newerValues) {
            newerMap.put(nv.getNormalizedTestKey(), nv);
        }

        Set<String> matchedKeys = new HashSet<>();

        for (ReportValue ov : olderValues) {
            String key = ov.getNormalizedTestKey();
            if (newerMap.containsKey(key)) {
                matchedKeys.add(key);
                ReportValue nv = newerMap.get(key);

                ReportComparisonResultDto.ComparedTestMetric metric = new ReportComparisonResultDto.ComparedTestMetric();
                metric.setTestName(ov.getTestName());
                metric.setNormalizedTestKey(key);
                metric.setUnit(ov.getUnit());
                metric.setOlderValue(ov.getNumericValue());
                metric.setNewerValue(nv.getNumericValue());

                BigDecimal diff = nv.getNumericValue().subtract(ov.getNumericValue());
                metric.setDifference(diff);

                if (ov.getNumericValue().compareTo(BigDecimal.ZERO) != 0) {
                    BigDecimal pct = diff.divide(ov.getNumericValue(), 4, RoundingMode.HALF_UP).multiply(new BigDecimal(100)).setScale(2, RoundingMode.HALF_UP);
                    metric.setPercentageDifference(pct);
                }

                if (diff.compareTo(BigDecimal.ZERO) > 0) {
                    metric.setTrend("INCREASED");
                } else if (diff.compareTo(BigDecimal.ZERO) < 0) {
                    metric.setTrend("DECREASED");
                } else {
                    metric.setTrend("UNCHANGED");
                }

                metric.setReferenceRangeMin(nv.getReferenceRangeMin() != null ? nv.getReferenceRangeMin() : ov.getReferenceRangeMin());
                metric.setReferenceRangeMax(nv.getReferenceRangeMax() != null ? nv.getReferenceRangeMax() : ov.getReferenceRangeMax());

                metric.setOlderStatus(calculateRangeStatus(ov.getNumericValue(), metric.getReferenceRangeMin(), metric.getReferenceRangeMax()));
                metric.setNewerStatus(calculateRangeStatus(nv.getNumericValue(), metric.getReferenceRangeMin(), metric.getReferenceRangeMax()));

                result.getMatchedMetrics().add(metric);
            } else {
                result.getOlderOnlyMetrics().add(toDto(ov));
            }
        }

        for (ReportValue nv : newerValues) {
            if (!matchedKeys.contains(nv.getNormalizedTestKey())) {
                result.getNewerOnlyMetrics().add(toDto(nv));
            }
        }

        // Calculate structured analytics counts
        int inc = 0;
        int dec = 0;
        int stbl = 0;
        int oor = 0;

        for (ReportComparisonResultDto.ComparedTestMetric m : result.getMatchedMetrics()) {
            if ("INCREASED".equals(m.getTrend())) inc++;
            else if ("DECREASED".equals(m.getTrend())) dec++;
            else stbl++;

            if ("HIGH".equals(m.getNewerStatus()) || "LOW".equals(m.getNewerStatus())) {
                oor++;
            }
        }

        result.setIncreasedCount(inc);
        result.setDecreasedCount(dec);
        result.setStableCount(stbl);
        result.setOutOfRangeCount(oor);

        String summary = String.format("Longitudinal comparison between %s (%s) and %s (%s). Evaluated %d matching biomarkers: %d increased, %d decreased, %d stable, with %d value(s) outside reference thresholds.",
                older.getReportTitle(), older.getReportDate(), newer.getReportTitle(), newer.getReportDate(),
                result.getMatchedMetrics().size(), inc, dec, stbl, oor);
        result.setSummary(summary);

        // Persist to database so comparison history is permanently stored
        try {
            String json = objectMapper.writeValueAsString(result);
            String title = older.getReportTitle() + " vs " + newer.getReportTitle();
            ReportComparison comparison = new ReportComparison(
                    patient, older, newer, title, summary, json, result.getDisclaimer()
            );
            ReportComparison saved = reportComparisonRepository.save(comparison);
            result.setComparisonId(saved.getComparisonId());
        } catch (Exception e) {
            // Keep going even if serialization fails
        }

        auditService.log(userId, "COMPARE_REPORTS", "REPORT", older.getReportId() + "-" + newer.getReportId(), "SUCCESS", "Comparison generated");
        return result;
    }

    @Transactional(readOnly = true)
    public List<ReportComparison> getPatientComparisons(Long userId) {
        return reportComparisonRepository.findByPatient_User_UserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public ReportComparison getComparisonById(Long comparisonId, Long userId) {
        ReportComparison comp = reportComparisonRepository.findById(comparisonId)
                .orElseThrow(() -> new ResourceNotFoundException("Comparison not found with id: " + comparisonId));
        if (!comp.getPatient().getUser().getUserId().equals(userId)) {
            throw new AccessDeniedException("You are not authorized to view this comparison.");
        }
        return comp;
    }

    @Transactional
    public void deleteComparison(Long comparisonId, Long userId) {
        ReportComparison comp = getComparisonById(comparisonId, userId);
        reportComparisonRepository.delete(comp);
        auditService.log(userId, "DELETE_COMPARISON", "REPORT_COMPARISON", comparisonId.toString(), "SUCCESS", "Comparison deleted");
    }

    @Transactional
    public void deleteReport(Long reportId, Long userId) {
        Report report = getReportById(reportId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        boolean canDelete = report.getPatient().getUser().getUserId().equals(userId)
                || (report.getUploadedByUser() != null && report.getUploadedByUser().getUserId().equals(userId))
                || user.getRole() == UserRole.ADMIN;

        if (!canDelete) {
            throw new AccessDeniedException("You are not authorized to delete this medical report.");
        }

        reportValueRepository.deleteByReport_ReportId(reportId);
        reportRepository.delete(report);

        try {
            Path filePath = this.storageDirectory.resolve(report.getStorageKey()).normalize();
            Files.deleteIfExists(filePath);
        } catch (Exception ignored) {}

        auditService.log(userId, "DELETE_REPORT", "REPORT", reportId.toString(), "SUCCESS", "Report deleted: " + report.getReportTitle());
    }

    private String calculateRangeStatus(BigDecimal val, BigDecimal min, BigDecimal max) {
        if (val == null) return "UNSPECIFIED";
        if (min != null && val.compareTo(min) < 0) return "LOW";
        if (max != null && val.compareTo(max) > 0) return "HIGH";
        if (min != null || max != null) return "NORMAL";
        return "UNSPECIFIED";
    }

    private ReportValueDto toDto(ReportValue rv) {
        ReportValueDto dto = new ReportValueDto();
        dto.setValueId(rv.getValueId());
        dto.setTestName(rv.getTestName());
        dto.setNormalizedTestKey(rv.getNormalizedTestKey());
        dto.setNumericValue(rv.getNumericValue());
        dto.setUnit(rv.getUnit());
        dto.setReferenceRangeMin(rv.getReferenceRangeMin());
        dto.setReferenceRangeMax(rv.getReferenceRangeMax());
        dto.setInterpretation(rv.getInterpretation());
        return dto;
    }
}
