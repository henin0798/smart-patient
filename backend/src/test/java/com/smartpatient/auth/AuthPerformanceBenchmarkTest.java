package com.smartpatient.auth;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class AuthPerformanceBenchmarkTest {

    private final PasswordEncoder encoder = new BCryptPasswordEncoder();

    @Test
    @DisplayName("Measure local BCrypt verification processing latency")
    void measureAuthenticationProcessingLatency() {
        String rawPassword = "Patient@123";
        String encodedHash = encoder.encode(rawPassword);

        // Warm up JVM JIT compiler
        encoder.matches(rawPassword, encodedHash);

        long start = System.nanoTime();
        boolean matched = encoder.matches(rawPassword, encodedHash);
        long durationMs = (System.nanoTime() - start) / 1_000_000;

        assertTrue(matched);
        System.out.printf(">>> [BENCHMARK] Local BCrypt verification latency: %d ms <<<%n", durationMs);

        // Security requirement: BCrypt 10 rounds takes between 40ms and 200ms (resistant to brute-force)
        // This clearly distinguishes application CPU work (~80ms) from Render free-tier container cold-start delay (~30-50s).
        assertTrue(durationMs < 500, "Authentication processing should complete well under 500ms");
    }
}
