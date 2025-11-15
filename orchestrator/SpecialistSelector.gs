/**
 * SpecialistSelector.gs - Automatic Specialist Selection
 *
 * Based on requirements analysis, automatically selects appropriate
 * specialists and determines their priority/order.
 *
 * Specialists available:
 * - Security Engineer
 * - Platform Engineer
 * - AI Integration Specialist
 * - Integration Engineer
 * - Data Engineer
 * - BC Specialist
 * - Solution Architect
 * - Workspace Engineer
 * - Business Logic Engineer
 * - UI Engineer
 * - Document Processing Specialist
 * - Documentation Engineer
 */

const SpecialistSelector = (function() {

  /**
   * Specialist definitions with selection criteria
   */
  const SPECIALISTS = {
    'Security Engineer': {
      file: 'docs/specialists/security-engineer.md',
      keywords: ['security', 'oauth', 'auth', 'credential', 'rbac', 'gdpr', 'compliance'],
      requiredFor: ['businessCentral', 'aiIntegration'],
      deepFiles: [
        'docs/deep/security/oauth2-patterns.md',
        'docs/deep/security/properties-security.md',
        'docs/deep/security/sensitive-data.md',
        'docs/deep/security/authorization.md'
      ],
      priority: 1, // Runs early (foundation)
      alwaysInclude: false
    },

    'Platform Engineer': {
      file: 'docs/specialists/platform-engineer.md',
      keywords: ['performance', 'cache', 'error', 'logging', 'monitoring', 'reliability'],
      requiredFor: [],
      deepFiles: [
        'docs/deep/platform/error-handling.md',
        'docs/deep/platform/caching.md',
        'docs/deep/platform/performance.md',
        'docs/deep/platform/monitoring.md'
      ],
      priority: 7, // Runs late (integrates everything)
      alwaysInclude: true // Always needed for production
    },

    'AI Integration Specialist': {
      file: 'docs/specialists/ai-integration-specialist.md',
      keywords: ['claude', 'ai', 'ml', 'llm', 'gpt', 'nlp', 'prompt'],
      requiredFor: ['aiIntegration'],
      deepFiles: [
        'docs/deep/ai-integration/api-setup.md',
        'docs/deep/ai-integration/prompt-engineering.md',
        'docs/deep/ai-integration/token-optimization.md'
      ],
      priority: 6,
      alwaysInclude: false
    },

    'Integration Engineer': {
      file: 'docs/specialists/integration-engineer.md',
      keywords: ['api', 'http', 'webhook', 'rest', 'integration', 'endpoint'],
      requiredFor: ['businessCentral', 'integration'],
      deepFiles: [
        'docs/deep/integration/http-patterns.md',
        'docs/deep/integration/oauth2-implementation.md',
        'docs/deep/integration/response-parsing.md'
      ],
      priority: 4,
      alwaysInclude: false
    },

    'Data Engineer': {
      file: 'docs/specialists/data-engineer.md',
      keywords: ['data', 'etl', 'sync', 'sheets', 'database', 'query'],
      requiredFor: ['dataEngineering', 'workspace'],
      deepFiles: [
        'docs/deep/data/sheets-database.md',
        'docs/deep/data/etl-patterns.md',
        'docs/deep/data/query-patterns.md'
      ],
      priority: 5,
      alwaysInclude: false
    },

    'BC Specialist': {
      file: 'docs/specialists/bc-specialist.md',
      keywords: ['business central', 'bc', 'dynamics', 'odata', 'entity'],
      requiredFor: ['businessCentral'],
      deepFiles: [
        'docs/deep/bc/entities.md',
        'docs/deep/bc/odata-patterns.md'
      ],
      priority: 3,
      alwaysInclude: false
    },

    'Solution Architect': {
      file: 'docs/specialists/solution-architect.md',
      keywords: ['architecture', 'design', 'pattern', 'solid'],
      requiredFor: [],
      deepFiles: [
        'docs/deep/architecture/patterns.md',
        'docs/deep/architecture/principles.md'
      ],
      priority: 2, // Runs early (design phase)
      alwaysInclude: false,
      includeIfComplex: true // Include for complex projects
    },

    'Workspace Engineer': {
      file: 'docs/specialists/workspace-engineer.md',
      keywords: ['sheets', 'drive', 'gmail', 'calendar', 'workspace'],
      requiredFor: ['workspace'],
      deepFiles: [
        'docs/deep/workspace/sheets-patterns.md',
        'docs/deep/workspace/drive-gmail.md'
      ],
      priority: 5,
      alwaysInclude: false
    },

    'Business Logic Engineer': {
      file: 'docs/specialists/business-logic-engineer.md',
      keywords: ['business', 'logic', 'rules', 'validation', 'workflow'],
      requiredFor: [],
      deepFiles: [],
      priority: 6,
      alwaysInclude: false
    },

    'UI Engineer': {
      file: 'docs/specialists/ui-engineer.md',
      keywords: ['ui', 'interface', 'sidebar', 'dialog', 'html', 'form'],
      requiredFor: ['ui'],
      deepFiles: [],
      priority: 6,
      alwaysInclude: false
    },

    'Document Processing Specialist': {
      file: 'docs/specialists/document-processing-specialist.md',
      keywords: ['pdf', 'document', 'ocr', 'parsing', 'text extraction'],
      requiredFor: [],
      deepFiles: [
        'docs/deep/ai-integration/document-processing.md'
      ],
      priority: 5,
      alwaysInclude: false
    },

    'Documentation Engineer': {
      file: 'docs/specialists/documentation-engineer.md',
      keywords: ['documentation', 'jsdoc', 'comment', 'readme'],
      requiredFor: [],
      deepFiles: [],
      priority: 8, // Runs last
      alwaysInclude: false,
      includeIfComplex: true
    }
  };

  /**
   * Select specialists based on requirements analysis
   *
   * @param {Object} analysis - Requirements analysis from RequirementsAnalyzer
   * @returns {Object} Selection result
   */
  function selectSpecialists(analysis) {
    const selected = [];
    const reasons = {};

    // Always include Platform Engineer for production
    if (SPECIALISTS['Platform Engineer'].alwaysInclude) {
      selected.push('Platform Engineer');
      reasons['Platform Engineer'] = ['Always included for production readiness'];
    }

    // Check each specialist
    for (const [name, spec] of Object.entries(SPECIALISTS)) {
      if (selected.includes(name)) continue; // Already added

      const shouldInclude = [];

      // Check if required for any active category
      for (const requiredCat of spec.requiredFor) {
        if (analysis.categories[requiredCat]?.relevance) {
          shouldInclude.push(`Required for ${requiredCat}`);
        }
      }

      // Check keyword matches
      const categoryMatches = [];
      for (const [category, data] of Object.entries(analysis.categories)) {
        if (!data.relevance) continue;

        const matchingKeywords = spec.keywords.filter(kw =>
          data.matched.some(m => m.includes(kw) || kw.includes(m))
        );

        if (matchingKeywords.length > 0) {
          categoryMatches.push(category);
        }
      }

      if (categoryMatches.length > 0) {
        shouldInclude.push(`Matched categories: ${categoryMatches.join(', ')}`);
      }

      // Include if complex project and specialist has includeIfComplex flag
      if (spec.includeIfComplex &&
          (analysis.complexity.level === 'high' || analysis.complexity.level === 'very high')) {
        shouldInclude.push('Complex project requires architectural guidance');
      }

      // Add if there are reasons to include
      if (shouldInclude.length > 0) {
        selected.push(name);
        reasons[name] = shouldInclude;
      }
    }

    // Sort by priority
    selected.sort((a, b) => SPECIALISTS[a].priority - SPECIALISTS[b].priority);

    // Build result
    const specialists = selected.map(name => ({
      name,
      file: SPECIALISTS[name].file,
      deepFiles: SPECIALISTS[name].deepFiles,
      priority: SPECIALISTS[name].priority,
      reasons: reasons[name]
    }));

    return {
      specialists,
      count: specialists.length,
      estimatedFiles: specialists.reduce((sum, s) => sum + 1 + s.deepFiles.length, 0),
      complexity: determineImplementationComplexity(specialists, analysis)
    };
  }

  /**
   * Determine implementation complexity based on specialist count
   */
  function determineImplementationComplexity(specialists, analysis) {
    const specialistCount = specialists.length;
    let complexity = 'low';
    let estimatedHours = 0;

    // Base hours per specialist (overview + 1-2 deep files)
    estimatedHours = specialistCount * 2;

    // Additional hours for complexity
    if (analysis.complexity.level === 'very high') {
      estimatedHours *= 2;
      complexity = 'very high';
    } else if (analysis.complexity.level === 'high') {
      estimatedHours *= 1.5;
      complexity = 'high';
    } else if (specialistCount >= 4) {
      complexity = 'medium';
    }

    // Additional hours for specific patterns
    if (specialists.some(s => s.name === 'Security Engineer')) estimatedHours += 3; // OAuth2 takes time
    if (specialists.some(s => s.name === 'AI Integration Specialist')) estimatedHours += 4; // AI integration complex
    if (specialists.some(s => s.name === 'BC Specialist')) estimatedHours += 2; // BC setup takes time

    return {
      level: complexity,
      estimatedHours: Math.ceil(estimatedHours),
      estimatedDays: Math.ceil(estimatedHours / 8),
      specialists: specialistCount
    };
  }

  /**
   * Get dependencies between specialists
   * Returns which specialists depend on others
   */
  function getDependencies(specialists) {
    const deps = {};

    const specialistNames = specialists.map(s => s.name);

    // Security Engineer outputs are needed by most others
    if (specialistNames.includes('Security Engineer')) {
      deps['Integration Engineer'] = ['Security Engineer'];
      deps['Data Engineer'] = ['Security Engineer'];
      deps['BC Specialist'] = ['Security Engineer'];
      deps['AI Integration Specialist'] = ['Security Engineer'];
    }

    // Solution Architect provides design for all
    if (specialistNames.includes('Solution Architect')) {
      specialistNames.forEach(name => {
        if (name !== 'Solution Architect') {
          if (!deps[name]) deps[name] = [];
          deps[name].push('Solution Architect');
        }
      });
    }

    // Integration Engineer provides API clients for Data Engineer
    if (specialistNames.includes('Integration Engineer') &&
        specialistNames.includes('Data Engineer')) {
      if (!deps['Data Engineer']) deps['Data Engineer'] = [];
      deps['Data Engineer'].push('Integration Engineer');
    }

    // Platform Engineer integrates everything (runs last)
    if (specialistNames.includes('Platform Engineer')) {
      deps['Platform Engineer'] = specialistNames.filter(n =>
        n !== 'Platform Engineer' && n !== 'Documentation Engineer'
      );
    }

    return deps;
  }

  /**
   * Format selection result as readable text
   */
  function formatSelection(selection, analysis) {
    const lines = [];

    lines.push('='.repeat(60));
    lines.push('SPECIALIST SELECTION');
    lines.push('='.repeat(60));
    lines.push('');

    lines.push(`Total Specialists: ${selection.count}`);
    lines.push(`Estimated Files: ${selection.estimatedFiles} (overview + deep files)`);
    lines.push(`Implementation Complexity: ${selection.complexity.level.toUpperCase()}`);
    lines.push(`Estimated Effort: ${selection.complexity.estimatedHours} hours (${selection.complexity.estimatedDays} days)`);
    lines.push('');

    lines.push('Selected Specialists (in execution order):');
    lines.push('');

    selection.specialists.forEach((spec, i) => {
      lines.push(`${i + 1}. ${spec.name} (priority: ${spec.priority})`);
      lines.push(`   File: ${spec.file}`);
      if (spec.deepFiles.length > 0) {
        lines.push(`   Deep Files (${spec.deepFiles.length}):`);
        spec.deepFiles.forEach(f => {
          lines.push(`     - ${f}`);
        });
      }
      lines.push(`   Reasons: ${spec.reasons.join(', ')}`);
      lines.push('');
    });

    // Show dependencies
    const deps = getDependencies(selection.specialists);
    if (Object.keys(deps).length > 0) {
      lines.push('Dependencies:');
      for (const [specialist, dependencies] of Object.entries(deps)) {
        lines.push(`  ${specialist} depends on: ${dependencies.join(', ')}`);
      }
      lines.push('');
    }

    lines.push('='.repeat(60));

    return lines.join('\n');
  }

  // Public API
  return {
    selectSpecialists,
    getDependencies,
    formatSelection,
    SPECIALISTS
  };
})();

/**
 * Test function - select specialists for sample project
 */
function testSpecialistSelector() {
  const sampleProject = `
    Build a system that syncs orders from Business Central to Google Sheets.
    Requirements:
    - OAuth2 authentication for BC API
    - Incremental sync (only new/changed orders)
    - Multi-level caching (memory + CacheService)
    - Error handling with exponential backoff
    - Monitoring and health checks
    - Audit logging for compliance
  `;

  // First analyze requirements
  const analysis = RequirementsAnalyzer.analyze(sampleProject);
  Logger.log('Analysis completed\n');

  // Then select specialists
  const selection = SpecialistSelector.selectSpecialists(analysis);
  const formatted = SpecialistSelector.formatSelection(selection, analysis);

  Logger.log(formatted);
  Logger.log('');
  Logger.log('Raw Selection:');
  Logger.log(JSON.stringify(selection, null, 2));

  return selection;
}
