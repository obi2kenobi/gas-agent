/**
 * ExecutionPlanner.gs - Execution Plan Generation
 *
 * Generates detailed step-by-step execution plans based on:
 * - Requirements analysis
 * - Selected specialists
 * - Dependencies between specialists
 *
 * Output: Phase-based execution plan with tasks, files, and validation points
 */

const ExecutionPlanner = (function() {

  /**
   * Generate execution plan
   *
   * @param {Object} analysis - Requirements analysis
   * @param {Object} selection - Specialist selection
   * @returns {Object} Execution plan
   */
  function generatePlan(analysis, selection) {
    const phases = [];
    let stepNumber = 1;

    // Group specialists by priority into phases
    const grouped = groupByPriority(selection.specialists);

    // Generate phases
    for (const [priority, specialists] of grouped) {
      const phase = generatePhase(priority, specialists, stepNumber, analysis);
      phases.push(phase);
      stepNumber += phase.steps.length;
    }

    // Calculate totals
    const totalSteps = phases.reduce((sum, p) => sum + p.steps.length, 0);
    const totalFiles = phases.reduce((sum, p) => sum + p.filesCount, 0);

    return {
      phases,
      totalPhases: phases.length,
      totalSteps,
      totalFiles,
      estimatedHours: selection.complexity.estimatedHours,
      complexity: selection.complexity.level,
      generated: new Date().toISOString()
    };
  }

  /**
   * Group specialists by priority
   */
  function groupByPriority(specialists) {
    const grouped = new Map();

    specialists.forEach(spec => {
      if (!grouped.has(spec.priority)) {
        grouped.set(spec.priority, []);
      }
      grouped.get(spec.priority).push(spec);
    });

    // Sort by priority
    return new Map([...grouped.entries()].sort((a, b) => a[0] - b[0]));
  }

  /**
   * Generate phase details
   */
  function generatePhase(priority, specialists, startStep, analysis) {
    const phaseName = getPhaseName(priority);
    const steps = [];
    let filesCount = 0;

    specialists.forEach(spec => {
      // Main specialist step
      const step = {
        number: startStep + steps.length,
        specialist: spec.name,
        action: `Load and apply ${spec.name} guidance`,
        files: [spec.file],
        description: generateStepDescription(spec, analysis),
        estimatedTime: '30-60 min',
        outputs: generateExpectedOutputs(spec)
      };

      steps.push(step);
      filesCount += 1;

      // Deep file steps (if relevant)
      const relevantDeepFiles = selectRelevantDeepFiles(spec, analysis);
      relevantDeepFiles.forEach(deepFile => {
        const deepStep = {
          number: startStep + steps.length,
          specialist: spec.name,
          action: `Implement pattern from ${deepFile.split('/').pop()}`,
          files: [deepFile],
          description: `Apply ${deepFile.split('/').pop().replace('.md', '').replace(/-/g, ' ')} patterns`,
          estimatedTime: '45-90 min',
          outputs: []
        };
        steps.push(deepStep);
        filesCount += 1;
      });
    });

    return {
      name: phaseName,
      priority,
      steps,
      filesCount,
      estimatedHours: Math.ceil(steps.length * 0.75) // Average 45 min per step
    };
  }

  /**
   * Get phase name based on priority
   */
  function getPhaseName(priority) {
    const names = {
      1: 'Foundation & Security',
      2: 'Architecture & Design',
      3: 'Core Integration',
      4: 'Data & APIs',
      5: 'Business Logic & Data Processing',
      6: 'Advanced Features',
      7: 'Platform & Reliability',
      8: 'Documentation & Polish'
    };

    return names[priority] || `Phase ${priority}`;
  }

  /**
   * Generate step description
   */
  function generateStepDescription(spec, analysis) {
    const descriptions = {
      'Security Engineer': 'Implement OAuth2 authentication, credential management, and authorization patterns',
      'Platform Engineer': 'Add error handling, caching, performance optimization, and monitoring',
      'AI Integration Specialist': 'Set up Claude API integration, prompt engineering, and token management',
      'Integration Engineer': 'Implement HTTP client, response parsing, and integration patterns',
      'Data Engineer': 'Design Sheets database schema, implement ETL patterns, and query optimization',
      'BC Specialist': 'Configure Business Central integration and OData queries',
      'Solution Architect': 'Design system architecture, define patterns, and ensure SOLID principles',
      'Workspace Engineer': 'Implement Google Workspace integrations (Sheets, Drive, Gmail)',
      'UI Engineer': 'Create user interface with HTML Service (sidebars, dialogs)',
      'Documentation Engineer': 'Add JSDoc comments, README, and API documentation'
    };

    return descriptions[spec.name] || `Implement ${spec.name} patterns`;
  }

  /**
   * Generate expected outputs for each specialist
   */
  function generateExpectedOutputs(spec) {
    const outputs = {
      'Security Engineer': [
        'OAuth2Manager.gs - Token management',
        'Config.gs - Secure configuration',
        'RBAC logic (if needed)'
      ],
      'Platform Engineer': [
        'ErrorHandler.gs - Error handling utilities',
        'CacheManager.gs - Multi-level caching',
        'Monitor.gs - Health checks and logging'
      ],
      'AI Integration Specialist': [
        'ClaudeClient.gs - API client',
        'PromptBuilder.gs - Prompt utilities',
        'TokenOptimizer.gs - Token management'
      ],
      'Integration Engineer': [
        'HTTPClient.gs - HTTP utilities',
        'ResponseParser.gs - Response handling'
      ],
      'Data Engineer': [
        'Schema.gs - Database schema',
        'Repository.gs - Data access layer',
        'ETL.gs - Transform logic'
      ],
      'BC Specialist': [
        'BCClient.gs - Business Central client',
        'ODataHelper.gs - Query utilities'
      ]
    };

    return outputs[spec.name] || [`${spec.name.replace(/ /g, '')}.gs`];
  }

  /**
   * Select relevant deep files based on analysis
   */
  function selectRelevantDeepFiles(spec, analysis) {
    // For now, return first 2 deep files (most important)
    // In production, use analysis to filter
    return spec.deepFiles.slice(0, 2);
  }

  /**
   * Format execution plan as readable text
   */
  function formatPlan(plan) {
    const lines = [];

    lines.push('='.repeat(80));
    lines.push('EXECUTION PLAN');
    lines.push('='.repeat(80));
    lines.push('');

    lines.push(`Total Phases: ${plan.totalPhases}`);
    lines.push(`Total Steps: ${plan.totalSteps}`);
    lines.push(`Total Files: ${plan.totalFiles}`);
    lines.push(`Estimated Effort: ${plan.estimatedHours} hours`);
    lines.push(`Complexity: ${plan.complexity.toUpperCase()}`);
    lines.push('');

    plan.phases.forEach((phase, i) => {
      lines.push('-'.repeat(80));
      lines.push(`PHASE ${i + 1}: ${phase.name} (${phase.estimatedHours}h)`);
      lines.push('-'.repeat(80));
      lines.push('');

      phase.steps.forEach(step => {
        lines.push(`[${step.number}] ${step.action}`);
        lines.push(`     Specialist: ${step.specialist}`);
        lines.push(`     Description: ${step.description}`);
        lines.push(`     Files: ${step.files.join(', ')}`);
        if (step.outputs && step.outputs.length > 0) {
          lines.push(`     Expected Output: ${step.outputs.join(', ')}`);
        }
        lines.push(`     Time: ${step.estimatedTime}`);
        lines.push('');
      });
    });

    lines.push('='.repeat(80));

    return lines.join('\n');
  }

  // Public API
  return {
    generatePlan,
    formatPlan
  };
})();

/**
 * Test function
 */
function testExecutionPlanner() {
  const sampleProject = `
    Build a secure order management system that integrates with Business Central,
    stores data in Sheets, has real-time monitoring, and uses Claude AI for validation.
  `;

  const analysis = RequirementsAnalyzer.analyze(sampleProject);
  const selection = SpecialistSelector.selectSpecialists(analysis);
  const plan = ExecutionPlanner.generatePlan(analysis, selection);

  const formatted = ExecutionPlanner.formatPlan(plan);
  Logger.log(formatted);

  return plan;
}
