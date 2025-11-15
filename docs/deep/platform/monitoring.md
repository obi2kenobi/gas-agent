# 🛠️ Monitoring & Alerting

**Categoria**: Platform → Observability
**Righe**: ~245
**Parent**: `specialists/platform-engineer.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Configurare monitoring per production
- Implementare health checks
- Definire alert triggers
- Tracciare metriche
- Configurare SLA monitoring
- Detect anomalies
- Implement incident response

---

## 🏥 Health Check Patterns

### Basic Health Check

**Simple Availability Check**:
```javascript
function healthCheck() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'HEALTHY',
    checks: {}
  };

  try {
    // Check 1: Sheets Access
    checks.checks.sheets = checkSheetsAccess();

    // Check 2: BC API
    checks.checks.bcAPI = checkBCAPI();

    // Check 3: Claude API
    checks.checks.claudeAPI = checkClaudeAPI();

    // Check 4: Properties
    checks.checks.properties = checkProperties();

    // Overall status
    const allHealthy = Object.values(checks.checks).every(c => c.status === 'OK');
    checks.status = allHealthy ? 'HEALTHY' : 'DEGRADED';

  } catch (error) {
    checks.status = 'UNHEALTHY';
    checks.error = error.message;
  }

  return checks;
}

function checkSheetsAccess() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    sheet.getName(); // Simple access test
    return { status: 'OK', latency: 0 };
  } catch (e) {
    return { status: 'FAIL', error: e.message };
  }
}

function checkBCAPI() {
  const start = Date.now();
  try {
    // Lightweight API call
    BCClient.get('/companies');
    return { status: 'OK', latency: Date.now() - start };
  } catch (e) {
    return { status: 'FAIL', error: e.message };
  }
}

function checkClaudeAPI() {
  const start = Date.now();
  try {
    // Lightweight check (health endpoint if available)
    // Or cache recent success
    return { status: 'OK', latency: Date.now() - start };
  } catch (e) {
    return { status: 'FAIL', error: e.message };
  }
}

function checkProperties() {
  try {
    const props = PropertiesService.getScriptProperties();
    const required = ['BC_CLIENT_ID', 'CLAUDE_API_KEY'];

    const missing = required.filter(key => !props.getProperty(key));

    if (missing.length > 0) {
      return { status: 'FAIL', error: `Missing: ${missing.join(', ')}` };
    }

    return { status: 'OK' };
  } catch (e) {
    return { status: 'FAIL', error: e.message };
  }
}
```

---

### Scheduled Health Checks

**Via Time-Based Trigger**:
```javascript
function setupHealthCheckTrigger() {
  // Delete existing triggers
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'scheduledHealthCheck') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new trigger (every 5 minutes)
  ScriptApp.newTrigger('scheduledHealthCheck')
    .timeBased()
    .everyMinutes(5)
    .create();
}

function scheduledHealthCheck() {
  const health = healthCheck();

  // Log to Sheets
  logHealthCheck(health);

  // Alert if unhealthy
  if (health.status !== 'HEALTHY') {
    sendHealthAlert(health);
  }
}

function logHealthCheck(health) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('HealthLog');
  if (!sheet) return;

  sheet.appendRow([
    health.timestamp,
    health.status,
    JSON.stringify(health.checks)
  ]);
}
```

---

## 📊 Metrics to Track

### Performance Metrics

**Execution Time Tracking**:
```javascript
const MetricsCollector = (function() {
  const METRICS_SHEET = 'Metrics';

  function recordMetric(metricName, value, unit = 'ms') {
    const sheet = getOrCreateMetricsSheet();

    sheet.appendRow([
      new Date(),
      metricName,
      value,
      unit,
      Session.getActiveUser().getEmail()
    ]);
  }

  function recordExecutionTime(operation, duration) {
    recordMetric(`execution_time.${operation}`, duration, 'ms');

    // Alert if slow
    const threshold = getThreshold(operation);
    if (duration > threshold) {
      sendSlowOperationAlert(operation, duration, threshold);
    }
  }

  function recordAPILatency(api, endpoint, latency) {
    recordMetric(`api_latency.${api}.${endpoint}`, latency, 'ms');
  }

  function recordCacheHitRate(operation, hits, misses) {
    const total = hits + misses;
    const hitRate = total > 0 ? (hits / total) : 0;
    recordMetric(`cache_hit_rate.${operation}`, hitRate * 100, '%');
  }

  function getOrCreateMetricsSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(METRICS_SHEET);

    if (!sheet) {
      sheet = ss.insertSheet(METRICS_SHEET);
      sheet.appendRow(['Timestamp', 'Metric', 'Value', 'Unit', 'User']);
    }

    return sheet;
  }

  function getThreshold(operation) {
    const THRESHOLDS = {
      'syncOrders': 60000,       // 1 minute
      'processDocument': 30000,  // 30 seconds
      'batchWrite': 5000         // 5 seconds
    };
    return THRESHOLDS[operation] || 10000; // Default 10s
  }

  return {
    recordMetric,
    recordExecutionTime,
    recordAPILatency,
    recordCacheHitRate
  };
})();

// Usage
function syncOrders() {
  const start = Date.now();

  try {
    // ... sync logic ...
    const duration = Date.now() - start;
    MetricsCollector.recordExecutionTime('syncOrders', duration);
  } catch (error) {
    const duration = Date.now() - start;
    MetricsCollector.recordExecutionTime('syncOrders', duration);
    throw error;
  }
}
```

---

### Reliability Metrics

**Error Rate Tracking**:
```javascript
const ReliabilityMetrics = (function() {

  function recordOperationResult(operation, success) {
    const props = PropertiesService.getScriptProperties();
    const key = `reliability.${operation}`;

    // Get current stats
    const stats = JSON.parse(props.getProperty(key) || '{"success":0,"failure":0}');

    // Update
    if (success) {
      stats.success++;
    } else {
      stats.failure++;
    }

    // Store
    props.setProperty(key, JSON.stringify(stats));

    // Calculate error rate
    const total = stats.success + stats.failure;
    const errorRate = total > 0 ? (stats.failure / total) : 0;

    // Alert if high error rate
    if (errorRate > 0.05 && total > 10) { // >5% error rate, min 10 requests
      sendHighErrorRateAlert(operation, errorRate, stats);
    }
  }

  function getErrorRate(operation) {
    const props = PropertiesService.getScriptProperties();
    const key = `reliability.${operation}`;
    const stats = JSON.parse(props.getProperty(key) || '{"success":0,"failure":0}');

    const total = stats.success + stats.failure;
    return total > 0 ? (stats.failure / total) : 0;
  }

  function resetMetrics(operation) {
    const props = PropertiesService.getScriptProperties();
    const key = `reliability.${operation}`;
    props.deleteProperty(key);
  }

  return {
    recordOperationResult,
    getErrorRate,
    resetMetrics
  };
})();

// Usage
function processOrder(orderId) {
  try {
    // ... processing ...
    ReliabilityMetrics.recordOperationResult('processOrder', true);
  } catch (error) {
    ReliabilityMetrics.recordOperationResult('processOrder', false);
    throw error;
  }
}
```

---

### Business Metrics

**Records Processed Tracking**:
```javascript
function trackBusinessMetrics(operation, metrics) {
  const sheet = getOrCreateBusinessMetricsSheet();

  sheet.appendRow([
    new Date(),
    operation,
    metrics.recordsProcessed || 0,
    metrics.recordsSucceeded || 0,
    metrics.recordsFailed || 0,
    metrics.dataQualityIssues || 0,
    metrics.duration || 0
  ]);
}

// Usage
function syncOrdersBatch() {
  const metrics = {
    recordsProcessed: 0,
    recordsSucceeded: 0,
    recordsFailed: 0,
    dataQualityIssues: 0,
    duration: 0
  };

  const start = Date.now();

  orders.forEach(order => {
    metrics.recordsProcessed++;
    try {
      processOrder(order);
      metrics.recordsSucceeded++;
    } catch (error) {
      metrics.recordsFailed++;
      if (error.type === 'DATA_QUALITY') {
        metrics.dataQualityIssues++;
      }
    }
  });

  metrics.duration = Date.now() - start;
  trackBusinessMetrics('syncOrders', metrics);
}
```

---

## 🚨 Alert Triggers

### When to Alert

**Alert Thresholds**:
```javascript
const ALERT_THRESHOLDS = {
  // Performance
  EXECUTION_TIME: {
    syncOrders: 60000,        // 1 minute
    processDocument: 30000,   // 30 seconds
    batchOperation: 10000     // 10 seconds
  },

  // Reliability
  ERROR_RATE: 0.05,           // 5%
  ERROR_RATE_MIN_SAMPLES: 10, // Minimum samples before alerting

  // Business
  DATA_QUALITY_ISSUES: 0.10,  // 10% of records

  // External dependencies
  API_FAILURE_THRESHOLD: 3,   // Consecutive failures
  API_LATENCY: 5000           // 5 seconds
};
```

---

### Alert Channels

**Email Alerts**:
```javascript
function sendAlert(subject, body, priority = 'MEDIUM') {
  const recipients = getAlertRecipients(priority);

  const emailSubject = `[${priority}] GAS-AGENT Alert: ${subject}`;
  const emailBody = `
${body}

Timestamp: ${new Date().toISOString()}
Script: ${ScriptApp.getScriptId()}
User: ${Session.getActiveUser().getEmail()}

---
This is an automated alert from GAS-AGENT monitoring system.
  `.trim();

  MailApp.sendEmail({
    to: recipients.join(','),
    subject: emailSubject,
    body: emailBody
  });

  // Log alert
  logAlert(subject, body, priority);
}

function getAlertRecipients(priority) {
  const RECIPIENTS = {
    'CRITICAL': ['admin@company.com', 'oncall@company.com'],
    'HIGH': ['admin@company.com'],
    'MEDIUM': ['team@company.com'],
    'LOW': ['team@company.com']
  };

  return RECIPIENTS[priority] || RECIPIENTS['MEDIUM'];
}
```

---

**Slack Webhook**:
```javascript
function sendSlackAlert(message, channel = '#alerts') {
  const webhookUrl = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');

  if (!webhookUrl) {
    Logger.log('Slack webhook not configured');
    return;
  }

  const payload = {
    channel: channel,
    username: 'GAS-AGENT Monitor',
    icon_emoji: ':warning:',
    text: message,
    attachments: [{
      color: 'danger',
      fields: [
        { title: 'Timestamp', value: new Date().toISOString(), short: true },
        { title: 'Script', value: ScriptApp.getScriptId(), short: true }
      ]
    }]
  };

  UrlFetchApp.fetch(webhookUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}
```

---

### Alert Examples

**High Error Rate Alert**:
```javascript
function sendHighErrorRateAlert(operation, errorRate, stats) {
  const subject = `High Error Rate: ${operation}`;
  const body = `
Operation: ${operation}
Error Rate: ${(errorRate * 100).toFixed(2)}%
Successful: ${stats.success}
Failed: ${stats.failure}

Action Required: Investigate failures immediately.
  `.trim();

  sendAlert(subject, body, 'HIGH');
}
```

**Slow Operation Alert**:
```javascript
function sendSlowOperationAlert(operation, duration, threshold) {
  const subject = `Slow Operation: ${operation}`;
  const body = `
Operation: ${operation}
Duration: ${duration}ms
Threshold: ${threshold}ms
Slowdown: ${((duration / threshold - 1) * 100).toFixed(1)}%

Action Required: Check performance logs and investigate bottleneck.
  `.trim();

  sendAlert(subject, body, 'MEDIUM');
}
```

**API Failure Alert**:
```javascript
function sendAPIFailureAlert(api, consecutiveFailures, lastError) {
  const subject = `API Failure: ${api}`;
  const body = `
API: ${api}
Consecutive Failures: ${consecutiveFailures}
Last Error: ${lastError}

Action Required: Check API status and credentials.
  `.trim();

  sendAlert(subject, body, 'CRITICAL');
}
```

---

## 📈 SLA Definitions

### SLA Targets

**Service Level Agreements**:
```javascript
const SLA = {
  // Availability
  AVAILABILITY: 0.995,           // 99.5% uptime

  // Performance
  SYNC_COMPLETION_P95: 300000,   // 5 minutes (95th percentile)
  SYNC_COMPLETION_P99: 600000,   // 10 minutes (99th percentile)
  API_LATENCY_P95: 2000,         // 2 seconds (95th percentile)

  // Reliability
  ERROR_RATE_MAX: 0.01,          // <1% error rate
  DATA_QUALITY_MIN: 0.95         // >95% data quality
};
```

---

### SLA Monitoring

**Calculate SLA Compliance**:
```javascript
function calculateSLACompliance(period = 'day') {
  const metrics = getMetricsForPeriod(period);

  const compliance = {
    period,
    timestamp: new Date().toISOString(),
    availability: calculateAvailability(metrics),
    performance: calculatePerformanceCompliance(metrics),
    reliability: calculateReliabilityCompliance(metrics)
  };

  // Check if breached
  if (compliance.availability < SLA.AVAILABILITY) {
    sendSLABreachAlert('Availability', compliance.availability, SLA.AVAILABILITY);
  }

  return compliance;
}

function calculateAvailability(metrics) {
  const totalChecks = metrics.healthChecks.length;
  const healthyChecks = metrics.healthChecks.filter(c => c.status === 'HEALTHY').length;

  return totalChecks > 0 ? (healthyChecks / totalChecks) : 1.0;
}

function calculateP95(values) {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor(sorted.length * 0.95);
  return sorted[index];
}
```

---

## 🔍 Anomaly Detection

### Statistical Anomaly Detection

**Detect outliers**:
```javascript
function detectAnomalies(metricName, recentValues) {
  // Calculate statistics
  const mean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
  const variance = recentValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentValues.length;
  const stdDev = Math.sqrt(variance);

  // Current value
  const current = recentValues[recentValues.length - 1];

  // Z-score
  const zScore = (current - mean) / stdDev;

  // Alert if >3 standard deviations (anomaly)
  if (Math.abs(zScore) > 3) {
    sendAnomalyAlert(metricName, current, mean, stdDev);
    return true;
  }

  return false;
}

function sendAnomalyAlert(metric, value, mean, stdDev) {
  const subject = `Anomaly Detected: ${metric}`;
  const body = `
Metric: ${metric}
Current Value: ${value}
Expected (Mean): ${mean.toFixed(2)}
Standard Deviation: ${stdDev.toFixed(2)}
Z-Score: ${((value - mean) / stdDev).toFixed(2)}

This is ${Math.abs((value - mean) / stdDev).toFixed(1)} standard deviations from normal.
  `.trim();

  sendAlert(subject, body, 'HIGH');
}
```

---

## 🚑 Incident Response

### Incident Detection

**Automatic Incident Creation**:
```javascript
function createIncident(title, severity, description) {
  const incident = {
    id: Utilities.getUuid(),
    title,
    severity,
    description,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    createdBy: 'SYSTEM'
  };

  // Log to Incidents sheet
  const sheet = getOrCreateIncidentsSheet();
  sheet.appendRow([
    incident.id,
    incident.createdAt,
    incident.title,
    incident.severity,
    incident.status,
    incident.description
  ]);

  // Send alert
  sendIncidentAlert(incident);

  return incident;
}

function sendIncidentAlert(incident) {
  const priority = incident.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH';

  sendAlert(
    `Incident ${incident.id}: ${incident.title}`,
    incident.description,
    priority
  );

  sendSlackAlert(`🚨 *INCIDENT*: ${incident.title}\nSeverity: ${incident.severity}\nID: ${incident.id}`);
}
```

---

### Incident Triage Checklist

**Automated Triage**:
```javascript
function triageIncident(incidentId) {
  const checks = {
    apiStatus: checkAllAPIs(),
    recentErrors: getRecentErrors(10),
    systemHealth: healthCheck(),
    recentChanges: getRecentDeployments(),
    affectedUsers: getAffectedUsers()
  };

  // Log triage data
  logTriageData(incidentId, checks);

  return checks;
}
```

---

## 🛡️ Monitoring Best Practices

### Checklist

- [x] **Monitor critical paths** - Focus on user-facing operations
- [x] **Set up alerting before deployment** - Don't deploy blind
- [x] **Define clear SLAs** - Know what "healthy" means
- [x] **Track performance and reliability** - Both matter
- [x] **Alert on anomalies** - Not just thresholds
- [x] **Include context in alerts** - Help responders act fast
- [x] **Regular review** - Are alerts useful or noisy?
- [x] **Document incident response** - Playbooks save time
- [x] **Test alerts** - Verify they actually work
- [x] **Reduce alert fatigue** - Quality > quantity

---

### Anti-Patterns

**❌ Alert on everything**:
- Too many alerts = ignored alerts
- Focus on actionable issues

**❌ No context in alerts**:
- "Error occurred" is useless
- Include: what, when, where, impact

**❌ No escalation path**:
- Critical alerts need immediate response
- Define who gets notified when

---

## 🔗 Related Files

- `platform/logging.md` - Log-based monitoring
- `platform/error-handling.md` - Error rate monitoring
- `security/audit-compliance.md` - Security monitoring
- `platform/performance.md` - Performance metrics

---

**Versione**: 1.0
**Context Size**: ~245 righe
