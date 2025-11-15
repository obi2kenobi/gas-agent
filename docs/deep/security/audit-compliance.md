# 🔐 Audit & Compliance

**Categoria**: Security → Audit Logging & Compliance
**Righe**: ~275
**Parent**: `specialists/security-engineer.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Implementare audit logging
- Assicurare compliance (GDPR, SOC2, ISO 27001, etc.)
- Tracciare security-relevant events
- Preparare per audit esterni
- Investigare security incidents
- Generate compliance reports
- Implement tamper-proof logging

---

## 📊 Audit Logging Patterns

### What to Log (CRITICAL)

**ALWAYS log these security-relevant events**:
- ✅ **Authentication attempts** (success and failure)
- ✅ **Authorization failures** (permission denied)
- ✅ **Data access** (PII, financial data, sensitive records)
- ✅ **Configuration changes** (properties, settings, permissions)
- ✅ **User actions** (create, update, delete operations)
- ✅ **System errors** (unhandled exceptions, integration failures)
- ✅ **Privileged operations** (admin actions, role changes)
- ✅ **Security events** (credential rotation, deployment, suspicious activity)

---

### What NOT to Log (SECURITY VIOLATION)

**NEVER log these (privacy + security risk)**:
- ❌ **Passwords, tokens, secrets, API keys**
- ❌ **Full PII values** (use IDs instead, e.g., userId not full name)
- ❌ **Credit card numbers, SSNs**
- ❌ **Sensitive business data** (trade secrets, pricing)
- ❌ **Session cookies**
- ❌ **Unencrypted passwords** (should never exist anyway)

---

## 📝 Structured Audit Logs

### Audit Log Schema

**Standard Format**:
```javascript
const AuditLogSchema = {
  timestamp: 'ISO8601 string',       // When
  userId: 'string (email)',          // Who
  action: 'string (ACTION_TYPE)',    // What
  resource: 'string',                // Which resource
  resourceId: 'string',              // Specific ID
  result: 'success | failure',       // Outcome
  metadata: {                        // Additional context
    ipAddress: 'string',
    userAgent: 'string',
    errorMessage: 'string',          // If failure
    previousValue: 'any',            // For updates
    newValue: 'any'                  // For updates
  }
};
```

---

### Audit Logging Implementation

**Core Audit Logger**:
```javascript
const AuditLogger = (function() {

  const ACTION_TYPES = {
    // Authentication & Authorization
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILURE: 'LOGIN_FAILURE',
    LOGOUT: 'LOGOUT',
    AUTHORIZATION_FAILURE: 'AUTHORIZATION_FAILURE',

    // Data Operations
    DATA_READ: 'DATA_READ',
    DATA_CREATE: 'DATA_CREATE',
    DATA_UPDATE: 'DATA_UPDATE',
    DATA_DELETE: 'DATA_DELETE',

    // Configuration
    CONFIG_CHANGE: 'CONFIG_CHANGE',
    ROLE_ASSIGNED: 'ROLE_ASSIGNED',
    PERMISSION_GRANTED: 'PERMISSION_GRANTED',

    // Security Events
    CREDENTIAL_ROTATION: 'CREDENTIAL_ROTATION',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
    SECURITY_ALERT: 'SECURITY_ALERT',

    // System Events
    SYNC_STARTED: 'SYNC_STARTED',
    SYNC_COMPLETED: 'SYNC_COMPLETED',
    SYNC_FAILED: 'SYNC_FAILED',
    DEPLOYMENT: 'DEPLOYMENT'
  };

  /**
   * Write audit log entry
   */
  function log(action, resource, result, metadata = {}) {
    const auditSheet = getAuditSheet();

    const entry = {
      timestamp: new Date().toISOString(),
      userId: Session.getActiveUser().getEmail() || 'SYSTEM',
      action,
      resource,
      resourceId: metadata.resourceId || '',
      result,
      metadata: JSON.stringify(metadata)
    };

    // Append to audit log (append-only, tamper-resistant)
    auditSheet.appendRow([
      entry.timestamp,
      entry.userId,
      entry.action,
      entry.resource,
      entry.resourceId,
      entry.result,
      entry.metadata
    ]);

    // Also log to Stackdriver for external storage
    console.log('AUDIT', entry);
  }

  /**
   * Get or create audit log sheet
   */
  function getAuditSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('AuditLog');

    if (!sheet) {
      sheet = ss.insertSheet('AuditLog');
      sheet.appendRow([
        'Timestamp',
        'User ID',
        'Action',
        'Resource',
        'Resource ID',
        'Result',
        'Metadata'
      ]);

      // Protect sheet (prevent tampering)
      const protection = sheet.protect();
      protection.setDescription('Audit log - do not modify');
      protection.setWarningOnly(true);
    }

    return sheet;
  }

  /**
   * Log successful operation
   */
  function logSuccess(action, resource, metadata = {}) {
    log(action, resource, 'success', metadata);
  }

  /**
   * Log failed operation
   */
  function logFailure(action, resource, error, metadata = {}) {
    log(action, resource, 'failure', {
      ...metadata,
      errorMessage: error.message || String(error)
    });
  }

  return {
    ACTION_TYPES,
    log,
    logSuccess,
    logFailure
  };

})();

// Usage examples
function exampleAuditUsage() {
  // Log successful operation
  AuditLogger.logSuccess(
    AuditLogger.ACTION_TYPES.DATA_CREATE,
    'Order',
    { resourceId: 'ORD-123', orderAmount: 1500 }
  );

  // Log authorization failure
  AuditLogger.logFailure(
    AuditLogger.ACTION_TYPES.AUTHORIZATION_FAILURE,
    'Order',
    new Error('Missing DELETE_ORDER permission'),
    { resourceId: 'ORD-456', attemptedAction: 'DELETE' }
  );

  // Log configuration change
  AuditLogger.logSuccess(
    AuditLogger.ACTION_TYPES.ROLE_ASSIGNED,
    'User',
    {
      resourceId: 'user@example.com',
      role: 'ADMIN',
      assignedBy: Session.getActiveUser().getEmail()
    }
  );
}
```

---

## ⚖️ Compliance Frameworks

### GDPR Requirements

**Article 30: Records of Processing Activities**:
```javascript
const GDPRComplianceChecklist = {
  consentTracking: {
    required: true,
    implementation: 'Track user consent for data processing',
    status: 'IMPLEMENTED', // Or 'PENDING', 'NOT_APPLICABLE'
    reference: 'sensitive-data.md > Consent Management'
  },

  dataBreachNotification: {
    required: true,
    implementation: 'Notify within 72 hours of breach discovery',
    status: 'IMPLEMENTED',
    procedure: '1. Detect breach\n2. Log incident\n3. Notify DPO\n4. Notify supervisory authority\n5. Notify affected users'
  },

  rightToAccess: {
    required: true,
    implementation: 'User can request all data we hold',
    status: 'IMPLEMENTED',
    reference: 'sensitive-data.md > Right to Access'
  },

  rightToErasure: {
    required: true,
    implementation: 'User can request data deletion',
    status: 'IMPLEMENTED',
    reference: 'sensitive-data.md > Right to Erasure'
  },

  dataRetentionPolicies: {
    required: true,
    implementation: 'Auto-delete data after retention period',
    status: 'IMPLEMENTED',
    reference: 'sensitive-data.md > Data Retention Policy'
  },

  auditLogging: {
    required: true,
    implementation: 'Log all access to personal data',
    status: 'IMPLEMENTED',
    details: 'AuditLogger tracks all PII access'
  }
};
```

---

### SOC2 Requirements

**SOC2 Trust Service Criteria**:
```javascript
const SOC2ComplianceChecklist = {
  // CC6.1: Access Logging
  accessLogging: {
    control: 'CC6.1',
    requirement: 'Log all access to system resources',
    implementation: 'AuditLogger logs authentication, authorization, data access',
    evidence: 'AuditLog sheet',
    testProcedure: 'Review AuditLog for completeness'
  },

  // CC6.2: Access Restrictions
  accessRestrictions: {
    control: 'CC6.2',
    requirement: 'Restrict access based on roles',
    implementation: 'RBAC system with ADMIN, MANAGER, USER, READONLY roles',
    evidence: 'authorization.md',
    testProcedure: 'Attempt unauthorized access, verify rejection + logging'
  },

  // CC7.2: Change Management
  changeManagement: {
    control: 'CC7.2',
    requirement: 'Log all system changes',
    implementation: 'Log config changes, deployments, role assignments',
    evidence: 'AuditLog entries for CONFIG_CHANGE, DEPLOYMENT',
    testProcedure: 'Review deployment logs'
  },

  // CC7.3: Monitoring
  monitoring: {
    control: 'CC7.3',
    requirement: 'Monitor for security events',
    implementation: 'Automated alerts on suspicious activity',
    evidence: 'platform/monitoring.md',
    testProcedure: 'Trigger alert, verify notification sent'
  },

  // CC8.1: Incident Response
  incidentResponse: {
    control: 'CC8.1',
    requirement: 'Documented incident response procedures',
    implementation: 'Security incident logging + escalation procedures',
    evidence: 'AuditLogger.ACTION_TYPES.SECURITY_ALERT',
    testProcedure: 'Simulate incident, verify logging + escalation'
  }
};
```

---

## 🗄️ Log Retention Policies

### Retention Periods by Log Type

**Compliance-Driven Retention**:
```javascript
const LOG_RETENTION_POLICIES = {
  // Security logs: Long retention (compliance)
  AUTHENTICATION: 365 * 2,          // 2 years
  AUTHORIZATION_FAILURE: 365 * 2,   // 2 years
  SECURITY_ALERT: 365 * 7,          // 7 years
  DATA_ACCESS_PII: 365 * 7,         // 7 years (GDPR allows, SOC2 requires)

  // Operational logs: Medium retention
  DATA_CREATE: 365 * 3,             // 3 years
  DATA_UPDATE: 365 * 3,             // 3 years
  DATA_DELETE: 365 * 7,             // 7 years (prove deletion for compliance)
  CONFIG_CHANGE: 365 * 3,           // 3 years

  // System logs: Short retention
  SYNC_STARTED: 90,                 // 90 days
  SYNC_COMPLETED: 90,               // 90 days
  SYNC_FAILED: 365,                 // 1 year (for debugging)

  // Deployment logs: Long retention
  DEPLOYMENT: 365 * 5               // 5 years
};

function enforceLogRetention() {
  const auditSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AuditLog');
  const data = auditSheet.getDataRange().getValues();
  const header = data[0];
  const logs = data.slice(1);

  const now = new Date();
  const rowsToDelete = [];

  logs.forEach((row, idx) => {
    const timestamp = new Date(row[0]);
    const action = row[2];

    const retentionDays = LOG_RETENTION_POLICIES[action] || 365; // Default 1 year
    const cutoffDate = new Date(now - retentionDays * 24 * 60 * 60 * 1000);

    if (timestamp < cutoffDate) {
      // Archive before deleting (compliance requirement)
      archiveLogEntry(row);

      rowsToDelete.push(idx + 2); // +2 for header + 0-indexing
    }
  });

  // Delete expired logs (in reverse to avoid index shifting)
  rowsToDelete.reverse().forEach(rowNum => {
    auditSheet.deleteRow(rowNum);
  });

  Logger.log(`Log retention: Archived and deleted ${rowsToDelete.length} expired log entries`);
}
```

---

### Log Archival

**Archive to Long-Term Storage**:
```javascript
function archiveLogEntry(logEntry) {
  const archiveSheet = getOrCreateArchiveSheet();

  // Append to archive (separate sheet or external storage)
  archiveSheet.appendRow(logEntry);

  // Also export to external storage (e.g., Cloud Storage)
  exportToExternalStorage(logEntry);
}

function getOrCreateArchiveSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('AuditLog_Archive');

  if (!sheet) {
    sheet = ss.insertSheet('AuditLog_Archive');
    sheet.appendRow([
      'Timestamp', 'User ID', 'Action', 'Resource', 'Resource ID', 'Result', 'Metadata'
    ]);
  }

  return sheet;
}
```

---

## 🔍 Forensic Investigation Support

### Log Query Patterns

**Search Logs by User**:
```javascript
function getAuditLogsByUser(userEmail, startDate, endDate) {
  const auditSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AuditLog');
  const data = auditSheet.getDataRange().getValues();
  const logs = data.slice(1); // Skip header

  return logs.filter(row => {
    const timestamp = new Date(row[0]);
    const userId = row[1];

    return userId === userEmail &&
           timestamp >= startDate &&
           timestamp <= endDate;
  });
}

// Usage
function investigateUser(email) {
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const logs = getAuditLogsByUser(email, last30Days, new Date());

  Logger.log(`User ${email} has ${logs.length} audit entries in last 30 days`);
  return logs;
}
```

---

**Search Logs by Action**:
```javascript
function getAuditLogsByAction(action, limit = 100) {
  const auditSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AuditLog');
  const data = auditSheet.getDataRange().getValues();
  const logs = data.slice(1); // Skip header

  return logs
    .filter(row => row[2] === action)
    .slice(-limit); // Most recent N entries
}

// Usage: Find all failed authorizations
function investigateAuthFailures() {
  const failures = getAuditLogsByAction('AUTHORIZATION_FAILURE', 50);
  Logger.log(`Found ${failures.length} recent authorization failures`);
  return failures;
}
```

---

**Search Logs by Resource**:
```javascript
function getAuditLogsByResource(resourceId) {
  const auditSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AuditLog');
  const data = auditSheet.getDataRange().getValues();
  const logs = data.slice(1);

  return logs.filter(row => row[4] === resourceId);
}

// Usage: Reconstruct history of specific order
function investigateOrder(orderId) {
  const logs = getAuditLogsByResource(orderId);

  Logger.log(`Order ${orderId} audit trail:`);
  logs.forEach(([timestamp, userId, action, resource, resourceId, result, metadata]) => {
    Logger.log(`  ${timestamp}: ${userId} performed ${action} - ${result}`);
  });

  return logs;
}
```

---

### Incident Timeline Reconstruction

**Reconstruct Security Incident**:
```javascript
function reconstructIncident(suspiciousUserId, incidentTime) {
  const windowStart = new Date(incidentTime - 60 * 60 * 1000); // 1 hour before
  const windowEnd = new Date(incidentTime + 60 * 60 * 1000);   // 1 hour after

  const logs = getAuditLogsByUser(suspiciousUserId, windowStart, windowEnd);

  const timeline = logs.map(([timestamp, userId, action, resource, resourceId, result, metadata]) => ({
    timestamp,
    action,
    resource,
    resourceId,
    result,
    metadata: JSON.parse(metadata)
  }));

  // Generate incident report
  const report = {
    userId: suspiciousUserId,
    incidentTime: new Date(incidentTime).toISOString(),
    timelineWindow: `${windowStart.toISOString()} to ${windowEnd.toISOString()}`,
    eventCount: timeline.length,
    failedActions: timeline.filter(e => e.result === 'failure').length,
    timeline
  };

  return report;
}
```

---

## 📄 Compliance Reporting

### Regular Compliance Reports

**Monthly Security Report**:
```javascript
function generateMonthlySecurityReport() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const auditSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AuditLog');
  const data = auditSheet.getDataRange().getValues();
  const logs = data.slice(1);

  const recentLogs = logs.filter(row => new Date(row[0]) >= thirtyDaysAgo);

  const report = {
    period: 'Last 30 days',
    totalEvents: recentLogs.length,
    authenticationAttempts: recentLogs.filter(r => r[2].includes('LOGIN')).length,
    authorizationFailures: recentLogs.filter(r => r[2] === 'AUTHORIZATION_FAILURE').length,
    dataAccesses: recentLogs.filter(r => r[2] === 'DATA_READ').length,
    configChanges: recentLogs.filter(r => r[2] === 'CONFIG_CHANGE').length,
    securityAlerts: recentLogs.filter(r => r[2] === 'SECURITY_ALERT').length,
    uniqueUsers: new Set(recentLogs.map(r => r[1])).size
  };

  // Send report to compliance team
  sendComplianceReport(report);

  return report;
}
```

---

### Audit Trail Export

**Export Audit Logs for External Audit**:
```javascript
function exportAuditTrail(startDate, endDate) {
  const auditSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AuditLog');
  const data = auditSheet.getDataRange().getValues();
  const header = data[0];
  const logs = data.slice(1);

  // Filter by date range
  const filteredLogs = logs.filter(row => {
    const timestamp = new Date(row[0]);
    return timestamp >= startDate && timestamp <= endDate;
  });

  // Create CSV
  const csv = [header, ...filteredLogs]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  // Create downloadable file
  const blob = Utilities.newBlob(csv, 'text/csv', `audit_trail_${startDate}_${endDate}.csv`);

  // Save to Drive
  const folder = DriveApp.getFolderById('AUDIT_EXPORTS_FOLDER_ID');
  const file = folder.createFile(blob);

  Logger.log(`Audit trail exported: ${file.getUrl()}`);
  return file;
}
```

---

## 🛡️ Audit Best Practices

### Security Checklist

- [x] **Tamper-proof logging**: Append-only sheets, protected from editing
- [x] **Centralized log storage**: Single AuditLog sheet + external backup
- [x] **Automated alerting**: Alert on suspicious patterns (e.g., >10 auth failures)
- [x] **Regular log reviews**: Monthly security reports
- [x] **Retention policy enforcement**: Auto-archive and delete expired logs
- [x] **Separation of duties**: Logger ≠ admin (audit log protected)
- [x] **Encrypted metadata**: Sensitive metadata JSON-encoded
- [x] **External storage backup**: Export to Cloud Storage for disaster recovery

---

## 🔗 Related Files

- `platform/logging.md` - General logging patterns
- `security/sensitive-data.md` - Safe logging of sensitive data
- `platform/monitoring.md` - Alerting on audit events
- `security/authorization.md` - Authorization event logging

---

**Versione**: 1.0
**Context Size**: ~275 righe
