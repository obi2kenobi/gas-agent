/**
 * TestRunner.gs
 *
 * Test runner for Orchestrator system
 *
 * Usage:
 * - runAllOrchestratorTests() - Run complete test suite
 * - runQuickTests() - Run essential tests only
 *
 * @version 1.0
 */

/**
 * Run all Orchestrator tests
 */
function runAllOrchestratorTests() {
  Logger.log('\n🧪 ORCHESTRATOR TEST SUITE\n');
  Logger.log('='.repeat(70) + '\n');

  const startTime = Date.now();
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  const testSuites = [
    { name: 'RequirementsAnalyzer', file: 'RequirementsAnalyzer.test.gs' },
    { name: 'SpecialistSelector', file: 'SpecialistSelector.test.gs' },
    { name: 'ExecutionPlanner', file: 'ExecutionPlanner.test.gs' },
    { name: 'Integration', file: 'Integration.test.gs' }
  ];

  testSuites.forEach(suite => {
    Logger.log(`\n📦 Test Suite: ${suite.name}`);
    Logger.log('─'.repeat(70));

    try {
      const suiteResults = runTestSuite_(suite.name);
      results.passed += suiteResults.passed;
      results.failed += suiteResults.failed;
      results.errors.push(...suiteResults.errors);
    } catch (error) {
      Logger.log(`❌ Suite failed to run: ${error.message}`);
      results.failed++;
      results.errors.push({
        suite: suite.name,
        test: 'Suite Execution',
        error: error.message
      });
    }
  });

  const duration = Date.now() - startTime;

  Logger.log('\n' + '='.repeat(70));
  Logger.log('TEST SUMMARY');
  Logger.log('='.repeat(70));
  Logger.log(`Total Passed: ✅ ${results.passed}`);
  Logger.log(`Total Failed: ❌ ${results.failed}`);
  Logger.log(`Total Skipped: ⏭️  ${results.skipped}`);
  Logger.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
  Logger.log('='.repeat(70));

  if (results.failed > 0) {
    Logger.log('\n❌ FAILED TESTS:');
    results.errors.forEach(err => {
      Logger.log(`  - [${err.suite}] ${err.test}: ${err.error}`);
    });
  } else {
    Logger.log('\n🎉 ALL TESTS PASSED!');
  }

  return results;
}

/**
 * Run tests for specific suite
 * @private
 */
function runTestSuite_(suiteName) {
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  try {
    switch (suiteName) {
      case 'RequirementsAnalyzer':
        return testRequirementsAnalyzer();
      case 'SpecialistSelector':
        return testSpecialistSelector();
      case 'ExecutionPlanner':
        return testExecutionPlanner();
      case 'Integration':
        return testOrchestratorIntegration();
      default:
        throw new Error(`Unknown test suite: ${suiteName}`);
    }
  } catch (error) {
    results.failed = 1;
    results.errors.push({
      suite: suiteName,
      test: 'Unknown',
      error: error.message
    });
    return results;
  }
}

/**
 * Run quick smoke tests
 */
function runQuickTests() {
  Logger.log('\n🔥 QUICK SMOKE TESTS\n');

  const tests = [
    { name: 'Modules Loaded', fn: testModulesLoaded },
    { name: 'Basic Analysis', fn: testBasicAnalysis },
    { name: 'Specialist Selection', fn: testBasicSpecialistSelection }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(test => {
    try {
      Logger.log(`▶️  ${test.name}...`);
      test.fn();
      Logger.log(`✅ ${test.name}`);
      passed++;
    } catch (error) {
      Logger.log(`❌ ${test.name}: ${error.message}`);
      failed++;
    }
  });

  Logger.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

  return { passed, failed };
}

/**
 * Quick test: Modules loaded
 */
function testModulesLoaded() {
  assert(typeof RequirementsAnalyzer !== 'undefined', 'RequirementsAnalyzer should be loaded');
  assert(typeof SpecialistSelector !== 'undefined', 'SpecialistSelector should be loaded');
  assert(typeof ExecutionPlanner !== 'undefined', 'ExecutionPlanner should be loaded');
  assert(typeof Orchestrator !== 'undefined', 'Orchestrator should be loaded');
}

/**
 * Quick test: Basic analysis
 */
function testBasicAnalysis() {
  const testProject = 'Build a simple customer management system with Google Sheets';
  const analysis = RequirementsAnalyzer.analyze(testProject);

  assert(analysis !== null, 'Analysis should return result');
  assert(analysis.complexity, 'Analysis should include complexity');
  assert(analysis.requirements, 'Analysis should include requirements');
}

/**
 * Quick test: Basic specialist selection
 */
function testBasicSpecialistSelection() {
  const mockAnalysis = {
    complexity: 'MEDIUM',
    requirements: {
      technical: ['Google Sheets integration'],
      functional: ['CRUD operations']
    }
  };

  const specialists = SpecialistSelector.selectSpecialists(mockAnalysis);

  assert(Array.isArray(specialists), 'Should return array of specialists');
  assert(specialists.length > 0, 'Should select at least one specialist');
}

/**
 * Assertion helper
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

/**
 * Run tests on file change (for development)
 */
function onTestFileEdit(e) {
  // Auto-run tests when test files are edited
  // This can be triggered by a time-based trigger during development
  Logger.log('Test file modified - running quick tests...');
  runQuickTests();
}
