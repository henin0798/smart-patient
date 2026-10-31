package com.smartpatient.admin;

import com.smartpatient.auth.dto.RegisterPatientRequest;
import com.smartpatient.doctor.entity.Doctor;
import com.smartpatient.doctor.entity.VerificationStatus;
import com.smartpatient.hospital.entity.Hospital;
import com.smartpatient.user.entity.AccountStatus;
import com.smartpatient.user.entity.User;
import com.smartpatient.user.entity.UserRole;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

public class AdminDoctorVerificationTest {

    @Test
    @DisplayName("Doctor registration must default to PENDING status and allow admin transition to VERIFIED")
    void testDoctorVerificationTransitions() {
        User user = new User("dr.test", "dr.test@hospital.org", "hash", UserRole.DOCTOR);
        user.setAccountStatus(AccountStatus.ACTIVE);

        Hospital hospital = new Hospital("Test Hospital", "Test St", "Kochi", "123", "NABH");
        Doctor doctor = new Doctor(user, hospital, "Dr. Test", "Cardiology", "MBBS, MD", "KMC-9999");

        // Verify initial state
        assertEquals(VerificationStatus.PENDING, doctor.getVerificationStatus(), "New doctor must default to PENDING");

        // Admin approve transition
        doctor.setVerificationStatus(VerificationStatus.VERIFIED);
        assertEquals(VerificationStatus.VERIFIED, doctor.getVerificationStatus());

        // Admin reject transition
        doctor.setVerificationStatus(VerificationStatus.REJECTED);
        assertEquals(VerificationStatus.REJECTED, doctor.getVerificationStatus());
    }

    @Test
    @DisplayName("Confirm ordinary users cannot supply a role field in registration requests")
    void testRegistrationPrivilegeEscalationPrevented() {
        Field[] fields = RegisterPatientRequest.class.getDeclaredFields();
        boolean hasRoleField = Arrays.stream(fields)
                .anyMatch(f -> f.getName().equalsIgnoreCase("role") || f.getName().equalsIgnoreCase("userRole"));

        assertFalse(hasRoleField, "RegisterPatientRequest must NOT contain a role field, preventing caller role injection.");
    }
}
