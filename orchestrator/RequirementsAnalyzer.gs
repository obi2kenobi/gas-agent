/**
 * RequirementsAnalyzer.gs - Intelligent Requirements Analysis
 *
 * Analyzes natural language project requirements and extracts:
 * - Technical requirements (OAuth2, caching, monitoring, etc.)
 * - Integration points (Business Central, Google Sheets, APIs)
 * - Non-functional requirements (performance, security, compliance)
 * - Complexity indicators
 *
 * Uses pattern matching and keyword analysis for specialist selection.
 */

const RequirementsAnalyzer = (function() {

  /**
   * Keyword patterns for different categories
   */
  const PATTERNS = {
    security: [
      'oauth', 'oauth2', 'auth', 'authentication', 'authorization', 'token',
      'credential', 'secret', 'security', 'rbac', 'role', 'permission',
      'encrypt', 'gdpr', 'compliance', 'audit', 'pii', 'sensitive',
      'ssl', 'tls', 'https', 'certificate'
    ],

    businessCentral: [
      'business central', 'bc', 'dynamics', 'dynamics 365', 'd365',
      'nav', 'navision', 'odata', 'entity', 'customer', 'item',
      'sales order', 'purchase order', 'invoice', 'ledger'
    ],

    performance: [
      'slow', 'fast', 'optimize', 'performance', 'speed', 'cache',
      'caching', 'batch', 'parallel', 'async', 'timeout', 'quota',
      'throttle', 'rate limit', 'large dataset', '10k', '100k'
    ],

    dataEngineering: [
      'sheets', 'spreadsheet', 'database', 'data', 'etl', 'sync',
      'synchronize', 'import', 'export', 'transform', 'query',
      'filter', 'aggregate', 'join', 'relation', 'table', 'row'
    ],

    aiIntegration: [
      'claude', 'ai', 'artificial intelligence', 'ml', 'machine learning',
      'gpt', 'llm', 'chatbot', 'nlp', 'natural language',
      'document processing', 'pdf', 'ocr', 'text extraction',
      'prompt', 'embedding', 'semantic'
    ],

    integration: [
      'api', 'rest', 'http', 'webhook', 'endpoint', 'request',
      'response', 'json', 'xml', 'soap', 'graphql',
      'third party', 'external', 'integrate', 'connection'
    ],

    monitoring: [
      'monitor', 'monitoring', 'log', 'logging', 'alert', 'notification',
      'health check', 'status', 'dashboard', 'metrics', 'track',
      'observe', 'telemetry', 'error tracking'
    ],

    workspace: [
      'sheets', 'drive', 'gmail', 'calendar', 'docs', 'slides',
      'forms', 'google workspace', 'g suite', 'email', 'attachment'
    ],

    ui: [
      'ui', 'user interface', 'sidebar', 'dialog', 'menu', 'form',
      'html', 'css', 'javascript', 'frontend', 'display',
      'show', 'input', 'button', 'modal'
    ],

    testing: [
      'test', 'testing', 'unit test', 'integration test', 'e2e',
      'validate', 'verify', 'mock', 'stub', 'quality',
      'qa', 'bug', 'debug'
    ],

    deployment: [
      'deploy', 'deployment', 'ci/cd', 'pipeline', 'release',
      'version', 'staging', 'production', 'environment',
      'rollback', 'clasp'
    ]
  };

  /**
   * Analyze project requirements from natural language description
   *
   * @param {string} description - Project description
   * @returns {Object} Analysis result
   */
  function analyze(description) {
    const normalized = description.toLowerCase();

    // Extract keywords for each category
    const categories = {};
    let totalMatches = 0;

    for (const [category, keywords] of Object.entries(PATTERNS)) {
      const matches = keywords.filter(keyword =>
        normalized.includes(keyword.toLowerCase())
      );

      categories[category] = {
        matched: matches,
        count: matches.length,
        relevance: matches.length > 0
      };

      totalMatches += matches.length;
    }

    // Identify primary categories (top 3 by matches)
    const sortedCategories = Object.entries(categories)
      .filter(([_, data]) => data.count > 0)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([name, _]) => name);

    // Determine complexity
    const complexity = calculateComplexity(categories, normalized);

    // Extract specific requirements
    const requirements = {
      technical: extractTechnicalRequirements(normalized, categories),
      integrations: extractIntegrations(normalized, categories),
      nonFunctional: extractNonFunctionalRequirements(normalized, categories)
    };

    // Generate insights
    const insights = generateInsights(categories, complexity, requirements);

    return {
      description,
      categories,
      primaryCategories: sortedCategories,
      complexity,
      requirements,
      insights,
      totalMatches,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate project complexity
   */
  function calculateComplexity(categories, description) {
    const activeCategories = Object.values(categories).filter(c => c.relevance).length;
    const wordCount = description.split(/\s+/).length;

    let complexity = 'low';
    let score = 0;

    // Category-based scoring
    if (activeCategories >= 5) score += 3;
    else if (activeCategories >= 3) score += 2;
    else if (activeCategories >= 2) score += 1;

    // Description length scoring
    if (wordCount > 100) score += 2;
    else if (wordCount > 50) score += 1;

    // Specific complexity indicators
    if (description.includes('complex') || description.includes('advanced')) score += 2;
    if (description.includes('production') || description.includes('enterprise')) score += 1;
    if (description.includes('real-time') || description.includes('high volume')) score += 2;

    // Determine complexity level
    if (score >= 6) complexity = 'very high';
    else if (score >= 4) complexity = 'high';
    else if (score >= 2) complexity = 'medium';

    return {
      level: complexity,
      score: score,
      activeCategories: activeCategories,
      factors: {
        categoryCount: activeCategories,
        descriptionLength: wordCount,
        indicators: score
      }
    };
  }

  /**
   * Extract technical requirements
   */
  function extractTechnicalRequirements(description, categories) {
    const requirements = [];

    if (categories.security.relevance) {
      requirements.push({
        category: 'security',
        items: categories.security.matched,
        priority: 'high'
      });
    }

    if (categories.performance.relevance) {
      requirements.push({
        category: 'performance',
        items: categories.performance.matched,
        priority: 'high'
      });
    }

    if (categories.monitoring.relevance) {
      requirements.push({
        category: 'monitoring',
        items: categories.monitoring.matched,
        priority: 'medium'
      });
    }

    if (categories.testing.relevance) {
      requirements.push({
        category: 'testing',
        items: categories.testing.matched,
        priority: 'medium'
      });
    }

    return requirements;
  }

  /**
   * Extract integration points
   */
  function extractIntegrations(description, categories) {
    const integrations = [];

    if (categories.businessCentral.relevance) {
      integrations.push({
        type: 'Business Central',
        keywords: categories.businessCentral.matched,
        requiresAuth: true,
        protocol: 'OData'
      });
    }

    if (categories.workspace.relevance) {
      integrations.push({
        type: 'Google Workspace',
        keywords: categories.workspace.matched,
        requiresAuth: false,
        protocol: 'Native APIs'
      });
    }

    if (categories.aiIntegration.relevance) {
      integrations.push({
        type: 'AI Service (Claude)',
        keywords: categories.aiIntegration.matched,
        requiresAuth: true,
        protocol: 'REST API'
      });
    }

    if (categories.integration.relevance && integrations.length === 0) {
      // Generic API integration
      integrations.push({
        type: 'External API',
        keywords: categories.integration.matched,
        requiresAuth: true,
        protocol: 'REST/SOAP'
      });
    }

    return integrations;
  }

  /**
   * Extract non-functional requirements
   */
  function extractNonFunctionalRequirements(description, categories) {
    const nfr = {
      performance: false,
      security: false,
      scalability: false,
      maintainability: false,
      reliability: false
    };

    if (categories.performance.relevance) nfr.performance = true;
    if (categories.security.relevance) nfr.security = true;
    if (description.includes('scale') || description.includes('volume')) nfr.scalability = true;
    if (description.includes('maintain') || description.includes('readable')) nfr.maintainability = true;
    if (description.includes('reliable') || description.includes('error')) nfr.reliability = true;

    return nfr;
  }

  /**
   * Generate insights from analysis
   */
  function generateInsights(categories, complexity, requirements) {
    const insights = [];

    // Complexity insight
    if (complexity.level === 'very high' || complexity.level === 'high') {
      insights.push({
        type: 'complexity',
        level: 'warning',
        message: `High complexity project (${complexity.activeCategories} categories). Consider phased implementation.`
      });
    }

    // Security insight
    if (categories.security.relevance && categories.businessCentral.relevance) {
      insights.push({
        type: 'security',
        level: 'info',
        message: 'OAuth2 authentication required for Business Central integration.'
      });
    }

    // Performance insight
    if (categories.performance.relevance || categories.dataEngineering.relevance) {
      insights.push({
        type: 'performance',
        level: 'info',
        message: 'Implement batch operations and caching for optimal performance.'
      });
    }

    // Testing insight
    if (complexity.level !== 'low' && !categories.testing.relevance) {
      insights.push({
        type: 'testing',
        level: 'warning',
        message: 'Consider adding comprehensive testing for complex projects.'
      });
    }

    // AI integration insight
    if (categories.aiIntegration.relevance) {
      insights.push({
        type: 'ai',
        level: 'info',
        message: 'Claude AI integration will require API key and token management.'
      });
    }

    return insights;
  }

  /**
   * Format analysis result as readable text
   */
  function formatAnalysis(analysis) {
    const lines = [];

    lines.push('='.repeat(60));
    lines.push('REQUIREMENTS ANALYSIS');
    lines.push('='.repeat(60));
    lines.push('');

    // Project description
    lines.push(`Project: ${analysis.description.substring(0, 80)}${analysis.description.length > 80 ? '...' : ''}`);
    lines.push('');

    // Complexity
    lines.push(`Complexity: ${analysis.complexity.level.toUpperCase()} (score: ${analysis.complexity.score})`);
    lines.push(`Active Categories: ${analysis.complexity.activeCategories}`);
    lines.push('');

    // Primary categories
    lines.push('Primary Categories:');
    analysis.primaryCategories.forEach((cat, i) => {
      lines.push(`  ${i + 1}. ${cat} (${analysis.categories[cat].count} matches)`);
    });
    lines.push('');

    // Technical requirements
    if (analysis.requirements.technical.length > 0) {
      lines.push('Technical Requirements:');
      analysis.requirements.technical.forEach(req => {
        lines.push(`  - ${req.category} (priority: ${req.priority})`);
      });
      lines.push('');
    }

    // Integrations
    if (analysis.requirements.integrations.length > 0) {
      lines.push('Integrations:');
      analysis.requirements.integrations.forEach(int => {
        lines.push(`  - ${int.type} (${int.protocol})`);
      });
      lines.push('');
    }

    // Non-functional requirements
    const nfr = Object.entries(analysis.requirements.nonFunctional)
      .filter(([_, value]) => value)
      .map(([key, _]) => key);

    if (nfr.length > 0) {
      lines.push('Non-Functional Requirements:');
      nfr.forEach(req => {
        lines.push(`  - ${req}`);
      });
      lines.push('');
    }

    // Insights
    if (analysis.insights.length > 0) {
      lines.push('Insights:');
      analysis.insights.forEach(insight => {
        const icon = insight.level === 'warning' ? '⚠️' : 'ℹ️';
        lines.push(`  ${icon} [${insight.type}] ${insight.message}`);
      });
      lines.push('');
    }

    lines.push('='.repeat(60));

    return lines.join('\n');
  }

  // Public API
  return {
    analyze,
    formatAnalysis,
    PATTERNS
  };
})();

/**
 * Test function - analyze sample project
 */
function testRequirementsAnalyzer() {
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

  const analysis = RequirementsAnalyzer.analyze(sampleProject);
  const formatted = RequirementsAnalyzer.formatAnalysis(analysis);

  Logger.log(formatted);
  Logger.log('');
  Logger.log('Raw Analysis:');
  Logger.log(JSON.stringify(analysis, null, 2));

  return analysis;
}
