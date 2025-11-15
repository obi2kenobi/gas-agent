/**
 * Orchestrator.gs - Main Orchestrator Coordinator
 *
 * **Intelligent Project Coordinator for Google Apps Script Development**
 *
 * YOU DON'T NEED TO KNOW WHICH SPECIALIST TO USE - just describe your project!
 *
 * The Orchestrator automatically:
 * 1. Analyzes your requirements
 * 2. Selects appropriate specialists
 * 3. Generates step-by-step execution plan
 * 4. Provides validation framework
 *
 * Usage:
 *   const result = orchestrate("Build a system that syncs BC orders to Sheets with OAuth2");
 *   Logger.log(result.plan);
 */

const Orchestrator = (function() {

  /**
   * Main orchestration function
   *
   * @param {string} projectDescription - Natural language project description
   * @param {Object} options - Configuration options
   * @returns {Object} Orchestration result
   */
  function orchestrate(projectDescription, options = {}) {
    const startTime = Date.now();

    Logger.log('🎯 GAS-Agent Orchestrator');
    Logger.log('='.repeat(60));
    Logger.log('');
    Logger.log(`Project: ${projectDescription.substring(0, 100)}${projectDescription.length > 100 ? '...' : ''}`);
    Logger.log('');

    // Step 1: Analyze requirements
    Logger.log('📋 Step 1: Analyzing requirements...');
    const analysis = RequirementsAnalyzer.analyze(projectDescription);
    Logger.log(`✅ Analysis complete (${analysis.totalMatches} keyword matches)`);
    Logger.log(`   Complexity: ${analysis.complexity.level.toUpperCase()}`);
    Logger.log(`   Primary Categories: ${analysis.primaryCategories.join(', ')}`);
    Logger.log('');

    // Step 2: Select specialists
    Logger.log('👥 Step 2: Selecting specialists...');
    const selection = SpecialistSelector.selectSpecialists(analysis);
    Logger.log(`✅ Selected ${selection.count} specialists`);
    Logger.log(`   Estimated effort: ${selection.complexity.estimatedHours}h (${selection.complexity.estimatedDays} days)`);
    Logger.log('');

    // Step 3: Generate execution plan
    Logger.log('📝 Step 3: Generating execution plan...');
    const plan = ExecutionPlanner.generatePlan(analysis, selection);
    Logger.log(`✅ Plan generated: ${plan.totalPhases} phases, ${plan.totalSteps} steps`);
    Logger.log('');

    // Step 4: Generate recommendations
    Logger.log('💡 Step 4: Generating recommendations...');
    const recommendations = generateRecommendations(analysis, selection, plan);
    Logger.log(`✅ ${recommendations.length} recommendations generated`);
    Logger.log('');

    const elapsedMs = Date.now() - startTime;
    Logger.log(`⏱️  Total time: ${elapsedMs}ms`);
    Logger.log('');

    const result = {
      analysis,
      selection,
      plan,
      recommendations,
      metadata: {
        projectDescription,
        timestamp: new Date().toISOString(),
        elapsedMs,
        version: '1.0'
      }
    };

    if (options.verbose !== false) {
      displaySummary(result);
    }

    return result;
  }

  /**
   * Generate recommendations based on analysis
   */
  function generateRecommendations(analysis, selection, plan) {
    const recommendations = [];

    // Security recommendations
    if (selection.specialists.some(s => s.name === 'Security Engineer')) {
      recommendations.push({
        category: 'security',
        priority: 'high',
        title: 'Secure Credential Storage',
        description: 'Use PropertiesService.getScriptProperties() for all credentials. Never hardcode secrets.',
        resources: ['docs/deep/security/properties-security.md']
      });

      if (analysis.categories.businessCentral?.relevance) {
        recommendations.push({
          category: 'security',
          priority: 'high',
          title: 'OAuth2 Token Caching',
          description: 'Implement multi-level token caching (Memory → CacheService) for 160x performance improvement.',
          resources: ['docs/deep/security/oauth2-patterns.md', 'examples/oauth2-bc-integration/OAuth2Manager.gs']
        });
      }
    }

    // Performance recommendations
    if (analysis.categories.performance?.relevance || analysis.categories.dataEngineering?.relevance) {
      recommendations.push({
        category: 'performance',
        priority: 'high',
        title: 'Batch Operations',
        description: 'Use getValues()/setValues() for Sheets operations. 100x faster than row-by-row.',
        resources: ['docs/deep/platform/performance.md']
      });

      recommendations.push({
        category: 'performance',
        priority: 'medium',
        title: 'Multi-Level Caching',
        description: 'Implement caching strategy: Memory → CacheService → PropertiesService → Source.',
        resources: ['docs/deep/platform/caching.md']
      });
    }

    // Error handling recommendations
    if (plan.complexity !== 'low') {
      recommendations.push({
        category: 'reliability',
        priority: 'high',
        title: 'Error Handling & Retry Logic',
        description: 'Implement exponential backoff for API calls. Essential for production reliability.',
        resources: ['docs/deep/platform/error-handling.md']
      });
    }

    // Testing recommendations
    if (plan.totalSteps > 5) {
      recommendations.push({
        category: 'quality',
        priority: 'medium',
        title: 'Comprehensive Testing',
        description: 'Implement test suite with unit tests, integration tests, and performance benchmarks.',
        resources: ['docs/testing/README.md', 'examples/oauth2-bc-integration/TEST.gs']
      });
    }

    // Documentation recommendations
    if (selection.complexity.estimatedHours > 8) {
      recommendations.push({
        category: 'maintainability',
        priority: 'low',
        title: 'Code Documentation',
        description: 'Add JSDoc comments for all public functions. Makes code maintainable long-term.',
        resources: ['docs/quality-standards.md']
      });
    }

    return recommendations;
  }

  /**
   * Display comprehensive summary
   */
  function displaySummary(result) {
    Logger.log('');
    Logger.log('='.repeat(80));
    Logger.log('📊 ORCHESTRATION SUMMARY');
    Logger.log('='.repeat(80));
    Logger.log('');

    // Requirements
    Logger.log('📋 Requirements Analysis:');
    Logger.log(`   Complexity: ${result.analysis.complexity.level.toUpperCase()} (score: ${result.analysis.complexity.score})`);
    Logger.log(`   Categories: ${result.analysis.primaryCategories.join(', ')}`);
    Logger.log(`   Total Matches: ${result.analysis.totalMatches}`);
    Logger.log('');

    // Specialists
    Logger.log('👥 Selected Specialists:');
    result.selection.specialists.forEach((spec, i) => {
      Logger.log(`   ${i + 1}. ${spec.name} (priority: ${spec.priority})`);
    });
    Logger.log('');

    // Execution Plan
    Logger.log('📝 Execution Plan:');
    Logger.log(`   Phases: ${result.plan.totalPhases}`);
    Logger.log(`   Steps: ${result.plan.totalSteps}`);
    Logger.log(`   Files: ${result.plan.totalFiles}`);
    Logger.log(`   Estimated: ${result.plan.estimatedHours} hours`);
    Logger.log('');

    // Recommendations
    if (result.recommendations.length > 0) {
      Logger.log('💡 Key Recommendations:');
      result.recommendations.slice(0, 5).forEach((rec, i) => {
        Logger.log(`   ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
      });
      Logger.log('');
    }

    Logger.log('='.repeat(80));
    Logger.log('');
    Logger.log('📖 Next Steps:');
    Logger.log('   1. Review the detailed execution plan');
    Logger.log('   2. Load specialist files in order');
    Logger.log('   3. Follow step-by-step implementation');
    Logger.log('   4. Validate at each phase');
    Logger.log('');
    Logger.log('💡 Tip: Use result.plan for detailed step-by-step guide');
    Logger.log('');
  }

  /**
   * Get full detailed report
   */
  function getDetailedReport(result) {
    const sections = [];

    sections.push(RequirementsAnalyzer.formatAnalysis(result.analysis));
    sections.push('\n\n');
    sections.push(SpecialistSelector.formatSelection(result.selection, result.analysis));
    sections.push('\n\n');
    sections.push(ExecutionPlanner.formatPlan(result.plan));
    sections.push('\n\n');
    sections.push(formatRecommendations(result.recommendations));

    return sections.join('');
  }

  /**
   * Format recommendations
   */
  function formatRecommendations(recommendations) {
    const lines = [];

    lines.push('='.repeat(60));
    lines.push('RECOMMENDATIONS');
    lines.push('='.repeat(60));
    lines.push('');

    recommendations.forEach((rec, i) => {
      lines.push(`${i + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
      lines.push(`   Category: ${rec.category}`);
      lines.push(`   ${rec.description}`);
      if (rec.resources && rec.resources.length > 0) {
        lines.push(`   Resources:`);
        rec.resources.forEach(r => lines.push(`     - ${r}`));
      }
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Quick orchestration - minimal output
   */
  function quickOrchestrate(projectDescription) {
    return orchestrate(projectDescription, { verbose: false });
  }

  // Public API
  return {
    orchestrate,
    quickOrchestrate,
    getDetailedReport
  };
})();

/**
 * Main function - orchestrate a project
 *
 * @param {string} description - Project description
 * @returns {Object} Orchestration result
 */
function orchestrateProject(description) {
  return Orchestrator.orchestrate(description);
}

/**
 * Example 1: Business Central Integration
 */
function example1_BCIntegration() {
  const project = `
    Build a system that syncs orders from Business Central to Google Sheets.
    Requirements:
    - OAuth2 authentication for BC API
    - Incremental sync (only new/changed orders)
    - Multi-level caching (memory + CacheService)
    - Error handling with exponential backoff
    - Monitoring and health checks
    - Audit logging for compliance
  `;

  const result = Orchestrator.orchestrate(project);
  const report = Orchestrator.getDetailedReport(result);

  Logger.log('\n\n');
  Logger.log('FULL DETAILED REPORT:');
  Logger.log('='.repeat(80));
  Logger.log(report);

  return result;
}

/**
 * Example 2: AI Document Processing
 */
function example2_AIDocProcessing() {
  const project = `
    Create a document processing system that uses Claude AI to extract data from PDFs
    stored in Google Drive, validate the data, and save it to Sheets with audit logging.
  `;

  return Orchestrator.orchestrate(project);
}

/**
 * Example 3: Simple Automation
 */
function example3_SimpleAutomation() {
  const project = `
    Automate weekly sales report generation from Sheets data with email notifications.
  `;

  return Orchestrator.orchestrate(project);
}

/**
 * Example 4: Complex Enterprise System
 */
function example4_ComplexEnterprise() {
  const project = `
    Build a comprehensive ERP integration connecting Business Central, Salesforce,
    and Google Workspace with real-time sync, AI-powered analytics, custom UI,
    role-based access control, and enterprise-grade monitoring.
  `;

  return Orchestrator.orchestrate(project);
}
