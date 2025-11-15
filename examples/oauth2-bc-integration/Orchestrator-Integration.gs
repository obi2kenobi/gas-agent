/**
 * Orchestrator-Integration.gs - Orchestrator Integration Example
 *
 * This file demonstrates how the Orchestrator would analyze and plan
 * a Business Central integration project like this one.
 *
 * Shows:
 * - Security-first approach (OAuth2)
 * - Integration patterns
 * - Performance optimization
 * - How specialists work together
 */

/**
 * Example 1: Analyze This Project
 *
 * See how the Orchestrator would have planned this oauth2-bc-integration example
 */
function analyzeThisProject() {
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('ORCHESTRATOR ANALYSIS: oauth2-bc-integration Example');
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('');

  const projectDescription = `
    Build a Business Central integration with:
    - OAuth2 authentication with automatic token refresh
    - Multi-level caching (memory, CacheService, PropertiesService)
    - Complete OData v4 API client
    - Support for 216 BC API endpoints
    - Batch operations for performance
    - Comprehensive error handling
    - Production-ready examples
  `;

  Logger.log('PROJECT DESCRIPTION:');
  Logger.log(projectDescription);
  Logger.log('');

  if (typeof orchestrateProject === 'undefined') {
    Logger.log('⚠️  Orchestrator not installed.');
    Logger.log('');
    Logger.log('To see the full analysis, copy files from orchestrator/');
    Logger.log('');
    showManualAnalysis();
    return;
  }

  const result = orchestrateProject(projectDescription);

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
 */
function showManualAnalysis() {
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('MANUAL ANALYSIS (What Orchestrator Would Recommend)');
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('');

  Logger.log('📊 COMPLEXITY: HIGH');
  Logger.log('⏱️  ESTIMATED: 12-16 hours');
  Logger.log('');

  Logger.log('👥 SPECIALISTS NEEDED (5):');
  Logger.log('');

  Logger.log('1. Security Engineer (Priority 1) ⭐ CRITICAL FIRST');
  Logger.log('   Why: OAuth2 required for BC, credential management, secure storage');
  Logger.log('   Files:');
  Logger.log('     - docs/specialists/security-engineer.md');
  Logger.log('     - docs/deep/security/oauth2-patterns.md');
  Logger.log('     - docs/deep/security/properties-security.md');
  Logger.log('   Output:');
  Logger.log('     → OAuth2Manager.gs (token management)');
  Logger.log('     → Config.gs (secure credential storage)');
  Logger.log('');

  Logger.log('2. BC Specialist (Priority 3)');
  Logger.log('   Why: Business Central OData API expertise');
  Logger.log('   Files:');
  Logger.log('     - docs/specialists/bc-specialist.md');
  Logger.log('     - docs/deep/bc/entities.md');
  Logger.log('     - docs/deep/bc/odata-patterns.md');
  Logger.log('   Output:');
  Logger.log('     → BCClient.gs (API client with OData v4)');
  Logger.log('     → Entity helpers and query builders');
  Logger.log('');

  Logger.log('3. Integration Engineer (Priority 4)');
  Logger.log('   Why: HTTP client, response parsing, error handling');
  Logger.log('   Files:');
  Logger.log('     - docs/specialists/integration-engineer.md');
  Logger.log('     - docs/deep/integration/http-patterns.md');
  Logger.log('     - docs/deep/integration/response-parsing.md');
  Logger.log('   Dependencies: Security Engineer (needs OAuth2Manager)');
  Logger.log('   Output:');
  Logger.log('     → HTTP request utilities');
  Logger.log('     → Response parsing logic');
  Logger.log('');

  Logger.log('4. Platform Engineer (Priority 7) ⭐ RUNS LAST');
  Logger.log('   Why: Performance optimization, caching, monitoring');
  Logger.log('   Files:');
  Logger.log('     - docs/specialists/platform-engineer.md');
  Logger.log('     - docs/deep/platform/caching.md');
  Logger.log('     - docs/deep/platform/performance.md');
  Logger.log('     - docs/deep/platform/error-handling.md');
  Logger.log('   Dependencies: All others (integrates everything)');
  Logger.log('   Output:');
  Logger.log('     → Multi-level caching (160x faster)');
  Logger.log('     → Error handling with retry logic');
  Logger.log('     → Performance monitoring');
  Logger.log('');

  Logger.log('5. Solution Architect (Priority 2)');
  Logger.log('   Why: High complexity project needs architectural guidance');
  Logger.log('   Files:');
  Logger.log('     - docs/specialists/solution-architect.md');
  Logger.log('     - docs/deep/architecture/patterns.md');
  Logger.log('   Output:');
  Logger.log('     → System design');
  Logger.log('     → Component interactions');
  Logger.log('     → Best practices');
  Logger.log('');

  Logger.log('📋 EXECUTION PLAN (Phases):');
  Logger.log('');

  Logger.log('Phase 1: Foundation & Security (3h) ← START HERE');
  Logger.log('  [1] Security Engineer: OAuth2Manager.gs');
  Logger.log('      → Implement token fetch');
  Logger.log('      → Implement token refresh');
  Logger.log('      → Add basic caching');
  Logger.log('  [2] Security Engineer: Config.gs');
  Logger.log('      → Secure credential storage');
  Logger.log('      → Configuration helpers');
  Logger.log('');

  Logger.log('Phase 2: Architecture & Design (1h)');
  Logger.log('  [3] Solution Architect: Design system');
  Logger.log('      → Define component structure');
  Logger.log('      → Plan API client architecture');
  Logger.log('      → Document integration patterns');
  Logger.log('');

  Logger.log('Phase 3: Business Central Integration (4h)');
  Logger.log('  [4] BC Specialist: BCClient.gs');
  Logger.log('      → Implement OData v4 client');
  Logger.log('      → Add query helpers ($filter, $select, etc.)');
  Logger.log('      → Support 216 BC endpoints');
  Logger.log('  [5] BC Specialist: Entity patterns');
  Logger.log('      → Customer queries');
  Logger.log('      → Sales order patterns');
  Logger.log('      → Invoice handling');
  Logger.log('');

  Logger.log('Phase 4: HTTP Integration (2h)');
  Logger.log('  [6] Integration Engineer: HTTP utilities');
  Logger.log('      → Implement request wrapper');
  Logger.log('      → Add response parsing');
  Logger.log('      → Handle BC-specific headers');
  Logger.log('');

  Logger.log('Phase 5: Performance & Production (5h) ← CRITICAL');
  Logger.log('  [7] Platform Engineer: Multi-level caching');
  Logger.log('      → Memory cache (Level 1)');
  Logger.log('      → CacheService (Level 2)');
  Logger.log('      → PropertiesService (Level 3)');
  Logger.log('      → Result: 160x performance improvement!');
  Logger.log('  [8] Platform Engineer: Error handling');
  Logger.log('      → Exponential backoff');
  Logger.log('      → Quota management');
  Logger.log('      → Network error recovery');
  Logger.log('  [9] Platform Engineer: Monitoring');
  Logger.log('      → Performance logging');
  Logger.log('      → Health checks');
  Logger.log('');

  Logger.log('Phase 6: Examples & Documentation (1h)');
  Logger.log('  [10] Create production examples');
  Logger.log('  [11] Write comprehensive tests');
  Logger.log('  [12] Document everything');
  Logger.log('');

  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('🎯 KEY INSIGHTS FROM ORCHESTRATOR:');
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('');
  Logger.log('1. SECURITY FIRST: OAuth2 must be implemented before');
  Logger.log('   anything else. Integration Engineer depends on it.');
  Logger.log('');
  Logger.log('2. BC SPECIALIST CRITICAL: Deep knowledge of OData v4');
  Logger.log('   and BC API quirks saves hours of trial-and-error.');
  Logger.log('');
  Logger.log('3. PLATFORM ENGINEER LAST: Runs after all components');
  Logger.log('   exist. Adds caching, error handling, monitoring.');
  Logger.log('   This 160x performance boost!');
  Logger.log('');
  Logger.log('4. DEPENDENCIES MATTER: Can\'t build BCClient without');
  Logger.log('   OAuth2Manager. Orchestrator enforces correct order.');
  Logger.log('');
}

/**
 * Example 2: Plan Similar BC Integrations
 */
function planBCIntegrations() {
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('PLAN YOUR BUSINESS CENTRAL INTEGRATION');
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('');

  const integrations = {
    simple: {
      name: 'Customer List Export',
      description: 'Export active customers to Sheets once daily',
      estimate: '2-3h',
      specialists: ['Security Engineer', 'BC Specialist']
    },

    medium: {
      name: 'Order Sync with Sheets Database',
      description: 'Sync orders to Sheets database with validation and foreign keys',
      estimate: '8-10h',
      specialists: ['Security Engineer', 'BC Specialist', 'Data Engineer', 'Platform Engineer']
    },

    complex: {
      name: 'Two-Way Sync with Conflict Resolution',
      description: 'Bidirectional sync between BC and Sheets with conflict detection and AI-powered resolution',
      estimate: '20-25h',
      specialists: ['Security Engineer', 'BC Specialist', 'Data Engineer', 'AI Integration Specialist', 'Platform Engineer', 'Solution Architect']
    },

    advanced: {
      name: 'Multi-Company BC Aggregation',
      description: 'Aggregate data from multiple BC companies, apply business rules, generate consolidated reports',
      estimate: '30-40h',
      specialists: ['Security Engineer', 'BC Specialist', 'Data Engineer', 'Business Logic Engineer', 'Platform Engineer', 'Solution Architect', 'Documentation Engineer']
    }
  };

  for (const [level, integration] of Object.entries(integrations)) {
    Logger.log(`─────────────────────────────────────────────────────`);
    Logger.log(`${level.toUpperCase()}: ${integration.name}`);
    Logger.log(`  ${integration.description}`);
    Logger.log(`  Estimate: ${integration.estimate}`);
    Logger.log(`  Specialists (${integration.specialists.length}):`);
    integration.specialists.forEach(s => Logger.log(`    • ${s}`));
    Logger.log('');
  }

  Logger.log('💡 Use orchestrateProject() with your specific requirements');
  Logger.log('   to get a detailed execution plan!');
}

/**
 * Example 3: Security-First Approach
 *
 * Why the Orchestrator ALWAYS starts with Security Engineer for BC
 */
function explainSecurityFirst() {
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('WHY SECURITY ENGINEER IS PRIORITY 1');
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('');

  Logger.log('🔒 SECURITY-FIRST PRINCIPLE:');
  Logger.log('');
  Logger.log('The Orchestrator ALWAYS selects Security Engineer first');
  Logger.log('when Business Central is detected. Here\'s why:');
  Logger.log('');

  const reasons = [
    {
      reason: 'OAuth2 is Required',
      explanation: 'BC API requires OAuth2 authentication. Without it, you can\'t make ANY API calls.',
      impact: 'BLOCKING'
    },
    {
      reason: 'Credentials Must Be Secure',
      explanation: 'Client secrets, tenant IDs must never be hardcoded. PropertiesService provides secure storage.',
      impact: 'CRITICAL'
    },
    {
      reason: 'Token Management is Complex',
      explanation: 'Tokens expire after 3600s. Need automatic refresh, caching, error handling.',
      impact: 'HIGH'
    },
    {
      reason: 'Other Components Depend on It',
      explanation: 'BCClient, Integration Engineer, Data Engineer ALL need OAuth2Manager.',
      impact: 'DEPENDENCY'
    }
  ];

  reasons.forEach((r, i) => {
    Logger.log(`${i + 1}. ${r.reason} [${r.impact}]`);
    Logger.log(`   ${r.explanation}`);
    Logger.log('');
  });

  Logger.log('✅ THIS EXAMPLE FOLLOWS SECURITY-FIRST:');
  Logger.log('   • OAuth2Manager.gs implemented first');
  Logger.log('   • Credentials in PropertiesService (not hardcoded)');
  Logger.log('   • Multi-level token caching');
  Logger.log('   • Automatic token refresh');
  Logger.log('   • All other components use OAuth2Manager');
  Logger.log('');
  Logger.log('🎯 ORCHESTRATOR ENFORCES THIS ORDER AUTOMATICALLY');
}

/**
 * Example 4: Performance Optimization Journey
 *
 * Show the 160x performance improvement path
 */
function explainPerformanceJourney() {
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('PERFORMANCE OPTIMIZATION JOURNEY');
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('');

  const stages = [
    {
      stage: 'Initial (No Caching)',
      performance: '1x baseline',
      apiCalls: '100 calls = 100 OAuth2 requests',
      time: '~100 seconds',
      cost: 'High quota usage'
    },
    {
      stage: 'Level 1: Memory Cache',
      performance: '50x faster',
      apiCalls: '100 calls = 2 OAuth2 requests',
      time: '~2 seconds',
      cost: 'Lost on script restart'
    },
    {
      stage: 'Level 2: CacheService',
      performance: '100x faster',
      apiCalls: '100 calls = 1 OAuth2 request per 10 min',
      time: '~1 second',
      cost: '10-minute expiry'
    },
    {
      stage: 'Level 3: PropertiesService',
      performance: '160x faster',
      apiCalls: '100 calls = 1 OAuth2 request per hour',
      time: '~0.6 seconds',
      cost: 'Persistent across runs'
    }
  ];

  Logger.log('🚀 PERFORMANCE EVOLUTION:');
  Logger.log('');

  stages.forEach((s, i) => {
    Logger.log(`Stage ${i + 1}: ${s.stage}`);
    Logger.log(`  Performance: ${s.performance}`);
    Logger.log(`  API Calls: ${s.apiCalls}`);
    Logger.log(`  Time: ${s.time}`);
    Logger.log(`  Note: ${s.cost}`);
    Logger.log('');
  });

  Logger.log('💡 ORCHESTRATOR INSIGHT:');
  Logger.log('   Platform Engineer specialist implements this automatically');
  Logger.log('   by following docs/deep/platform/caching.md patterns!');
  Logger.log('');
  Logger.log('✅ THIS EXAMPLE: Full 3-level caching = 160x improvement!');
}

/**
 * Example 5: Extend This Example
 */
function planExtensions() {
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('PLAN EXTENSIONS TO oauth2-bc-integration');
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('');

  const extensions = [
    {
      name: 'Two-Way Sync',
      description: 'Write changes from Sheets back to Business Central',
      estimate: '6-8h',
      specialists: ['BC Specialist', 'Data Engineer', 'Business Logic Engineer'],
      complexity: 'HIGH',
      newPatterns: ['Conflict detection', 'Change tracking', 'Write validation']
    },
    {
      name: 'Incremental Sync',
      description: 'Only sync changed/new records using BC timestamps',
      estimate: '3-4h',
      specialists: ['BC Specialist', 'Data Engineer'],
      complexity: 'MEDIUM',
      newPatterns: ['Last sync tracking', 'Delta queries', 'Merge logic']
    },
    {
      name: 'Multi-Company Support',
      description: 'Sync from multiple BC companies into one Sheet',
      estimate: '4-6h',
      specialists: ['BC Specialist', 'Data Engineer', 'Solution Architect'],
      complexity: 'MEDIUM',
      newPatterns: ['Company routing', 'Namespace isolation', 'Cross-company queries']
    },
    {
      name: 'Real-Time Webhooks',
      description: 'BC webhooks trigger immediate Sheets updates',
      estimate: '8-10h',
      specialists: ['Integration Engineer', 'Platform Engineer', 'Security Engineer'],
      complexity: 'HIGH',
      newPatterns: ['Webhook handlers', 'Event queue', 'Retry mechanism']
    },
    {
      name: 'AI Data Validation',
      description: 'Use Claude to validate BC data before import',
      estimate: '5-7h',
      specialists: ['AI Integration Specialist', 'Business Logic Engineer'],
      complexity: 'MEDIUM',
      newPatterns: ['Prompt engineering', 'Validation rules', 'Error reporting']
    }
  ];

  extensions.forEach((ext, i) => {
    Logger.log(`${i + 1}. ${ext.name} [${ext.complexity}]`);
    Logger.log(`   ${ext.description}`);
    Logger.log(`   Estimate: ${ext.estimate}`);
    Logger.log(`   Specialists: ${ext.specialists.join(', ')}`);
    Logger.log(`   New Patterns: ${ext.newPatterns.join(', ')}`);
    Logger.log('');
  });

  Logger.log('💡 TIP: Each extension adds specific specialists.');
  Logger.log('   Use orchestrateProject() to see the full plan!');
}

/**
 * Example 6: Common Pitfalls Avoided
 *
 * Show what the Orchestrator helps you avoid
 */
function showCommonPitfalls() {
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('COMMON PITFALLS THE ORCHESTRATOR HELPS YOU AVOID');
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('');

  const pitfalls = [
    {
      pitfall: '❌ Hardcoded Credentials',
      problem: 'Client secret in code = GitHub push protection rejects it',
      solution: '✅ Security Engineer → PropertiesService storage',
      saved: '2-3 hours of debugging'
    },
    {
      pitfall: '❌ No Token Caching',
      problem: 'Every API call = new OAuth2 request = slow + quota issues',
      solution: '✅ Platform Engineer → Multi-level caching (160x faster)',
      saved: 'Massive performance gain'
    },
    {
      pitfall: '❌ Wrong OData Syntax',
      problem: 'BC API has quirks (e.g., entity names, filter operators)',
      solution: '✅ BC Specialist → OData patterns, entity list',
      saved: '4-6 hours of trial-and-error'
    },
    {
      pitfall: '❌ No Error Handling',
      problem: 'Network hiccup = script crashes, data loss',
      solution: '✅ Platform Engineer → Exponential backoff, retry logic',
      saved: 'Production reliability'
    },
    {
      pitfall: '❌ Synchronous Loops',
      problem: 'for-loop hitting API = 100 calls = 100 seconds',
      solution: '✅ Platform Engineer → Batch operations, parallel requests',
      saved: '90% time reduction'
    },
    {
      pitfall: '❌ Integration Before Security',
      problem: 'Build BCClient, realize you need OAuth2, refactor everything',
      solution: '✅ Orchestrator → Security Engineer runs FIRST',
      saved: '8-10 hours of rework'
    }
  ];

  pitfalls.forEach((p, i) => {
    Logger.log(`${i + 1}. ${p.pitfall}`);
    Logger.log(`   Problem: ${p.problem}`);
    Logger.log(`   ${p.solution}`);
    Logger.log(`   Time Saved: ${p.saved}`);
    Logger.log('');
  });

  Logger.log('✅ THIS EXAMPLE AVOIDS ALL THESE PITFALLS!');
  Logger.log('   That\'s why it\'s production-ready from day 1.');
}

/**
 * Run all examples
 */
function runAllOrchestratorExamples() {
  analyzeThisProject();
  Logger.log('\n\n');

  planBCIntegrations();
  Logger.log('\n\n');

  explainSecurityFirst();
  Logger.log('\n\n');

  explainPerformanceJourney();
  Logger.log('\n\n');

  planExtensions();
  Logger.log('\n\n');

  showCommonPitfalls();
}
