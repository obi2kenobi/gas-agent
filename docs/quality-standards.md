# 📐 Quality Standards for GAS-Agent Documentation

**Communication Guidelines and Best Practices**

---

## Overview

This document defines the quality standards and communication guidelines used throughout the GAS-Agent documentation system. These standards ensure consistency, clarity, and effectiveness when working with Claude AI to develop Google Apps Script projects.

---

## Core Communication Principles

### 1. **Why Before What**

Always explain the reasoning and context before describing the implementation.

**❌ Bad Example:**
```
Use getValues() instead of getValue().
```

**✅ Good Example:**
```
Use getValues() to read data in batch operations.

WHY: getValue() makes one API call per cell. For 1000 cells, that's 1000 API calls,
which is slow and hits quota limits. getValues() makes a single API call to fetch
all cells at once, resulting in 100x faster execution and better quota usage.
```

### 2. **Impact Quantification**

Quantify the impact of recommendations with concrete metrics when possible.

**❌ Bad Example:**
```
Caching improves performance.
```

**✅ Good Example:**
```
Multi-level caching reduces API calls by 73% and improves response time from
2.3 seconds to 0.4 seconds (5.75x faster) in our Business Central integration benchmark.
```

### 3. **Analogies for Complex Concepts**

Use analogies to make complex technical concepts more accessible.

**Example:**
```
CONCEPT: Exponential backoff

ANALOGY: Think of exponential backoff like knocking on a busy person's door.
If they don't answer, you don't knock again immediately - you wait a bit.
If they still don't answer, you wait even longer before trying again.
This prevents overwhelming them while ensuring you eventually get through.

TECHNICAL: Start with 1-second delay, then 2s, 4s, 8s... until success or max retries.
```

### 4. **Checkpoints for Long Processes**

Break long processes into checkpoints to prevent timeout and allow progress tracking.

**Example:**
```
For operations that process 10K+ rows:

Checkpoint 1: Process rows 1-2500   → Save progress
Checkpoint 2: Process rows 2501-5000 → Save progress
Checkpoint 3: Process rows 5001-7500 → Save progress
Checkpoint 4: Process rows 7501-10000 → Complete

Each checkpoint saves state. If timeout occurs, resume from last checkpoint.
```

### 5. **Always Include Testing Guidance**

Every code example should include guidance on how to test it.

**Example:**
```javascript
function getCachedBCOrders(customerId) {
  // Implementation here...
}

// TESTING:
// 1. First call should hit BC API (check logs for "API call made")
// 2. Second call within 6 hours should return cached data (check logs for "Cache hit")
// 3. Verify data consistency: cached data === fresh API data
// 4. Test cache expiration: wait 6+ hours, verify fresh API call
```

---

## Code Quality Standards

### General Principles

1. **Readability over cleverness** - Code should be self-explanatory
2. **DRY (Don't Repeat Yourself)** - Extract repeated logic
3. **Single Responsibility** - Each function does one thing well
4. **Error handling** - All external calls wrapped in try-catch
5. **Constants** - Magic numbers/strings extracted to constants

### Function Design

**Maximum Lines:** 50 lines per function
- If longer, break into smaller functions
- Exception: Functions with repetitive switch/case statements

**Parameters:** Maximum 4 parameters
- If more needed, use configuration object
- Use destructuring for clarity

**Example:**
```javascript
// ❌ Bad: Too many parameters
function syncOrder(orderId, customerId, status, priority, retryCount, timeout) {
  // ...
}

// ✅ Good: Configuration object
function syncOrder(orderId, config = {}) {
  const {
    customerId,
    status = 'pending',
    priority = 'normal',
    retryCount = 3,
    timeout = 30000
  } = config;
  // ...
}
```

### Naming Conventions

**Functions:**
- Use verbs: `getOrder()`, `updateCustomer()`, `validateData()`
- Boolean-returning: `isValid()`, `hasPermission()`, `canSync()`
- Event handlers: `onOrderCreated()`, `handleError()`

**Variables:**
- Descriptive names: `customerOrders`, not `data`
- Constants: `UPPER_SNAKE_CASE`
- Private: Prefix with underscore `_privateFunction()`

**Example:**
```javascript
// ❌ Bad
const d = getData();
function proc(x) { return x * 2; }

// ✅ Good
const customerOrders = getCustomerOrders();
function calculateTotalPrice(orderItems) { return orderItems.reduce(...); }
```

### Error Handling

**Every external call must have error handling:**

```javascript
// ❌ Bad: No error handling
function getOrder(orderId) {
  const response = UrlFetchApp.fetch(url);
  return JSON.parse(response.getContentText());
}

// ✅ Good: Comprehensive error handling
function getOrder(orderId) {
  try {
    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true
    });

    const statusCode = response.getResponseCode();
    if (statusCode !== 200) {
      throw new Error(`API returned status ${statusCode}`);
    }

    const contentText = response.getContentText();
    if (!contentText) {
      throw new Error('Empty response from API');
    }

    return JSON.parse(contentText);

  } catch (error) {
    Logger.log(`Error fetching order ${orderId}: ${error.message}`);
    throw new Error(`Failed to get order: ${error.message}`);
  }
}
```

### Performance Patterns

**Required for Production Code:**

1. **Batch Operations** - Use `getValues()`/`setValues()` not `getValue()`/`setValue()`
2. **Caching** - Cache expensive operations (API calls, complex calculations)
3. **Pagination** - Handle large datasets in chunks
4. **Exponential Backoff** - Retry failed operations with increasing delays
5. **Indexing** - Build indexes for O(1) lookups on large datasets

**Example:**
```javascript
// ❌ Bad: Row-by-row (1000 API calls for 1000 rows)
for (let i = 0; i < orders.length; i++) {
  sheet.getRange(i + 2, 1).setValue(orders[i].id);
  sheet.getRange(i + 2, 2).setValue(orders[i].customer);
}

// ✅ Good: Batch operation (1 API call)
const values = orders.map(order => [order.id, order.customer, order.total]);
sheet.getRange(2, 1, values.length, 3).setValues(values);
```

---

## Security Standards

### Mandatory Security Practices

1. **Never hardcode credentials**
   - Use `PropertiesService.getScriptProperties()`
   - Document required properties in README

2. **OAuth2 token management**
   - Always implement token refresh
   - Cache tokens with 5-minute expiry buffer
   - Handle 401 responses automatically

3. **Input validation**
   - Validate all user inputs
   - Sanitize data before using in queries
   - Validate foreign keys before database operations

4. **Error messages**
   - Don't leak sensitive information in error messages
   - Log detailed errors, show generic messages to users

5. **HTTPS enforcement**
   - All external API calls use HTTPS
   - Verify SSL certificates

**Example:**
```javascript
// ❌ Bad: Hardcoded credentials
const API_KEY = 'sk-abc123xyz';

// ✅ Good: Secure storage
function getApiKey() {
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('CLAUDE_API_KEY');

  if (!apiKey) {
    throw new Error('CLAUDE_API_KEY not configured. See README for setup instructions.');
  }

  return apiKey;
}
```

---

## Documentation Standards

### Code Comments

**Use JSDoc for all functions:**

```javascript
/**
 * Retrieves orders from Business Central with optional filtering
 *
 * @param {Object} options - Query options
 * @param {string} [options.status] - Filter by status (e.g., 'Open', 'Released')
 * @param {string} [options.customerId] - Filter by customer ID
 * @param {number} [options.limit=100] - Maximum number of results
 * @returns {Array<Object>} Array of order objects
 * @throws {Error} If API request fails or authentication is invalid
 *
 * @example
 * // Get all open orders
 * const orders = getOrders({ status: 'Open' });
 *
 * @example
 * // Get orders for specific customer
 * const customerOrders = getOrders({ customerId: 'C001', limit: 50 });
 */
function getOrders(options = {}) {
  // Implementation...
}
```

### Inline Comments

**Use inline comments for non-obvious logic:**

```javascript
// Calculate 5-minute buffer before token expiry to prevent race conditions
const expiresIn = tokenData.expires_in - 300;

// Build index for O(1) lookups instead of O(n) array.find()
const orderIndex = {};
orders.forEach(order => {
  orderIndex[order.id] = order;
});
```

### README Requirements

Every project/module should have a README with:

1. **Purpose** - What does this do?
2. **Prerequisites** - What's needed to use it?
3. **Setup** - How to configure it?
4. **Usage** - How to use it?
5. **Configuration** - What settings are available?
6. **Troubleshooting** - Common issues and solutions

---

## Testing Standards

### Test Coverage

**Minimum:** 80% code coverage for production code

**Focus on:**
- Happy path (expected behavior)
- Error cases (what happens when things go wrong)
- Edge cases (boundary conditions, empty inputs, etc.)

### Test Structure

Use AAA pattern: **Arrange → Act → Assert**

```javascript
function testGetOrders() {
  // Arrange
  const mockCustomerId = 'C001';
  const expectedOrderCount = 3;

  // Act
  const orders = getOrders({ customerId: mockCustomerId });

  // Assert
  if (orders.length !== expectedOrderCount) {
    throw new Error(`Expected ${expectedOrderCount} orders, got ${orders.length}`);
  }

  Logger.log('✓ testGetOrders passed');
}
```

### Mock External Dependencies

**Don't call real APIs in tests:**

```javascript
// Test helper: Mock UrlFetchApp
function mockUrlFetchApp(mockResponse) {
  const originalFetch = UrlFetchApp.fetch;

  UrlFetchApp.fetch = function(url, options) {
    return {
      getResponseCode: () => 200,
      getContentText: () => JSON.stringify(mockResponse)
    };
  };

  return {
    restore: () => {
      UrlFetchApp.fetch = originalFetch;
    }
  };
}
```

---

## Performance Benchmarking

### Required for Performance-Critical Code

Document performance characteristics:

```javascript
/**
 * Syncs orders from Business Central to Sheets
 *
 * PERFORMANCE:
 * - 100 orders: ~2.3 seconds
 * - 1000 orders: ~8.7 seconds
 * - 10000 orders: ~45 seconds (with checkpointing)
 *
 * Benchmark: MacBook Pro M1, 100 Mbps connection
 * Date: 2025-11-15
 */
function syncOrders() {
  // Implementation...
}
```

### Before/After Comparisons

When optimizing, document improvements:

```javascript
// BEFORE OPTIMIZATION:
// - Execution time: 45.3 seconds
// - API calls: 1000
// - Quota usage: 15%

// AFTER OPTIMIZATION:
// - Execution time: 4.1 seconds (11x faster)
// - API calls: 1
// - Quota usage: 0.2%
//
// CHANGES:
// - Replaced getValue() with getValues() (batch operation)
// - Added response caching (6-hour TTL)
// - Implemented request deduplication
```

---

## Logging Standards

### Log Levels

Use consistent log levels:

```javascript
const LogLevel = {
  DEBUG: 0,   // Detailed debugging information
  INFO: 1,    // General informational messages
  WARN: 2,    // Warning messages (potential issues)
  ERROR: 3    // Error messages (failures)
};
```

### Structured Logging

Use structured format for easier parsing:

```javascript
function log(level, message, context = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: level,
    message: message,
    ...context
  };

  Logger.log(JSON.stringify(logEntry));
}

// Usage:
log(LogLevel.INFO, 'Order synced successfully', {
  orderId: 'SO001',
  customerId: 'C001',
  executionTime: 234
});
```

---

## Versioning and Changes

### Version Format

Use Semantic Versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Changelog

Document all changes in CHANGELOG.md:

```markdown
# Changelog

## [1.2.0] - 2025-11-15

### Added
- Multi-level caching for Business Central API responses
- Health check endpoint for monitoring

### Changed
- Improved error messages for OAuth2 failures
- Updated batch operation size from 5000 to 10000

### Fixed
- Token refresh race condition in concurrent requests
- Memory leak in order sync process

### Deprecated
- `getOrderById()` - Use `getOrders({ id: '...' })` instead
```

---

## Deprecation Policy

### How to Deprecate Features

1. **Mark as deprecated** in JSDoc with replacement suggestion
2. **Add warning log** when deprecated function is called
3. **Document in CHANGELOG** with migration guide
4. **Remove after 2 major versions**

**Example:**
```javascript
/**
 * @deprecated Use getOrders({ id: orderId }) instead. Will be removed in v3.0.0
 */
function getOrderById(orderId) {
  Logger.log('WARNING: getOrderById() is deprecated. Use getOrders({ id: orderId }) instead.');
  return getOrders({ id: orderId })[0];
}
```

---

## Code Review Checklist

Before considering code complete, verify:

### Functionality
- [ ] All requirements implemented
- [ ] Edge cases handled
- [ ] Error handling present

### Performance
- [ ] Batch operations used (not row-by-row)
- [ ] Caching implemented for expensive operations
- [ ] No N+1 query patterns
- [ ] Large datasets paginated

### Security
- [ ] No hardcoded credentials
- [ ] Input validation present
- [ ] OAuth2 token refresh implemented
- [ ] Error messages don't leak sensitive data

### Code Quality
- [ ] Functions < 50 lines
- [ ] Clear, descriptive names
- [ ] JSDoc comments present
- [ ] No code duplication

### Testing
- [ ] Tests written and passing
- [ ] 80%+ code coverage
- [ ] Edge cases tested
- [ ] Mocks used for external dependencies

### Documentation
- [ ] README updated
- [ ] API documentation current
- [ ] Comments explain non-obvious logic
- [ ] Examples provided

---

## Examples of Quality Standards Applied

### Example 1: Complete Function with All Standards

```javascript
/**
 * Retrieves and caches Business Central orders with exponential backoff retry
 *
 * WHY: Direct API calls are slow (2.3s average) and count against quotas.
 * This function implements multi-level caching (73% hit rate) and retry logic
 * to improve performance and reliability.
 *
 * PERFORMANCE:
 * - Cache hit: ~0.1 seconds
 * - Cache miss: ~2.3 seconds (first call), then cached
 * - Reduces API calls by 73% in production workloads
 *
 * @param {Object} options - Query options
 * @param {string} [options.status] - Filter by status ('Open', 'Released', etc.)
 * @param {number} [options.limit=100] - Maximum results to return
 * @param {boolean} [options.useCache=true] - Whether to use caching
 * @returns {Array<Object>} Array of order objects
 * @throws {Error} If API fails after all retries
 *
 * @example
 * // Get open orders with caching
 * const orders = getBCOrders({ status: 'Open' });
 *
 * @example
 * // Force fresh data (bypass cache)
 * const orders = getBCOrders({ status: 'Open', useCache: false });
 */
function getBCOrders(options = {}) {
  // Extract and set defaults
  const {
    status,
    limit = 100,
    useCache = true
  } = options;

  // Build cache key
  const cacheKey = `bc_orders_${status || 'all'}_${limit}`;

  // Try cache first
  if (useCache) {
    const cached = CacheManager.get(cacheKey);
    if (cached) {
      Logger.log(`Cache hit for ${cacheKey}`);
      return JSON.parse(cached);
    }
  }

  // Build OData query
  const filters = [];
  if (status) {
    filters.push(`status eq '${status}'`);
  }

  const query = filters.length > 0 ? `$filter=${filters.join(' and ')}` : '';
  const url = `${Config.BC_BASE_URL}/salesOrders?${query}&$top=${limit}`;

  // Fetch with retry logic
  const orders = retryWithBackoff(() => {
    try {
      const token = OAuth2Manager.getToken();
      const response = UrlFetchApp.fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
        muteHttpExceptions: true
      });

      const statusCode = response.getResponseCode();
      if (statusCode !== 200) {
        throw new Error(`BC API returned status ${statusCode}`);
      }

      const data = JSON.parse(response.getContentText());
      return data.value; // OData wraps results in 'value' property

    } catch (error) {
      Logger.log(`Error fetching BC orders: ${error.message}`);
      throw error; // Re-throw for retry logic
    }
  }, {
    maxRetries: 3,
    initialDelay: 1000,
    backoffFactor: 2
  });

  // Cache successful response (6 hour TTL)
  if (useCache) {
    CacheManager.put(cacheKey, JSON.stringify(orders), 21600);
  }

  Logger.log(`Fetched ${orders.length} orders from BC API`);
  return orders;
}

// TESTING:
function testGetBCOrders() {
  // Test 1: Happy path with caching
  const orders1 = getBCOrders({ status: 'Open' });
  if (orders1.length === 0) {
    throw new Error('Expected orders to be returned');
  }

  // Test 2: Cache hit (should be faster)
  const start = Date.now();
  const orders2 = getBCOrders({ status: 'Open' });
  const elapsed = Date.now() - start;

  if (elapsed > 500) {
    throw new Error('Cache should have returned faster');
  }

  // Test 3: Bypass cache
  const orders3 = getBCOrders({ status: 'Open', useCache: false });
  if (JSON.stringify(orders1) !== JSON.stringify(orders3)) {
    throw new Error('Cached and fresh data should match');
  }

  Logger.log('✓ All tests passed');
}
```

---

## Summary

These quality standards ensure that all code in the GAS-Agent ecosystem is:

✅ **Clear** - Easy to understand with explanatory comments
✅ **Performant** - Uses best practices for speed and quota efficiency
✅ **Secure** - Follows security best practices
✅ **Reliable** - Has error handling and retry logic
✅ **Testable** - Includes tests and mocks
✅ **Maintainable** - Well-documented and consistent

---

## Related Documentation

- **Orchestrator**: [ORCHESTRATOR.md](ORCHESTRATOR.md) - Uses these standards for validation
- **All Specialists**: [specialists/](specialists/) - Apply these standards in implementations
- **Getting Started**: [getting-started/README.md](getting-started/README.md) - Learn how to apply these standards

---

**Version**: 1.0
**Last Updated**: November 2025
**Status**: Active
