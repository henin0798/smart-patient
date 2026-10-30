package com.smartpatient.audit.service;

import com.smartpatient.audit.entity.AuditLog;
import com.smartpatient.audit.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void log(Long actorUserId, String actionType, String resourceType, String resourceId, String outcome, String metadata) {
        try {
            AuditLog log = new AuditLog(actorUserId, actionType, resourceType, resourceId, outcome, metadata);
            auditLogRepository.save(log);
        } catch (Exception ex) {
            // Fail safely: audit logging should not break business flow but should be recorded in server log
            System.err.println("Failed to write audit log: " + ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop100ByOrderByTimestampDesc();
    }
}
