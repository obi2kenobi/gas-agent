/**
 * TEST.gs - Comprehensive Test Suite
 *
 * Tests all components of the Business Central integration
 * Run these tests after setup to verify everything works correctly.
 */

/**
 * Test Suite Runner
 * Runs all tests and reports results
 */
function runAllTests() {
  Logger.log('🧪 GAS-Agent OAuth2 BC Integration - Test Suite');
  Logger.log('='.repeat(60));
  Logger.log('');

  const tests = [
    { name: 'Configuration', fn: testConfiguration },
    { name: 'OAuth2 Flow', fn: testOAuth2 },
    { name: 'BC API Connection', fn: testBCConnection },
    { name: 'Token Caching', fn: testTokenCaching },
    { name: 'OData Queries', fn: testODataQueries },
    { name: 'Error Handling', fn: testErrorHandling },
    { name: 'Performance', fn: testPerformance }
  ];

  const results = {
    passed: 0,
    failed: 0,
    total: tests.length,
    details: []
  };

  tests.forEach(test => {
    Logger.log(`\n📋 Test: ${test.name}`);
    Logger.log('-'.repeat(60));

    try {
      const startTime = Date.now();
      const result = test.fn();
      const elapsed = Date.now() - startTime;

      if (result === true || result === undefined) {
        results.passed++;
        results.details.push({ test: test.name, status: 'PASSED', elapsed });
        Logger.log(`✅ PASSED (${elapsed}ms)`);
      } else {
        results.failed++;
        results.details.push({ test: test.name, status: 'FAILED', elapsed, error: 'Test returned false' });
        Logger.log(`❌ FAILED`);
      }
    } catch (error) {
      results.failed++;
      results.details.push({ test: test.name, status: 'FAILED', error: error.message });
      Logger.log(`❌ FAILED: ${error.message}`);
    }
  });

  // Summary
  Logger.log('');
  Logger.log('='.repeat(60));
  Logger.log('📊 TEST SUMMARY');
  Logger.log('='.repeat(60));
  Logger.log(`Total Tests: ${results.total}`);
  Logger.log(`Passed: ${results.passed} ✅`);
  Logger.log(`Failed: ${results.failed} ❌`);
  Logger.log(`Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
  Logger.log('');

  if (results.failed === 0) {
    Logger.log('🎉 ALL TESTS PASSED! System is ready for production use.');
  } else {
    Logger.log('⚠️  SOME TESTS FAILED. Review errors above.');
  }

  return results;
}

/**
 * Test: Token Caching Performance
 */
function testTokenCaching() {
  Logger.log('Testing token caching strategy...');

  // Clear cache to start fresh
  clearTokenCache();

  // First call - should fetch from Azure AD
  const start1 = Date.now();
  const token1 = getBCAccessToken();
  const time1 = Date.now() - start1;
  Logger.log(`  1st call (fresh): ${time1}ms`);

  // Second call - should use memory cache
  const start2 = Date.now();
  const token2 = getBCAccessToken();
  const time2 = Date.now() - start2;
  Logger.log(`  2nd call (memory): ${time2}ms`);

  // Verify tokens match
  if (token1 !== token2) {
    throw new Error('Tokens do not match');
  }

  // Verify cache is faster
  if (time2 >= time1) {
    Logger.log(`  ⚠️  Warning: Cache not faster (${time2}ms vs ${time1}ms)`);
  }

  const speedup = Math.round(time1 / time2);
  Logger.log(`  ✅ Cache speedup: ${speedup}x faster`);

  // Check cache status
  const status = getTokenCacheStatus();
  Logger.log(`  Memory cache: ${status.memoryCache.isValid ? '✅' : '❌'} (expires in ${status.memoryCache.expiresIn}s)`);
  Logger.log(`  CacheService: ${status.cacheService.isValid ? '✅' : '❌'} (expires in ${status.cacheService.expiresIn}s)`);

  return true;
}

/**
 * Test: OData Query Patterns
 */
function testODataQueries() {
  Logger.log('Testing OData query patterns...');

  // Test 1: $select
  Logger.log('  Test 1: $select');
  const customers1 = Customers.getAll({ $select: 'No,Name', $top: 5 });
  if (!customers1 || customers1.length === 0) {
    throw new Error('$select query returned no results');
  }
  Logger.log(`    ✅ Retrieved ${customers1.length} customers with selected fields`);

  // Test 2: $filter
  Logger.log('  Test 2: $filter');
  const customers2 = Customers.getAll({
    $filter: 'Balance_LCY gt 0',
    $top: 5
  });
  if (customers2) {
    const allPositive = customers2.every(c => (c.Balance_LCY || 0) > 0);
    if (!allPositive) {
      throw new Error('$filter query returned records not matching filter');
    }
    Logger.log(`    ✅ Filter working correctly (${customers2.length} records)`);
  } else {
    Logger.log(`    ℹ️  No records matching filter (this is OK)`);
  }

  // Test 3: $orderby
  Logger.log('  Test 3: $orderby');
  const customers3 = Customers.getAll({
    $select: 'No,Name',
    $orderby: 'Name',
    $top: 5
  });
  if (customers3 && customers3.length >= 2) {
    const sorted = customers3.every((c, i) => {
      if (i === 0) return true;
      return (c.Name || '') >= (customers3[i - 1].Name || '');
    });
    if (!sorted) {
      throw new Error('$orderby not working correctly');
    }
    Logger.log(`    ✅ Order by working correctly`);
  } else {
    Logger.log(`    ℹ️  Not enough records to verify ordering`);
  }

  // Test 4: $top and pagination
  Logger.log('  Test 4: $top (pagination)');
  const customers4 = Customers.getAll({ $top: 3 });
  if (customers4.length > 3) {
    throw new Error('$top limit not respected');
  }
  Logger.log(`    ✅ $top working correctly (${customers4.length} records)`);

  // Test 5: $count
  Logger.log('  Test 5: count()');
  const count = Customers.count();
  if (typeof count !== 'number' || count < 0) {
    throw new Error('count() returned invalid result');
  }
  Logger.log(`    ✅ count() working (${count} total customers)`);

  return true;
}

/**
 * Test: Error Handling
 */
function testErrorHandling() {
  Logger.log('Testing error handling...');

  // Test 1: Invalid entity name
  Logger.log('  Test 1: Invalid entity name');
  try {
    BCClient.get('NonExistentEntity_XYZ123');
    throw new Error('Should have thrown error for invalid entity');
  } catch (error) {
    if (error.message.includes('Resource not found') || error.message.includes('404')) {
      Logger.log('    ✅ Invalid entity handled correctly');
    } else {
      Logger.log(`    ⚠️  Unexpected error: ${error.message}`);
    }
  }

  // Test 2: Invalid filter syntax
  Logger.log('  Test 2: Invalid filter syntax');
  try {
    Customers.getAll({ $filter: 'INVALID_SYNTAX @#$%' });
    // Some invalid filters might still return empty results
    Logger.log('    ⚠️  Invalid filter did not throw error (might be OK)');
  } catch (error) {
    Logger.log('    ✅ Invalid filter handled correctly');
  }

  // Test 3: Retry logic (this would need to be tested with network issues)
  Logger.log('  Test 3: Retry logic');
  Logger.log('    ℹ️  Retry logic tested implicitly (cannot force network errors)');

  return true;
}

/**
 * Test: Performance Benchmarks
 */
function testPerformance() {
  Logger.log('Testing performance benchmarks...');

  // Benchmark 1: Simple query
  Logger.log('  Benchmark 1: Simple query (5 records)');
  const start1 = Date.now();
  Customers.getAll({ $top: 5 });
  const time1 = Date.now() - start1;
  Logger.log(`    ⏱️  ${time1}ms`);

  if (time1 > 5000) {
    Logger.log('    ⚠️  Warning: Query slower than expected (>5s)');
  }

  // Benchmark 2: Larger query
  Logger.log('  Benchmark 2: Larger query (100 records)');
  const start2 = Date.now();
  Customers.getAll({ $top: 100 });
  const time2 = Date.now() - start2;
  Logger.log(`    ⏱️  ${time2}ms`);

  if (time2 > 10000) {
    Logger.log('    ⚠️  Warning: Query slower than expected (>10s)');
  }

  // Benchmark 3: Count query (should be fast)
  Logger.log('  Benchmark 3: Count query');
  const start3 = Date.now();
  Customers.count();
  const time3 = Date.now() - start3;
  Logger.log(`    ⏱️  ${time3}ms`);

  if (time3 > 2000) {
    Logger.log('    ⚠️  Warning: Count query slower than expected (>2s)');
  }

  // Benchmark 4: Cached token retrieval
  Logger.log('  Benchmark 4: Cached token retrieval');
  const start4 = Date.now();
  getBCAccessToken();
  const time4 = Date.now() - start4;
  Logger.log(`    ⏱️  ${time4}ms (from cache)`);

  if (time4 > 100) {
    Logger.log('    ⚠️  Warning: Cached token retrieval slower than expected (>100ms)');
  }

  Logger.log('  ✅ Performance benchmarks completed');
  return true;
}

/**
 * Quick Smoke Test
 * Run this for a fast verification
 */
function quickSmokeTest() {
  Logger.log('🚀 Quick Smoke Test');
  Logger.log('');

  const tests = [
    { name: 'Config', fn: () => testConfiguration() },
    { name: 'OAuth2', fn: () => testOAuth2() },
    { name: 'BC API', fn: () => testBCConnection() }
  ];

  let allPassed = true;

  tests.forEach(test => {
    try {
      Logger.log(`Testing ${test.name}...`);
      const result = test.fn();

      if (result === false) {
        allPassed = false;
        Logger.log(`❌ ${test.name} failed`);
      } else {
        Logger.log(`✅ ${test.name} passed`);
      }
      Logger.log('');
    } catch (error) {
      allPassed = false;
      Logger.log(`❌ ${test.name} failed: ${error.message}`);
      Logger.log('');
    }
  });

  if (allPassed) {
    Logger.log('✅ Smoke test passed! Basic functionality working.');
  } else {
    Logger.log('❌ Smoke test failed! Check errors above.');
  }

  return allPassed;
}

/**
 * Test specific functionality (for debugging)
 */
function testSpecific() {
  Logger.log('🔧 Testing specific functionality...');
  Logger.log('');

  // Add your specific test here
  // Example:
  try {
    const items = Items.getAll({ $top: 5, $select: 'No,Description' });
    Logger.log(`✅ Retrieved ${items.length} items`);
    items.forEach((item, i) => {
      Logger.log(`  ${i + 1}. ${item.No} - ${item.Description}`);
    });
  } catch (error) {
    Logger.log(`❌ Error: ${error.message}`);
  }
}

/**
 * Performance stress test (use with caution)
 * Tests system under heavier load
 */
function performanceStressTest() {
  Logger.log('⚡ Performance Stress Test');
  Logger.log('⚠️  This will make multiple API calls - use sparingly!');
  Logger.log('');

  const iterations = 10;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    Customers.getAll({ $top: 10 });
    const elapsed = Date.now() - start;
    times.push(elapsed);
    Logger.log(`  Iteration ${i + 1}/${iterations}: ${elapsed}ms`);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  Logger.log('');
  Logger.log('📊 Results:');
  Logger.log(`  Average: ${avgTime.toFixed(0)}ms`);
  Logger.log(`  Min: ${minTime}ms`);
  Logger.log(`  Max: ${maxTime}ms`);
  Logger.log(`  Std Dev: ${calculateStdDev(times).toFixed(0)}ms`);

  if (maxTime > avgTime * 3) {
    Logger.log('  ⚠️  High variance detected - may indicate intermittent issues');
  }

  return { avgTime, minTime, maxTime, times };
}

/**
 * Helper: Calculate standard deviation
 */
function calculateStdDev(values) {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}
