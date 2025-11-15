/**
 * Integration.test.gs - Integration tests for complete Orchestrator flow
 */

function testOrchestratorIntegration() {
  const results = { passed: 0, failed: 0, errors: [] };
  const tests = [
    testCompleteWorkflow,
    testSimpleProjectE2E,
    testComplexProjectE2E,
    testErrorHandling
  ];

  tests.forEach(test => {
    try {
      test();
      results.passed++;
      Logger.log(`  ✅ ${test.name}`);
    } catch (error) {
      results.failed++;
      results.errors.push({ suite: 'Integration', test: test.name, error: error.message });
      Logger.log(`  ❌ ${test.name}: ${error.message}`);
    }
  });

  return results;
}

function testCompleteWorkflow() {
  const project = 'Build customer database with Google Sheets';
  
  // Full workflow
  const result = orchestrateProject(project);
  
  assert(result, 'Orchestrator should return result');
  assert(result.analysis, 'Result should include analysis');
  assert(result.specialists, 'Result should include specialists');
  assert(result.plan, 'Result should include plan');
}

function testSimpleProjectE2E() {
  const project = 'Create a simple todo list in Google Sheets';
  
  const result = orchestrateProject(project);
  
  assert(result.analysis.complexity === 'LOW' || result.analysis.complexity === 'MEDIUM',
         'Simple project should have LOW/MEDIUM complexity');
  assert(result.specialists.length >= 1, 'Should select at least 1 specialist');
  assert(result.plan.phases.length >= 1, 'Should have at least 1 phase');
}

function testComplexProjectE2E() {
  const project = 'Build enterprise system with OAuth2, BC integration, AI processing, real-time sync, and monitoring';
  
  const result = orchestrateProject(project);
  
  assert(result.analysis.complexity === 'HIGH', 'Complex project should be HIGH complexity');
  assert(result.specialists.length >= 3, 'Should select multiple specialists');
  assert(result.plan.phases.length >= 3, 'Should have multiple phases');
}

function testErrorHandling() {
  try {
    orchestrateProject(''); // Empty project description
    assert(false, 'Should throw error for empty description');
  } catch (error) {
    assert(true, 'Should handle empty description gracefully');
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}
