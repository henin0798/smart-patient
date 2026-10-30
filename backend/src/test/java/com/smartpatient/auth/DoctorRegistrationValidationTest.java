package com.smartpatient.auth;

import com.smartpatient.auth.dto.RegisterDoctorRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class DoctorRegistrationValidationTest {

    @Test
    @DisplayName("Should validate Doctor Registration request fields")
    void testDoctorRegistrationRequest() {
        RegisterDoctorRequest req = new RegisterDoctorRequest();
        req.setFullName("Dr. Rajesh Sharma");
        req.setUsername("dr.rajesh");
        req.setEmail("rajesh.sharma@hospital.org");
        req.setPassword("Doctor@123");
        req.setSpecialty("Cardiology");
        req.setQualification("MBBS, MD");
        req.setLicenseOrRegistrationReference("KMC-2024-8976");
        req.setHospitalId(1L);

        assertEquals("Dr. Rajesh Sharma", req.getFullName());
        assertEquals("dr.rajesh", req.getUsername());
        assertEquals("rajesh.sharma@hospital.org", req.getEmail());
        assertEquals("Cardiology", req.getSpecialty());
        assertEquals("MBBS, MD", req.getQualification());
        assertEquals("KMC-2024-8976", req.getLicenseOrRegistrationReference());
        assertEquals(1L, req.getHospitalId());
    }

    @Test
    @DisplayName("Should handle missing optional hospital affiliation")
    void testDoctorRegistrationWithoutHospital() {
        RegisterDoctorRequest req = new RegisterDoctorRequest();
        req.setFullName("Dr. Priya Menon");
        req.setUsername("dr.priya");
        req.setEmail("priya.menon@clinic.org");
        req.setPassword("Doctor@123");
        req.setSpecialty("Pediatrics");
        req.setQualification("MBBS, DCH");
        req.setLicenseOrRegistrationReference("TCMC-11223");
        req.setHospitalId(null);

        assertNull(req.getHospitalId());
        assertNotNull(req.getLicenseOrRegistrationReference());
    }
}
