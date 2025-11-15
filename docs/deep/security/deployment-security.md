# 🔐 Deployment Security

**Categoria**: Security → Deployment & Environments
**Righe**: ~235
**Parent**: `specialists/security-engineer.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Pubblicare web app in produzione
- Gestire multiple environments (dev/staging/prod)
- Configurare access controls per deployment
- Implementare version management
- Pianificare rollback procedures
- Configure security hardening pre-deployment
- Monitor post-deployment security

---

## 🌐 Web App Access Controls

### Deployment Configuration

**doGet/doPost with Access Control**:
```javascript
function doGet(e) {
  // Access control check FIRST
  if (!isAuthorizedAccess(e)) {
    return HtmlService.createHtmlOutput('Unauthorized')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DENY);
  }

  // Serve web app
  return HtmlService.createHtmlOutputFromFile('Index');
}

function isAuthorizedAccess(e) {
  const userEmail = Session.getActiveUser().getEmail();

  // Check if user is authorized
  const authorizedDomain = 'yourcompany.com';
  return userEmail.endsWith(`@${authorizedDomain}`);
}
```

---

### Access Levels Explained

**1. Only Me** (Most Secure):
- **Who can access**: Only the script owner
- **Use for**: Development, testing, admin tools
- **Security**: Highest security, no external access
- **Limitation**: Cannot be used by other users

```javascript
// Deploy as: Execute as "Me", Who has access: "Only myself"
// No additional code needed - Google handles access control
```

---

**2. Anyone Within Domain** (Recommended for Internal Apps):
- **Who can access**: All users in your Google Workspace domain
- **Use for**: Internal business apps, employee tools
- **Security**: Good - limited to domain users
- **Verification**: Always verify domain in code

```javascript
function doGet(e) {
  const userEmail = Session.getActiveUser().getEmail();
  const ALLOWED_DOMAIN = 'yourcompany.com';

  // Verify domain (defense in depth)
  if (!userEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
    return HtmlService.createHtmlOutput('Access Denied: Domain not authorized');
  }

  return HtmlService.createHtmlOutputFromFile('Index');
}
```

---

**3. Anyone (Public)** ⚠️ **HIGH RISK**:
- **Who can access**: Anyone on the internet
- **Use for**: Public-facing tools, open APIs (rare)
- **Security**: CRITICAL security measures required
- **NEVER** expose without proper security hardening

**Security Requirements for Public Web Apps**:
```javascript
function doGet(e) {
  // 1. Rate Limiting
  if (!checkRateLimit(e.parameter.clientId)) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: 'Rate limit exceeded' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // 2. Input Validation (CRITICAL)
  if (!validateInputs(e.parameter)) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: 'Invalid input' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // 3. API Key Authentication
  if (!isValidAPIKey(e.parameter.apiKey)) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: 'Unauthorized' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // 4. CORS Headers (if needed)
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok' })
  )
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', 'https://yourdomain.com');
}

function checkRateLimit(clientId) {
  const cache = CacheService.getScriptCache();
  const key = `ratelimit_${clientId}`;
  const count = parseInt(cache.get(key) || '0');

  const RATE_LIMIT = 100; // requests per hour
  if (count >= RATE_LIMIT) {
    return false;
  }

  cache.put(key, String(count + 1), 3600); // 1 hour TTL
  return true;
}
```

---

## 🌍 Environment Management

### Dev/Staging/Prod Pattern

**Environment Detection**:
```javascript
function getEnvironment() {
  const scriptProps = PropertiesService.getScriptProperties();
  return scriptProps.getProperty('ENVIRONMENT') || 'development';
}

function getEnvironmentConfig() {
  const env = getEnvironment();

  const CONFIGS = {
    'development': {
      BC_API_URL: 'https://api.businesscentral.dynamics.com/v2.0/sandbox',
      CLAUDE_MODEL: 'claude-3-haiku-20240307',
      DEBUG_MODE: true,
      LOG_LEVEL: 'DEBUG',
      RATE_LIMIT: 1000
    },
    'staging': {
      BC_API_URL: 'https://api.businesscentral.dynamics.com/v2.0/staging',
      CLAUDE_MODEL: 'claude-3-sonnet-20240229',
      DEBUG_MODE: true,
      LOG_LEVEL: 'INFO',
      RATE_LIMIT: 500
    },
    'production': {
      BC_API_URL: 'https://api.businesscentral.dynamics.com/v2.0/prod',
      CLAUDE_MODEL: 'claude-3-sonnet-20240229',
      DEBUG_MODE: false,
      LOG_LEVEL: 'ERROR',
      RATE_LIMIT: 100
    }
  };

  return CONFIGS[env];
}

// Usage
function connectToBC() {
  const config = getEnvironmentConfig();
  const apiUrl = config.BC_API_URL;

  if (config.DEBUG_MODE) {
    Logger.log(`Connecting to BC at ${apiUrl}`);
  }

  // Use config
}
```

---

### Environment-Specific Credentials

**Separate Properties per Environment**:
```javascript
// Development environment setup
function setupDevEnvironment() {
  const props = PropertiesService.getScriptProperties();

  props.setProperties({
    'ENVIRONMENT': 'development',
    'BC_CLIENT_ID': 'dev_client_id',
    'BC_CLIENT_SECRET': 'dev_secret',
    'CLAUDE_API_KEY': 'dev_claude_key'
  });
}

// Production environment setup (run separately)
function setupProdEnvironment() {
  const props = PropertiesService.getScriptProperties();

  props.setProperties({
    'ENVIRONMENT': 'production',
    'BC_CLIENT_ID': 'prod_client_id',
    'BC_CLIENT_SECRET': 'prod_secret',
    'CLAUDE_API_KEY': 'prod_claude_key'
  });
}

// CRITICAL: NEVER commit credentials to git
// Run setup functions manually in each environment
```

---

## 📦 Version Management

### Deployment Versions Strategy

**HEAD vs Versioned Deployments**:

**HEAD Deployment** (Latest Code):
- **Use for**: Development, testing
- **Behavior**: Always runs latest code version
- **Risk**: Breaking changes immediately affect all users
- **URL Pattern**: `https://script.google.com/macros/s/.../exec` (no version)

**Versioned Deployment** (Stable Release):
- **Use for**: Production
- **Behavior**: Runs specific code version (immutable)
- **Safety**: Changes don't affect deployed version until explicitly updated
- **URL Pattern**: `https://script.google.com/macros/s/.../exec?v=1`

---

### Version Tagging Pattern

**Version Naming Convention**:
```
Format: v{major}.{minor}.{patch}
Example: v1.2.3

major: Breaking changes (v1 → v2)
minor: New features (v1.0 → v1.1)
patch: Bug fixes (v1.0.0 → v1.0.1)
```

**Version Documentation**:
```javascript
/**
 * GAS-AGENT System
 *
 * @version 1.2.3
 * @date 2024-01-15
 * @changelog
 *   v1.2.3 (2024-01-15):
 *     - Fixed OAuth token refresh bug
 *     - Improved error handling in BC sync
 *   v1.2.0 (2024-01-10):
 *     - Added TOON encoding for Claude API
 *     - Implemented batch processing for Sheets
 *   v1.0.0 (2024-01-01):
 *     - Initial release
 */
```

---

### Creating New Version Deployment

**Checklist Before Deploying**:
1. ✅ All tests passed
2. ✅ Code review completed
3. ✅ Changelog updated
4. ✅ Version number incremented
5. ✅ Security review done
6. ✅ Rollback plan documented

**Deployment Steps**:
1. **Deploy** → **New deployment**
2. Select **Web app** type
3. **Description**: "v1.2.3 - Bug fixes"
4. **Execute as**: Me (or User accessing web app)
5. **Who has access**: Set appropriate level
6. Click **Deploy**
7. **CRITICAL**: Save deployment ID and URL

---

## 🔄 Rollback Procedures

### When to Rollback

**Rollback Criteria** (ANY of these):
- ❌ Critical bug affecting users
- ❌ Security vulnerability discovered
- ❌ Data corruption occurring
- ❌ Error rate >5% of requests
- ❌ Performance degradation >50%
- ❌ Integration failures (BC, Claude API)

---

### How to Rollback

**Step-by-Step Rollback**:
```
1. Identify previous stable version
   - Check deployment list
   - Find last known good version (e.g., v1.2.2)

2. Update web app URL to previous version
   - Copy previous deployment URL
   - Update all references to use old URL

   OR

   - Deploy → Manage deployments
   - Click on previous version
   - Click "..." → "Use this version"

3. Verify rollback successful
   - Test critical user flows
   - Check error logs
   - Verify integrations working

4. Communicate to users
   - Notify of temporary rollback
   - Provide ETA for fix

5. Fix bug in code
   - Debug issue in development
   - Test thoroughly
   - Deploy new version when ready
```

---

### Testing After Rollback

**Validation Checklist**:
- [ ] Web app loads successfully
- [ ] Authentication working
- [ ] Core features functional
- [ ] BC integration working
- [ ] Claude API calls successful
- [ ] Error rate returned to baseline (<1%)
- [ ] No data corruption
- [ ] User feedback positive

---

## 🛡️ Pre-Deployment Security Checklist

### CRITICAL Security Checks

Before deploying to production:

- [ ] **Credentials**: All credentials in Properties (NEVER hardcoded)
- [ ] **Input Validation**: All user inputs validated (client + server side)
- [ ] **Error Handling**: All errors caught, NO stack traces exposed to users
- [ ] **Logging**: Configured properly, NO sensitive data logged
- [ ] **HTTPS**: All external API calls use HTTPS
- [ ] **Rate Limiting**: Implemented for public endpoints
- [ ] **Authorization**: Access control checks on ALL endpoints
- [ ] **XSS Prevention**: All user input sanitized before display
- [ ] **CORS**: Configured properly (if applicable)
- [ ] **Security Review**: Peer review completed
- [ ] **Rollback Plan**: Documented and tested
- [ ] **Environment Config**: Correct environment variables set
- [ ] **Version Tag**: Version number updated in code + changelog
- [ ] **Backup**: Previous version deployment ID saved
- [ ] **Monitoring**: Alerts configured for errors/security events

---

## 📊 Post-Deployment Monitoring

### What to Monitor

**Immediately After Deployment (First 1 Hour)**:
```javascript
function postDeploymentHealthCheck() {
  const checks = {
    errorRate: getErrorRate(),           // Should be <1%
    responseTime: getAvgResponseTime(),  // Should be <2s
    authFailures: getAuthFailureCount(), // Should be 0
    bcIntegration: testBCConnection(),   // Should be true
    claudeAPI: testClaudeConnection()    // Should be true
  };

  // Alert if any check fails
  Object.entries(checks).forEach(([check, value]) => {
    if (isCritical(check, value)) {
      sendAlert(`Post-deployment check failed: ${check} = ${value}`);
    }
  });

  return checks;
}
```

**Ongoing Monitoring**:
- Error rate (alert if >2%)
- Unauthorized access attempts (alert if >10/hour)
- API call failures (BC, Claude) (alert if >5%)
- Execution time (alert if >5 minutes)
- Properties access (audit log)
- User feedback/complaints

---

### Alert Triggers

**CRITICAL Alerts** (Immediate Notification):
```javascript
function setupCriticalAlerts() {
  // Run every 5 minutes via trigger
  const errorRate = getErrorRate();
  if (errorRate > 0.05) { // 5%
    sendUrgentAlert(`CRITICAL: Error rate at ${errorRate * 100}%`);
  }

  const authFailures = getAuthFailureCount();
  if (authFailures > 50) {
    sendUrgentAlert(`CRITICAL: ${authFailures} auth failures - possible attack`);
  }
}

function sendUrgentAlert(message) {
  MailApp.sendEmail({
    to: 'devops@yourcompany.com',
    subject: '🚨 URGENT: GAS-AGENT Production Alert',
    body: `${message}\n\nTimestamp: ${new Date().toISOString()}\n\nAction required immediately.`
  });
}
```

**HIGH Priority Alerts** (Within 1 Hour):
- Integration failures (BC, Claude API)
- Performance degradation >50%
- Unusual traffic patterns

**MEDIUM Priority Alerts** (Daily Digest):
- Warning-level errors
- Deprecated API usage
- Quota approaching limits

---

## 🔒 Deployment Security Best Practices

### DO:
- **ALWAYS** deploy versioned releases to production (not HEAD)
- **ALWAYS** test in dev/staging before prod
- **ALWAYS** have rollback plan ready
- **IMPLEMENT** access control appropriate to use case
- **MONITOR** error rates immediately after deployment
- **DOCUMENT** deployment changes in changelog
- **BACKUP** previous deployment ID before updating
- **TEST** rollback procedure in staging
- **USE** environment-specific credentials

### DON'T:
- **NEVER** deploy untested code to production
- **NEVER** use "Anyone" access without security hardening
- **NEVER** expose stack traces to users
- **NEVER** deploy without backup/rollback plan
- **NEVER** commit credentials to git
- **NEVER** skip security checklist
- **NEVER** deploy on Friday afternoon (limited support window)

---

## 🔗 Related Files

- `security/authorization.md` - Access control implementation
- `platform/monitoring.md` - Monitoring and alerting setup
- `security/audit-compliance.md` - Deployment audit logs
- `security/properties-security.md` - Environment-specific credentials

---

**Versione**: 1.0
**Context Size**: ~235 righe
