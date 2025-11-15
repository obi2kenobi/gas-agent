/**
 * Orchestrator-Integration.gs - Orchestrator Integration Example
 *
 * This file demonstrates how the Orchestrator would analyze and plan
 * a Sheets Database project like this one.
 *
 * Shows:
 * - Automatic requirements analysis
 * - Specialist selection
 * - Execution plan generation
 * - How the Orchestrator "thought process" works
 */

/**
 * Example 1: Analyze This Project
 *
 * See how the Orchestrator would have planned this sheets-database example
 */
function analyzeThisProject() {
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('ORCHESTRATOR ANALYSIS: sheets-database Example');
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('');

  // This is what we would have told the Orchestrator
  const projectDescription = `
    Build a system that uses Google Sheets as a relational database with:
    - Schema definition with types and constraints
    - CRUD operations with validation
    - Foreign key relationships (CASCADE and RESTRICT)
    - Query builder for complex queries
    - Business logic layer for orders and customers
    - Comprehensive testing
  `;

  Logger.log('PROJECT DESCRIPTION:');
  Logger.log(projectDescription);
  Logger.log('');

  // Check if Orchestrator is available
  if (typeof orchestrateProject === 'undefined') {
    Logger.log('⚠️  Orchestrator not installed.');
    Logger.log('');
    Logger.log('To see the full analysis, copy files from orchestrator/:');
    Logger.log('  - RequirementsAnalyzer.gs');
    Logger.log('  - SpecialistSelector.gs');
    Logger.log('  - ExecutionPlanner.gs');
    Logger.log('  - Orchestrator.gs');
    Logger.log('');
    showManualAnalysis();
    return;
  }

  // Run orchestration
  const result = orchestrateProject(projectDescription);

  // Show results
  Logger.log('ORCHESTRATOR OUTPUT:');
  Logger.log('');
  Logger.log(RequirementsAnalyzer.formatAnalysis(result.analysis));
  Logger.log('');
  Logger.log(SpecialistSelector.formatSelection(result.selection, result.analysis));
  Logger.log('');
  Logger.log(ExecutionPlanner.formatPlan(result.plan));
}

/**
 * Manual analysis (when Orchestrator not installed)
 * Shows what the Orchestrator WOULD have recommended
 */
function showManualAnalysis() {
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('MANUAL ANALYSIS (What Orchestrator Would Recommend)');
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('');

  Logger.log('📊 COMPLEXITY: MEDIUM');
  Logger.log('⏱️  ESTIMATED: 8-12 hours');
  Logger.log('');

  Logger.log('👥 SPECIALISTS NEEDED (3):');
  Logger.log('');
  Logger.log('1. Data Engineer (Priority 5)');
  Logger.log('   Why: Sheets database, ETL patterns, query optimization');
  Logger.log('   Files:');
  Logger.log('     - docs/specialists/data-engineer.md');
  Logger.log('     - docs/deep/data/sheets-database.md');
  Logger.log('     - docs/deep/data/query-patterns.md');
  Logger.log('');

  Logger.log('2. Solution Architect (Priority 2)');
  Logger.log('   Why: Complex project requires architectural guidance');
  Logger.log('   Files:');
  Logger.log('     - docs/specialists/solution-architect.md');
  Logger.log('     - docs/deep/architecture/patterns.md');
  Logger.log('');

  Logger.log('3. Platform Engineer (Priority 7)');
  Logger.log('   Why: Always included for production readiness');
  Logger.log('   Files:');
  Logger.log('     - docs/specialists/platform-engineer.md');
  Logger.log('     - docs/deep/platform/error-handling.md');
  Logger.log('');

  Logger.log('📋 EXECUTION PLAN:');
  Logger.log('');
  Logger.log('Phase 1: Architecture & Design (2h)');
  Logger.log('  [1] Load Solution Architect guidance');
  Logger.log('      → Define schema structure');
  Logger.log('      → Plan Repository pattern');
  Logger.log('      → Design validation layer');
  Logger.log('');

  Logger.log('Phase 2: Data Layer Implementation (5h)');
  Logger.log('  [2] Load Data Engineer guidance');
  Logger.log('      → Implement Schema.gs');
  Logger.log('      → Implement Repository.gs');
  Logger.log('      → Implement Validator.gs');
  Logger.log('  [3] Load Query Patterns');
  Logger.log('      → Implement QueryBuilder.gs');
  Logger.log('      → Add index support');
  Logger.log('  [4] Load Sheets Database patterns');
  Logger.log('      → Add foreign key validation');
  Logger.log('      → Implement cascade delete');
  Logger.log('');

  Logger.log('Phase 3: Business Logic (2h)');
  Logger.log('  [5] Implement Service layer');
  Logger.log('      → OrderService');
  Logger.log('      → CustomerService');
  Logger.log('');

  Logger.log('Phase 4: Production Readiness (3h)');
  Logger.log('  [6] Load Platform Engineer guidance');
  Logger.log('      → Add error handling');
  Logger.log('      → Implement logging');
  Logger.log('  [7] Create comprehensive tests');
  Logger.log('      → 7 test suites');
  Logger.log('  [8] Write documentation');
  Logger.log('      → README with examples');
  Logger.log('');

  Logger.log('✅ RESULT: This example follows the exact pattern the');
  Logger.log('   Orchestrator would have recommended!');
}

/**
 * Example 2: Plan a Similar Project
 *
 * Use the Orchestrator to plan YOUR Sheets database project
 */
function planMyDatabaseProject() {
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('PLAN YOUR SHEETS DATABASE PROJECT');
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('');

  // Example: Inventory management system
  const myProject = `
    Build an inventory management system using Google Sheets with:
    - Products table with SKU, name, quantity, price
    - Suppliers table with contact info
    - Purchase orders with line items
    - Stock movements tracking
    - Low stock alerts
    - Reporting dashboard
  `;

  Logger.log('YOUR PROJECT:');
  Logger.log(myProject);
  Logger.log('');

  if (typeof orchestrateProject === 'undefined') {
    Logger.log('⚠️  Install Orchestrator to get automatic analysis.');
    Logger.log('');
    Logger.log('Expected recommendations:');
    Logger.log('  - Data Engineer (database structure)');
    Logger.log('  - Workspace Engineer (Gmail alerts)');
    Logger.log('  - Solution Architect (system design)');
    Logger.log('  - Platform Engineer (monitoring)');
    return;
  }

  // Run orchestration
  const result = orchestrateProject(myProject);

  Logger.log('ORCHESTRATOR RECOMMENDATIONS:');
  Logger.log('');
  Logger.log(`Complexity: ${result.analysis.complexity.level}`);
  Logger.log(`Estimated: ${result.selection.complexity.estimatedHours}h`);
  Logger.log(`Specialists: ${result.selection.count}`);
  Logger.log('');

  Logger.log('Recommended specialists:');
  result.selection.specialists.forEach((spec, i) => {
    Logger.log(`${i + 1}. ${spec.name} (priority: ${spec.priority})`);
  });

  Logger.log('');
  Logger.log('📋 See full execution plan in logs above');
}

/**
 * Example 3: Compare Project Complexities
 *
 * See how the Orchestrator evaluates different project sizes
 */
function compareProjectComplexities() {
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('PROJECT COMPLEXITY COMPARISON');
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('');

  const projects = {
    simple: 'Build a simple customer contact list in Sheets with name and email',

    medium: 'Build a customer and order management system with validation',

    complex: `
      Build a complete ERP system with:
      - Multi-table database (customers, products, orders, inventory)
      - Business Central integration
      - Real-time stock updates
      - Email notifications
      - Claude AI for order validation
      - Monitoring dashboard
      - Audit logging for compliance
    `
  };

  if (typeof orchestrateProject === 'undefined') {
    Logger.log('⚠️  Install Orchestrator for automatic comparison');
    return;
  }

  for (const [level, description] of Object.entries(projects)) {
    Logger.log(`─────────────────────────────────────────────────────`);
    Logger.log(`${level.toUpperCase()} PROJECT:`);
    Logger.log(description.substring(0, 100) + '...');
    Logger.log('');

    const result = orchestrateProject(description);

    Logger.log(`  Complexity: ${result.analysis.complexity.level}`);
    Logger.log(`  Specialists: ${result.selection.count}`);
    Logger.log(`  Estimated: ${result.selection.complexity.estimatedHours}h (${result.selection.complexity.estimatedDays}d)`);
    Logger.log('');
  }

  Logger.log('═══════════════════════════════════════════════════════');
}

/**
 * Example 4: Extend This Example
 *
 * Plan extensions to the current sheets-database example
 */
function planExtensions() {
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('PLAN EXTENSIONS TO SHEETS-DATABASE');
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('');

  const extensions = [
    {
      name: 'Add Product Catalog',
      description: 'Add Products table with categories, images, and inventory tracking',
      estimate: '3-4h',
      specialists: ['Data Engineer', 'Solution Architect']
    },
    {
      name: 'Email Notifications',
      description: 'Send email when order status changes or low stock detected',
      estimate: '2-3h',
      specialists: ['Workspace Engineer', 'Platform Engineer']
    },
    {
      name: 'Business Central Sync',
      description: 'Sync customers and orders with Business Central',
      estimate: '6-8h',
      specialists: ['Security Engineer', 'Integration Engineer', 'BC Specialist']
    },
    {
      name: 'Reporting Dashboard',
      description: 'HTML dashboard with charts, KPIs, and export to PDF',
      estimate: '4-6h',
      specialists: ['UI Engineer', 'Data Engineer']
    },
    {
      name: 'AI Order Validation',
      description: 'Use Claude to validate orders against business rules',
      estimate: '5-7h',
      specialists: ['AI Integration Specialist', 'Business Logic Engineer']
    }
  ];

  extensions.forEach((ext, i) => {
    Logger.log(`${i + 1}. ${ext.name}`);
    Logger.log(`   ${ext.description}`);
    Logger.log(`   Estimate: ${ext.estimate}`);
    Logger.log(`   Specialists: ${ext.specialists.join(', ')}`);
    Logger.log('');
  });

  Logger.log('💡 TIP: Use orchestrateProject() with detailed description');
  Logger.log('   to get step-by-step implementation plan!');
}

/**
 * Example 5: Learn from the Pattern
 *
 * See what patterns this example demonstrates
 */
function learnPatterns() {
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('PATTERNS DEMONSTRATED IN sheets-database');
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('');

  const patterns = [
    {
      name: 'Repository Pattern',
      file: 'Repository.gs',
      description: 'Data access abstraction layer',
      benefits: [
        'Separates data access from business logic',
        'Provides consistent CRUD interface',
        'Easy to mock for testing',
        'Can swap storage backend'
      ]
    },
    {
      name: 'Schema Definition',
      file: 'Schema.gs',
      description: 'Type system and constraints',
      benefits: [
        'Single source of truth for data structure',
        'Enables automatic validation',
        'Documents database schema',
        'Supports migrations'
      ]
    },
    {
      name: 'Fluent API (QueryBuilder)',
      file: 'QueryBuilder.gs',
      description: 'Method chaining for queries',
      benefits: [
        'Readable, self-documenting code',
        'Type-safe queries',
        'Composable filters',
        'Easy to extend'
      ]
    },
    {
      name: 'Service Layer',
      file: 'Service.gs',
      description: 'Business logic separation',
      benefits: [
        'Encapsulates complex operations',
        'Provides high-level API',
        'Enforces business rules',
        'Transaction-like operations'
      ]
    },
    {
      name: 'Index-based Lookups',
      file: 'Repository.gs (getIndex)',
      description: 'O(1) performance with caching',
      benefits: [
        'Fast lookups for large datasets',
        'Automatic cache management',
        'Transparent to callers',
        '100x+ performance improvement'
      ]
    }
  ];

  patterns.forEach((pattern, i) => {
    Logger.log(`${i + 1}. ${pattern.name}`);
    Logger.log(`   File: ${pattern.file}`);
    Logger.log(`   ${pattern.description}`);
    Logger.log('   Benefits:');
    pattern.benefits.forEach(benefit => {
      Logger.log(`     • ${benefit}`);
    });
    Logger.log('');
  });

  Logger.log('💡 These patterns are recommended by the Orchestrator\'s');
  Logger.log('   Data Engineer and Solution Architect specialists!');
}

/**
 * Run all examples
 */
function runAllOrchestratorExamples() {
  analyzeThisProject();
  Logger.log('\n\n');

  planMyDatabaseProject();
  Logger.log('\n\n');

  compareProjectComplexities();
  Logger.log('\n\n');

  planExtensions();
  Logger.log('\n\n');

  learnPatterns();
}
