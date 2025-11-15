# 🛠️ Logging & Debugging

**Categoria**: Platform → Logging Strategies
**Righe**: ~235
**Parent**: `specialists/platform-engineer.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Implementare structured logging
- Debuggare problemi in production
- Configurare log levels
- Integrare con Stackdriver
- Analizzare log patterns
- Implement correlation IDs for distributed tracing

---

## 📝 Structured Logging Pattern

### Log Entry Format

**Standard Structure**:
```javascript
const StructuredLog = {
  timestamp: 'ISO8601',
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',
  message: 'string',
  context: {
    function: 'string',          // Function name
    operationId: 'string',        // Correlation ID
    userId: 'string',             // User email (masked)
    duration: 'number',           // Execution time (ms)
    // Domain-specific fields
    orderId: 'string',
    status: 'string'
  },
  error: {                        // If level === ERROR
    message: 'string',
    stack: 'string',
    code: 'string'
  }
};
```

---

### Logger Implementation

**Structured Logger Wrapper**:
```javascript
const StructuredLogger = (function() {

  const LEVEL = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
  };

  // Get current log level from environment
  function getCurrentLevel() {
    const env = PropertiesService.getScriptProperties().getProperty('ENVIRONMENT') || 'development';
    const LOG_LEVELS = {
      'development': LEVEL.DEBUG,
      'staging': LEVEL.INFO,
      'production': LEVEL.ERROR
    };
    return LOG_LEVELS[env];
  }

  function log(level, message, context = {}) {
    const currentLevel = getCurrentLevel();

    // Skip if below current level
    if (LEVEL[level] < currentLevel) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        function: context.function || 'unknown',
        operationId: context.operationId || generateOperationId(),
        userId: context.userId || Session.getActiveUser().getEmail(),
        ...context
      }
    };

    // Log to Logger (Stackdriver)
    Logger.log(JSON.stringify(logEntry));

    // Also log to console for Cloud Logging
    console.log(level, message, logEntry.context);
  }

  function debug(message, context) {
    log('DEBUG', message, context);
  }

  function info(message, context) {
    log('INFO', message, context);
  }

  function warn(message, context) {
    log('WARN', message, context);
  }

  function error(message, errorObj, context = {}) {
    const errorContext = {
      ...context,
      error: {
        message: errorObj.message || String(errorObj),
        stack: errorObj.stack || '',
        code: errorObj.code || 'UNKNOWN'
      }
    };
    log('ERROR', message, errorContext);
  }

  function generateOperationId() {
    return Utilities.getUuid();
  }

  return {
    debug,
    info,
    warn,
    error,
    LEVEL
  };

})();

// Usage
function processOrder(orderId) {
  const operationId = Utilities.getUuid();

  StructuredLogger.info('Processing order started', {
    function: 'processOrder',
    operationId,
    orderId
  });

  try {
    const result = performProcessing(orderId);

    StructuredLogger.info('Processing order completed', {
      function: 'processOrder',
      operationId,
      orderId,
      result: 'success'
    });

    return result;

  } catch (error) {
    StructuredLogger.error('Processing order failed', error, {
      function: 'processOrder',
      operationId,
      orderId
    });
    throw error;
  }
}
```

---

## 📊 Log Levels

### DEBUG - Detailed Diagnostic Info

**Use for**: Development only, detailed tracing

```javascript
StructuredLogger.debug('Fetching order from BC', {
  function: 'fetchOrder',
  orderId: 'ORD-123',
  apiUrl: 'https://api.businesscentral.dynamics.com/...',
  queryParams: { $expand: 'lines' }
});
```

**⚠️ IMPORTANT**: DEBUG logs disabled in production (too verbose, performance impact)

---

### INFO - General Informational Messages

**Use for**: Normal operations, milestones, audit trail

```javascript
StructuredLogger.info('Sync completed successfully', {
  function: 'syncOrders',
  recordsProcessed: 150,
  duration: 3500
});
```

---

### WARN - Potential Issues

**Use for**: Recoverable errors, deprecated usage, threshold warnings

```javascript
StructuredLogger.warn('Cache miss rate high', {
  function: 'getOrderData',
  cacheHitRate: 0.45,  // 45% (expected >70%)
  threshold: 0.70
});
```

---

### ERROR - Errors Requiring Attention

**Use for**: Exceptions, failures, data quality issues

```javascript
StructuredLogger.error('BC API call failed', new Error('Network timeout'), {
  function: 'callBCAPI',
  endpoint: '/salesOrders',
  retryAttempt: 3
});
```

---

## 📋 Contextual Information

### Always Include

**Required fields in every log**:
- ✅ **Timestamp** - When (automatic in logger)
- ✅ **Function name** - Where
- ✅ **Operation ID** - For tracing related logs
- ✅ **User ID** - Who (masked email)

### Often Useful

**Additional context based on operation**:
- Input parameters (sanitized!)
- Execution duration
- Result status (success/failure)
- Record counts
- Resource IDs (orderId, customerId, etc.)
- HTTP status codes
- Retry attempts

### NEVER Log

**Sensitive data** (security + privacy violation):
- ❌ **Passwords, tokens, API keys**
- ❌ **Full PII** (use IDs: userId not full name)
- ❌ **Credit cards, SSNs**
- ❌ **OAuth tokens**
- ❌ **Sensitive business data** (pricing, trade secrets)

---

### Safe Logging Example

```javascript
function syncUser(user) {
  // ❌ BAD: Logs full PII
  Logger.log(`Syncing user: ${JSON.stringify(user)}`);
  // Exposes: { name: 'John Doe', email: '...', ssn: '...' }

  // ✅ GOOD: Logs only IDs
  StructuredLogger.info('Syncing user', {
    function: 'syncUser',
    userId: user.id,  // ID only, not full data
    userEmail: maskEmail(user.email)
  });
}

function maskEmail(email) {
  const [local, domain] = email.split('@');
  return `${local[0]}***@${domain}`;
}
```

---

## 📡 Stackdriver Integration

### Logger.log vs console.log

| Feature | Logger.log | console.log |
|---------|------------|-------------|
| **Destination** | Stackdriver Logging | Cloud Logging |
| **Retention** | ~30 days | Varies |
| **Structured logs** | Manual (JSON string) | Automatic (objects) |
| **Performance** | Slightly slower | Fast |
| **Recommendation** | Use for audit logs | Use for debug/dev |

**Best Practice**: Use both - `Logger.log()` for structured audit logs, `console.log()` for debugging

---

### Querying Stackdriver Logs

**Via Apps Script**:
```javascript
function queryLogs() {
  // View logs at: https://script.google.com/home → Executions
  // Filter by date, function, error status
}
```

**Via Cloud Console**:
```
1. Go to: https://console.cloud.google.com/logs
2. Select project
3. Query examples:
   - All errors: severity="ERROR"
   - Specific function: jsonPayload.context.function="processOrder"
   - Time range: timestamp>"2024-01-01T00:00:00Z"
   - User logs: jsonPayload.context.userId="user@example.com"
```

---

## 🔍 Log Analysis Strategies

### Finding Errors

**Query Pattern**:
```
severity="ERROR"
AND jsonPayload.context.function="syncOrders"
AND timestamp>"2024-01-01"
```

**Result**: All errors in `syncOrders` function since Jan 1st

---

### Tracing Operations

**Using Operation IDs**:
```javascript
// Generate operation ID at start
const operationId = Utilities.getUuid();

StructuredLogger.info('Operation started', { operationId, orderId });
// ... many function calls ...
StructuredLogger.info('Operation completed', { operationId, orderId });

// Query: jsonPayload.context.operationId="UUID-HERE"
// Gets ALL logs for that operation across functions
```

---

### Performance Analysis

**Log execution times**:
```javascript
function timedOperation(operationName, fn) {
  const start = Date.now();

  try {
    const result = fn();
    const duration = Date.now() - start;

    StructuredLogger.info(`${operationName} completed`, {
      function: operationName,
      duration,
      status: 'success'
    });

    return result;

  } catch (error) {
    const duration = Date.now() - start;

    StructuredLogger.error(`${operationName} failed`, error, {
      function: operationName,
      duration,
      status: 'failure'
    });

    throw error;
  }
}

// Usage
timedOperation('fetchOrdersFromBC', () => {
  return BCClient.query('salesOrders');
});
```

**Query**: Find slowest operations
```
jsonPayload.context.duration>5000
ORDER BY jsonPayload.context.duration DESC
```

---

## 🐛 Debugging Techniques

### Local Development

**Enhanced Debug Logging**:
```javascript
function debugMode() {
  const IS_DEBUG = PropertiesService.getScriptProperties().getProperty('DEBUG_MODE') === 'true';
  return IS_DEBUG;
}

function debugLog(message, data) {
  if (debugMode()) {
    Logger.log(`[DEBUG] ${message}`);
    Logger.log(JSON.stringify(data, null, 2));
  }
}

// Usage
function processOrder(orderId) {
  debugLog('Processing order', { orderId, timestamp: new Date() });

  const order = fetchOrder(orderId);
  debugLog('Order fetched', { order });

  // ... processing ...
}
```

---

### Production Debugging

**Strategies without impacting users**:

**1. Temporary Verbose Logging**:
```javascript
function enableVerboseLoggingForUser(userEmail) {
  const props = PropertiesService.getUserProperties();
  props.setProperty('VERBOSE_LOGGING', 'true');
  // Expires after 1 hour
  Utilities.sleep(3600000);
  props.deleteProperty('VERBOSE_LOGGING');
}
```

**2. Sampling** (log 1% of requests):
```javascript
function shouldLogDebug() {
  return Math.random() < 0.01; // 1% sampling
}

if (shouldLogDebug()) {
  StructuredLogger.debug('Detailed debug info', { ... });
}
```

**3. Conditional Logging** (specific users only):
```javascript
function logIfTestUser(message, context) {
  const user = Session.getActiveUser().getEmail();
  const TEST_USERS = ['admin@example.com', 'developer@example.com'];

  if (TEST_USERS.includes(user)) {
    StructuredLogger.debug(message, context);
  }
}
```

---

## 🛡️ Logging Best Practices

### Checklist

- [x] **Use structured logging format** - JSON with consistent schema
- [x] **Include correlation IDs** - Trace operations across functions
- [x] **Log at appropriate levels** - DEBUG/INFO/WARN/ERROR
- [x] **Never log sensitive data** - Passwords, tokens, full PII
- [x] **Log both entry and exit** - Start + completion of operations
- [x] **Include execution duration** - Performance tracking
- [x] **Sanitize inputs** - Mask/redact sensitive fields
- [x] **Use Logger.log for Stackdriver** - Better retention + querying
- [x] **Environment-specific levels** - DEBUG in dev, ERROR in prod
- [x] **Context enrichment** - userId, orderId, operationId

---

### Anti-Patterns to Avoid

**❌ Logging in tight loops**:
```javascript
// BAD: 1000 log entries!
for (let i = 0; i < 1000; i++) {
  Logger.log(`Processing row ${i}`);
}

// GOOD: Aggregate logging
Logger.log(`Processing ${rows.length} rows`);
```

**❌ No context**:
```javascript
// BAD: No context
Logger.log('Order failed');

// GOOD: Rich context
StructuredLogger.error('Order processing failed', error, {
  orderId: 'ORD-123',
  step: 'validation',
  userId: 'user@example.com'
});
```

**❌ Logging sensitive data**:
```javascript
// BAD: Exposes password!
Logger.log(`User login: ${username}, ${password}`);

// GOOD: No sensitive data
StructuredLogger.info('User login attempt', { username });
```

---

## 🔗 Related Files

- `platform/error-handling.md` - Error logging patterns
- `security/audit-compliance.md` - Audit logging requirements
- `platform/monitoring.md` - Log-based alerting
- `security/sensitive-data.md` - Safe logging of PII

---

**Versione**: 1.0
**Context Size**: ~235 righe
