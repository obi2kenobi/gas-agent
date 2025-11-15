# Orchestrator Tests

Comprehensive test suite for the **gas-Agent Orchestrator** system.

## 📁 Test Structure

```
orchestrator/tests/
├── TestRunner.gs                    # Main test runner
├── RequirementsAnalyzer.test.gs     # Requirements analysis tests
├── SpecialistSelector.test.gs       # Specialist selection tests
├── ExecutionPlanner.test.gs         # Execution planning tests
├── Integration.test.gs              # End-to-end integration tests
└── README.md                        # This file
```

## 🚀 Quick Start

### Run All Tests

```javascript
function runTests() {
  const results = runAllOrchestratorTests();
  Logger.log(`Total: ${results.total}, Passed: ${results.passed}, Failed: ${results.failed}`);
}
```

### Run Quick Smoke Tests

```javascript
function quickCheck() {
  runQuickTests();
}
```

### Run Individual Test Suites

```javascript
// Test individual components
testRequirementsAnalyzer();
testSpecialistSelector();
testExecutionPlanner();
testOrchestratorIntegration();
```

## 📊 Test Coverage

### 1. RequirementsAnalyzer Tests (5 tests)

Tests for project requirements analysis and complexity assessment:

- ✅ **testAnalyzeSimpleProject**: Validates LOW/MEDIUM complexity for simple projects
- ✅ **testAnalyzeComplexProject**: Validates HIGH complexity for complex projects
- ✅ **testComplexityDetection**: Compares complexity levels between simple and complex projects
- ✅ **testRequirementExtraction**: Validates extraction of technical/functional requirements
- ✅ **testRiskAssessment**: Validates risk assessment for projects with external dependencies

**Example:**
```javascript
const project = 'Create a simple spreadsheet to track expenses';
const analysis = RequirementsAnalyzer.analyze(project);
// Returns: { complexity: 'LOW', requirements: {...}, risks: [...] }
```

### 2. SpecialistSelector Tests (5 tests)

Tests for specialist selection based on project requirements:

- ✅ **testBasicSelection**: Validates basic specialist selection for Sheets projects
- ✅ **testSecuritySpecialistSelection**: Validates Security Engineer selection for OAuth2/auth
- ✅ **testAIIntegrationSelection**: Validates AI Specialist selection for Claude API
- ✅ **testMultipleSpecialistsSelection**: Validates multi-specialist selection for complex projects
- ✅ **testPriorityOrdering**: Validates specialist priority ordering (lower = higher priority)

**Example:**
```javascript
const mockAnalysis = {
  complexity: 'HIGH',
  requirements: { technical: ['OAuth2', 'Claude API', 'Sheets'] }
};
const specialists = SpecialistSelector.selectSpecialists(mockAnalysis);
// Returns: [
//   { name: 'Security Engineer', priority: 1 },
//   { name: 'AI Integration Specialist', priority: 2 },
//   { name: 'Data Engineer', priority: 3 }
// ]
```

### 3. ExecutionPlanner Tests (5 tests)

Tests for execution plan generation:

- ✅ **testBasicPlanCreation**: Validates basic plan structure with phases
- ✅ **testPhaseGeneration**: Validates phase generation with names and tasks
- ✅ **testTaskBreakdown**: Validates task breakdown into actionable items
- ✅ **testDependencyHandling**: Validates dependency ordering (Security before Integration)
- ✅ **testTimeEstimation**: Validates time estimation in generated plans

**Example:**
```javascript
const plan = ExecutionPlanner.createPlan(mockAnalysis, mockSpecialists);
// Returns: {
//   phases: [
//     { name: 'Security Setup', tasks: [...], estimatedTime: '2h' },
//     { name: 'Integration', tasks: [...], estimatedTime: '3h' }
//   ],
//   estimatedHours: 5
// }
```

### 4. Integration Tests (4 tests)

End-to-end tests for complete Orchestrator workflow:

- ✅ **testCompleteWorkflow**: Validates full orchestration with analysis, specialists, and plan
- ✅ **testSimpleProjectE2E**: End-to-end test for simple todo list project
- ✅ **testComplexProjectE2E**: End-to-end test for enterprise system with multiple integrations
- ✅ **testErrorHandling**: Validates error handling for empty/invalid descriptions

**Example:**
```javascript
const result = orchestrateProject('Build customer database with Google Sheets');
// Returns: {
//   analysis: { complexity: 'MEDIUM', requirements: {...} },
//   specialists: [{ name: 'Data Engineer', priority: 1 }],
//   plan: { phases: [...], estimatedTime: '4h' }
// }
```

## 🎯 Test Patterns

### Assert Helper

All test files include a simple `assert()` helper:

```javascript
function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}
```

### Result Tracking

Each test suite tracks results in a consistent format:

```javascript
const results = { passed: 0, failed: 0, errors: [] };

tests.forEach(test => {
  try {
    test();
    results.passed++;
    Logger.log(`  ✅ ${test.name}`);
  } catch (error) {
    results.failed++;
    results.errors.push({ suite: 'SuiteName', test: test.name, error: error.message });
    Logger.log(`  ❌ ${test.name}: ${error.message}`);
  }
});
```

## 📈 Running Tests in Apps Script

### Option 1: Apps Script Editor

1. Open your Google Apps Script project
2. Open `TestRunner.gs`
3. Click **Run** → Select `runAllOrchestratorTests`
4. View results in **Executions** log

### Option 2: Custom Menu (Recommended)

Add a custom menu to your spreadsheet:

```javascript
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🧪 Tests')
    .addItem('Run All Tests', 'runAllOrchestratorTests')
    .addItem('Quick Tests', 'runQuickTests')
    .addSeparator()
    .addItem('Requirements Tests', 'testRequirementsAnalyzer')
    .addItem('Specialist Tests', 'testSpecialistSelector')
    .addItem('Planner Tests', 'testExecutionPlanner')
    .addItem('Integration Tests', 'testOrchestratorIntegration')
    .addToUi();
}
```

### Option 3: clasp + Local Development

```bash
# Push code to Apps Script
clasp push

# Run tests via Apps Script API
clasp run runAllOrchestratorTests
```

## 🔧 Test Configuration

### Mock Data

Tests use mock analysis and specialist data:

```javascript
const mockAnalysis = {
  complexity: 'MEDIUM',
  requirements: {
    technical: ['Google Sheets', 'Data validation'],
    functional: ['Data storage', 'User interface']
  },
  risks: ['Data integrity']
};

const mockSpecialists = [
  { name: 'Data Engineer', priority: 1, expertise: ['Sheets', 'Database'] }
];
```

### Custom Test Data

To test with your own data:

```javascript
function testMyProject() {
  const myProject = 'Build inventory management system with BC integration';
  const result = orchestrateProject(myProject);

  Logger.log('Analysis:', result.analysis);
  Logger.log('Specialists:', result.specialists);
  Logger.log('Plan:', result.plan);
}
```

## 📊 Expected Results

A successful test run should show:

```
🧪 Running All Orchestrator Tests...

📝 Requirements Analyzer Tests
  ✅ testAnalyzeSimpleProject
  ✅ testAnalyzeComplexProject
  ✅ testComplexityDetection
  ✅ testRequirementExtraction
  ✅ testRiskAssessment

👥 Specialist Selector Tests
  ✅ testBasicSelection
  ✅ testSecuritySpecialistSelection
  ✅ testAIIntegrationSelection
  ✅ testMultipleSpecialistsSelection
  ✅ testPriorityOrdering

📋 Execution Planner Tests
  ✅ testBasicPlanCreation
  ✅ testPhaseGeneration
  ✅ testTaskBreakdown
  ✅ testDependencyHandling
  ✅ testTimeEstimation

🔄 Integration Tests
  ✅ testCompleteWorkflow
  ✅ testSimpleProjectE2E
  ✅ testComplexProjectE2E
  ✅ testErrorHandling

════════════════════════════════
📊 FINAL RESULTS
════════════════════════════════
Total Tests: 19
✅ Passed: 19
❌ Failed: 0
⏭️  Skipped: 0
Success Rate: 100%
```

## 🐛 Debugging Failed Tests

If tests fail:

1. **Check Execution Logs**: View detailed error messages in Apps Script execution logs
2. **Run Individual Tests**: Isolate the failing test and run it separately
3. **Verify Dependencies**: Ensure all Orchestrator modules are loaded
4. **Check Mock Data**: Verify mock data matches expected format
5. **Logger Output**: Add `Logger.log()` statements to inspect intermediate values

## 🔗 Related Documentation

- [Orchestrator Main README](../README.md) - Overview of Orchestrator system
- [RequirementsAnalyzer](../RequirementsAnalyzer.gs) - Requirements analysis implementation
- [SpecialistSelector](../SpecialistSelector.gs) - Specialist selection implementation
- [ExecutionPlanner](../ExecutionPlanner.gs) - Execution planning implementation

## 🤝 Contributing

When adding new tests:

1. Follow the existing test pattern
2. Use descriptive test function names (e.g., `testFeatureName`)
3. Include meaningful assertions with clear error messages
4. Add tests to the appropriate test suite
5. Update this README with new test descriptions

## 📝 Notes

- Tests are designed to run independently without external dependencies
- No actual API calls are made (all tests use mock data)
- Tests validate business logic and data transformations
- For integration testing with real data, see the examples in each test file

---

**Last Updated**: 2025-11-15
**Version**: 1.0
**Test Coverage**: 19 tests across 4 components
