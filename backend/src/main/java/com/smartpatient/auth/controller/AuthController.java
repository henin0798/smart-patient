package com.smartpatient.auth.controller;

import com.smartpatient.auth.dto.AuthResponse;
import com.smartpatient.auth.dto.LoginRequest;
import com.smartpatient.auth.dto.RegisterDoctorRequest;
import com.smartpatient.auth.dto.RegisterPatientRequest;
import com.smartpatient.auth.dto.UserSummaryDto;
import com.smartpatient.auth.service.AuthService;
import com.smartpatient.common.response.ApiResponse;
import com.smartpatient.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/auth", "/api"})
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping({"/register", "/register/", "/auth/register", "/auth/register/"})
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterPatientRequest request) {
        AuthResponse response = authService.registerPatient(request);
        return ResponseEntity.ok(ApiResponse.success("Registration successful. Your Patient ID is " + response.getPatientCode(), response));
    }

    @PostMapping({"/register-doctor", "/register-doctor/", "/auth/register-doctor", "/auth/register-doctor/"})
    public ResponseEntity<ApiResponse<AuthResponse>> registerDoctor(@Valid @RequestBody RegisterDoctorRequest request) {
        AuthResponse response = authService.registerDoctor(request);
        return ResponseEntity.ok(ApiResponse.success("Doctor application submitted successfully. Your account is pending administrator verification.", response));
    }

    @PostMapping({"/login", "/login/", "/auth/login", "/auth/login/"})
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @GetMapping({"/login", "/login/", "/auth/login", "/auth/login/"})
    public ResponseEntity<ApiResponse<Void>> loginGetInfo() {
        return ResponseEntity.status(405)
                .body(ApiResponse.error("Login requires an HTTP POST request with JSON body { usernameOrEmail, password }. HTTP GET is not permitted."));
    }

    @PostMapping({"/logout", "/logout/", "/auth/logout", "/auth/logout/"})
    public ResponseEntity<ApiResponse<String>> logout() {
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully.", null));
    }

    @GetMapping({"/me", "/me/", "/auth/me", "/auth/me/"})
    public ResponseEntity<ApiResponse<UserSummaryDto>> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }
        UserSummaryDto user = authService.getCurrentUser(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(user));
    }
}
