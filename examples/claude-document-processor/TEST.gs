/**
 * TEST.gs
 *
 * Complete test suite for Claude Document Processor
 *
 * Tests:
 * - ClaudeClient API calls
 * - CacheManager multi-level caching
 * - DocumentProcessor pipeline
 * - PromptTemplates generation
 * - Integration tests
 * - Performance benchmarks
 *
 * Usage:
 * 1. Run setupTestConfig() first to configure API key
 * 2. Run runAllTests() to execute full test suite
 * 3. Or run individual test functions
 *
 * @version 1.0
 */

// Test configuration
const TEST_CONFIG = {
  apiKey: null, // Set via setupTestConfig()
  testDocument: `
    EXECUTIVE SUMMARY

    Our Q4 2024 revenue reached $5.2M, representing a 23% increase year-over-year.
    The SaaS platform now serves 1,250 active customers across 15 countries.

    KEY HIGHLIGHTS:
    - Customer retention rate: 94%
    - Monthly recurring revenue (MRR): $450K
    - New enterprise clients: 12
    - Product launches: 2 major features

    CHALLENGES:
    - Support ticket volume increased 35%
    - Need to hire 5 additional engineers
    - Server costs up 18% due to growth

    ACTION ITEMS:
    1. Finalize 2025 budget by Dec 15 (Owner: CFO)
    2. Launch mobile app beta by Jan 30 (Owner: CTO)
    3. Expand sales team by Feb 1 (Owner: VP Sales)
  `.trim()
};

/**
 * Setup test configuration
 * Run this first to set your API key
 */
function setupTestConfig() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Claude API Key',
    'Enter your Claude API key for testing:',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    const apiKey = response.getResponseText();
    ClaudeClient.setupConfig(apiKey);
    TEST_CONFIG.apiKey = apiKey;
    Logger.log('✅ Test configuration complete');
    ui.alert('Test configuration complete! You can now run tests.');
  }
}

/**
 * Run all tests
 */
function runAllTests() {
  Logger.log('\n🧪 RUNNING ALL TESTS\n===================\n');

  const startTime = Date.now();
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  // Test suite
  const tests = [
    { name: 'ClaudeClient - Basic Message', fn: testClaudeClientBasicMessage },
    { name: 'ClaudeClient - Model Selection', fn: testClaudeClientModels },
    { name: 'ClaudeClient - Error Handling', fn: testClaudeClientErrorHandling },
    { name: 'CacheManager - Set and Get', fn: testCacheManagerBasic },
    { name: 'CacheManager - Multi-Level', fn: testCacheManagerMultiLevel },
    { name: 'CacheManager - Statistics', fn: testCacheManagerStats },
    { name: 'DocumentProcessor - Simple Document', fn: testDocumentProcessorBasic },
    { name: 'DocumentProcessor - With Cache', fn: testDocumentProcessorCache },
    { name: 'PromptTemplates - Summarize', fn: testPromptTemplateSummarize },
    { name: 'PromptTemplates - Extract Data', fn: testPromptTemplateExtractData },
    { name: 'Integration - Full Pipeline', fn: testFullPipeline },
    { name: 'Performance - Cache Impact', fn: testPerformanceCacheImpact }
  ];

  // Run tests
  tests.forEach(test => {
    try {
      Logger.log(`\n▶️  ${test.name}...`);
      test.fn();
      Logger.log(`✅ PASSED: ${test.name}`);
      results.passed++;
    } catch (error) {
      Logger.log(`❌ FAILED: ${test.name}`);
      Logger.log(`   Error: ${error.message}`);
      results.failed++;
      results.errors.push({
        test: test.name,
        error: error.message
      });
    }
  });

  // Summary
  const duration = Date.now() - startTime;
  Logger.log('\n===================');
  Logger.log('TEST SUMMARY');
  Logger.log('===================');
  Logger.log(`Total Tests: ${tests.length}`);
  Logger.log(`✅ Passed: ${results.passed}`);
  Logger.log(`❌ Failed: ${results.failed}`);
  Logger.log(`Duration: ${duration}ms`);

  if (results.failed > 0) {
    Logger.log('\nFailed Tests:');
    results.errors.forEach(err => {
      Logger.log(`- ${err.test}: ${err.error}`);
    });
  }

  return results;
}

// ============================================================================
// ClaudeClient Tests
// ============================================================================

function testClaudeClientBasicMessage() {
  const response = ClaudeClient.sendMessage('Say "test successful" if you can read this.', {
    model: 'HAIKU',
    maxTokens: 50
  });

  assert(response.content, 'Response should have content');
  assert(response.content[0].text, 'Response should have text');
  assert(response.usage, 'Response should include usage stats');

  Logger.log(`   Response: ${response.content[0].text.substring(0, 50)}...`);
}

function testClaudeClientModels() {
  const models = ClaudeClient.getModels();

  assert(models.HAIKU, 'Should have HAIKU model');
  assert(models.SONNET, 'Should have SONNET model');
  assert(models.OPUS, 'Should have OPUS model');

  assert(models.HAIKU.name, 'Model should have name');
  assert(models.HAIKU.maxTokens, 'Model should have maxTokens');
  assert(models.HAIKU.contextWindow, 'Model should have contextWindow');

  Logger.log(`   Found ${Object.keys(models).length} models`);
}

function testClaudeClientErrorHandling() {
  try {
    // This should fail gracefully
    ClaudeClient.sendMessage('test', {
      model: 'INVALID_MODEL'
    });
    throw new Error('Should have thrown error for invalid model');
  } catch (error) {
    assert(error.message.includes('Invalid model'), 'Should error on invalid model');
  }

  Logger.log('   Error handling works correctly');
}

// ============================================================================
// CacheManager Tests
// ============================================================================

function testCacheManagerBasic() {
  // Clear cache first
  CacheManager.clear('ALL');
  CacheManager.resetStats();

  // Test set and get
  const testPrompt = 'test prompt ' + Date.now();
  const testResponse = {
    content: [{ text: 'test response' }],
    usage: { input_tokens: 10, output_tokens: 20 }
  };

  CacheManager.set(testPrompt, 'SONNET', testResponse);
  const cached = CacheManager.get(testPrompt, 'SONNET');

  assert(cached, 'Should retrieve cached value');
  assert(cached.content[0].text === testResponse.content[0].text, 'Cached value should match');

  Logger.log('   Basic cache operations work');
}

function testCacheManagerMultiLevel() {
  CacheManager.clear('ALL');
  CacheManager.resetStats();

  const testPrompt = 'multi-level test ' + Date.now();
  const testResponse = {
    content: [{ text: 'test' }],
    usage: { input_tokens: 5, output_tokens: 10 }
  };

  // Set in cache
  CacheManager.set(testPrompt, 'SONNET', testResponse);

  // First get - should hit L1
  CacheManager.get(testPrompt, 'SONNET');

  // Clear L1 only
  CacheManager.clear('L1');

  // Second get - should hit L2
  CacheManager.get(testPrompt, 'SONNET');

  const stats = CacheManager.getStats();
  assert(stats.l1Hits === 1, 'Should have 1 L1 hit');
  assert(stats.l2Hits === 1, 'Should have 1 L2 hit');

  Logger.log(`   L1 Hits: ${stats.l1Hits}, L2 Hits: ${stats.l2Hits}`);
}

function testCacheManagerStats() {
  const stats = CacheManager.getStats();

  assert(typeof stats.totalRequests === 'number', 'Should have totalRequests');
  assert(typeof stats.l1Hits === 'number', 'Should have l1Hits');
  assert(typeof stats.hitRate === 'string', 'Should have hitRate');
  assert(stats.costSavedFormatted, 'Should have formatted cost');

  Logger.log(`   Hit Rate: ${stats.hitRate}`);
}

// ============================================================================
// DocumentProcessor Tests
// ============================================================================

function testDocumentProcessorBasic() {
  const result = DocumentProcessor.processDocument(TEST_CONFIG.testDocument, {
    model: 'HAIKU',
    instructions: 'Summarize this document in 2 sentences.',
    useCache: false // Don't cache for this test
  });

  assert(result, 'Should return result');
  assert(result.content, 'Result should have content');
  assert(result.type === 'single', 'Should be single document type');

  Logger.log(`   Processed ${TEST_CONFIG.testDocument.length} characters`);
  Logger.log(`   Summary: ${result.content.substring(0, 100)}...`);
}

function testDocumentProcessorCache() {
  CacheManager.clear('ALL');
  CacheManager.resetStats();

  // First call - should miss cache
  DocumentProcessor.processDocument(TEST_CONFIG.testDocument, {
    model: 'HAIKU',
    instructions: 'Extract revenue number.',
    useCache: true
  });

  // Second call - should hit cache
  const result = DocumentProcessor.processDocument(TEST_CONFIG.testDocument, {
    model: 'HAIKU',
    instructions: 'Extract revenue number.',
    useCache: true
  });

  assert(result.fromCache === true, 'Second call should be from cache');

  const stats = CacheManager.getStats();
  assert(stats.totalHits > 0, 'Should have cache hits');

  Logger.log(`   Cache hit rate: ${stats.hitRate}`);
}

// ============================================================================
// PromptTemplates Tests
// ============================================================================

function testPromptTemplateSummarize() {
  const prompt = PromptTemplates.SUMMARIZE.generate({
    length: 'short',
    format: 'bullets'
  });

  assert(prompt.includes('summary'), 'Should mention summary');
  assert(prompt.includes('bullet'), 'Should mention bullets');

  Logger.log(`   Generated prompt: ${prompt.substring(0, 50)}...`);
}

function testPromptTemplateExtractData() {
  const fields = [
    { name: 'revenue', type: 'number', description: 'Total revenue' },
    { name: 'customers', type: 'number', description: 'Number of customers' }
  ];

  const prompt = PromptTemplates.EXTRACT_DATA.generate(fields, {
    format: 'json',
    strict: true
  });

  assert(prompt.includes('revenue'), 'Should include revenue field');
  assert(prompt.includes('customers'), 'Should include customers field');
  assert(prompt.includes('JSON'), 'Should mention JSON format');

  Logger.log(`   Generated extraction prompt`);
}

// ============================================================================
// Integration Tests
// ============================================================================

function testFullPipeline() {
  // Clear cache and stats
  CacheManager.clear('ALL');
  CacheManager.resetStats();

  // Use template to generate prompt
  const prompt = PromptTemplates.EXTRACT_KEY_POINTS.generate({
    maxPoints: 5,
    prioritize: true
  });

  // Process document
  const result = DocumentProcessor.processDocument(TEST_CONFIG.testDocument, {
    model: 'HAIKU',
    instructions: prompt,
    useCache: true
  });

  // Verify result
  assert(result, 'Should have result');
  assert(result.content, 'Should have content');

  // Check cache stats
  const stats = CacheManager.getStats();
  assert(stats.totalRequests > 0, 'Should have tracked requests');

  Logger.log(`   Full pipeline executed successfully`);
  Logger.log(`   Content length: ${result.content.length} chars`);
}

// ============================================================================
// Performance Tests
// ============================================================================

function testPerformanceCacheImpact() {
  CacheManager.clear('ALL');
  CacheManager.resetStats();

  const testDoc = TEST_CONFIG.testDocument;
  const instructions = 'Extract the revenue number.';

  // First call (no cache)
  const start1 = Date.now();
  DocumentProcessor.processDocument(testDoc, {
    model: 'HAIKU',
    instructions,
    useCache: true
  });
  const duration1 = Date.now() - start1;

  // Second call (with cache)
  const start2 = Date.now();
  DocumentProcessor.processDocument(testDoc, {
    model: 'HAIKU',
    instructions,
    useCache: true
  });
  const duration2 = Date.now() - start2;

  const improvement = duration1 / duration2;

  Logger.log(`   Without cache: ${duration1}ms`);
  Logger.log(`   With cache: ${duration2}ms`);
  Logger.log(`   🚀 ${improvement.toFixed(1)}x faster with cache`);

  assert(improvement > 5, 'Cache should provide at least 5x improvement');
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Simple assertion helper
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

/**
 * Run quick smoke test
 */
function runSmokeTest() {
  Logger.log('🔥 Running smoke test...\n');

  try {
    // Test 1: API connectivity
    const response = ClaudeClient.sendMessage('Reply with "OK"', {
      model: 'HAIKU',
      maxTokens: 10
    });
    Logger.log('✅ API connectivity OK');

    // Test 2: Cache working
    CacheManager.clear('ALL');
    CacheManager.resetStats();
    const testVal = { test: 'data' };
    CacheManager.set('test', 'SONNET', testVal);
    const cached = CacheManager.get('test', 'SONNET');
    assert(cached, 'Cache should work');
    Logger.log('✅ Cache system OK');

    // Test 3: Processing pipeline
    const result = DocumentProcessor.processDocument('Test document', {
      model: 'HAIKU',
      instructions: 'Say "OK"'
    });
    assert(result.content, 'Processor should work');
    Logger.log('✅ Processing pipeline OK');

    Logger.log('\n🎉 Smoke test passed! System is operational.');

  } catch (error) {
    Logger.log(`\n❌ Smoke test failed: ${error.message}`);
    throw error;
  }
}
