# 🟡 Intermediate Learning Path

**Build production-ready integrations with external systems**

---

## Overview

**Duration**: 1-2 days
**Prerequisites**: Completed Beginner Path OR equivalent JavaScript/GAS experience
**Goal**: Build robust, production-ready integrations

By the end of this path, you'll be able to:
- ✅ Implement OAuth2 authentication flows
- ✅ Build resilient error handling with exponential backoff
- ✅ Implement multi-level caching strategies
- ✅ Optimize performance for large datasets
- ✅ Integrate with Business Central or similar enterprise APIs
- ✅ Add monitoring and health checks

---

## Module 1: OAuth2 Authentication (2-3 hours)

### Why OAuth2?

Basic auth (username/password) is:
- ❌ Less secure (credentials in code)
- ❌ No token expiration
- ❌ No fine-grained permissions

OAuth2 provides:
- ✅ Token-based (no passwords in code)
- ✅ Automatic expiration and refresh
- ✅ Scoped permissions
- ✅ Industry standard

### Concepts to Learn

- Authorization code flow
- Token storage and refresh
- Handling token expiration
- Security best practices

### Hands-On Exercise: OAuth2 Token Manager

```javascript
/**
 * OAuth2 Token Manager for Business Central (or any OAuth2 API)
 *
 * Learn more: docs/deep/security/oauth2-patterns.md
 */
const OAuth2Manager = (function() {

  /**
   * Get valid access token (fetch new or refresh if needed)
   */
  function getToken() {
    const cached = getCachedToken();
    if (cached) {
      Logger.log('Using cached token');
      return cached;
    }

    // No cached token, check if we have refresh token
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      Logger.log('Refreshing expired token');
      return refreshAccessToken(refreshToken);
    }

    // No refresh token, need full authorization
    throw new Error('No valid token. Run authorize() first.');
  }

  /**
   * Get cached token if still valid
   */
  function getCachedToken() {
    const cache = CacheService.getScriptCache();
    const token = cache.get('oauth_access_token');

    if (token) {
      return token;
    }

    return null;
  }

  /**
   * Get stored refresh token
   */
  function getRefreshToken() {
    const props = PropertiesService.getScriptProperties();
    return props.getProperty('oauth_refresh_token');
  }

  /**
   * Refresh access token using refresh token
   */
  function refreshAccessToken(refreshToken) {
    const tokenUrl = getConfig('OAUTH_TOKEN_URL');
    const clientId = getConfig('OAUTH_CLIENT_ID');
    const clientSecret = getConfig('OAUTH_CLIENT_SECRET');

    try {
      const response = UrlFetchApp.fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        payload: {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret
        },
        muteHttpExceptions: true
      });

      if (response.getResponseCode() !== 200) {
        throw new Error('Token refresh failed: ' + response.getContentText());
      }

      const tokenData = JSON.parse(response.getContentText());

      // Cache access token with 5-minute buffer before expiry
      const expiresIn = tokenData.expires_in - 300; // 5 min buffer
      CacheService.getScriptCache().put(
        'oauth_access_token',
        tokenData.access_token,
        expiresIn
      );

      // Store new refresh token if provided
      if (tokenData.refresh_token) {
        PropertiesService.getScriptProperties()
          .setProperty('oauth_refresh_token', tokenData.refresh_token);
      }

      Logger.log('✓ Token refreshed successfully');
      return tokenData.access_token;

    } catch (error) {
      Logger.log(`Error refreshing token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Initial authorization (run once manually)
   */
  function authorize(authorizationCode) {
    const tokenUrl = getConfig('OAUTH_TOKEN_URL');
    const clientId = getConfig('OAUTH_CLIENT_ID');
    const clientSecret = getConfig('OAUTH_CLIENT_SECRET');
    const redirectUri = getConfig('OAUTH_REDIRECT_URI');

    const response = UrlFetchApp.fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      payload: {
        grant_type: 'authorization_code',
        code: authorizationCode,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri
      },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      throw new Error('Authorization failed: ' + response.getContentText());
    }

    const tokenData = JSON.parse(response.getContentText());

    // Cache access token
    const expiresIn = tokenData.expires_in - 300;
    CacheService.getScriptCache().put(
      'oauth_access_token',
      tokenData.access_token,
      expiresIn
    );

    // Store refresh token
    PropertiesService.getScriptProperties()
      .setProperty('oauth_refresh_token', tokenData.refresh_token);

    Logger.log('✓ Authorization complete');
    return tokenData.access_token;
  }

  return {
    getToken,
    authorize
  };
})();

/**
 * Example usage: Make authenticated API call
 */
function callProtectedAPI() {
  const token = OAuth2Manager.getToken();
  const url = 'https://api.businesscentral.dynamics.com/v2.0/...';

  const response = UrlFetchApp.fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() === 401) {
    // Token invalid, clear cache and retry
    CacheService.getScriptCache().remove('oauth_access_token');
    Logger.log('Token was invalid, retrying...');
    return callProtectedAPI(); // Recursive retry
  }

  return JSON.parse(response.getContentText());
}
```

**Learn more**: [Security Engineer - OAuth2](../../deep/security/oauth2-patterns.md)

---

## Module 2: Error Handling & Resilience (2-3 hours)

### Why Robust Error Handling?

Production systems face:
- Network failures
- API rate limits
- Temporary service outages
- Invalid data

Without proper handling:
- Scripts fail completely
- Data inconsistencies
- No recovery mechanism

### Concepts to Learn

- Try-catch patterns
- Exponential backoff
- Circuit breaker
- Graceful degradation

### Hands-On Exercise: Retry with Exponential Backoff

```javascript
/**
 * Retry function with exponential backoff
 *
 * Learn more: docs/deep/platform/error-handling.md
 */
function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    backoffFactor = 2,
    shouldRetry = null
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} retries: ${error.message}`);
      }

      // Check custom retry logic if provided
      if (shouldRetry && !shouldRetry(error, attempt)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = initialDelay * Math.pow(backoffFactor, attempt);
      Logger.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);

      Utilities.sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Custom retry logic based on error type
 */
function shouldRetryError(error, attempt) {
  const errorMessage = error.message.toLowerCase();

  // Don't retry on authentication errors
  if (errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
    return false;
  }

  // Retry on rate limit (but with longer delay)
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    if (attempt < 2) {
      Utilities.sleep(5000); // Extra 5 second delay
      return true;
    }
  }

  // Retry on network errors
  if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
    return true;
  }

  // Don't retry by default
  return false;
}

/**
 * Example: Resilient API call
 */
function fetchWithRetry(url, options = {}) {
  return retryWithBackoff(() => {
    const response = UrlFetchApp.fetch(url, {
      ...options,
      muteHttpExceptions: true
    });

    const statusCode = response.getResponseCode();

    // Handle different status codes
    if (statusCode === 401 || statusCode === 403) {
      throw new Error('Unauthorized - check credentials');
    }

    if (statusCode === 429) {
      throw new Error('Rate limit exceeded');
    }

    if (statusCode >= 500) {
      throw new Error(`Server error: ${statusCode}`);
    }

    if (statusCode !== 200) {
      throw new Error(`HTTP ${statusCode}: ${response.getContentText()}`);
    }

    return JSON.parse(response.getContentText());
  }, {
    maxRetries: 3,
    initialDelay: 1000,
    backoffFactor: 2,
    shouldRetry: shouldRetryError
  });
}
```

**Try it:**
```javascript
// This will retry up to 3 times with exponential backoff
const data = fetchWithRetry('https://api.example.com/data', {
  headers: { 'Authorization': 'Bearer ...' }
});
```

**Learn more**: [Platform Engineer - Error Handling](../../deep/platform/error-handling.md)

---

## Module 3: Multi-Level Caching (2-3 hours)

### Why Caching?

**Problem**: External API calls are:
- Slow (2-3 seconds)
- Limited by quotas
- Cost money (some APIs charge per call)
- Not always necessary (data doesn't change often)

**Solution**: Multi-level cache
- Memory: Instant (same execution)
- CacheService: Fast (~0.1s, 6-hour TTL)
- PropertiesService: Fallback (slower but persistent)

### Hands-On Exercise: Multi-Level Cache

```javascript
/**
 * Multi-level cache manager
 *
 * Learn more: docs/deep/platform/caching.md
 */
const CacheManager = (function() {
  // Memory cache (fastest, execution-scoped)
  const memoryCache = {};

  /**
   * Get value from cache (checks all levels)
   */
  function get(key) {
    // Level 1: Memory
    if (key in memoryCache) {
      Logger.log(`Cache HIT (memory): ${key}`);
      return memoryCache[key];
    }

    // Level 2: CacheService
    const cache = CacheService.getScriptCache();
    let value = cache.get(key);
    if (value) {
      Logger.log(`Cache HIT (CacheService): ${key}`);
      memoryCache[key] = value; // Promote to memory
      return value;
    }

    // Level 3: PropertiesService (for long-term caching)
    const props = PropertiesService.getScriptProperties();
    value = props.getProperty(`cache_${key}`);
    if (value) {
      Logger.log(`Cache HIT (PropertiesService): ${key}`);
      cache.put(key, value, 3600); // Promote to CacheService
      memoryCache[key] = value; // Promote to memory
      return value;
    }

    Logger.log(`Cache MISS: ${key}`);
    return null;
  }

  /**
   * Put value in cache (all levels)
   */
  function put(key, value, ttl = 3600) {
    // Memory
    memoryCache[key] = value;

    // CacheService (6 hour max)
    const cacheTTL = Math.min(ttl, 21600);
    CacheService.getScriptCache().put(key, value, cacheTTL);

    // PropertiesService (long-term, optional)
    if (ttl > 21600) {
      PropertiesService.getScriptProperties()
        .setProperty(`cache_${key}`, value);
    }

    Logger.log(`Cached: ${key} (TTL: ${ttl}s)`);
  }

  /**
   * Remove from all cache levels
   */
  function remove(key) {
    delete memoryCache[key];
    CacheService.getScriptCache().remove(key);
    PropertiesService.getScriptProperties().deleteProperty(`cache_${key}`);
    Logger.log(`Removed from cache: ${key}`);
  }

  /**
   * Get or compute value
   */
  function getOrCompute(key, computeFn, ttl = 3600) {
    let value = get(key);

    if (!value) {
      Logger.log(`Computing value for: ${key}`);
      value = computeFn();
      put(key, value, ttl);
    }

    return value;
  }

  return {
    get,
    put,
    remove,
    getOrCompute
  };
})();

/**
 * Example: Cached API call
 */
function getCachedBCOrders(status) {
  const cacheKey = `bc_orders_${status}`;

  return CacheManager.getOrCompute(
    cacheKey,
    () => {
      // This only runs on cache miss
      Logger.log('Fetching from BC API...');
      const url = `${getConfig('BC_BASE_URL')}/salesOrders?$filter=status eq '${status}'`;
      const token = OAuth2Manager.getToken();

      const response = UrlFetchApp.fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      return response.getContentText();
    },
    3600 // Cache for 1 hour
  );
}
```

**Performance Impact:**
```
First call:  2.3 seconds (API call)
Second call: 0.1 seconds (cache hit) - 23x faster!
Third call:  0.001 seconds (memory) - 2300x faster!
```

**Learn more**: [Platform Engineer - Caching](../../deep/platform/caching.md)

---

## Module 4: Performance Optimization (2-3 hours)

### Common Performance Issues

1. **Row-by-row operations** (slow)
2. **N+1 queries** (unnecessary API calls)
3. **No pagination** (memory limits)
4. **Unoptimized OData queries** (transfer too much data)

### Hands-On Exercise: Optimize Large Dataset

```javascript
/**
 * Sync 10,000 orders from BC to Sheets
 *
 * Learn more: docs/deep/platform/performance.md
 */

// ❌ BAD: Takes 45+ seconds, might timeout
function syncOrders_Slow() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Orders');

  const orders = fetchAllOrders(); // Gets all 10K orders

  // Row-by-row write (10,000 API calls!)
  orders.forEach((order, i) => {
    sheet.getRange(i + 2, 1).setValue(order.id);
    sheet.getRange(i + 2, 2).setValue(order.customer);
    sheet.getRange(i + 2, 3).setValue(order.total);
  });
}

// ✅ GOOD: Takes ~5 seconds
function syncOrders_Fast() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Orders');

  // Fetch with pagination (prevents memory issues)
  const orders = fetchAllOrdersPaginated(1000); // 1000 per page

  // Build 2D array
  const values = orders.map(order => [
    order.id,
    order.customer,
    order.total,
    new Date()
  ]);

  // Single batch write (1 API call!)
  if (values.length > 0) {
    sheet.getRange(2, 1, values.length, 4).setValues(values);
  }

  Logger.log(`Synced ${values.length} orders in one batch`);
}

/**
 * Fetch orders with pagination
 */
function fetchAllOrdersPaginated(pageSize = 1000) {
  const allOrders = [];
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const url = `${getConfig('BC_BASE_URL')}/salesOrders?$top=${pageSize}&$skip=${skip}`;
    const orders = fetchWithRetry(url);

    allOrders.push(...orders.value);

    hasMore = orders.value.length === pageSize;
    skip += pageSize;

    Logger.log(`Fetched ${allOrders.length} orders so far...`);

    // Optional: checkpoint for very large datasets
    if (skip % 5000 === 0) {
      Logger.log('Checkpoint: Taking a breath...');
      Utilities.sleep(1000);
    }
  }

  return allOrders;
}
```

**Performance Comparison:**
```
Slow version: 45+ seconds, 30,000 API calls
Fast version: 5 seconds, 10 API calls
Improvement: 9x faster, 3000x fewer API calls!
```

**Learn more**: [Platform Engineer - Performance](../../deep/platform/performance.md)

---

## Module 5: Business Central Integration (3-4 hours)

### Project: Order Sync System

Build a production-ready system that syncs orders from Business Central to Sheets.

**Features:**
- OAuth2 authentication
- Incremental sync (only new/changed)
- Multi-level caching
- Error handling with retry
- Performance optimized
- Health checks

**Implementation:**

```javascript
/**
 * Complete BC Order Sync System
 */

// Configuration
const CONFIG = {
  SHEET_NAME: 'Orders',
  LAST_SYNC_KEY: 'last_order_sync',
  CACHE_TTL: 3600
};

/**
 * Main sync function
 */
function syncBCOrders() {
  try {
    Logger.log('=== Starting BC Order Sync ===');

    // Get last sync timestamp
    const lastSync = PropertiesService.getScriptProperties()
      .getProperty(CONFIG.LAST_SYNC_KEY);

    Logger.log(`Last sync: ${lastSync || 'Never'}`);

    // Fetch new/updated orders
    const orders = fetchOrdersSince(lastSync);
    Logger.log(`Found ${orders.length} orders to sync`);

    if (orders.length === 0) {
      Logger.log('No new orders, exiting');
      return;
    }

    // Transform for Sheets
    const transformed = transformOrders(orders);

    // Write to Sheets
    writeOrdersToSheet(transformed);

    // Update last sync timestamp
    PropertiesService.getScriptProperties()
      .setProperty(CONFIG.LAST_SYNC_KEY, new Date().toISOString());

    Logger.log('=== Sync Complete ===');

  } catch (error) {
    Logger.log(`✗ Sync failed: ${error.message}`);
    sendErrorNotification(error);
    throw error;
  }
}

/**
 * Fetch orders modified since timestamp
 */
function fetchOrdersSince(since) {
  const cacheKey = `orders_since_${since}`;

  return CacheManager.getOrCompute(cacheKey, () => {
    const baseUrl = getConfig('BC_BASE_URL');
    const token = OAuth2Manager.getToken();

    // Build OData filter
    let filter = '';
    if (since) {
      filter = `$filter=lastModifiedDateTime gt ${since}`;
    }

    // Optimize: Only fetch needed fields
    const select = '$select=id,documentNumber,customerName,totalAmountIncludingTax,status';

    // Expand related data (prevent N+1)
    const expand = '$expand=salesOrderLines($select=lineNumber,itemId,quantity,unitPrice)';

    const url = `${baseUrl}/salesOrders?${filter}&${select}&${expand}`;

    return fetchWithRetry(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).value;
  }, CONFIG.CACHE_TTL);
}

/**
 * Transform BC orders to Sheets format
 */
function transformOrders(orders) {
  return orders.map(order => [
    order.id,
    order.documentNumber,
    order.customerName,
    order.totalAmountIncludingTax,
    order.status,
    order.salesOrderLines.length, // Line count
    new Date()
  ]);
}

/**
 * Write orders to Sheets (batch operation)
 */
function writeOrdersToSheet(orders) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(CONFIG.SHEET_NAME);

  // Ensure sheet exists
  if (!sheet) {
    throw new Error(`Sheet "${CONFIG.SHEET_NAME}" not found`);
  }

  // Add headers if empty
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 7).setValues([[
      'ID', 'Document #', 'Customer', 'Total', 'Status', 'Lines', 'Updated'
    ]]);
  }

  // Append orders
  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, orders.length, 7).setValues(orders);

  Logger.log(`✓ Wrote ${orders.length} orders to Sheets`);
}

/**
 * Send error notification
 */
function sendErrorNotification(error) {
  const recipient = getConfig('ERROR_EMAIL');

  MailApp.sendEmail({
    to: recipient,
    subject: '❌ BC Order Sync Failed',
    body: `
Error: ${error.message}

Stack Trace:
${error.stack}

Timestamp: ${new Date()}

Check logs: ${ScriptApp.getService().getUrl()}
    `.trim()
  });
}

/**
 * Setup hourly sync trigger
 */
function setupSyncTrigger() {
  // Clear existing triggers
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'syncBCOrders') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create hourly trigger
  ScriptApp.newTrigger('syncBCOrders')
    .timeBased()
    .everyHours(1)
    .create();

  Logger.log('✓ Hourly sync trigger created');
}
```

**Learn more**: [BC Specialist](../../specialists/bc-specialist.md)

---

## Final Project: Complete Integration System

Build a complete production system with all intermediate concepts:

**Requirements:**
- Business Central OAuth2 integration
- Incremental order sync to Sheets
- Multi-level caching (73% hit rate goal)
- Error handling with exponential backoff
- Performance optimized (handle 10K+ orders)
- Health check endpoint
- Email notifications
- Hourly automatic sync

**Success Criteria:**
✅ Sync runs reliably every hour
✅ Handles 10K+ orders in <10 seconds
✅ Gracefully handles API failures
✅ Cache hit rate >70%
✅ Zero hardcoded credentials
✅ Detailed logs for debugging
✅ Email on errors

---

## Congratulations! 🎉

You've completed the Intermediate Learning Path!

### What You Learned

✅ OAuth2 authentication with token refresh
✅ Resilient error handling with exponential backoff
✅ Multi-level caching for performance
✅ Large dataset optimization
✅ Business Central API integration
✅ Production-ready patterns

### Next Steps

**Choose your path:**

1. **Build more**: Apply these patterns to other integrations
2. **Level up**: Continue to [Advanced Learning Path](advanced.md)
3. **Go deeper**: Explore specialists:
   - [Security Engineer](../../specialists/security-engineer.md) - RBAC, audit logging
   - [Platform Engineer](../../specialists/platform-engineer.md) - Monitoring, circuit breakers
   - [Data Engineer](../../specialists/data-engineer.md) - ETL patterns, data modeling

---

**Keep building production-ready systems! 🚀**
