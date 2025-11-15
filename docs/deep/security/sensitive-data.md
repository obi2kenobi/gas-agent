# 🔐 Sensitive Data Handling

**Categoria**: Security → PII & Data Protection
**Righe**: ~260
**Parent**: `specialists/security-engineer.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Processare PII (Personally Identifiable Information)
- Gestire dati finanziari
- Assicurare GDPR compliance
- Implementare data encryption
- Anonimizzare/pseudonimizzare dati
- Implementare right to erasure
- Data retention policies

---

## 📊 PII Identification & Classification

### Cosa Costituisce PII

**Direct Identifiers** (CRITICAL):
- Full name
- Email address
- Phone number
- Physical address
- SSN / Tax IDs
- Passport / Driver's license numbers
- Biometric data (fingerprints, facial recognition)
- IP addresses (in some jurisdictions)

**Sensitive PII** (CRITICAL + Special Protections):
- Financial data (credit cards, bank accounts)
- Health information (medical records, diagnoses)
- Racial/ethnic origin
- Political opinions
- Religious beliefs
- Trade union membership
- Sexual orientation
- Criminal history

**Quasi-Identifiers** (HIGH):
- Date of birth
- Postal code
- Gender
- Job title
- Employer name

**Combination Risk**: Quasi-identifiers TOGETHER can identify individuals (e.g., "45-year-old female CEO in ZIP 12345").

---

### Data Classification Levels

| Level | Examples | Protection Required |
|-------|----------|---------------------|
| **CRITICAL** | SSN, credit cards, passwords | Encryption at rest, strict access control, audit logs |
| **HIGH** | Full name + address, health data | Encryption, limited access, audit logs |
| **MEDIUM** | Email, phone, company name | Access control, safe logging |
| **LOW** | Public data, aggregated statistics | Standard security practices |

---

## 🔒 Data Encryption

### At Rest Encryption (GAS Limitation)

**⚠️ GAS Limitation**: PropertiesService and Sheets do NOT encrypt at rest by default. Google encrypts storage, but script editors can read plaintext.

**Best Practice**: Encrypt sensitive data before storing.

**Simple Encryption Pattern**:
```javascript
/**
 * Encrypt sensitive data using AES-like approach
 * NOTE: This is obfuscation, not cryptographic encryption (GAS lacks native crypto)
 * For true encryption, send to external service with proper key management
 */
function encryptData(plaintext, secretKey) {
  // XOR-based obfuscation (better than plaintext, not cryptographically secure)
  const key = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, secretKey);
  const plaintextBytes = Utilities.newBlob(plaintext).getBytes();

  const encrypted = plaintextBytes.map((byte, idx) => {
    return byte ^ key[idx % key.length];
  });

  return Utilities.base64Encode(encrypted);
}

function decryptData(encryptedBase64, secretKey) {
  const key = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, secretKey);
  const encryptedBytes = Utilities.base64Decode(encryptedBase64);

  const decrypted = encryptedBytes.map((byte, idx) => {
    return byte ^ key[idx % key.length];
  });

  return Utilities.newBlob(decrypted).getDataAsString();
}

// Usage
function storeEncryptedPII() {
  const secretKey = PropertiesService.getScriptProperties().getProperty('ENCRYPTION_KEY');
  const ssn = '123-45-6789';

  const encrypted = encryptData(ssn, secretKey);
  PropertiesService.getUserProperties().setProperty('USER_SSN_ENC', encrypted);
}

function retrieveEncryptedPII() {
  const secretKey = PropertiesService.getScriptProperties().getProperty('ENCRYPTION_KEY');
  const encrypted = PropertiesService.getUserProperties().getProperty('USER_SSN_ENC');

  const decrypted = decryptData(encrypted, secretKey);
  return decrypted;
}
```

**⚠️ WARNING**: This is **obfuscation**, not military-grade encryption. For highly sensitive data, use external encryption service.

---

### In Transit Security

**HTTPS Enforcement**:
```javascript
function fetchSecureAPI(url, data) {
  // ALWAYS use HTTPS
  if (!url.startsWith('https://')) {
    throw new Error('Security violation: Must use HTTPS for sensitive data');
  }

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(data),
    muteHttpExceptions: true
  });

  return response;
}
```

**TLS Verification**: GAS UrlFetchApp automatically verifies TLS certificates. Do NOT use `validateHttpsCertificates: false`.

---

## 🎯 Data Minimization

### Principle: Collect Only What's Necessary

**❌ BAD - Collect Everything**:
```javascript
function collectUserData(user) {
  return {
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    address: user.address,
    ssn: user.ssn,
    dateOfBirth: user.dateOfBirth,
    creditCard: user.creditCard
    // ... everything
  };
}
```

**✅ GOOD - Collect Minimum Required**:
```javascript
function collectOrderData(user) {
  // Only collect what's needed for the order
  return {
    userId: user.id,              // Non-PII identifier
    email: user.email,            // Needed for confirmation
    shippingAddress: user.address // Needed for delivery
    // NO: SSN, creditCard, dateOfBirth (not needed for order)
  };
}
```

### Implementation Checklist

- [ ] **Purpose Limitation**: Define WHY each field is collected
- [ ] **Storage Limitation**: Define HOW LONG data is kept
- [ ] **Data Retention**: Auto-delete after retention period
- [ ] **Access Control**: Limit who can access PII
- [ ] **Regular Audits**: Review what's stored, purge unnecessary data

---

## 📝 Safe Logging Practices

### ❌ NEVER Log

**Sensitive Data** (NEVER in Logger.log or console):
```javascript
// ❌ CRITICAL SECURITY VIOLATION
Logger.log(`User password: ${password}`);
Logger.log(`Credit card: ${creditCard}`);
Logger.log(`OAuth token: ${token}`);
Logger.log(`SSN: ${ssn}`);
Logger.log(`Full user: ${JSON.stringify(user)}`); // May contain PII
```

---

### ✅ Safe to Log

**Safe Logging Patterns**:
```javascript
// ✅ Log non-PII identifiers
Logger.log(`Processing user ID: ${userId}`);

// ✅ Log operation types
Logger.log(`Sync operation started: ${operationType}`);

// ✅ Log masked/partial data
function maskCreditCard(cardNumber) {
  return `****-****-****-${cardNumber.slice(-4)}`;
}
Logger.log(`Payment processed: ${maskCreditCard(card)}`);

// ✅ Log aggregated statistics
Logger.log(`Processed ${count} orders with avg value ${avgValue}`);

// ✅ Log timestamps
Logger.log(`Last sync: ${new Date().toISOString()}`);
```

---

### Redaction Helper

**Automatic PII Redaction**:
```javascript
function redactPII(data) {
  const redacted = { ...data };

  const PII_FIELDS = [
    'password', 'ssn', 'creditCard', 'cardNumber',
    'token', 'secret', 'apiKey', 'accessToken'
  ];

  PII_FIELDS.forEach(field => {
    if (field in redacted) {
      redacted[field] = '[REDACTED]';
    }
  });

  return redacted;
}

// Usage
function safeLog(label, data) {
  const redacted = redactPII(data);
  Logger.log(`${label}: ${JSON.stringify(redacted)}`);
}

// Example
const user = {
  userId: 'U123',
  email: 'user@example.com',
  password: 'secret123',
  ssn: '123-45-6789'
};

safeLog('Processing user', user);
// Logs: "Processing user: {userId: 'U123', email: 'user@example.com', password: '[REDACTED]', ssn: '[REDACTED]'}"
```

---

## 🎭 Data Anonymization & Pseudonymization

### Hashing (One-Way, Irreversible)

**Use for**: When you need to match records but don't need original value.

```javascript
function hashPII(value) {
  const hash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    value,
    Utilities.Charset.UTF_8
  );

  return hash.map(byte => {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}

// Example: Store hashed email for deduplication without storing actual email
function storeAnonymizedUser(email) {
  const hashedEmail = hashPII(email);

  // Store only hash (cannot reverse to original email)
  sheet.appendRow([hashedEmail, new Date()]);
}

// Check if user exists without storing email
function userExists(email) {
  const hashedEmail = hashPII(email);
  const data = sheet.getDataRange().getValues();

  return data.some(row => row[0] === hashedEmail);
}
```

---

### Masking (Partial Hiding)

**Use for**: Display purposes, user feedback.

```javascript
function maskEmail(email) {
  const [local, domain] = email.split('@');
  const maskedLocal = local[0] + '***' + local[local.length - 1];
  return `${maskedLocal}@${domain}`;
}

function maskPhone(phone) {
  // Show last 4 digits only
  return `***-***-${phone.slice(-4)}`;
}

function maskSSN(ssn) {
  return `***-**-${ssn.slice(-4)}`;
}

// Usage
Logger.log(maskEmail('john.doe@example.com')); // j***e@example.com
Logger.log(maskPhone('555-123-4567'));         // ***-***-4567
```

---

### Aggregation (Group Statistics)

**Use for**: Reporting without individual identification.

```javascript
function generateAggregatedReport() {
  const users = getUserData(); // Contains PII

  // Aggregate WITHOUT exposing individual PII
  const report = {
    totalUsers: users.length,
    averageAge: users.reduce((sum, u) => sum + u.age, 0) / users.length,
    locationBreakdown: users.reduce((acc, u) => {
      const city = u.city;
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {})
  };

  // Report contains NO individual PII
  return report;
}
```

---

## ⚖️ GDPR Compliance Patterns

### Right to Access

**User can request their data**:
```javascript
function exportUserData(userId) {
  const user = getUserById(userId);

  // Export all data we have about user
  const userData = {
    profile: user.profile,
    orders: getOrdersByUserId(userId),
    preferences: getUserPreferences(userId),
    loginHistory: getLoginHistory(userId)
  };

  // Create downloadable JSON
  const blob = Utilities.newBlob(
    JSON.stringify(userData, null, 2),
    'application/json',
    `user_data_${userId}.json`
  );

  return blob;
}
```

---

### Right to Erasure (Right to be Forgotten)

**User can request deletion**:
```javascript
function deleteUserData(userId) {
  // 1. Delete from all storage locations
  deleteUserProfile(userId);
  deleteUserOrders(userId);
  deleteUserPreferences(userId);
  deleteUserTokens(userId);

  // 2. Anonymize historical records (if needed for compliance/auditing)
  anonymizeHistoricalRecords(userId);

  // 3. Log deletion for audit trail
  logSecurityEvent('USER_DATA_DELETED', {
    userId,
    timestamp: new Date().toISOString(),
    requestedBy: Session.getActiveUser().getEmail()
  });

  // 4. Send confirmation
  MailApp.sendEmail({
    to: getUserEmail(userId),
    subject: 'Data Deletion Confirmation',
    body: 'Your data has been permanently deleted from our systems.'
  });
}

function anonymizeHistoricalRecords(userId) {
  // Replace PII with anonymized values in audit logs
  const auditSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AuditLog');
  const data = auditSheet.getDataRange().getValues();

  data.forEach((row, idx) => {
    if (row[0] === userId) {
      // Keep userId for referential integrity, remove other PII
      row[2] = '[DELETED]'; // email
      row[3] = '[DELETED]'; // name
      auditSheet.getRange(idx + 1, 1, 1, row.length).setValues([row]);
    }
  });
}
```

---

### Consent Management

**Track user consent**:
```javascript
function recordConsent(userId, consentType) {
  const consentSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Consents');

  consentSheet.appendRow([
    userId,
    consentType,           // 'EMAIL_MARKETING', 'DATA_PROCESSING', etc.
    new Date(),
    Session.getActiveUser().getEmail(),
    'GRANTED'
  ]);
}

function checkConsent(userId, consentType) {
  const consentSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Consents');
  const data = consentSheet.getDataRange().getValues();

  // Find most recent consent record
  const consent = data.reverse().find(row => {
    return row[0] === userId && row[1] === consentType;
  });

  return consent && consent[4] === 'GRANTED';
}

// Usage
function sendMarketingEmail(userId) {
  if (!checkConsent(userId, 'EMAIL_MARKETING')) {
    throw new Error('User has not consented to marketing emails');
  }

  // Send email
}
```

---

### Data Retention Policy

**Auto-delete after retention period**:
```javascript
function enforceDataRetention() {
  const RETENTION_DAYS = {
    'SESSION_LOGS': 30,
    'ORDER_HISTORY': 365 * 7,  // 7 years (legal requirement)
    'USER_ACTIVITY': 90
  };

  const now = new Date();

  Object.entries(RETENTION_DAYS).forEach(([dataType, days]) => {
    const cutoffDate = new Date(now - days * 24 * 60 * 60 * 1000);
    deleteDataOlderThan(dataType, cutoffDate);
  });
}

function deleteDataOlderThan(dataType, cutoffDate) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(dataType);
  const data = sheet.getDataRange().getValues();

  // Find rows older than cutoff
  const rowsToDelete = [];
  data.forEach((row, idx) => {
    const timestamp = new Date(row[1]); // Assuming column B is timestamp
    if (timestamp < cutoffDate) {
      rowsToDelete.push(idx + 1);
    }
  });

  // Delete in reverse order (to avoid index shifting)
  rowsToDelete.reverse().forEach(rowNum => {
    sheet.deleteRow(rowNum);
  });

  Logger.log(`Deleted ${rowsToDelete.length} rows from ${dataType} (older than ${cutoffDate})`);
}
```

---

## 🛡️ Security Best Practices

### DO:
- **ALWAYS** encrypt sensitive data at rest
- **ALWAYS** use HTTPS for data in transit
- **ALWAYS** implement access control for PII
- **ALWAYS** log access to sensitive data (audit trail)
- **IMPLEMENT** data retention policies
- **PROVIDE** user data export (right to access)
- **IMPLEMENT** user data deletion (right to erasure)
- **DOCUMENT** lawful basis for processing
- **OBTAIN** explicit consent for sensitive processing
- **TRAIN** team on PII handling

### DON'T:
- **NEVER** log PII in plaintext
- **NEVER** store PII longer than necessary
- **NEVER** share PII without consent
- **NEVER** process PII without lawful basis
- **NEVER** ignore data breach notifications (72h GDPR requirement)
- **NEVER** use PII for purposes beyond original consent

---

## 🔗 Related Files

- `security/audit-compliance.md` - Audit logging for PII access
- `platform/logging.md` - Safe logging practices
- `security/authorization.md` - Access control for sensitive data
- `security/properties-security.md` - Secure credential storage

---

**Versione**: 1.0
**Context Size**: ~260 righe
