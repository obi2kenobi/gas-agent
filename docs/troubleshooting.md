# 🔧 Troubleshooting Guide

**Common issues and solutions for Google Apps Script development**

---

## Quick Diagnostic

If you're experiencing issues, start here:

1. **Check Logs**: View → Logs (Ctrl+Enter)
2. **Check Executions**: Triggers → Executions tab
3. **Check Quotas**: Check quota usage in Apps Script dashboard
4. **Check Permissions**: Ensure proper OAuth scopes
5. **Check Configuration**: Verify PropertiesService settings

---

## Common Errors

### 1. "Authorization required"

**Symptoms**:
- Script stops with authorization error
- Can't access Sheets/Drive/etc.

**Causes**:
- First run requires permission grant
- OAuth scopes changed
- User revoked permissions

**Solutions**:
```javascript
// ✅ Run function manually first
function grantPermissions() {
  // This forces permission dialog
  SpreadsheetApp.getActiveSpreadsheet();
  DriveApp.getRootFolder();
  Logger.log('Permissions granted');
}
```

Update `appsscript.json` with required scopes:
```json
{
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/script.external_request"
  ]
}
```

---

### 2. "Service invoked too many times"

**Symptoms**:
- Script fails with quota error
- Happens with large datasets

**Causes**:
- Row-by-row operations (too many API calls)
- No caching
- Hitting daily quotas

**Solutions**:
```javascript
// ❌ BAD: 1000 API calls
for (let i = 0; i < 1000; i++) {
  sheet.getRange(i + 1, 1).setValue(data[i]);
}

// ✅ GOOD: 1 API call
const values = data.map(d => [d]);
sheet.getRange(1, 1, values.length, 1).setValues(values);
```

Implement caching:
```javascript
function getCachedData(key, fetchFn) {
  const cache = CacheService.getScriptCache();
  let data = cache.get(key);

  if (!data) {
    data = JSON.stringify(fetchFn());
    cache.put(key, data, 3600);
  }

  return JSON.parse(data);
}
```

**Learn more**: [Platform Engineer - Performance](specialists/platform-engineer.md)

---

### 3. "Execution timeout: Exceeded maximum execution time"

**Symptoms**:
- Script stops after 6 minutes
- Incomplete processing

**Causes**:
- Operation takes > 6 minutes
- Inefficient code
- Too much data

**Solutions**:

Use checkpointing:
```javascript
function processLargeDataset() {
  const checkpoint = loadCheckpoint();
  const startIndex = checkpoint ? checkpoint.lastIndex : 0;
  const batchSize = 1000;

  // Process batch
  const data = getData(startIndex, batchSize);
  processData(data);

  // Save checkpoint
  saveCheckpoint({ lastIndex: startIndex + batchSize });

  // If more data, schedule next run
  if (data.length === batchSize) {
    ScriptApp.newTrigger('processLargeDataset')
      .timeBased()
      .after(1000) // 1 second
      .create();
  }
}
```

**Learn more**: [Platform Engineer - Performance](deep/platform/performance.md)

---

### 4. OAuth2 Token Refresh Fails

**Symptoms**:
- "Invalid token" errors
- 401 Unauthorized responses
- Works initially, then fails

**Causes**:
- Token expired without refresh
- Refresh token invalid
- No expiry buffer

**Solutions**:
```javascript
function getTokenWithRefresh() {
  const cache = CacheService.getScriptCache();
  let token = cache.get('access_token');

  if (!token) {
    const refreshToken = PropertiesService.getScriptProperties()
      .getProperty('refresh_token');

    // Refresh token
    const newTokenData = refreshAccessToken(refreshToken);

    // Cache with 5-minute buffer
    const expiresIn = newTokenData.expires_in - 300;
    cache.put('access_token', newTokenData.access_token, expiresIn);

    token = newTokenData.access_token;
  }

  return token;
}
```

**Learn more**: [Security Engineer - OAuth2](deep/security/oauth2-patterns.md)

---

### 5. "Cannot read property 'value' of undefined"

**Symptoms**:
- Accessing undefined object properties
- API response parsing fails

**Causes**:
- API returned unexpected format
- Missing null checks
- Wrong property path

**Solutions**:
```javascript
// ❌ BAD: No validation
function processBCData(response) {
  const orders = response.value;
  orders.forEach(order => {
    Logger.log(order.customer.name); // Crash if customer is null
  });
}

// ✅ GOOD: Defensive programming
function processBCData(response) {
  if (!response || !response.value) {
    Logger.log('Invalid response structure');
    return [];
  }

  return response.value
    .filter(order => order && order.customer)
    .map(order => ({
      id: order.id,
      customerName: order.customer.name || 'Unknown'
    }));
}
```

---

### 6. Slow Performance (> 10 seconds)

**Symptoms**:
- Script takes too long
- Users complain about speed

**Common Causes & Fixes**:

| Cause | Solution | Improvement |
|-------|----------|-------------|
| Row-by-row operations | Use `getValues()`/`setValues()` | 100x faster |
| No caching | Implement CacheService | 73% faster |
| N+1 API queries | Use `$expand` in OData | 10-100x faster |
| Large data transfers | Implement pagination | 5-10x faster |
| Unoptimized formulas | Build indexes | 1000x faster |

**Learn more**: [Platform Engineer - Performance](deep/platform/performance.md)

---

### 7. "Rate limit exceeded" (429 errors)

**Symptoms**:
- External API returns 429
- Works with small datasets, fails with large

**Causes**:
- Too many API calls too fast
- No rate limiting awareness
- No retry logic

**Solutions**:
```javascript
function fetchWithRateLimit(url) {
  return retryWithBackoff(() => {
    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true
    });

    if (response.getResponseCode() === 429) {
      // Get retry-after header
      const retryAfter = parseInt(response.getHeaders()['Retry-After'] || '60');
      Logger.log(`Rate limited, waiting ${retryAfter}s`);
      Utilities.sleep(retryAfter * 1000);
      throw new Error('Rate limit - retry');
    }

    return response;
  }, {
    maxRetries: 5,
    initialDelay: 2000,
    backoffFactor: 2
  });
}
```

**Learn more**: [Integration Engineer - HTTP Patterns](deep/integration/http-patterns.md)

---

### 8. Memory Limit Exceeded

**Symptoms**:
- "Exceeded memory limit" error
- Works with small data, fails with large

**Causes**:
- Loading too much data at once
- No garbage collection
- Large objects in memory

**Solutions**:
```javascript
// ❌ BAD: Load everything
function processAllOrders() {
  const allOrders = fetchAllOrders(); // 100K records in memory!
  allOrders.forEach(processOrder);
}

// ✅ GOOD: Stream/paginate
function processAllOrders() {
  const pageSize = 1000;
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const orders = fetchOrders(skip, pageSize);
    orders.forEach(processOrder);

    hasMore = orders.length === pageSize;
    skip += pageSize;

    // Allow garbage collection
    Utilities.sleep(100);
  }
}
```

---

### 9. Trigger Not Executing

**Symptoms**:
- Time-based trigger doesn't run
- Expected execution didn't happen

**Causes**:
- Trigger deleted accidentally
- Project timezone mismatch
- Execution failed silently

**Solutions**:

Check triggers:
```javascript
function listTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    Logger.log(`Function: ${trigger.getHandlerFunction()}`);
    Logger.log(`Type: ${trigger.getEventType()}`);
    Logger.log(`Unique ID: ${trigger.getUniqueId()}`);
  });
}
```

Check executions:
- Go to: Triggers → Executions tab
- Look for errors in failure column
- Check execution time vs. expected time

Fix timezone issues:
```javascript
// Set project timezone in appsscript.json
{
  "timeZone": "America/New_York",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER"
}
```

---

### 10. Data Validation Failures

**Symptoms**:
- Invalid data in Sheets
- Foreign key violations
- Data type mismatches

**Causes**:
- No validation before save
- Missing null checks
- Type coercion issues

**Solutions**:
```javascript
function validateOrder(order) {
  const errors = [];

  // Required fields
  if (!order.id) errors.push('ID required');
  if (!order.customerId) errors.push('Customer ID required');

  // Type validation
  if (typeof order.total !== 'number') {
    errors.push('Total must be a number');
  }

  // Business rules
  if (order.total < 0) {
    errors.push('Total cannot be negative');
  }

  // Foreign key validation
  const customer = CustomerRepository.findById(order.customerId);
  if (!customer) {
    errors.push(`Customer ${order.customerId} not found`);
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  return true;
}
```

**Learn more**: [Data Engineer - Sheets Database](deep/data/sheets-database.md)

---

## Debugging Techniques

### 1. Structured Logging

```javascript
function log(level, message, context = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: level,
    message: message,
    ...context
  };
  Logger.log(JSON.stringify(entry));
}

// Usage
log('INFO', 'Processing order', { orderId: 'SO001', customerId: 'C123' });
log('ERROR', 'API call failed', { url: apiUrl, statusCode: 500 });
```

### 2. Breakpoint Debugging

```javascript
function debugFunction() {
  const data = fetchData();
  debugger; // Pause here when running in debug mode

  const processed = processData(data);
  Logger.log(processed);
}
```

### 3. Performance Profiling

```javascript
function profile(name, fn) {
  const start = Date.now();
  const result = fn();
  const duration = Date.now() - start;

  Logger.log(`${name}: ${duration}ms`);
  return result;
}

// Usage
const orders = profile('Fetch orders', () => fetchOrders());
```

---

## FAQ

### Q: How do I see detailed error logs?

**A**: Enable Stackdriver logging:

1. In Apps Script editor: View → Stackdriver Logging
2. Or in `appsscript.json`:
```json
{
  "exceptionLogging": "STACKDRIVER"
}
```

### Q: Why does my script work locally but fail when scheduled?

**A**: Common reasons:
- Trigger runs as different user (different permissions)
- Time zone differences
- PropertiesService scope (Script vs. User)
- Session-dependent code (e.g., `getActiveSheet()`)

### Q: How do I test OAuth2 integration without deploying?

**A**: Use manual execution:
```javascript
function testOAuth() {
  const token = OAuth2Manager.authorize('test-auth-code');
  Logger.log('Token received:', token);

  const data = callProtectedAPI();
  Logger.log('API call succeeded:', data);
}
```

### Q: Can I use external libraries in GAS?

**A**: Yes! Add to `appsscript.json`:
```json
{
  "dependencies": {
    "libraries": [{
      "userSymbol": "OAuth2",
      "libraryId": "1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF",
      "version": "41"
    }]
  }
}
```

---

## Getting More Help

### Check These Resources

1. **Official GAS Docs**: [developers.google.com/apps-script](https://developers.google.com/apps-script)
2. **Stack Overflow**: Tag `google-apps-script`
3. **GAS Issue Tracker**: [issuetracker.google.com](https://issuetracker.google.com/issues?q=componentid:190387)
4. **GAS-Agent Specialists**: [specialists/](specialists/) - Domain-specific guidance

### Report Issues

If you find bugs in GAS-Agent documentation:
- Check existing issues
- Provide minimal reproduction code
- Include error messages and logs

---

**Still stuck? Review the specialist documentation for your specific domain!**

**Last Updated**: November 2025
