# 🎯 GAS-Agent Orchestrator

**Intelligent Project Coordinator for Google Apps Script Development**

---

## Overview

The **Orchestrator** is the intelligent coordinator that analyzes your project requirements, automatically selects the right specialists, coordinates their work, and manages the entire development lifecycle from requirements to deployment.

**YOU DON'T NEED TO KNOW WHICH SPECIALIST TO USE** - just describe your project!

---

## How to Use

### Simple Usage

```
USER: "I need to sync orders from Business Central to Google Sheets with OAuth2,
caching, error handling, and monitoring"

ORCHESTRATOR:
✓ Analyzed requirements
✓ Selected specialists: Security, Integration, Data, Platform
✓ Created execution plan (8 steps)
✓ Coordinating implementation...
```

---

## Core Capabilities

### 1. **Intelligent Requirements Analysis**

The Orchestrator parses natural language project descriptions and identifies:

- **Technical requirements**: OAuth2, caching, monitoring, etc.
- **Integration points**: Business Central, Google Sheets, APIs
- **Non-functional requirements**: Performance, security, compliance
- **Quality attributes**: Scalability, maintainability, testability

### 2. **Automatic Specialist Selection**

Based on requirements, selects the right combination of specialists:

| Requirement Pattern | Specialists Selected |
|---------------------|---------------------|
| "OAuth2", "authentication", "security" | Security Engineer |
| "Business Central", "OData", "BC API" | BC Specialist, Integration Engineer |
| "performance", "caching", "optimization" | Platform Engineer |
| "Sheets database", "ETL", "sync" | Data Engineer |
| "Claude", "AI", "document processing" | AI Integration Specialist |
| "monitoring", "logging", "errors" | Platform Engineer |
| "UI", "sidebar", "dialog" | UI Engineer |

### 3. **Execution Plan Generation**

Creates a step-by-step implementation plan:

```
PROJECT: Business Central → Sheets Order Sync

EXECUTION PLAN:
1. [Security] OAuth2 token management implementation
2. [Integration] Business Central API client setup
3. [Data] Sheets database schema design
4. [Data] ETL pipeline for order sync
5. [Platform] Multi-level caching implementation
6. [Platform] Error handling and retry logic
7. [Platform] Monitoring and health checks
8. [Testing] Unit and integration tests
9. [Deployment] CI/CD pipeline setup
```

### 4. **Workflow Coordination**

Manages interactions between specialists:

```
┌─────────────────┐
│  Orchestrator   │
└────────┬────────┘
         │
         ├──────► [Security Engineer] → OAuth2 implementation
         │              │
         │              ├──► requires: PropertiesService patterns
         │              └──► outputs: Token manager + refresh logic
         │
         ├──────► [Integration Engineer] → BC API client
         │              │
         │              ├──► depends on: OAuth2 from Security
         │              └──► outputs: OData query builder
         │
         ├──────► [Data Engineer] → ETL pipeline
         │              │
         │              ├──► depends on: BC client from Integration
         │              └──► outputs: Transformation + sync logic
         │
         └──────► [Platform Engineer] → Caching + monitoring
                        │
                        ├──► depends on: All above components
                        └──► outputs: Complete production system
```

### 5. **Validation & Quality Assurance**

Continuously validates:

- ✓ **Code quality**: Follows best practices from quality-standards.md
- ✓ **Security**: No hardcoded credentials, proper error handling
- ✓ **Performance**: Batch operations, caching implemented
- ✓ **Completeness**: All requirements addressed
- ✓ **Testing**: Tests written and passing

### 6. **Iterative Refinement**

Handles feedback and corrections automatically:

```
ITERATION 1: Initial implementation
  ↓ Issues found: Missing error handling in token refresh

ITERATION 2: Add error handling
  ↓ Issues found: No caching for BC API responses

ITERATION 3: Implement caching
  ↓ Issues found: Missing integration tests

ITERATION 4: Add tests
  ✓ All checks passed → COMPLETE
```

---

## Usage Patterns

### Pattern 1: Complete Project from Scratch

```
INPUT: "Build a document processing system that uses Claude AI to extract
data from PDFs stored in Google Drive, validate the data, and save it to
Sheets with audit logging"

ORCHESTRATOR ACTIONS:
1. Requirements Analysis:
   - AI Integration (Claude API, PDF processing)
   - Document Processing (PDF parsing, text extraction)
   - Data Engineering (Sheets database, validation)
   - Security (audit logging, compliance)
   - Platform (error handling, monitoring)

2. Specialist Selection:
   - AI Integration Specialist
   - Document Processing Specialist
   - Data Engineer
   - Security Engineer
   - Platform Engineer

3. Execution Plan:
   Step 1: [AI] Claude API setup and authentication
   Step 2: [Doc] PDF parsing and text extraction patterns
   Step 3: [AI] Prompt engineering for data extraction
   Step 4: [Data] Sheets database schema design
   Step 5: [Data] Validation rules implementation
   Step 6: [Security] Audit logging setup
   Step 7: [Platform] Error handling and retry logic
   Step 8: [Platform] Monitoring and alerting
   Step 9: [Testing] End-to-end testing
   Step 10: [Deployment] Production deployment

4. Implementation:
   - Loads specialists/ai-integration-specialist.md
   - Follows decision tree → deep/ai-integration/api-setup.md
   - Implements code with validation
   - Iterates based on validation results
   - Coordinates with other specialists
   - Produces complete, tested solution

5. Validation:
   ✓ All requirements met
   ✓ Security checks passed
   ✓ Performance optimized
   ✓ Tests passing
   ✓ Documentation complete

OUTPUT: Complete, production-ready system with code, tests, and deployment guide
```

### Pattern 2: Optimize Existing Code

```
INPUT: "This Sheets operation is slow for 10K+ rows - optimize it"

ORCHESTRATOR ACTIONS:
1. Analysis:
   - Problem: Performance issue
   - Context: Large dataset (10K+ rows)
   - Component: Sheets operations

2. Specialist: Platform Engineer

3. Execution:
   - Load specialists/platform-engineer.md
   - Load deep/platform/performance.md
   - Analyze current code
   - Apply batch operation patterns
   - Implement caching if applicable
   - Add performance monitoring
   - Benchmark before/after

4. Validation:
   ✓ Performance improvement measured (e.g., 100x faster)
   ✓ No data loss
   ✓ Error handling maintained

OUTPUT: Optimized code with benchmarks
```

### Pattern 3: Add Feature to Existing Project

```
INPUT: "Add OAuth2 authentication to my existing Business Central integration"

ORCHESTRATOR ACTIONS:
1. Analysis:
   - Existing: BC integration (probably basic auth)
   - New requirement: OAuth2
   - Impact: Authentication layer

2. Specialists: Security Engineer, Integration Engineer

3. Execution:
   - Analyze existing code
   - Load specialists/security-engineer.md
   - Load deep/security/oauth2-patterns.md
   - Design OAuth2 integration
   - Refactor existing code
   - Maintain backward compatibility if needed
   - Add token refresh logic
   - Update error handling

4. Validation:
   ✓ OAuth2 working
   ✓ Existing functionality intact
   ✓ Tests updated

OUTPUT: Refactored code with OAuth2
```

### Pattern 4: Troubleshooting & Debugging

```
INPUT: "My API calls are failing with 'Service invoked too many times' error"

ORCHESTRATOR ACTIONS:
1. Analysis:
   - Error: Rate limiting issue
   - Root cause: Likely missing caching or exponential backoff
   - Context: External API integration

2. Specialists: Platform Engineer, Integration Engineer

3. Execution:
   - Load deep/platform/error-handling.md
   - Load deep/platform/caching.md
   - Analyze code for retry logic
   - Implement exponential backoff
   - Add caching layer
   - Add rate limiting awareness

4. Validation:
   ✓ Error resolved
   ✓ Resilient to rate limits
   ✓ Proper error handling

OUTPUT: Fixed code with resilience patterns
```

---

## Decision Logic

### How the Orchestrator Chooses Specialists

```javascript
// Pseudo-code for specialist selection

function analyzeRequirements(projectDescription) {
  const keywords = extractKeywords(projectDescription);
  const specialists = [];

  // Security-related
  if (matches(keywords, ['oauth', 'auth', 'security', 'token', 'credentials', 'rbac'])) {
    specialists.push('Security Engineer');
  }

  // Business Central
  if (matches(keywords, ['business central', 'bc', 'dynamics', 'odata'])) {
    specialists.push('BC Specialist');
    specialists.push('Integration Engineer');
  }

  // Performance
  if (matches(keywords, ['slow', 'optimize', 'performance', 'cache', 'speed'])) {
    specialists.push('Platform Engineer');
  }

  // Data operations
  if (matches(keywords, ['sheets', 'database', 'etl', 'sync', 'data', 'query'])) {
    specialists.push('Data Engineer');
  }

  // AI Integration
  if (matches(keywords, ['claude', 'ai', 'document', 'pdf', 'ocr', 'extraction'])) {
    specialists.push('AI Integration Specialist');
    if (matches(keywords, ['pdf', 'docx', 'parsing'])) {
      specialists.push('Document Processing Specialist');
    }
  }

  // Platform/Infrastructure (always needed for production)
  if (hasKeyword(keywords, ['production', 'deploy', 'monitoring', 'logging'])) {
    if (!specialists.includes('Platform Engineer')) {
      specialists.push('Platform Engineer');
    }
  }

  // Architecture (for complex projects)
  if (specialists.length >= 4 || matches(keywords, ['architecture', 'design', 'pattern'])) {
    specialists.push('Solution Architect');
  }

  return {
    specialists: specialists,
    complexity: calculateComplexity(specialists.length, keywords),
    estimatedSteps: estimateSteps(specialists, keywords)
  };
}
```

### Dependency Resolution

The Orchestrator understands specialist dependencies:

```
Security Engineer
  ↓ provides: Authentication/Authorization
  ↓ needed by: Integration Engineer, Data Engineer, Platform Engineer

Integration Engineer
  ↓ provides: API clients, HTTP patterns
  ↓ needed by: Data Engineer, AI Integration Specialist

Data Engineer
  ↓ provides: Data models, ETL pipelines
  ↓ needed by: Platform Engineer (for monitoring)

Platform Engineer
  ↓ provides: Error handling, caching, monitoring
  ↓ integrates: All components

Solution Architect
  ↓ provides: Overall design, patterns
  ↓ coordinates: All specialists
```

### Execution Order

```
1. ANALYZE → Understand requirements
2. DESIGN → Solution Architect (if complex)
3. FOUNDATION → Security Engineer (authentication/authorization)
4. INTEGRATION → Integration Engineer (API clients)
5. DATA → Data Engineer (data models, ETL)
6. INTELLIGENCE → AI Specialist (if needed)
7. PLATFORM → Platform Engineer (reliability, monitoring)
8. QUALITY → Testing patterns
9. DEPLOYMENT → CI/CD setup
10. VALIDATION → Verify all requirements met
```

---

## Validation Framework

### Code Quality Checks

```javascript
function validateCode(code, requirements) {
  const checks = {
    security: [
      'No hardcoded credentials',
      'OAuth2 token refresh implemented',
      'Error messages don\'t leak sensitive data',
      'HTTPS enforced',
      'Input validation present'
    ],
    performance: [
      'Batch operations used (not row-by-row)',
      'Caching implemented',
      'Exponential backoff for retries',
      'No N+1 query patterns',
      'Large datasets handled with pagination'
    ],
    reliability: [
      'Try-catch blocks present',
      'Graceful error handling',
      'Logging implemented',
      'Health checks available',
      'Idempotent operations'
    ],
    maintainability: [
      'Functions < 50 lines',
      'Clear naming conventions',
      'JSDoc comments present',
      'Constants extracted',
      'DRY principle followed'
    ]
  };

  return performChecks(code, checks);
}
```

### Requirements Completeness

```javascript
function validateRequirements(implementation, originalRequirements) {
  // Parse original requirements
  const required = {
    functionalRequirements: extractFunctional(originalRequirements),
    nonFunctionalRequirements: extractNonFunctional(originalRequirements),
    integrations: extractIntegrations(originalRequirements)
  };

  // Check implementation
  const coverage = {
    functional: checkFunctionalCoverage(implementation, required.functionalRequirements),
    nonFunctional: checkNonFunctionalCoverage(implementation, required.nonFunctionalRequirements),
    integrations: checkIntegrations(implementation, required.integrations)
  };

  return {
    complete: coverage.functional === 100 && coverage.nonFunctional === 100,
    gaps: identifyGaps(coverage),
    score: calculateScore(coverage)
  };
}
```

---

## Orchestrator API

### For Claude Code Integration

```javascript
/**
 * Main orchestration function
 *
 * @param {string} projectDescription - Natural language project description
 * @param {object} options - Configuration options
 * @returns {object} Implementation result
 */
function orchestrate(projectDescription, options = {}) {
  // 1. Analyze requirements
  const analysis = analyzeRequirements(projectDescription);

  console.log(`✓ Analyzed requirements`);
  console.log(`✓ Complexity: ${analysis.complexity}`);
  console.log(`✓ Selected specialists: ${analysis.specialists.join(', ')}`);
  console.log(`✓ Estimated steps: ${analysis.estimatedSteps}`);

  // 2. Generate execution plan
  const plan = generateExecutionPlan(analysis);
  console.log(`✓ Created execution plan (${plan.steps.length} steps)`);

  // 3. Execute plan with coordination
  const result = executePlan(plan, options);

  // 4. Validate result
  const validation = validateResult(result, analysis);

  if (!validation.passed) {
    console.log(`⚠ Issues found, iterating...`);
    return orchestrate(projectDescription, {
      ...options,
      previousAttempt: result,
      issues: validation.issues
    });
  }

  console.log(`✓ All checks passed → COMPLETE`);

  return {
    success: true,
    code: result.code,
    tests: result.tests,
    documentation: result.documentation,
    deploymentGuide: result.deploymentGuide,
    plan: plan,
    validation: validation
  };
}
```

### Usage Example

```javascript
// Simple usage
const result = orchestrate(`
  Build a system that syncs orders from Business Central to Google Sheets.
  Requirements:
  - OAuth2 authentication for BC API
  - Incremental sync (only new/changed orders)
  - Multi-level caching (memory + CacheService)
  - Error handling with exponential backoff
  - Monitoring and health checks
  - Audit logging for compliance
`);

console.log(result.code);
console.log(result.deploymentGuide);
```

---

## Iteration & Feedback Loop

### Automatic Issue Detection

```javascript
function detectIssues(code, requirements) {
  const issues = [];

  // Security issues
  if (containsHardcodedCredentials(code)) {
    issues.push({
      type: 'security',
      severity: 'critical',
      message: 'Hardcoded credentials found',
      fix: 'Use PropertiesService.getScriptProperties()',
      specialist: 'Security Engineer'
    });
  }

  // Performance issues
  if (usesRowByRowOperations(code)) {
    issues.push({
      type: 'performance',
      severity: 'high',
      message: 'Row-by-row operations detected',
      fix: 'Use batch operations with getValues()/setValues()',
      specialist: 'Platform Engineer'
    });
  }

  // Missing error handling
  if (missingErrorHandling(code)) {
    issues.push({
      type: 'reliability',
      severity: 'high',
      message: 'Missing try-catch blocks',
      fix: 'Add error handling with exponential backoff',
      specialist: 'Platform Engineer'
    });
  }

  return issues;
}
```

### Automatic Correction

```javascript
function autoCorrect(code, issues) {
  let correctedCode = code;

  for (const issue of issues) {
    // Load appropriate specialist
    const specialist = loadSpecialist(issue.specialist);

    // Get correction pattern
    const pattern = specialist.getCorrectionPattern(issue.type);

    // Apply correction
    correctedCode = applyPattern(correctedCode, pattern);

    console.log(`✓ Fixed: ${issue.message}`);
  }

  return correctedCode;
}
```

---

## Integration with Existing Documentation

### How Specialists Are Loaded

```javascript
function loadSpecialist(specialistName) {
  const specialistMap = {
    'Security Engineer': 'docs/specialists/security-engineer.md',
    'Platform Engineer': 'docs/specialists/platform-engineer.md',
    'AI Integration Specialist': 'docs/specialists/ai-integration-specialist.md',
    'Integration Engineer': 'docs/specialists/integration-engineer.md',
    'Data Engineer': 'docs/specialists/data-engineer.md',
    'BC Specialist': 'docs/specialists/bc-specialist.md',
    'Solution Architect': 'docs/specialists/solution-architect.md',
    // ... others
  };

  const specialistPath = specialistMap[specialistName];
  const specialist = loadMarkdown(specialistPath);

  // Specialist provides decision tree for loading deep files
  const deepFiles = specialist.decisionTree.recommend(currentContext);

  return {
    overview: specialist,
    deepDocumentation: deepFiles.map(loadMarkdown)
  };
}
```

### Context Management

The Orchestrator manages context efficiently:

```javascript
function manageContext(specialists, maxTokens = 200000) {
  let currentTokens = 0;
  const loadedContext = [];

  // Load in priority order
  const priorityOrder = resolveDependencies(specialists);

  for (const specialist of priorityOrder) {
    // Load overview first (~150 lines)
    const overview = loadSpecialistOverview(specialist);
    currentTokens += estimateTokens(overview);
    loadedContext.push(overview);

    // Load only relevant deep files based on decision tree
    const relevantDeepFiles = overview.decisionTree.filter(currentRequirements);

    for (const deepFile of relevantDeepFiles) {
      const estimated = estimateTokens(deepFile);
      if (currentTokens + estimated < maxTokens) {
        loadedContext.push(loadDeepFile(deepFile));
        currentTokens += estimated;
      } else {
        // Context window full, need to summarize or paginate
        break;
      }
    }
  }

  return loadedContext;
}
```

---

## Example Workflows

### Workflow 1: New Project from Scratch

```
USER: "Build a secure order management system that integrates with Business
Central, stores data in Sheets, has real-time monitoring, and uses Claude AI
for order validation"

ORCHESTRATOR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 REQUIREMENTS ANALYSIS
  ✓ OAuth2 authentication (Business Central)
  ✓ Data persistence (Google Sheets as database)
  ✓ AI integration (Claude for validation)
  ✓ Real-time monitoring
  ✓ Error handling and reliability

🎯 SPECIALISTS SELECTED
  1. Security Engineer - OAuth2 + RBAC
  2. BC Specialist - Business Central integration
  3. Integration Engineer - API patterns
  4. Data Engineer - Sheets database design
  5. AI Integration Specialist - Claude validation
  6. Platform Engineer - Monitoring + reliability
  7. Solution Architect - Overall design

📊 COMPLEXITY: High (7 specialists, ~15 steps)
⏱️  ESTIMATED TIME: 4-6 hours

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 EXECUTION PLAN

Phase 1: Architecture & Security
  [1] [Architect] System design and component architecture
  [2] [Security] OAuth2 implementation for BC API
  [3] [Security] RBAC setup for user roles

Phase 2: Data & Integration
  [4] [Data] Sheets database schema design
  [5] [BC] Business Central entity mapping
  [6] [Integration] BC API client with OData queries
  [7] [Data] Order repository with CRUD operations

Phase 3: Intelligence & Validation
  [8] [AI] Claude API setup and authentication
  [9] [AI] Order validation prompt engineering
  [10] [AI] Integration with order pipeline

Phase 4: Platform & Operations
  [11] [Platform] Multi-level caching implementation
  [12] [Platform] Error handling with exponential backoff
  [13] [Platform] Real-time monitoring dashboard
  [14] [Platform] Health checks and alerting

Phase 5: Quality & Deployment
  [15] [Testing] Unit and integration tests
  [16] [Deployment] CI/CD pipeline setup

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 EXECUTING...

[1/16] System design and component architecture
  ↳ Loading specialists/solution-architect.md
  ↳ Loading deep/architecture/patterns.md
  ↳ Designed: Repository pattern + Service layer
  ✓ Complete (Architecture.gs created)

[2/16] OAuth2 implementation for BC API
  ↳ Loading specialists/security-engineer.md
  ↳ Loading deep/security/oauth2-patterns.md
  ↳ Loading deep/integration/oauth2-implementation.md
  ↳ Implemented: Token manager with refresh logic
  ✓ Complete (OAuth2Manager.gs created)

[3/16] RBAC setup for user roles
  ↳ Loading deep/security/authorization.md
  ↳ Implemented: Role-based access control
  ✓ Complete (RBACManager.gs created)

[4/16] Sheets database schema design
  ↳ Loading specialists/data-engineer.md
  ↳ Loading deep/data/sheets-database.md
  ↳ Designed: Orders, OrderLines, Customers tables
  ✓ Complete (Schema.gs created)

... [continuing through all steps] ...

[16/16] CI/CD pipeline setup
  ↳ Loading docs/deployment/cicd.md
  ↳ Created: GitHub Actions workflow
  ✓ Complete (.github/workflows/deploy.yml created)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ VALIDATION

Security Checks:
  ✓ No hardcoded credentials
  ✓ OAuth2 token refresh implemented
  ✓ RBAC enforced on all endpoints
  ✓ Audit logging enabled

Performance Checks:
  ✓ Batch operations used
  ✓ Multi-level caching implemented
  ✓ No N+1 query patterns
  ✓ Pagination for large datasets

Reliability Checks:
  ✓ Error handling on all API calls
  ✓ Exponential backoff implemented
  ✓ Health checks configured
  ✓ Monitoring dashboard deployed

Completeness:
  ✓ All requirements addressed
  ✓ Tests written and passing (98% coverage)
  ✓ Documentation complete
  ✓ Deployment guide ready

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 PROJECT COMPLETE

Files Created:
  - Config.gs (configuration)
  - OAuth2Manager.gs (authentication)
  - RBACManager.gs (authorization)
  - BCClient.gs (Business Central API)
  - OrderRepository.gs (data access)
  - OrderService.gs (business logic)
  - ClaudeValidator.gs (AI validation)
  - CacheManager.gs (caching)
  - ErrorHandler.gs (error handling)
  - MonitoringDashboard.gs (monitoring)
  - HealthCheck.gs (health checks)
  - Tests.gs (unit/integration tests)

Documentation:
  - README.md (project overview)
  - DEPLOYMENT.md (deployment guide)
  - API.md (API documentation)

CI/CD:
  - .github/workflows/deploy.yml
  - .clasp.json
  - .eslintrc.json

Next Steps:
  1. Deploy to test environment: npm run deploy:test
  2. Run integration tests: npm run test:integration
  3. Review monitoring dashboard
  4. Deploy to production: npm run deploy:prod

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Benefits of the Orchestrator

### For Users

✅ **Zero cognitive load** - Don't need to know which specialist to use
✅ **Faster development** - Automatic coordination and iteration
✅ **Higher quality** - Built-in validation and best practices
✅ **Complete solutions** - All aspects covered (security, performance, testing)
✅ **Production-ready** - Deployment guide included

### For the Documentation System

✅ **Better utilization** - Documentation automatically applied correctly
✅ **Consistency** - Same patterns used across all projects
✅ **Context efficiency** - Loads only necessary documentation
✅ **Scalability** - Can add new specialists without changing user experience

---

## Configuration

### Orchestrator Settings

```javascript
const orchestratorConfig = {
  // Context management
  maxContextTokens: 200000,
  prioritizeSpecialists: ['Security Engineer', 'Platform Engineer'],

  // Quality thresholds
  minTestCoverage: 80,
  maxFunctionLines: 50,
  enforceSecurityChecks: true,

  // Iteration limits
  maxIterations: 5,
  autoCorrect: true,

  // Output preferences
  generateTests: true,
  generateDocumentation: true,
  generateDeploymentGuide: true,

  // Validation
  strictMode: true, // Enforce all quality checks
  failOnWarnings: false
};
```

---

## Future Enhancements

### Phase 1 (Current)
- ✅ Requirements analysis
- ✅ Specialist selection
- ✅ Execution plan generation
- ✅ Basic coordination
- ✅ Validation framework

### Phase 2 (Planned)
- [ ] Machine learning for better specialist selection
- [ ] Cost estimation (API calls, execution time)
- [ ] Risk assessment (complexity, dependencies)
- [ ] Interactive approval workflow
- [ ] Rollback capabilities

### Phase 3 (Future)
- [ ] Multi-project coordination
- [ ] Shared component library
- [ ] Performance benchmarking
- [ ] A/B testing support
- [ ] Continuous optimization

---

## Related Documentation

- **Quality Standards**: [quality-standards.md](quality-standards.md)
- **Getting Started**: [getting-started/README.md](getting-started/README.md)
- **All Specialists**: [specialists/](specialists/)
- **Deep Documentation**: [deep/](deep/)

---

## Support

For orchestrator-specific questions:
- Review execution plans for transparency
- Check validation results for quality assurance
- Consult individual specialists for domain-specific details

---

**Version**: 1.0
**Last Updated**: November 2025
**Status**: Production Ready 🚀
