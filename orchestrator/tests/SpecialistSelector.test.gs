/**
 * SpecialistSelector.test.gs - Tests for Specialist Selector
 */

function testSpecialistSelector() {
  const results = { passed: 0, failed: 0, errors: [] };
  const tests = [
    testBasicSelection,
    testSecuritySpecialistSelection,
    testAIIntegrationSelection,
    testMultipleSpecialistsSelection,
    testPriorityOrdering
  ];

  tests.forEach(test => {
    try {
      test();
      results.passed++;
      Logger.log(`  ✅ ${test.name}`);
    } catch (error) {
      results.failed++;
      results.errors.push({ suite: 'SpecialistSelector', test: test.name, error: error.message });
      Logger.log(`  ❌ ${test.name}: ${error.message}`);
    }
  });

  return results;
}

function testBasicSelection() {
  const mockAnalysis = {
    complexity: 'MEDIUM',
    requirements: { technical: ['Google Sheets'], functional: ['Data storage'] }
  };
  
  const specialists = SpecialistSelector.selectSpecialists(mockAnalysis);
  
  assert(Array.isArray(specialists), 'Should return array');
  assert(specialists.length > 0, 'Should select at least one specialist');
  assert(specialists[0].name, 'Specialist should have name');
}

function testSecuritySpecialistSelection() {
  const mockAnalysis = {
    complexity: 'HIGH',
    requirements: { technical: ['OAuth2', 'API authentication', 'secure tokens'] }
  };
  
  const specialists = SpecialistSelector.selectSpecialists(mockAnalysis);
  const hasSecurityEngineer = specialists.some(s => s.name === 'Security Engineer');
  
  assert(hasSecurityEngineer, 'Should select Security Engineer for OAuth2/auth requirements');
}

function testAIIntegrationSelection() {
  const mockAnalysis = {
    complexity: 'HIGH',
    requirements: { technical: ['Claude API', 'AI processing', 'document analysis'] }
  };
  
  const specialists = SpecialistSelector.selectSpecialists(mockAnalysis);
  const hasAISpecialist = specialists.some(s => s.name === 'AI Integration Specialist');
  
  assert(hasAISpecialist, 'Should select AI Integration Specialist for AI requirements');
}

function testMultipleSpecialistsSelection() {
  const mockAnalysis = {
    complexity: 'HIGH',
    requirements: {
      technical: ['OAuth2', 'Sheets database', 'Business Central API', 'error handling', 'caching']
    }
  };
  
  const specialists = SpecialistSelector.selectSpecialists(mockAnalysis);
  
  assert(specialists.length >= 3, 'Complex project should select multiple specialists');
}

function testPriorityOrdering() {
  const mockAnalysis = {
    complexity: 'HIGH',
    requirements: { technical: ['OAuth2', 'Sheets', 'API integration'] }
  };
  
  const specialists = SpecialistSelector.selectSpecialists(mockAnalysis);
  
  assert(specialists[0].priority !== undefined, 'Specialists should have priority');
  
  // Check ordering (lower priority number = higher priority)
  for (let i = 1; i < specialists.length; i++) {
    assert(specialists[i].priority >= specialists[i-1].priority, 'Specialists should be ordered by priority');
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}
