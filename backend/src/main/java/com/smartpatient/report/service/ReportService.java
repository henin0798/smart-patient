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
import java.time.format.DateTimeFormatter;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
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
        if (!lowerName.endsWith(".pdf") && !lowerName.endsWith(".png") && !lowerName.endsWith(".jpg") && !lowerName.endsWith(".jpeg") && !lowerName.endsWith(".txt")) {
            throw new BadRequestException("Invalid file format. Allowed formats: PDF, PNG, JPEG, TXT.");
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

        // Auto-extract structured test values from file if none supplied
        if (structuredValues == null || structuredValues.isEmpty()) {
            try {
                byte[] bytes = Files.readAllBytes(targetPath);
                String textContent = new String(bytes, java.nio.charset.StandardCharsets.ISO_8859_1);
                structuredValues = extractValuesFromText(textContent);
            } catch (Exception ignored) {}
        }

        // Save structured test values if supplied or extracted
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

        // Ensure chronological order (older date first; if dates match, break tie by reportId)
        if (older.getReportDate().isAfter(newer.getReportDate()) ||
            (older.getReportDate().isEqual(newer.getReportDate()) && older.getReportId() > newer.getReportId())) {
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
        result.setReportType(newer.getReportType() != null ? newer.getReportType().name() : "LAB");

        List<ReportValue> olderValues = reportValueRepository.findByReport_ReportId(older.getReportId());
        List<ReportValue> newerValues = reportValueRepository.findByReport_ReportId(newer.getReportId());

        if (olderValues.isEmpty()) {
            olderValues = tryExtractAndSaveValues(older, patient.getUser());
        }
        if (newerValues.isEmpty()) {
            newerValues = tryExtractAndSaveValues(newer, patient.getUser());
        }

        // Index newer values by canonicalized biomarker key
        Map<String, ReportValue> newerMap = new LinkedHashMap<>();
        for (ReportValue nv : newerValues) {
            String cKey = canonicalizeBiomarkerKey(nv.getNormalizedTestKey(), nv.getTestName());
            newerMap.put(cKey, nv);
        }

        Set<String> matchedKeys = new HashSet<>();

        for (ReportValue ov : olderValues) {
            String ovKey = canonicalizeBiomarkerKey(ov.getNormalizedTestKey(), ov.getTestName());
            if (newerMap.containsKey(ovKey)) {
                ReportValue nv = newerMap.get(ovKey);
                if (areUnitsCompatible(ov.getUnit(), nv.getUnit())) {
                    matchedKeys.add(ovKey);

                    ReportComparisonResultDto.ComparedTestMetric metric = new ReportComparisonResultDto.ComparedTestMetric();
                    metric.setTestName(ov.getTestName());
                    metric.setNormalizedTestKey(ovKey);
                    String unit = (nv.getUnit() != null && !nv.getUnit().trim().isEmpty()) ? nv.getUnit().trim() : (ov.getUnit() != null ? ov.getUnit().trim() : "");
                    metric.setUnit(unit);
                    metric.setOlderValue(stripZeros(ov.getNumericValue()));
                    metric.setNewerValue(stripZeros(nv.getNumericValue()));

                    BigDecimal diff = nv.getNumericValue().subtract(ov.getNumericValue());
                    metric.setDifference(stripZeros(diff));

                    if (ov.getNumericValue() != null && ov.getNumericValue().compareTo(BigDecimal.ZERO) != 0) {
                        BigDecimal pct = diff.divide(ov.getNumericValue(), 4, RoundingMode.HALF_UP)
                                .multiply(new BigDecimal(100))
                                .setScale(2, RoundingMode.HALF_UP);
                        metric.setPercentageDifference(pct);
                        metric.setPercentageDifferenceString((pct.compareTo(BigDecimal.ZERO) > 0 ? "+" : "") + pct + "%");
                    } else {
                        metric.setPercentageDifference(null);
                        metric.setPercentageDifferenceString("N/A");
                    }

                    if (diff.compareTo(BigDecimal.ZERO) > 0) {
                        metric.setTrend("INCREASED");
                    } else if (diff.compareTo(BigDecimal.ZERO) < 0) {
                        metric.setTrend("DECREASED");
                    } else {
                        metric.setTrend("UNCHANGED");
                    }

                    metric.setReferenceRangeMin(stripZeros(nv.getReferenceRangeMin() != null ? nv.getReferenceRangeMin() : ov.getReferenceRangeMin()));
                    metric.setReferenceRangeMax(stripZeros(nv.getReferenceRangeMax() != null ? nv.getReferenceRangeMax() : ov.getReferenceRangeMax()));

                    String oldStatus = calculateRangeStatus(ov.getNumericValue(), metric.getReferenceRangeMin(), metric.getReferenceRangeMax());
                    String newStatus = calculateRangeStatus(nv.getNumericValue(), metric.getReferenceRangeMin(), metric.getReferenceRangeMax());
                    metric.setOlderStatus(oldStatus);
                    metric.setNewerStatus(newStatus);
                    metric.setStatusTransition(oldStatus + " → " + newStatus);
                    metric.setOutOfRange(!"NORMAL".equals(newStatus) && !"UNSPECIFIED".equals(newStatus));

                    result.getMatchedMetrics().add(metric);
                    continue;
                }
            }
            result.getOlderOnlyMetrics().add(toDto(ov));
        }

        for (ReportValue nv : newerValues) {
            String nvKey = canonicalizeBiomarkerKey(nv.getNormalizedTestKey(), nv.getTestName());
            if (!matchedKeys.contains(nvKey)) {
                result.getNewerOnlyMetrics().add(toDto(nv));
            }
        }

        if (result.getMatchedMetrics().isEmpty()) {
            result.setHasComparableData(false);
            result.setIncreasedCount(null);
            result.setDecreasedCount(null);
            result.setStableCount(null);
            result.setOutOfRangeCount(null);
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMMM d, yyyy", Locale.ENGLISH);
            String olderDateStr = older.getReportDate() != null ? older.getReportDate().format(dtf) : "Baseline";
            String newerDateStr = newer.getReportDate() != null ? newer.getReportDate().format(dtf) : "Follow-up";
            String noDataMsg = String.format("No matching laboratory test parameters could be compared between '%s' (%s) and '%s' (%s).\n\nWhy this happens:\n• One or both documents might be diagnostic imaging (such as an X-ray, MRI, or Ultrasound), a prescription, or a non-laboratory document.\n• The two reports measure different test panels (for example, comparing a Lipid Profile with a Liver Function Test).\n• No readable numeric laboratory test values were provided or extracted during upload.\n\nTo view a comparison, please ensure both selected documents are laboratory blood tests containing matching test parameters (such as Hemoglobin, Blood Sugar, or Lipid Profile).\n\nNote: This tool tracks recorded values only. It does not predict future clinical trajectory, claim a result will become normal, or provide a medical diagnosis.",
                    older.getReportTitle(), olderDateStr, newer.getReportTitle(), newerDateStr);
            result.setSummary(noDataMsg);
            result.setDetailedDescription(noDataMsg);
        } else {
            result.setHasComparableData(true);
            int inc = 0;
            int dec = 0;
            int stbl = 0;
            int oor = 0;

            for (ReportComparisonResultDto.ComparedTestMetric m : result.getMatchedMetrics()) {
                if ("INCREASED".equals(m.getTrend())) inc++;
                else if ("DECREASED".equals(m.getTrend())) dec++;
                else stbl++;

                if (m.isOutOfRange()) {
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

            String detailedDesc = generateDetailedDescription(older, newer, result);
            result.setDetailedDescription(detailedDesc);
        }

        // Persist to database so comparison history is permanently stored
        try {
            String json = objectMapper.writeValueAsString(result);
            String title = older.getReportTitle() + " vs " + newer.getReportTitle();
            ReportComparison comparison = new ReportComparison(
                    patient, older, newer, title, result.getSummary(), json, result.getDisclaimer()
            );
            ReportComparison saved = reportComparisonRepository.save(comparison);
            result.setComparisonId(saved.getComparisonId());
        } catch (Exception ignored) {
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

    @Transactional(readOnly = true)
    public ReportComparisonResultDto getComparisonResultById(Long comparisonId, Long userId) {
        ReportComparison comp = getComparisonById(comparisonId, userId);
        try {
            if (comp.getComparisonDataJson() != null && !comp.getComparisonDataJson().trim().isEmpty()) {
                ReportComparisonResultDto result = objectMapper.readValue(comp.getComparisonDataJson(), ReportComparisonResultDto.class);
                result.setComparisonId(comp.getComparisonId());
                if (result.getMatchedMetrics() != null && !result.getMatchedMetrics().isEmpty()) {
                    if (result.getDetailedDescription() == null) {
                        result.setDetailedDescription(generateDetailedDescription(comp.getOlderReport(), comp.getNewerReport(), result));
                    }
                    return result;
                }
            }
        } catch (Exception ignored) {}

        // Fallback / dynamic recomputation: guarantees complete table rows and description if reports contain data!
        ReportComparisonRequest req = new ReportComparisonRequest();
        req.setOlderReportId(comp.getOlderReport().getReportId());
        req.setNewerReportId(comp.getNewerReport().getReportId());
        ReportComparisonResultDto fresh = compareReports(userId, req);
        fresh.setComparisonId(comp.getComparisonId());
        return fresh;
    }

    public static String canonicalizeBiomarkerKey(String rawKey, String testName) {
        String base = (rawKey != null && !rawKey.trim().isEmpty()) ? rawKey : (testName != null ? testName : "");
        base = base.toUpperCase().trim();
        base = base.replaceAll("[^A-Z0-9]+", " ").trim();
        String[] tokens = base.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String t : tokens) {
            if (t.equals("SERUM") || t.equals("BLOOD") || t.equals("PLASMA") ||
                t.equals("LEVEL") || t.equals("LEVELS") || t.equals("TEST") ||
                t.equals("PANEL") || t.equals("ASSAY") || t.equals("TOTAL") ||
                t.equals("ESTIMATED") || t.equals("FASTING") || t.equals("FRACTION")) {
                continue;
            }
            if (sb.length() > 0) sb.append("_");
            sb.append(t);
        }
        String cleaned = sb.toString();
        if (cleaned.isEmpty()) {
            cleaned = base.replace(" ", "_");
        }

        if (cleaned.contains("CHOLESTEROL") && !cleaned.contains("HDL") && !cleaned.contains("LDL") && !cleaned.contains("VLDL")) {
            return "CHOLESTEROL_TOTAL";
        }
        if (cleaned.equals("CHOL")) return "CHOLESTEROL_TOTAL";
        if (cleaned.contains("HDL")) return "HDL_CHOLESTEROL";
        if (cleaned.contains("LDL")) return "LDL_CHOLESTEROL";
        if (cleaned.contains("VLDL")) return "VLDL_CHOLESTEROL";
        if (cleaned.contains("TRIGLYCERIDE") || cleaned.equals("TG") || cleaned.equals("TRIG")) return "TRIGLYCERIDES";
        if (cleaned.contains("GLUCOSE") || cleaned.contains("SUGAR") || cleaned.equals("FBS")) return "FASTING_GLUCOSE";
        if (cleaned.contains("HBA1C") || cleaned.contains("A1C") || cleaned.contains("GLYCATED")) return "HBA1C";
        if (cleaned.equals("HB") || cleaned.equals("HGB") || cleaned.contains("HEMOGLOBIN")) return "HEMOGLOBIN";
        if (cleaned.equals("WBC") || cleaned.contains("LEUKOCYTE") || cleaned.equals("TLC")) return "WBC";
        if (cleaned.equals("RBC") || cleaned.contains("ERYTHROCYTE")) return "RBC";
        if (cleaned.contains("PLATELET") || cleaned.equals("PLT")) return "PLATELETS";
        if (cleaned.contains("CREATININE")) return "CREATININE";
        if (cleaned.contains("UREA") || cleaned.equals("BUN")) return "BUN";
        if (cleaned.contains("URIC")) return "URIC_ACID";
        if (cleaned.contains("BILIRUBIN") && cleaned.contains("DIRECT")) return "BILIRUBIN_DIRECT";
        if (cleaned.contains("BILIRUBIN")) return "BILIRUBIN_TOTAL";
        if (cleaned.equals("SGOT") || cleaned.equals("AST") || cleaned.contains("ASPARTATE")) return "AST";
        if (cleaned.equals("SGPT") || cleaned.equals("ALT") || cleaned.contains("ALANINE")) return "ALT";
        if (cleaned.equals("ALP") || cleaned.contains("ALKALINE")) return "ALP";
        if (cleaned.contains("TSH") || cleaned.contains("THYROTROPIN")) return "TSH";
        if (cleaned.equals("FT3") || cleaned.contains("FREE_T3")) return "FREE_T3";
        if (cleaned.equals("FT4") || cleaned.contains("FREE_T4")) return "FREE_T4";
        if (cleaned.contains("VITAMIN_D") || cleaned.contains("25_OH")) return "VITAMIN_D";
        if (cleaned.contains("VITAMIN_B12") || cleaned.contains("B12") || cleaned.contains("COBALAMIN")) return "VITAMIN_B12";

        return cleaned;
    }

    public static boolean areUnitsCompatible(String u1, String u2) {
        if (u1 == null || u2 == null || u1.trim().isEmpty() || u2.trim().isEmpty()) {
            return true;
        }
        String clean1 = u1.trim().toLowerCase().replaceAll("\\s+", "");
        String clean2 = u2.trim().toLowerCase().replaceAll("\\s+", "");
        return clean1.equals(clean2);
    }


    private BigDecimal stripZeros(BigDecimal val) {
        if (val == null) return null;
        return val.stripTrailingZeros();
    }

    private String formatNum(BigDecimal val) {
        if (val == null) return "";
        return val.stripTrailingZeros().toPlainString();
    }

    private String generateDetailedDescription(Report older, Report newer, ReportComparisonResultDto result) {
        StringBuilder sb = new StringBuilder();
        int total = result.getMatchedMetrics().size();

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMMM d, yyyy", Locale.ENGLISH);
        String formattedOlderDate = older.getReportDate() != null ? older.getReportDate().format(dtf) : "Baseline Date";
        String formattedNewerDate = newer.getReportDate() != null ? newer.getReportDate().format(dtf) : "Follow-up Date";

        sb.append(String.format("Longitudinal comparison between your baseline report '%s' (%s) and follow-up report '%s' (%s). A total of %d matching laboratory %s evaluated:\n\n",
                older.getReportTitle(), formattedOlderDate,
                newer.getReportTitle(), formattedNewerDate,
                total, total == 1 ? "parameter was" : "parameters were"));

        List<String> plainSentences = new ArrayList<>();
        List<String> incNames = new ArrayList<>();
        List<String> decNames = new ArrayList<>();
        List<String> stableNames = new ArrayList<>();

        for (ReportComparisonResultDto.ComparedTestMetric m : result.getMatchedMetrics()) {
            String unitStr = (m.getUnit() != null && !m.getUnit().trim().isEmpty()) ? " " + m.getUnit().trim() : "";
            BigDecimal diff = m.getDifference();
            BigDecimal absDiff = diff != null ? diff.abs() : BigDecimal.ZERO;

            String trendClause;
            String pctStr = (m.getPercentageDifferenceString() != null && !"N/A".equals(m.getPercentageDifferenceString()))
                    ? " (" + m.getPercentageDifferenceString() + ")"
                    : "";
            if (diff != null && diff.compareTo(BigDecimal.ZERO) > 0) {
                trendClause = "That is an increase of " + formatNum(absDiff) + unitStr + pctStr + ".";
                incNames.add(m.getTestName());
            } else if (diff != null && diff.compareTo(BigDecimal.ZERO) < 0) {
                trendClause = "That is a decrease of " + formatNum(absDiff) + unitStr + pctStr + ".";
                decNames.add(m.getTestName());
            } else {
                trendClause = "The result remained unchanged between the two visits.";
                stableNames.add(m.getTestName());
            }

            String rangeClause = "";
            boolean hasMin = m.getReferenceRangeMin() != null;
            boolean hasMax = m.getReferenceRangeMax() != null;
            String refRangeText = (hasMin && hasMax) ? " (" + formatNum(m.getReferenceRangeMin()) + " - " + formatNum(m.getReferenceRangeMax()) + unitStr + ")" : "";

            if ("LOW".equalsIgnoreCase(m.getNewerStatus())) {
                rangeClause = "The latest result is still below the provided reference range" + refRangeText + ".";
            } else if ("HIGH".equalsIgnoreCase(m.getNewerStatus())) {
                rangeClause = "The latest result is above the provided reference range" + refRangeText + ".";
            } else if ("NORMAL".equalsIgnoreCase(m.getNewerStatus())) {
                if ("LOW".equalsIgnoreCase(m.getOlderStatus()) || "HIGH".equalsIgnoreCase(m.getOlderStatus())) {
                    rangeClause = "The latest result has returned to the standard reference range" + refRangeText + ".";
                } else {
                    rangeClause = "The latest result is within the provided reference range" + refRangeText + ".";
                }
            } else {
                rangeClause = "No reference range was specified for this parameter.";
            }

            String testNameLower = m.getTestName().toLowerCase();
            String verb = (testNameLower.endsWith("s") || testNameLower.endsWith("cells")) ? "were" : "was";
            String sentence = String.format("Your %s %s %s%s on %s. In your follow-up report on %s, it was %s%s. %s %s",
                    m.getTestName(), verb, formatNum(m.getOlderValue()), unitStr, formattedOlderDate,
                    formattedNewerDate, formatNum(m.getNewerValue()), unitStr, trendClause, rangeClause).trim();

            plainSentences.add("• " + sentence);
        }

        sb.append(String.join("\n\n", plainSentences));

        sb.append("\n\n• Summary of Changes: ");
        sb.append(String.format("%d increased, %d decreased, and %d remained unchanged.",
                incNames.size(), decNames.size(), stableNames.size()));

        sb.append("\n\nNote: Clinical reference ranges and calibration baselines may vary between laboratories and test methodologies. This longitudinal comparison tracks recorded changes over time for patient awareness and does not predict future clinical trajectory, claim a result will become normal, or provide a medical diagnosis. Please consult a qualified physician for clinical evaluation.");

        return sb.toString();
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

    public static List<ReportValueDto> extractValuesFromText(String content) {
        List<ReportValueDto> list = new ArrayList<>();
        if (content == null || content.trim().isEmpty()) return list;

        String[] biomarkers = {
            "Hemoglobin", "Hb", "Total Cholesterol", "Cholesterol", "HDL Cholesterol", "HDL",
            "LDL Cholesterol", "LDL", "Triglycerides", "Fasting Blood Sugar", "Blood Sugar",
            "Glucose", "HbA1c", "Platelets", "Platelet Count", "WBC", "White Blood Cells", "RBC",
            "Red Blood Cells", "Creatinine", "Serum Creatinine", "Urea", "BUN", "Uric Acid",
            "Bilirubin", "Total Bilirubin", "SGPT", "ALT", "SGOT", "AST", "ALP", "Calcium",
            "Potassium", "Sodium", "TSH", "Hematocrit", "PCV"
        };

        Set<String> seen = new HashSet<>();

        for (String bm : biomarkers) {
            Pattern p = Pattern.compile("(?i)\\b" + Pattern.quote(bm) + "\\b[^0-9\\r\\n]{0,25}([0-9]+(?:\\.[0-9]+)?)\\s*([a-zA-Z\\/\\%\\^0-9]+)?(?:[^0-9\\r\\n]{0,25}([0-9]+(?:\\.[0-9]+)?)\\s*[-–to]\\s*([0-9]+(?:\\.[0-9]+)?))?");
            Matcher m = p.matcher(content);
            if (m.find()) {
                String cKey = canonicalizeBiomarkerKey(null, bm);
                if (!seen.contains(cKey)) {
                    seen.add(cKey);
                    ReportValueDto dto = new ReportValueDto();
                    dto.setTestName(bm);
                    dto.setNormalizedTestKey(cKey);
                    try {
                        dto.setNumericValue(new BigDecimal(m.group(1)));
                    } catch (Exception e) {
                        continue;
                    }
                    String unit = m.group(2) != null ? m.group(2).trim() : "";
                    if ("mg".equalsIgnoreCase(unit) || "dl".equalsIgnoreCase(unit)) unit = "mg/dL";
                    dto.setUnit(unit);
                    if (m.group(3) != null && m.group(4) != null) {
                        try {
                            dto.setReferenceRangeMin(new BigDecimal(m.group(3)));
                            dto.setReferenceRangeMax(new BigDecimal(m.group(4)));
                        } catch (Exception ignored) {}
                    }
                    list.add(dto);
                }
            }
        }
        return list;
    }

    private List<ReportValue> tryExtractAndSaveValues(Report report, User uploader) {
        List<ReportValue> saved = new ArrayList<>();
        try {
            Path filePath = this.storageDirectory.resolve(report.getStorageKey()).normalize();
            if (Files.exists(filePath)) {
                byte[] bytes = Files.readAllBytes(filePath);
                String content = new String(bytes, java.nio.charset.StandardCharsets.ISO_8859_1);
                List<ReportValueDto> dtos = extractValuesFromText(content);
                for (ReportValueDto dto : dtos) {
                    ReportValue val = new ReportValue(
                            report,
                            dto.getTestName().trim(),
                            dto.getNormalizedTestKey() != null ? dto.getNormalizedTestKey() : dto.getTestName().trim().toUpperCase().replace(" ", "_"),
                            dto.getNumericValue(),
                            dto.getUnit(),
                            dto.getReferenceRangeMin(),
                            dto.getReferenceRangeMax(),
                            dto.getInterpretation(),
                            uploader
                    );
                    saved.add(reportValueRepository.save(val));
                }
            }
        } catch (Exception ignored) {}
        return saved;
    }

}
