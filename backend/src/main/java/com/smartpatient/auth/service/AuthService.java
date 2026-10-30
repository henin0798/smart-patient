package com.smartpatient.auth.service;

import com.smartpatient.audit.service.AuditService;
import com.smartpatient.auth.dto.AuthResponse;
import com.smartpatient.auth.dto.LoginRequest;
import com.smartpatient.auth.dto.RegisterPatientRequest;
import com.smartpatient.auth.dto.UserSummaryDto;
import com.smartpatient.common.exception.BadRequestException;
import com.smartpatient.common.exception.ResourceNotFoundException;
import com.smartpatient.doctor.entity.Doctor;
import com.smartpatient.doctor.repository.DoctorRepository;
import com.smartpatient.notification.service.NotificationService;
import com.smartpatient.patient.entity.Patient;
import com.smartpatient.patient.repository.PatientRepository;
import com.smartpatient.security.JwtTokenProvider;
import com.smartpatient.security.UserPrincipal;
import com.smartpatient.user.entity.AccountStatus;
import com.smartpatient.user.entity.User;
import com.smartpatient.user.entity.UserRole;
import com.smartpatient.user.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final Random random = new Random();

    public AuthService(UserRepository userRepository,
                       PatientRepository patientRepository,
                       DoctorRepository doctorRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider tokenProvider,
                       NotificationService notificationService,
                       AuditService auditService) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Transactional
    public AuthResponse registerPatient(RegisterPatientRequest request) {
        if (Boolean.FALSE.equals(request.getConsent())) {
            throw new BadRequestException("Consent is required to register and store personal health data.");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username '" + request.getUsername() + "' is already taken.");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email '" + request.getEmail() + "' is already registered.");
        }

        // Create User
        User user = new User(
                request.getUsername(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                UserRole.PATIENT
        );
        user.setAccountStatus(AccountStatus.ACTIVE);
        User savedUser = userRepository.save(user);

        // Generate unique readable Patient ID (e.g., PT-2026-0001)
        String patientCode = generateUniquePatientCode();

        // Create Patient
        Patient patient = new Patient(
                patientCode,
                savedUser,
                request.getFullName(),
                request.getDateOfBirth(),
                request.getPhone(),
                request.getBloodGroup(),
                request.getAllergies(),
                request.getEmergencyContactName(),
                request.getEmergencyContactPhone()
        );
        Patient savedPatient = patientRepository.save(patient);

        // Initial welcome notification
        notificationService.createNotification(
                savedUser,
                "SYSTEM",
                "Welcome to Smart Patient!",
                "Your centralized digital health account is ready. Your unique Patient ID is: " + patientCode
        );

        auditService.log(savedUser.getUserId(), "REGISTER_PATIENT", "USER", savedUser.getUserId().toString(), "SUCCESS", "Patient ID: " + patientCode);

        // Auto authenticate and generate token directly without redundant DB query or duplicate BCrypt computation
        UserPrincipal principal = UserPrincipal.create(savedUser);
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        return new AuthResponse(
                jwt,
                savedUser.getUserId(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getRole().name(),
                savedPatient.getFullName(),
                patientCode,
                savedPatient.getPatientId()
        );
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsernameOrEmail(), request.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

            User user = userRepository.findById(userPrincipal.getUserId())
                    .orElseThrow(() -> new BadCredentialsException("Invalid credentials."));

            if (user.getAccountStatus() == AccountStatus.SUSPENDED || user.getAccountStatus() == AccountStatus.DISABLED) {
                auditService.log(user.getUserId(), "LOGIN_ATTEMPT", "USER", user.getUserId().toString(), "DENIED", "Account status: " + user.getAccountStatus());
                throw new BadRequestException("Your account has been " + user.getAccountStatus().name().toLowerCase() + ". Please contact support or administrator.");
            }

            user.setLastLoginAt(LocalDateTime.now());
            userRepository.save(user);

            String jwt = tokenProvider.generateToken(authentication);

            String fullName = user.getUsername();
            String patientCode = null;
            Long entityId = null;

            if (user.getRole() == UserRole.PATIENT) {
                Optional<Patient> pOpt = patientRepository.findByUser_UserId(user.getUserId());
                if (pOpt.isPresent()) {
                    fullName = pOpt.get().getFullName();
                    patientCode = pOpt.get().getPatientCode();
                    entityId = pOpt.get().getPatientId();
                }
            } else if (user.getRole() == UserRole.DOCTOR) {
                Optional<Doctor> dOpt = doctorRepository.findByUser_UserId(user.getUserId());
                if (dOpt.isPresent()) {
                    fullName = dOpt.get().getFullName();
                    entityId = dOpt.get().getDoctorId();
                }
            }

            auditService.log(user.getUserId(), "LOGIN", "USER", user.getUserId().toString(), "SUCCESS", "Role: " + user.getRole().name());

            return new AuthResponse(
                    jwt,
                    user.getUserId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getRole().name(),
                    fullName,
                    patientCode,
                    entityId
            );

        } catch (BadCredentialsException ex) {
            auditService.log(null, "LOGIN_FAILED", "USER", request.getUsernameOrEmail(), "FAILURE", "Invalid credentials");
            throw new BadCredentialsException("Invalid username or password.");
        }
    }

    @Transactional(readOnly = true)
    public UserSummaryDto getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        UserSummaryDto dto = new UserSummaryDto();
        dto.setUserId(user.getUserId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole().name());
        dto.setAccountStatus(user.getAccountStatus().name());

        if (user.getRole() == UserRole.PATIENT) {
            patientRepository.findByUser_UserId(user.getUserId()).ifPresent(p -> {
                dto.setFullName(p.getFullName());
                dto.setPatientCode(p.getPatientCode());
                dto.setEntityId(p.getPatientId());
            });
        } else if (user.getRole() == UserRole.DOCTOR) {
            doctorRepository.findByUser_UserId(user.getUserId()).ifPresent(d -> {
                dto.setFullName(d.getFullName());
                dto.setEntityId(d.getDoctorId());
            });
        } else {
            dto.setFullName("System Administrator");
        }

        return dto;
    }

    private String generateUniquePatientCode() {
        int year = LocalDate.now().getYear();
        String code;
        do {
            int num = 1000 + random.nextInt(9000);
            code = "PT-" + year + "-" + num;
        } while (patientRepository.existsByPatientCode(code));
        return code;
    }
}
