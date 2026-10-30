package com.smartpatient.report.repository;

import com.smartpatient.report.entity.ReportValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportValueRepository extends JpaRepository<ReportValue, Long> {
    List<ReportValue> findByReport_ReportId(Long reportId);
    List<ReportValue> findByReport_Patient_PatientIdAndNormalizedTestKey(Long patientId, String normalizedTestKey);
    void deleteByReport_ReportId(Long reportId);
}
