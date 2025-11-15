# 🔐 Properties Security

**Categoria**: Security → Credentials & Secrets Storage
**Righe**: ~220
**Parent**: `specialists/security-engineer.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Salvare credentials in modo sicuro
- Gestire API keys, client secrets
- Configurare environment-specific settings
- Implementare secret rotation
- Scegliere tra User/Script/Document Properties
- Handle property size limits

---

## 📚 PropertiesService Overview

### User vs Script vs Document Properties

**Script Properties** (Shared across all users):
```javascript
// Use for: Service account credentials, API keys, system-wide configuration
const scriptProps = PropertiesService.getScriptProperties();
scriptProps.setProperty('BC_CLIENT_ID', 'abc123');
scriptProps.setProperty('BC_CLIENT_SECRET', 'secret456');
```

**Best for**: OAuth2 client credentials, API endpoints, third-party API keys, system configuration.

**⚠️ WARNING**: Accessible by ALL users with script access. NEVER store user-specific tokens here.

---

**User Properties** (Per-user, isolated):
```javascript
// Use for: User OAuth tokens, user-specific settings
const userProps = PropertiesService.getUserProperties();
userProps.setProperty('USER_ACCESS_TOKEN', 'user_token_abc');
userProps.setProperty('USER_REFRESH_TOKEN', 'refresh_xyz');
```

**Best for**: User OAuth tokens, user preferences, user-specific API keys.

**✅ ALWAYS** use for user authorization tokens (OAuth, personal API keys).

---

**Document Properties** (Bound to spreadsheet):
```javascript
// Use for: Document-specific configuration
const docProps = PropertiesService.getDocumentProperties();
docProps.setProperty('SPREADSHEET_MODE', 'production');
docProps.setProperty('DATA_SOURCE', 'BC_PROD');
```

**Best for**: Spreadsheet-specific config, document metadata.

**Portable**: Moves with the spreadsheet when copied.

---

### Decision Matrix

| Property Type | Use Case | Visibility | Portability |
|--------------|----------|------------|-------------|
| **Script** | System credentials, API keys | All users | No (stays with script) |
| **User** | User tokens, preferences | Only that user | No (user-specific) |
| **Document** | Spreadsheet config | All users of doc | Yes (copies with sheet) |

---

## 🔒 Storage Patterns

### Secure Credential Storage

**Setting Properties (Script Credentials)**:
```javascript
function setupScriptCredentials() {
  const scriptProps = PropertiesService.getScriptProperties();

  // Set all credentials in one batch (atomic operation)
  scriptProps.setProperties({
    'BC_CLIENT_ID': 'YOUR_CLIENT_ID',
    'BC_CLIENT_SECRET': 'YOUR_CLIENT_SECRET',
    'BC_TENANT_ID': 'YOUR_TENANT_ID',
    'BC_ENVIRONMENT': 'production',
    'CLAUDE_API_KEY': 'YOUR_CLAUDE_KEY'
  }, false); // false = don't delete other properties

  Logger.log('✅ Script credentials configured');
}
```

**⚠️ CRITICAL**: Run `setupScriptCredentials()` once manually. NEVER commit credentials to git.

---

**Retrieving Credentials with Error Handling**:
```javascript
function getRequiredProperty(propertyName) {
  const scriptProps = PropertiesService.getScriptProperties();
  const value = scriptProps.getProperty(propertyName);

  if (!value) {
    throw new Error(
      `Missing required property: ${propertyName}. ` +
      `Run setupScriptCredentials() to configure.`
    );
  }

  return value;
}

// Usage
function connectToBC() {
  try {
    const clientId = getRequiredProperty('BC_CLIENT_ID');
    const clientSecret = getRequiredProperty('BC_CLIENT_SECRET');

    // Use credentials
  } catch (e) {
    Logger.log(`Configuration error: ${e.message}`);
    throw e;
  }
}
```

---

### SecurePropertiesManager Pattern

**Centralized Properties Access**:
```javascript
/**
 * Secure wrapper for PropertiesService with validation and error handling
 */
const SecurePropertiesManager = (function() {

  const REQUIRED_SCRIPT_PROPERTIES = [
    'BC_CLIENT_ID',
    'BC_CLIENT_SECRET',
    'BC_TENANT_ID',
    'CLAUDE_API_KEY'
  ];

  /**
   * Validate all required properties are set
   */
  function validateConfiguration() {
    const scriptProps = PropertiesService.getScriptProperties();
    const missing = [];

    REQUIRED_SCRIPT_PROPERTIES.forEach(prop => {
      if (!scriptProps.getProperty(prop)) {
        missing.push(prop);
      }
    });

    if (missing.length > 0) {
      throw new Error(
        `Missing required properties: ${missing.join(', ')}. ` +
        `Run setupScriptCredentials() first.`
      );
    }
  }

  /**
   * Get script property with validation
   */
  function getScriptProperty(key) {
    const value = PropertiesService.getScriptProperties().getProperty(key);

    if (!value) {
      throw new Error(`Missing property: ${key}`);
    }

    return value;
  }

  /**
   * Get user property (safe, returns null if missing)
   */
  function getUserProperty(key) {
    return PropertiesService.getUserProperties().getProperty(key);
  }

  /**
   * Set user property
   */
  function setUserProperty(key, value) {
    PropertiesService.getUserProperties().setProperty(key, value);
  }

  /**
   * Get all BC credentials
   */
  function getBCCredentials() {
    return {
      clientId: getScriptProperty('BC_CLIENT_ID'),
      clientSecret: getScriptProperty('BC_CLIENT_SECRET'),
      tenantId: getScriptProperty('BC_TENANT_ID'),
      environment: getScriptProperty('BC_ENVIRONMENT')
    };
  }

  /**
   * Get Claude API credentials
   */
  function getClaudeCredentials() {
    return {
      apiKey: getScriptProperty('CLAUDE_API_KEY')
    };
  }

  // Public API
  return {
    validateConfiguration,
    getScriptProperty,
    getUserProperty,
    setUserProperty,
    getBCCredentials,
    getClaudeCredentials
  };

})();

// Usage
function syncWithBC() {
  // Validate config on startup
  SecurePropertiesManager.validateConfiguration();

  const bcCreds = SecurePropertiesManager.getBCCredentials();
  // Use credentials
}
```

---

## 🌍 Environment-Specific Configs

### Multi-Environment Pattern

**Environment Detection**:
```javascript
function getEnvironment() {
  const scriptProps = PropertiesService.getScriptProperties();
  return scriptProps.getProperty('ENVIRONMENT') || 'development';
}

function getConfig() {
  const env = getEnvironment();

  const CONFIG = {
    'development': {
      BC_API_URL: 'https://api.businesscentral.dynamics.com/v2.0/dev',
      CLAUDE_MODEL: 'claude-3-haiku-20240307', // Cheaper for dev
      LOG_LEVEL: 'DEBUG',
      BATCH_SIZE: 10 // Smaller batches for testing
    },
    'staging': {
      BC_API_URL: 'https://api.businesscentral.dynamics.com/v2.0/staging',
      CLAUDE_MODEL: 'claude-3-sonnet-20240229',
      LOG_LEVEL: 'INFO',
      BATCH_SIZE: 100
    },
    'production': {
      BC_API_URL: 'https://api.businesscentral.dynamics.com/v2.0/prod',
      CLAUDE_MODEL: 'claude-3-sonnet-20240229',
      LOG_LEVEL: 'ERROR',
      BATCH_SIZE: 500
    }
  };

  return CONFIG[env];
}

// Usage
function processOrders() {
  const config = getConfig();
  const apiUrl = config.BC_API_URL;
  const batchSize = config.BATCH_SIZE;

  // Use environment-specific config
}
```

---

## 🔄 Secret Rotation Strategies

### Manual Rotation Procedure

**Step-by-Step Process**:
1. Generate new credentials in external system (Azure AD, API provider)
2. Set new credentials in Script Properties (use temporary key name)
3. Test with new credentials
4. Update primary key name
5. Delete old credentials
6. Document rotation in audit log

**Implementation**:
```javascript
function rotateClientSecret() {
  const scriptProps = PropertiesService.getScriptProperties();

  // Step 1: Get new secret (manually generated in Azure AD)
  const newSecret = 'NEW_SECRET_HERE'; // Replace with actual new secret

  // Step 2: Store with temporary name
  scriptProps.setProperty('BC_CLIENT_SECRET_NEW', newSecret);

  // Step 3: Test with new secret
  try {
    testBCConnection('BC_CLIENT_SECRET_NEW');
    Logger.log('✅ New secret works!');

    // Step 4: Update primary key
    scriptProps.setProperty('BC_CLIENT_SECRET', newSecret);

    // Step 5: Delete temporary key
    scriptProps.deleteProperty('BC_CLIENT_SECRET_NEW');

    // Step 6: Log rotation
    logSecurityEvent('CLIENT_SECRET_ROTATED', {
      timestamp: new Date().toISOString()
    });

    Logger.log('✅ Secret rotation complete');
  } catch (e) {
    Logger.log(`❌ New secret failed: ${e.message}`);
    Logger.log('Old secret still active. Fix new secret and retry.');
    throw e;
  }
}

function testBCConnection(secretPropertyName) {
  const scriptProps = PropertiesService.getScriptProperties();
  const clientSecret = scriptProps.getProperty(secretPropertyName);

  // Attempt token fetch with new secret
  // ... (use oauth2-patterns.md getServiceAccountToken logic)
}
```

---

### Automated Rotation Monitoring

**Alert When Credentials Aging**:
```javascript
function checkCredentialAge() {
  const scriptProps = PropertiesService.getScriptProperties();
  const lastRotation = scriptProps.getProperty('CREDENTIALS_LAST_ROTATION');

  if (!lastRotation) {
    Logger.log('⚠️ WARNING: No rotation date set. Set CREDENTIALS_LAST_ROTATION property.');
    return;
  }

  const rotationDate = new Date(lastRotation);
  const now = new Date();
  const daysSinceRotation = (now - rotationDate) / (1000 * 60 * 60 * 24);

  const ROTATION_THRESHOLD = 90; // 90 days
  const WARNING_THRESHOLD = 75;  // 75 days

  if (daysSinceRotation > ROTATION_THRESHOLD) {
    // CRITICAL: Send alert
    MailApp.sendEmail({
      to: 'admin@example.com',
      subject: '🚨 URGENT: Credentials Need Rotation',
      body: `Credentials are ${Math.floor(daysSinceRotation)} days old (threshold: ${ROTATION_THRESHOLD} days).\n\nRotate immediately.`
    });
  } else if (daysSinceRotation > WARNING_THRESHOLD) {
    // WARNING: Send reminder
    Logger.log(`⚠️ Credentials are ${Math.floor(daysSinceRotation)} days old. Rotation recommended.`);
  }
}

// Run weekly via trigger
function weeklySecurityAudit() {
  checkCredentialAge();
}
```

---

## 📏 Size Limits & Workarounds

### Properties Size Limits

**Limits**:
- Single property value: **9 KB**
- Total properties per store: **500 KB**
- Property key length: **8 KB**

**Workaround for Large Values (Chunking)**:
```javascript
function setLargeProperty(key, largeValue) {
  const CHUNK_SIZE = 8000; // 8KB chunks (safe under 9KB limit)
  const chunks = [];

  for (let i = 0; i < largeValue.length; i += CHUNK_SIZE) {
    chunks.push(largeValue.substring(i, i + CHUNK_SIZE));
  }

  const scriptProps = PropertiesService.getScriptProperties();

  // Store chunk count
  scriptProps.setProperty(`${key}_CHUNK_COUNT`, String(chunks.length));

  // Store each chunk
  chunks.forEach((chunk, index) => {
    scriptProps.setProperty(`${key}_CHUNK_${index}`, chunk);
  });
}

function getLargeProperty(key) {
  const scriptProps = PropertiesService.getScriptProperties();
  const chunkCount = parseInt(scriptProps.getProperty(`${key}_CHUNK_COUNT`) || '0');

  if (chunkCount === 0) {
    return null;
  }

  let value = '';
  for (let i = 0; i < chunkCount; i++) {
    value += scriptProps.getProperty(`${key}_CHUNK_${i}`);
  }

  return value;
}
```

---

## 🛡️ Security Best Practices

### ✅ DO:
- **ALWAYS** store credentials in Script Properties (NEVER hardcode)
- **ALWAYS** validate required properties on startup
- **ALWAYS** use User Properties for user-specific tokens
- **DOCUMENT** required properties in README
- **IMPLEMENT** error handling for missing properties
- **AUDIT** properties regularly (who has access, what's stored)
- **ROTATE** credentials every 90 days
- **DELETE** unused properties immediately
- **USE** meaningful property names (BC_CLIENT_ID not KEY1)

### ❌ DON'T:
- **NEVER** log property values (Logger.log includes in stackdriver)
- **NEVER** commit credentials to git
- **NEVER** store user tokens in Script Properties (shared!)
- **NEVER** hardcode fallback credentials
- **NEVER** store unencrypted PII in properties
- **NEVER** share Script Properties across projects (duplicate instead)

---

## 🔗 Related Files

- `security/oauth2-patterns.md` - OAuth2 token storage patterns
- `security/deployment-security.md` - Deployment environment security
- `security/sensitive-data.md` - PII and sensitive data handling

---

**Versione**: 1.0
**Context Size**: ~220 righe
