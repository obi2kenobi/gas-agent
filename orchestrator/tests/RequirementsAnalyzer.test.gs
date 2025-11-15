/**
 * RequirementsAnalyzer.test.gs - Tests for Requirements Analyzer
 */

function testRequirementsAnalyzer() {
  const results = { passed: 0, failed: 0, errors: [] };
  const tests = [
    testAnalyzeSimpleProject,
    testAnalyzeComplexProject,
    testComplexityDetection,
    testRequirementExtraction,
    testRiskAssessment
  ];

  tests.forEach(test => {
    try {
      test();
      results.passed++;
      Logger.log(`  ✅ ${test.name}`);
    } catch (error) {
      results.failed++;
      results.errors.push({ suite: 'RequirementsAnalyzer', test: test.name, error: error.message });
      Logger.log(`  ❌ ${test.name}: ${error.message}`);
    }
  });

  return results;
}

function testAnalyzeSimpleProject() {
  const project = 'Create a simple spreadsheet to track expenses';
  const analysis = RequirementsAnalyzer.analyze(project);
  
  assert(analysis, 'Should return analysis');
  assert(analysis.complexity === 'LOW' || analysis.complexity === 'MEDIUM', 'Simple project should be LOW/MEDIUM complexity');
}

function testAnalyzeComplexProject() {
  const project = 'Build a complete ERP system with BC integration, OAuth2, real-time sync, AI processing, and advanced reporting';
  const analysis = RequirementsAnalyzer.analyze(project);
  
  assert(analysis.complexity === 'HIGH', 'Complex project should be HIGH complexity');
  assert(analysis.requirements, 'Should extract requirements');
}

function testComplexityDetection() {
  const simpleDesc = 'Make a todo list';
  const complexDesc = 'Integrate multiple APIs with OAuth2, implement caching, error handling, monitoring, and CI/CD';
  
  const simple = RequirementsAnalyzer.analyze(simpleDesc);
  const complex = RequirementsAnalyzer.analyze(complexDesc);
  
  const complexityLevels = ['LOW', 'MEDIUM', 'HIGH'];
  assert(complexityLevels.indexOf(complex.complexity) > complexityLevels.indexOf(simple.complexity),
         'Complex project should have higher complexity');
}

function testRequirementExtraction() {
  const project = 'Build system with OAuth2 authentication and Sheets database';
  const analysis = RequirementsAnalyzer.analyze(project);
  
  assert(analysis.requirements, 'Should extract requirements');
  assert(analysis.requirements.technical || analysis.requirements.functional, 'Should have technical or functional requirements');
}

function testRiskAssessment() {
  const project = 'Integrate with external API using OAuth2';
  const analysis = RequirementsAnalyzer.analyze(project);
  
  assert(analysis.risks !== undefined, 'Should assess risks');
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}
