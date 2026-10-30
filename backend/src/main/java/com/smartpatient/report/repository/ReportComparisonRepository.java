package com.smartpatient.report.repository;

import com.smartpatient.report.entity.ReportComparison;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportComparisonRepository extends JpaRepository<ReportComparison, Long> {
    List<ReportComparison> findByPatient_PatientIdOrderByCreatedAtDesc(Long patientId);
    List<ReportComparison> findByPatient_User_UserIdOrderByCreatedAtDesc(Long userId);
}

