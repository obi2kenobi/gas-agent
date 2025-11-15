# 🧪 Testing Guide for Google Apps Script

**Comprehensive testing patterns and practices**

---

## Overview

Testing GAS applications is different from traditional JavaScript testing:
- No built-in test runner
- Limited external library support
- Must mock Google services
- Execution environment differences

This guide shows you how to build a robust testing strategy for GAS.

---

## Testing Strategy

### Test Pyramid

```
        /\
       /  \    E2E Tests (5%)
      /____\
     /      \  Integration Tests (15%)
    /________\
   /          \ Unit Tests (80%)
  /____________\
```

**Unit Tests**: Test individual functions in isolation
**Integration Tests**: Test component interactions
**E2E Tests**: Test complete workflows

---

## Quick Start

### Simple Test Runner

```javascript
/**
 * Simple test runner for GAS
 */
const TestRunner = (function() {
  let passedTests = 0;
  let failedTests = 0;
  const failures = [];

  function assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  function assertEquals(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(
        message || `Expected ${expected}, got ${actual}`
      );
    }
  }

  function assertThrows(fn, expectedError) {
    let threw = false;
    try {
      fn();
    } catch (error) {
      threw = true;
      if (expectedError && !error.message.includes(expectedError)) {
        throw new Error(
          `Expected error containing "${expectedError}", got "${error.message}"`
        );
      }
    }

    if (!threw) {
      throw new Error('Expected function to throw');
    }
  }

  function test(name, fn) {
    try {
      fn();
      passedTests++;
      Logger.log(`✓ ${name}`);
    } catch (error) {
      failedTests++;
      failures.push({ name, error: error.message });
      Logger.log(`✗ ${name}: ${error.message}`);
    }
  }

  function runAll() {
    passedTests = 0;
    failedTests = 0;
    failures.length = 0;

    Logger.log('=== Running Tests ===\n');

    // Auto-discover and run all test functions
    const testFunctions = getTestFunctions();
    testFunctions.forEach(fnName => {
      test(fnName, this[fnName]);
    });

    Logger.log(`\n=== Test Results ===`);
    Logger.log(`Passed: ${passedTests}`);
    Logger.log(`Failed: ${failedTests}`);

    if (failedTests > 0) {
      Logger.log('\nFailures:');
      failures.forEach(f => {
        Logger.log(`- ${f.name}: ${f.error}`);
      });
    }

    return {
      passed: passedTests,
      failed: failedTests,
      failures: failures
    };
  }

  function getTestFunctions() {
    return Object.getOwnPropertyNames(this)
      .filter(name => name.startsWith('test') && typeof this[name] === 'function');
  }

  return {
    assert,
    assertEquals,
    assertThrows,
    test,
    runAll
  };
})();
```

---

## Unit Testing Patterns

### 1. Testing Pure Functions

```javascript
/**
 * Pure function to test
 */
function calculateTotalPrice(items) {
  return items.reduce((sum, item) => {
    return sum + (item.quantity * item.price);
  }, 0);
}

/**
 * Unit test
 */
function testCalculateTotalPrice() {
  // Arrange
  const items = [
    { quantity: 2, price: 10 },
    { quantity: 3, price: 5 }
  ];

  // Act
  const total = calculateTotalPrice(items);

  // Assert
  TestRunner.assertEquals(total, 35, 'Total should be 35');
}

/**
 * Edge case test
 */
function testCalculateTotalPrice_EmptyArray() {
  const total = calculateTotalPrice([]);
  TestRunner.assertEquals(total, 0, 'Empty array should return 0');
}

/**
 * Error case test
 */
function testCalculateTotalPrice_InvalidInput() {
  TestRunner.assertThrows(
    () => calculateTotalPrice(null),
    'Cannot read property'
  );
}
```

### 2. Testing with Mocks

```javascript
/**
 * Function that uses external service
 */
function fetchUserData(userId) {
  const url = `https://api.example.com/users/${userId}`;
  const response = UrlFetchApp.fetch(url);
  return JSON.parse(response.getContentText());
}

/**
 * Mock UrlFetchApp for testing
 */
function createUrlFetchMock(mockResponse) {
  const originalFetch = UrlFetchApp.fetch;

  // Replace with mock
  UrlFetchApp.fetch = function(url, options) {
    return {
      getResponseCode: () => 200,
      getContentText: () => JSON.stringify(mockResponse)
    };
  };

  // Return restore function
  return {
    restore: () => {
      UrlFetchApp.fetch = originalFetch;
    }
  };
}

/**
 * Test with mock
 */
function testFetchUserData() {
  // Arrange
  const mockUser = { id: '123', name: 'John Doe' };
  const mock = createUrlFetchMock(mockUser);

  try {
    // Act
    const user = fetchUserData('123');

    // Assert
    TestRunner.assertEquals(user.id, '123');
    TestRunner.assertEquals(user.name, 'John Doe');
  } finally {
    // Always restore
    mock.restore();
  }
}
```

### 3. Testing Repository Pattern

```javascript
/**
 * Test data setup
 */
function setupTestSheet() {
  const ss = SpreadsheetApp.create('Test Sheet');
  const sheet = ss.getActiveSheet();
  sheet.setName('Orders');

  // Add headers
  sheet.getRange(1, 1, 1, 3).setValues([
    ['ID', 'Customer', 'Total']
  ]);

  // Add test data
  sheet.getRange(2, 1, 2, 3).setValues([
    ['O001', 'Customer A', 100],
    ['O002', 'Customer B', 200]
  ]);

  return ss.getId();
}

/**
 * Cleanup test data
 */
function teardownTestSheet(ssId) {
  DriveApp.getFileById(ssId).setTrashed(true);
}

/**
 * Test repository find
 */
function testOrderRepository_FindById() {
  const ssId = setupTestSheet();

  try {
    // Switch to test sheet
    const originalSS = SpreadsheetApp.getActiveSpreadsheet();
    SpreadsheetApp.openById(ssId).getActiveSheet();

    const order = OrderRepository.findById('O001');

    TestRunner.assert(order !== null, 'Order should be found');
    TestRunner.assertEquals(order.id, 'O001');
    TestRunner.assertEquals(order.customer, 'Customer A');
    TestRunner.assertEquals(order.total, 100);

  } finally {
    teardownTestSheet(ssId);
  }
}

/**
 * Test repository save
 */
function testOrderRepository_Save() {
  const ssId = setupTestSheet();

  try {
    const newOrder = {
      id: 'O003',
      customer: 'Customer C',
      total: 300
    };

    OrderRepository.save(newOrder);

    const saved = OrderRepository.findById('O003');
    TestRunner.assert(saved !== null, 'Order should be saved');
    TestRunner.assertEquals(saved.total, 300);

  } finally {
    teardownTestSheet(ssId);
  }
}
```

---

## Integration Testing

### Testing OAuth2 Flow

```javascript
/**
 * Integration test for OAuth2
 */
function testOAuth2Integration() {
  Logger.log('=== OAuth2 Integration Test ===');

  // Test 1: Get or refresh token
  try {
    const token = OAuth2Manager.getToken();
    TestRunner.assert(token, 'Should get valid token');
    Logger.log('✓ Token retrieved');
  } catch (error) {
    Logger.log(`✗ Token retrieval failed: ${error.message}`);
    throw error;
  }

  // Test 2: Use token for API call
  try {
    const response = callProtectedAPI(token);
    TestRunner.assert(response, 'Should get API response');
    Logger.log('✓ API call succeeded');
  } catch (error) {
    Logger.log(`✗ API call failed: ${error.message}`);
    throw error;
  }

  // Test 3: Token refresh (simulate expiry)
  try {
    CacheService.getScriptCache().remove('oauth_access_token');
    const newToken = OAuth2Manager.getToken();
    TestRunner.assert(newToken, 'Should refresh token');
    Logger.log('✓ Token refresh succeeded');
  } catch (error) {
    Logger.log(`✗ Token refresh failed: ${error.message}`);
    throw error;
  }

  Logger.log('=== All OAuth2 tests passed ===');
}
```

### Testing Cache Strategy

```javascript
function testCacheStrategy() {
  const testKey = 'test_cache_key';
  const testValue = 'test_value';

  // Test 1: Cache miss
  CacheManager.remove(testKey);
  const miss = CacheManager.get(testKey);
  TestRunner.assertEquals(miss, null, 'Should be cache miss');

  // Test 2: Cache put and hit
  CacheManager.put(testKey, testValue, 60);
  const hit = CacheManager.get(testKey);
  TestRunner.assertEquals(hit, testValue, 'Should be cache hit');

  // Test 3: getOrCompute
  let computeCalled = false;
  const result = CacheManager.getOrCompute(
    testKey,
    () => {
      computeCalled = true;
      return 'computed_value';
    },
    60
  );

  TestRunner.assertEquals(result, testValue, 'Should return cached value');
  TestRunner.assert(!computeCalled, 'Compute should not be called');

  // Test 4: Cache expiry (new key)
  const newResult = CacheManager.getOrCompute(
    'new_key',
    () => 'new_value',
    60
  );

  TestRunner.assertEquals(newResult, 'new_value', 'Should compute new value');

  // Cleanup
  CacheManager.remove(testKey);
  CacheManager.remove('new_key');
}
```

---

## E2E Testing

### Complete Workflow Test

```javascript
/**
 * End-to-end test: BC Order Sync
 */
function testE2E_BCOrderSync() {
  Logger.log('=== E2E Test: BC Order Sync ===');

  try {
    // Step 1: Clear test data
    clearTestOrders();
    Logger.log('✓ Test data cleared');

    // Step 2: Run sync
    const result = OrderService.syncFromBC({ status: 'Open' });
    Logger.log(`✓ Sync completed: ${result.total} orders`);

    // Step 3: Verify data in Sheets
    const orders = OrderRepository.findAll({ status: 'Open' });
    TestRunner.assert(orders.length > 0, 'Should have synced orders');
    Logger.log(`✓ Found ${orders.length} orders in Sheets`);

    // Step 4: Verify data integrity
    orders.forEach(order => {
      TestRunner.assert(order.id, 'Order should have ID');
      TestRunner.assert(order.customerId, 'Order should have customer');
      TestRunner.assert(order.total >= 0, 'Total should be non-negative');
    });
    Logger.log('✓ Data integrity checks passed');

    // Step 5: Test incremental sync
    const lastSync = new Date().toISOString();
    Utilities.sleep(2000); // Wait 2 seconds

    const result2 = OrderService.syncFromBC({ since: lastSync });
    Logger.log(`✓ Incremental sync: ${result2.total} orders`);

    Logger.log('=== E2E Test Passed ===');

  } catch (error) {
    Logger.log(`✗ E2E Test Failed: ${error.message}`);
    throw error;
  } finally {
    // Cleanup
    clearTestOrders();
  }
}
```

---

## Performance Testing

### Benchmarking

```javascript
function benchmarkBatchOperations() {
  const testData = [];
  for (let i = 0; i < 1000; i++) {
    testData.push(['Data ' + i]);
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Benchmark');

  // Benchmark 1: Row-by-row
  const start1 = Date.now();
  for (let i = 0; i < testData.length; i++) {
    sheet.getRange(i + 1, 1).setValue(testData[i][0]);
  }
  const time1 = Date.now() - start1;

  // Clear sheet
  sheet.clear();

  // Benchmark 2: Batch operation
  const start2 = Date.now();
  sheet.getRange(1, 1, testData.length, 1).setValues(testData);
  const time2 = Date.now() - start2;

  Logger.log(`Row-by-row: ${time1}ms`);
  Logger.log(`Batch: ${time2}ms`);
  Logger.log(`Improvement: ${(time1 / time2).toFixed(2)}x faster`);

  TestRunner.assert(time2 < time1, 'Batch should be faster');
}
```

---

## Test Organization

### Recommended Structure

```
src/
├── Code.gs                  # Production code
├── OrderRepository.gs       # Production code
├── OrderService.gs          # Production code
└── tests/
    ├── TestRunner.gs        # Test framework
    ├── Mocks.gs             # Mock helpers
    ├── TestOrderRepository.gs   # Repository tests
    ├── TestOrderService.gs      # Service tests
    └── TestE2E.gs           # E2E tests
```

### Test Naming Convention

```javascript
// Pattern: test[ComponentName]_[Method]_[Scenario]

function testOrderRepository_FindById_ValidId() { }
function testOrderRepository_FindById_InvalidId() { }
function testOrderService_SyncFromBC_Success() { }
function testOrderService_SyncFromBC_APIFailure() { }
```

---

## Running Tests

### Manual Execution

```javascript
/**
 * Run all tests
 */
function runAllTests() {
  Logger.log('Starting test suite...\n');

  const results = TestRunner.runAll();

  if (results.failed === 0) {
    Logger.log('\n✅ All tests passed!');
  } else {
    Logger.log(`\n❌ ${results.failed} tests failed`);
  }

  return results;
}
```

### Automated Testing (CI/CD)

```bash
# Using clasp and a test script
clasp push
clasp run 'runAllTests'
```

See [Deployment Guide](../deployment/README.md) for CI/CD integration.

---

## Best Practices

### 1. Test Isolation

✅ Each test should be independent
✅ Use setup/teardown for test data
✅ Don't rely on test execution order

### 2. Clear Test Names

✅ `testCalculateTotal_EmptyCart_ReturnsZero`
❌ `test1`, `testFunction`

### 3. Arrange-Act-Assert Pattern

```javascript
function testExample() {
  // Arrange: Setup test data
  const input = prepareTestData();

  // Act: Execute function
  const result = functionUnderTest(input);

  // Assert: Verify result
  TestRunner.assertEquals(result, expectedValue);
}
```

### 4. Test Coverage

Aim for:
- ✅ Happy path
- ✅ Edge cases
- ✅ Error cases
- ✅ Boundary conditions

### 5. Mock External Dependencies

Always mock:
- UrlFetchApp (external APIs)
- SpreadsheetApp (when possible)
- DriveApp
- MailApp
- PropertiesService (for isolation)

---

## Continuous Improvement

### Test Metrics to Track

- **Coverage**: % of code tested
- **Pass Rate**: % of tests passing
- **Execution Time**: How long tests take
- **Flakiness**: Tests that fail intermittently

### Regular Review

- Review and update tests when code changes
- Remove obsolete tests
- Add tests for new features
- Refactor test code like production code

---

## Related Documentation

- **Quality Standards**: [../quality-standards.md](../quality-standards.md)
- **Deployment**: [../deployment/README.md](../deployment/README.md)
- **Troubleshooting**: [../troubleshooting.md](../troubleshooting.md)

---

**Test early, test often! 🧪**

**Version**: 1.0
**Last Updated**: November 2025
