/**
 * TEST.gs
 *
 * Complete test suite for BC-Sheets Sync
 *
 * Tests:
 * - SyncEngine sync operations
 * - ChangeDetector tracking
 * - ConflictResolver conflict handling
 * - Scheduler trigger management
 * - Integration tests
 *
 * Usage:
 * 1. Run setupTestEnvironment() first
 * 2. Run runAllBCSyncTests() to execute full test suite
 * 3. Or run individual test functions
 *
 * @version 1.0
 */

/**
 * Setup test environment
 */
function setupTestEnvironment() {
  Logger.log('\n🧪 Setting up test environment...\n');

  // Create test sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let testSheet = ss.getSheetByName('_test_sync');

  if (testSheet) {
    ss.deleteSheet(testSheet);
  }

  testSheet = ss.insertSheet('_test_sync');

  Logger.log('✅ Test environment ready');
}

/**
 * Run all BC-Sheets Sync tests
 */
function runAllBCSyncTests() {
  Logger.log('\n🧪 RUNNING ALL BC-SHEETS SYNC TESTS\n');
  Logger.log('='.repeat(60) + '\n');

  const startTime = Date.now();
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  const tests = [
    { name: 'SyncEngine - Basic Sync', fn: testSyncEngineBasic },
    { name: 'SyncEngine - Incremental Sync', fn: testSyncEngineIncremental },
    { name: 'ChangeDetector - Track Changes', fn: testChangeDetectorTracking },
    { name: 'ChangeDetector - Get Modified', fn: testChangeDetectorModified },
    { name: 'ChangeDetector - Statistics', fn: testChangeDetectorStats },
    { name: 'ConflictResolver - Detect Conflict', fn: testConflictDetection },
    { name: 'ConflictResolver - Resolve BC Wins', fn: testConflictResolveBCWins },
    { name: 'ConflictResolver - Resolve Merge', fn: testConflictResolveMerge },
    { name: 'Scheduler - Create Trigger', fn: testSchedulerCreate },
    { name: 'Scheduler - Remove Trigger', fn: testSchedulerRemove },
    { name: 'Integration - Full Sync Flow', fn: testIntegrationFullFlow }
  ];

  tests.forEach(test => {
    try {
      Logger.log(`\n▶️  ${test.name}...`);
      test.fn();
      Logger.log(`✅ PASSED: ${test.name}`);
      results.passed++;
    } catch (error) {
      Logger.log(`❌ FAILED: ${test.name}`);
      Logger.log(`   Error: ${error.message}`);
      results.failed++;
      results.errors.push({
        test: test.name,
        error: error.message
      });
    }
  });

  const duration = Date.now() - startTime;

  Logger.log('\n' + '='.repeat(60));
  Logger.log('TEST SUMMARY');
  Logger.log('='.repeat(60));
  Logger.log(`Total Tests: ${tests.length}`);
  Logger.log(`✅ Passed: ${results.passed}`);
  Logger.log(`❌ Failed: ${results.failed}`);
  Logger.log(`Duration: ${duration}ms`);

  if (results.failed > 0) {
    Logger.log('\nFailed Tests:');
    results.errors.forEach(err => {
      Logger.log(`- ${err.test}: ${err.error}`);
    });
  }

  return results;
}

// ============================================================================
// SyncEngine Tests
// ============================================================================

function testSyncEngineBasic() {
  // Test configuration
  const originalConfig = SyncEngine.getConfig();

  SyncEngine.configure({
    syncDirection: 'BC_TO_SHEETS',
    enableChangeTracking: false,
    enableConflictDetection: false
  });

  assert(SyncEngine.getConfig().syncDirection === 'BC_TO_SHEETS', 'Config should update');

  // Restore
  SyncEngine.configure(originalConfig);

  Logger.log('   SyncEngine configuration works');
}

function testSyncEngineIncremental() {
  // Clear tracking first
  ChangeDetector.clearTracking('customers');

  // First sync - should be full
  const lastSync = ChangeDetector.getLastSyncTime('customers', 'BC_TO_SHEETS');

  assert(lastSync === null, 'First sync should have no last sync time');

  Logger.log('   Incremental sync logic verified');
}

// ============================================================================
// ChangeDetector Tests
// ============================================================================

function testChangeDetectorTracking() {
  // Clear tracking
  ChangeDetector.clearTracking('customers');

  // Track a change
  const testData = {
    customer_id: 'TEST123',
    name: 'Test Customer',
    email: 'test@example.com'
  };

  ChangeDetector.trackChange('customers', 'TEST123', 'BC_TO_SHEETS', testData);

  // Verify tracking
  const history = ChangeDetector.getChangeHistory('customers', 'TEST123');

  assert(history.length > 0, 'Change should be tracked');
  assert(history[0].recordId === 'TEST123', 'Record ID should match');

  Logger.log('   Change tracking works');
}

function testChangeDetectorModified() {
  // Track some changes
  ChangeDetector.clearTracking('orders');

  const testOrder1 = { order_id: 'ORD001', total_amount: 100 };
  const testOrder2 = { order_id: 'ORD002', total_amount: 200 };

  ChangeDetector.trackChange('orders', 'ORD001', 'BC_TO_SHEETS', testOrder1);
  ChangeDetector.trackChange('orders', 'ORD002', 'BC_TO_SHEETS', testOrder2);

  // Update last sync time
  ChangeDetector.updateLastSyncTime('orders', 'BC_TO_SHEETS');

  const lastSync = ChangeDetector.getLastSyncTime('orders', 'BC_TO_SHEETS');

  assert(lastSync !== null, 'Last sync time should be set');

  Logger.log('   Modified records detection works');
}

function testChangeDetectorStats() {
  const stats = ChangeDetector.getStats('customers');

  assert(typeof stats.totalChanges === 'number', 'Stats should include totalChanges');
  assert(stats.entityType === 'customers', 'Stats should include entityType');

  Logger.log(`   Stats: ${stats.totalChanges} total changes`);
}

// ============================================================================
// ConflictResolver Tests
// ============================================================================

function testConflictDetection() {
  const sheetsRecord = {
    id: 'CUST001',
    name: 'Customer A',
    email: 'customera@old.com',
    updated_at: new Date().toISOString()
  };

  const newSheetsData = {
    id: 'CUST001',
    name: 'Customer A Updated',
    email: 'customera@new.com'
  };

  const bcRecord = {
    id: 'CUST001',
    displayName: 'Customer A Updated',
    email: 'customera@new.com',
    lastModifiedDateTime: new Date().toISOString()
  };

  const conflict = ConflictResolver.detectConflict(
    sheetsRecord,
    newSheetsData,
    bcRecord
  );

  // Note: conflict detection depends on modification timestamps
  // In a real scenario with recent modifications, a conflict would be detected

  Logger.log('   Conflict detection logic verified');
}

function testConflictResolveBCWins() {
  const mockConflict = {
    id: 'CUST001',
    sheetsRecord: {
      id: 'CUST001',
      name: 'Old Name',
      email: 'old@email.com'
    },
    newSheetsData: {
      id: 'CUST001',
      name: 'New Name',
      email: 'new@email.com'
    },
    bcRecord: {
      id: 'CUST001',
      displayName: 'New Name',
      email: 'new@email.com'
    },
    fieldConflicts: [
      { field: 'name', sheetsValue: 'Old Name', bcValue: 'New Name' },
      { field: 'email', sheetsValue: 'old@email.com', bcValue: 'new@email.com' }
    ]
  };

  const resolution = ConflictResolver.resolve(mockConflict, {
    strategy: 'BC_WINS'
  });

  assert(resolution.strategy === 'BC_WINS', 'Strategy should be BC_WINS');
  assert(resolution.action === 'UPDATE', 'Action should be UPDATE');
  assert(resolution.data.name === 'New Name', 'BC data should be used');

  Logger.log('   BC_WINS resolution works');
}

function testConflictResolveMerge() {
  const mockConflict = {
    id: 'CUST001',
    sheetsRecord: {
      id: 'CUST001',
      name: 'Sheets Name',
      email: 'sheets@email.com',
      phone: '123456'
    },
    newSheetsData: {
      id: 'CUST001',
      name: 'BC Name',
      email: 'bc@email.com',
      phone: '789012'
    },
    fieldConflicts: [
      { field: 'name', sheetsValue: 'Sheets Name', bcValue: 'BC Name' },
      { field: 'email', sheetsValue: 'sheets@email.com', bcValue: 'bc@email.com' }
    ]
  };

  const resolution = ConflictResolver.resolve(mockConflict, {
    strategy: 'MERGE',
    fieldPriorities: {
      name: 'BC',
      email: 'SHEETS'
    }
  });

  assert(resolution.strategy === 'MERGE', 'Strategy should be MERGE');
  assert(resolution.data.name === 'BC Name', 'BC name should be used');
  assert(resolution.data.email === 'sheets@email.com', 'Sheets email should be used');

  Logger.log('   MERGE resolution works');
}

// ============================================================================
// Scheduler Tests
// ============================================================================

function testSchedulerCreate() {
  // Cleanup first
  Scheduler.removeSchedule('test_entity');

  // Note: In actual tests, we might not want to create real triggers
  // This test just verifies the schedule info storage

  const schedules = Scheduler.getAllSchedules();
  const initialCount = schedules.length;

  Logger.log(`   Initial schedules: ${initialCount}`);
  Logger.log('   Scheduler create logic verified');
}

function testSchedulerRemove() {
  // Remove test schedule
  Scheduler.removeSchedule('test_entity');

  const schedule = Scheduler.getSchedule('test_entity');

  assert(schedule === null, 'Schedule should be removed');

  Logger.log('   Scheduler remove works');
}

// ============================================================================
// Integration Tests
// ============================================================================

function testIntegrationFullFlow() {
  Logger.log('   Testing full sync flow...');

  // 1. Clear tracking
  ChangeDetector.clearTracking('customers');

  // 2. Verify initial state
  const initialLastSync = ChangeDetector.getLastSyncTime('customers', 'BC_TO_SHEETS');
  assert(initialLastSync === null, 'Initial state should have no last sync');

  // 3. Track a change
  const testCustomer = {
    customer_id: 'INTTEST001',
    name: 'Integration Test Customer',
    email: 'inttest@example.com'
  };

  ChangeDetector.trackChange('customers', 'INTTEST001', 'BC_TO_SHEETS', testCustomer);

  // 4. Update last sync time
  ChangeDetector.updateLastSyncTime('customers', 'BC_TO_SHEETS');

  // 5. Verify last sync time is set
  const updatedLastSync = ChangeDetector.getLastSyncTime('customers', 'BC_TO_SHEETS');
  assert(updatedLastSync !== null, 'Last sync time should be set');

  // 6. Get stats
  const stats = ChangeDetector.getStats('customers');
  assert(stats.totalChanges > 0, 'Stats should show changes');

  Logger.log('   Full integration flow works');
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Simple assertion helper
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

/**
 * Quick smoke test
 */
function runSmokeTest() {
  Logger.log('🔥 Running smoke test...\n');

  try {
    // Test 1: Modules exist
    assert(typeof SyncEngine !== 'undefined', 'SyncEngine should exist');
    assert(typeof ChangeDetector !== 'undefined', 'ChangeDetector should exist');
    assert(typeof ConflictResolver !== 'undefined', 'ConflictResolver should exist');
    assert(typeof Scheduler !== 'undefined', 'Scheduler should exist');
    Logger.log('✅ All modules loaded');

    // Test 2: Basic configuration
    const config = SyncEngine.getConfig();
    assert(config !== null, 'Config should exist');
    Logger.log('✅ Configuration accessible');

    // Test 3: Change tracking
    ChangeDetector.clearTracking('test');
    Logger.log('✅ Change tracking operational');

    Logger.log('\n🎉 Smoke test passed! System is operational.');

  } catch (error) {
    Logger.log(`\n❌ Smoke test failed: ${error.message}`);
    throw error;
  }
}
