/**
 * ExecutionPlanner.test.gs - Tests for Execution Planner
 */

function testExecutionPlanner() {
  const results = { passed: 0, failed: 0, errors: [] };
  const tests = [
    testBasicPlanCreation,
    testPhaseGeneration,
    testTaskBreakdown,
    testDependencyHandling,
    testTimeEstimation
  ];

  tests.forEach(test => {
    try {
      test();
      results.passed++;
      Logger.log(`  ✅ ${test.name}`);
    } catch (error) {
      results.failed++;
      results.errors.push({ suite: 'ExecutionPlanner', test: test.name, error: error.message });
      Logger.log(`  ❌ ${test.name}: ${error.message}`);
    }
  });

  return results;
}

function testBasicPlanCreation() {
  const mockAnalysis = { complexity: 'MEDIUM', requirements: { technical: ['Sheets'] } };
  const mockSpecialists = [{ name: 'Data Engineer', priority: 1 }];
  
  const plan = ExecutionPlanner.createPlan(mockAnalysis, mockSpecialists);
  
  assert(plan, 'Should return execution plan');
  assert(plan.phases, 'Plan should have phases');
  assert(Array.isArray(plan.phases), 'Phases should be array');
}

function testPhaseGeneration() {
  const mockAnalysis = { complexity: 'HIGH', requirements: { technical: ['OAuth2', 'Sheets', 'API'] } };
  const mockSpecialists = [
    { name: 'Security Engineer', priority: 1 },
    { name: 'Data Engineer', priority: 2 }
  ];
  
  const plan = ExecutionPlanner.createPlan(mockAnalysis, mockSpecialists);
  
  assert(plan.phases.length > 0, 'Should generate phases');
  assert(plan.phases[0].name, 'Phase should have name');
  assert(plan.phases[0].tasks, 'Phase should have tasks');
}

function testTaskBreakdown() {
  const mockAnalysis = { complexity: 'HIGH', requirements: { technical: ['Complete system'] } };
  const mockSpecialists = [{ name: 'Solution Architect', priority: 1 }];
  
  const plan = ExecutionPlanner.createPlan(mockAnalysis, mockSpecialists);
  
  let totalTasks = 0;
  plan.phases.forEach(phase => {
    totalTasks += (phase.tasks ? phase.tasks.length : 0);
  });
  
  assert(totalTasks > 0, 'Should break down into tasks');
}

function testDependencyHandling() {
  const mockAnalysis = { complexity: 'HIGH', requirements: { technical: ['OAuth2', 'API integration'] } };
  const mockSpecialists = [
    { name: 'Security Engineer', priority: 1 },
    { name: 'Integration Engineer', priority: 2 }
  ];
  
  const plan = ExecutionPlanner.createPlan(mockAnalysis, mockSpecialists);
  
  // Security should come before Integration
  const securityPhaseIndex = plan.phases.findIndex(p => p.name && p.name.includes('Security'));
  const integrationPhaseIndex = plan.phases.findIndex(p => p.name && p.name.includes('Integration'));
  
  if (securityPhaseIndex >= 0 && integrationPhaseIndex >= 0) {
    assert(securityPhaseIndex < integrationPhaseIndex, 'Dependencies should be respected');
  }
}

function testTimeEstimation() {
  const mockAnalysis = { complexity: 'MEDIUM', requirements: { technical: ['Simple task'] } };
  const mockSpecialists = [{ name: 'Data Engineer', priority: 1 }];
  
  const plan = ExecutionPlanner.createPlan(mockAnalysis, mockSpecialists);
  
  assert(plan.estimatedTime || plan.estimatedHours, 'Plan should include time estimation');
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}
