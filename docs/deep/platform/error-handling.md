# 🛠️ Error Handling & Retry Logic

**Categoria**: Platform → Error Management
**Righe**: ~280
**Parent**: `specialists/platform-engineer.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Implementare try-catch patterns
- Gestire errori da external APIs
- Implementare retry logic con exponential backoff
- Distinguere transient vs permanent errors
- Creare user-friendly error messages
- Implement circuit breaker pattern
- Handle partial failures gracefully

---

## 🔧 Try-Catch Patterns

### Basic Pattern

**Simple Try-Catch**:
```javascript
function processOrder(orderId) {
  try {
    // Attempt operation
    const order = getOrderFromBC(orderId);
    const result = updateSheet(order);

    return { success: true, result };
  } catch (error) {
    // Log error with context
    Logger.log(`Error processing order ${orderId}: ${error.message}`);
    Logger.log(`Stack trace: ${error.stack}`);

    // Return user-friendly error
    return {
      success: false,
      error: 'Unable to process order. Please try again later.'
    };
  }
}
```

---

### Nested Operations with Specific Handling

**Multi-Level Try-Catch**:
```javascript
function syncOrdersFromBC() {
  const results = {
    success: [],
    failed: []
  };

  try {
    // Outer try: API connectivity
    const orders = fetchOrdersFromBC();

    orders.forEach(order => {
      try {
        // Inner try: Per-order processing
        const processed = processOrder(order);
        results.success.push(order.id);
      } catch (orderError) {
        // Handle individual order failure without stopping batch
        Logger.log(`Failed to process order ${order.id}: ${orderError.message}`);
        results.failed.push({ orderId: order.id, error: orderError.message });
      }
    });

  } catch (apiError) {
    // Handle API connectivity failure
    Logger.log(`BC API error: ${apiError.message}`);
    throw new Error('Unable to connect to Business Central. Check your network connection.');
  }

  return results;
}
```

---

### Finally Block for Cleanup

**Ensure Cleanup Happens**:
```javascript
function importLargeFile(fileId) {
  const lock = LockService.getScriptLock();

  try {
    // Acquire lock
    lock.waitLock(30000); // 30 seconds

    // Process file
    const data = processFile(fileId);
    return data;

  } catch (error) {
    Logger.log(`Import failed: ${error.message}`);
    throw error;

  } finally {
    // ALWAYS release lock (even if error)
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }
}
```

---

## 🔀 Error Classification

### Transient Errors (Retry Recommended)

**Recoverable errors** - temporary issues that may resolve:
- ✅ **Network timeouts** (UrlFetchApp timeout)
- ✅ **Rate limiting** (HTTP 429)
- ✅ **Service unavailable** (HTTP 503)
- ✅ **Database deadlocks** (concurrent writes)
- ✅ **Temporary API failures** (HTTP 500, 502, 504)
- ✅ **Cache misses** (stale cache)

---

### Permanent Errors (No Retry)

**Non-recoverable errors** - retrying won't help:
- ❌ **Authentication failure** (HTTP 401) - Invalid credentials
- ❌ **Authorization failure** (HTTP 403) - Insufficient permissions
- ❌ **Not found** (HTTP 404) - Resource doesn't exist
- ❌ **Bad request** (HTTP 400) - Invalid input data
- ❌ **Validation errors** - Schema/type violations
- ❌ **Conflict** (HTTP 409) - Duplicate resource

---

### Error Classification Logic

```javascript
function isTransientError(error) {
  // Check HTTP status code
  if (error.response) {
    const status = error.response.getResponseCode();
    const TRANSIENT_CODES = [429, 500, 502, 503, 504];

    if (TRANSIENT_CODES.includes(status)) {
      return true;
    }
  }

  // Check error message patterns
  const message = error.message.toLowerCase();
  const TRANSIENT_PATTERNS = [
    'timeout',
    'network',
    'econnreset',
    'temporarily unavailable',
    'service unavailable',
    'rate limit'
  ];

  return TRANSIENT_PATTERNS.some(pattern => message.includes(pattern));
}

function shouldRetry(error, attemptNumber, maxRetries) {
  if (attemptNumber >= maxRetries) {
    return false; // Exceeded max retries
  }

  return isTransientError(error);
}
```

---

## 🔄 Exponential Backoff Implementation

### Retry with Exponential Backoff

**Full Implementation**:
```javascript
function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,      // 1 second
    backoffFactor = 2,        // Double each time
    maxDelay = 60000,         // Max 1 minute
    jitter = true             // Add randomness
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Attempt operation
      return fn();

    } catch (error) {
      lastError = error;

      // Check if should retry
      if (!shouldRetry(error, attempt, maxRetries)) {
        throw error; // Permanent error or max retries
      }

      // Calculate delay with exponential backoff
      let delay = initialDelay * Math.pow(backoffFactor, attempt);
      delay = Math.min(delay, maxDelay);

      // Add jitter (±20% randomization)
      if (jitter) {
        delay = delay * (0.8 + Math.random() * 0.4);
      }

      Logger.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`);

      // Sleep before retry
      Utilities.sleep(delay);
    }
  }

  // All retries exhausted
  throw new Error(`Operation failed after ${maxRetries} retries: ${lastError.message}`);
}

// Usage
function fetchFromBC() {
  return retryWithBackoff(() => {
    return BCClient.query('salesOrders');
  }, {
    maxRetries: 3,
    initialDelay: 2000
  });
}
```

---

### Retry Strategies Comparison

| Strategy | Initial Delay | After Retry 1 | After Retry 2 | After Retry 3 |
|----------|---------------|---------------|---------------|---------------|
| **Fixed** | 2s | 2s | 2s | 2s |
| **Linear** | 2s | 4s | 6s | 8s |
| **Exponential** | 2s | 4s | 8s | 16s |
| **Exp + Jitter** | 2s | ~4s (±0.8s) | ~8s (±1.6s) | ~16s (±3.2s) |

**Recommendation**: Exponential + Jitter (prevents thundering herd)

---

## 🚦 Circuit Breaker Pattern

### Circuit Breaker Implementation

**Prevent cascading failures**:
```javascript
const CircuitBreaker = (function() {
  const STATE = {
    CLOSED: 'CLOSED',       // Normal operation
    OPEN: 'OPEN',           // Failing, reject requests
    HALF_OPEN: 'HALF_OPEN'  // Testing if recovered
  };

  // State per service
  const circuits = {};

  function getCircuit(serviceName) {
    if (!circuits[serviceName]) {
      circuits[serviceName] = {
        state: STATE.CLOSED,
        failureCount: 0,
        lastFailureTime: null,
        successCount: 0
      };
    }
    return circuits[serviceName];
  }

  function execute(serviceName, fn, options = {}) {
    const {
      failureThreshold = 5,      // Open after 5 failures
      timeout = 60000,           // Try again after 1 minute
      successThreshold = 2       // Close after 2 successes
    } = options;

    const circuit = getCircuit(serviceName);

    // Check circuit state
    if (circuit.state === STATE.OPEN) {
      const now = Date.now();
      const timeSinceFailure = now - circuit.lastFailureTime;

      if (timeSinceFailure < timeout) {
        // Still in timeout period
        throw new Error(`Circuit breaker OPEN for ${serviceName}. Try again later.`);
      }

      // Timeout elapsed, transition to HALF_OPEN
      circuit.state = STATE.HALF_OPEN;
      circuit.successCount = 0;
      Logger.log(`Circuit breaker ${serviceName}: OPEN → HALF_OPEN`);
    }

    try {
      // Attempt operation
      const result = fn();

      // Success
      circuit.failureCount = 0;

      if (circuit.state === STATE.HALF_OPEN) {
        circuit.successCount++;

        if (circuit.successCount >= successThreshold) {
          // Recovered! Close circuit
          circuit.state = STATE.CLOSED;
          Logger.log(`Circuit breaker ${serviceName}: HALF_OPEN → CLOSED (recovered)`);
        }
      }

      return result;

    } catch (error) {
      // Failure
      circuit.failureCount++;
      circuit.lastFailureTime = Date.now();

      if (circuit.state === STATE.HALF_OPEN) {
        // Failed during test, reopen circuit
        circuit.state = STATE.OPEN;
        Logger.log(`Circuit breaker ${serviceName}: HALF_OPEN → OPEN (still failing)`);
      } else if (circuit.failureCount >= failureThreshold) {
        // Threshold exceeded, open circuit
        circuit.state = STATE.OPEN;
        Logger.log(`Circuit breaker ${serviceName}: CLOSED → OPEN (${circuit.failureCount} failures)`);
      }

      throw error;
    }
  }

  return { execute, STATE };
})();

// Usage
function callBCAPI() {
  return CircuitBreaker.execute('BC_API', () => {
    return BCClient.query('salesOrders');
  }, {
    failureThreshold: 5,
    timeout: 60000
  });
}
```

---

## 💬 User-Friendly Error Messages

### Error Message Transformation

**❌ BAD - Technical jargon exposed to user**:
```javascript
throw new Error('TypeError: Cannot read property "getRange" of null at line 42');
```

**✅ GOOD - User-friendly with technical details logged**:
```javascript
function getUserFriendlyError(technicalError, context) {
  // Log technical details (for debugging)
  Logger.log(`Technical error: ${technicalError.message}`);
  Logger.log(`Stack: ${technicalError.stack}`);
  Logger.log(`Context: ${JSON.stringify(context)}`);

  // Map to user-friendly message
  const ERROR_MESSAGES = {
    'getRange': 'Unable to access spreadsheet. Verify the sheet exists and you have permissions.',
    'fetch': 'Network error. Check your internet connection and try again.',
    'timeout': 'The operation took too long. Please try again.',
    'auth': 'Authentication failed. Please re-authorize the application.',
    'permission': 'You don\'t have permission to perform this action.',
    'not found': 'The requested resource could not be found.',
    'rate limit': 'Too many requests. Please wait a moment and try again.'
  };

  // Find matching user-friendly message
  const message = technicalError.message.toLowerCase();
  for (const [key, userMessage] of Object.entries(ERROR_MESSAGES)) {
    if (message.includes(key)) {
      return userMessage;
    }
  }

  // Default generic message
  return 'An unexpected error occurred. Our team has been notified.';
}

// Usage
function processUserRequest(data) {
  try {
    return performOperation(data);
  } catch (error) {
    const userMessage = getUserFriendlyError(error, { data });

    // Show user-friendly message
    SpreadsheetApp.getUi().alert('Error', userMessage, SpreadsheetApp.getUi().ButtonSet.OK);

    // Log technical details
    Logger.log(`Operation failed: ${error.message}`);
  }
}
```

---

### Error Context Enrichment

```javascript
class EnrichedError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

function enrichError(error, context) {
  if (error instanceof EnrichedError) {
    // Already enriched, add more context
    error.context = { ...error.context, ...context };
    return error;
  }

  return new EnrichedError(error.message, {
    originalError: error,
    ...context
  });
}

// Usage
function syncOrder(orderId) {
  try {
    const order = fetchOrder(orderId);
    return processOrder(order);
  } catch (error) {
    throw enrichError(error, {
      operation: 'syncOrder',
      orderId,
      user: Session.getActiveUser().getEmail()
    });
  }
}
```

---

## 🛡️ Graceful Degradation

### Fallback Logic

**Provide limited functionality when errors occur**:
```javascript
function getOrderData(orderId) {
  try {
    // Primary: Fetch from BC API
    return BCClient.getOrder(orderId);

  } catch (apiError) {
    Logger.log(`BC API failed: ${apiError.message}`);

    try {
      // Fallback 1: Use cached data
      const cached = getFromCache(orderId);
      if (cached) {
        return {
          ...cached,
          source: 'cache',
          warning: 'Showing cached data. Latest data unavailable.'
        };
      }
    } catch (cacheError) {
      Logger.log(`Cache failed: ${cacheError.message}`);
    }

    try {
      // Fallback 2: Read from local Sheets backup
      const backup = getFromSheets(orderId);
      if (backup) {
        return {
          ...backup,
          source: 'backup',
          warning: 'Showing backup data. Real-time sync unavailable.'
        };
      }
    } catch (sheetsError) {
      Logger.log(`Sheets backup failed: ${sheetsError.message}`);
    }

    // All fallbacks exhausted
    throw new Error('Unable to retrieve order data from any source.');
  }
}
```

---

### Partial Failure Handling

**Continue processing valid items despite some failures**:
```javascript
function batchProcessOrders(orderIds) {
  const results = {
    processed: [],
    failed: [],
    summary: {
      total: orderIds.length,
      success: 0,
      failure: 0
    }
  };

  orderIds.forEach(orderId => {
    try {
      const result = processOrder(orderId);
      results.processed.push({ orderId, result });
      results.summary.success++;

    } catch (error) {
      // Log but continue
      Logger.log(`Failed to process order ${orderId}: ${error.message}`);
      results.failed.push({
        orderId,
        error: error.message
      });
      results.summary.failure++;
    }
  });

  // Alert if failure rate > 20%
  const failureRate = results.summary.failure / results.summary.total;
  if (failureRate > 0.2) {
    sendAlert(`High failure rate in batch processing: ${Math.round(failureRate * 100)}%`);
  }

  return results;
}
```

---

## 🛡️ Error Handling Best Practices

### Checklist

- [x] **NEVER swallow errors silently** - Always log or re-throw
- [x] **Log errors with context** - Include operation, user, timestamp, data
- [x] **Distinguish transient vs permanent** - Only retry transient errors
- [x] **Implement retry with backoff** - Exponential backoff + jitter
- [x] **User-friendly messages** - No stack traces or jargon to users
- [x] **Circuit breaker for external dependencies** - Prevent cascading failures
- [x] **Graceful degradation** - Fallback to cache/backup when possible
- [x] **Set timeouts on all external calls** - Prevent hanging
- [x] **Enrich errors with context** - Include orderId, userId, operation
- [x] **Monitor error rates** - Alert if >5% error rate

---

### Anti-Patterns to Avoid

**❌ Silent failure**:
```javascript
try {
  processOrder(orderId);
} catch (e) {
  // Nothing - ERROR SWALLOWED!
}
```

**❌ Overly broad catch**:
```javascript
try {
  // 100 lines of code
} catch (e) {
  // Which operation failed?
}
```

**❌ Retry permanent errors**:
```javascript
// Bad: Retrying 404 won't help
retryWithBackoff(() => fetchNonExistentResource());
```

**❌ No timeout**:
```javascript
// Hangs forever if API is down
UrlFetchApp.fetch(url); // Missing timeout!
```

---

## 🔗 Related Files

- `platform/logging.md` - Logging errors with context
- `integration/http-patterns.md` - API error handling
- `platform/monitoring.md` - Alerting on error rates
- `platform/performance.md` - Timeout configuration

---

**Versione**: 1.0
**Context Size**: ~280 righe
