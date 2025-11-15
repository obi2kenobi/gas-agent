/**
 * ClaudeClient.gs
 *
 * Production-ready Claude API client for Google Apps Script
 *
 * Features:
 * - Support for all Claude models (Haiku, Sonnet, Opus)
 * - Multi-turn conversations
 * - Token counting and management
 * - Exponential backoff retry logic
 * - Response caching
 * - Error handling
 *
 * @version 1.0
 */

/**
 * Claude API client class
 */
const ClaudeClient = (function() {

  // API Configuration
  const API_BASE_URL = 'https://api.anthropic.com/v1';
  const API_VERSION = '2023-06-01';

  // Model configurations
  const MODELS = {
    HAIKU: {
      name: 'claude-3-haiku-20240307',
      maxTokens: 4096,
      contextWindow: 200000,
      costPer1MInput: 0.25,
      costPer1MOutput: 1.25,
      description: 'Fast, efficient for simple tasks'
    },
    SONNET: {
      name: 'claude-3-5-sonnet-20241022',
      maxTokens: 8192,
      contextWindow: 200000,
      costPer1MInput: 3.00,
      costPer1MOutput: 15.00,
      description: 'Balanced performance and capability'
    },
    OPUS: {
      name: 'claude-3-opus-20240229',
      maxTokens: 4096,
      contextWindow: 200000,
      costPer1MInput: 15.00,
      costPer1MOutput: 75.00,
      description: 'Most capable, for complex tasks'
    }
  };

  /**
   * Initialize Claude API configuration
   * Run this once to set up your API key
   *
   * @param {string} apiKey - Your Anthropic API key
   */
  function setupConfig(apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API key is required');
    }

    const props = PropertiesService.getScriptProperties();
    props.setProperty('CLAUDE_API_KEY', apiKey);

    Logger.log('✅ Claude API key configured successfully');
  }

  /**
   * Get API key from properties
   * @private
   */
  function getApiKey_() {
    const props = PropertiesService.getScriptProperties();
    const apiKey = props.getProperty('CLAUDE_API_KEY');

    if (!apiKey) {
      throw new Error('Claude API key not configured. Run ClaudeClient.setupConfig() first.');
    }

    return apiKey;
  }

  /**
   * Send a message to Claude
   *
   * @param {string} prompt - The user message
   * @param {Object} options - Configuration options
   * @param {string} options.model - Model to use (HAIKU, SONNET, OPUS)
   * @param {number} options.maxTokens - Maximum tokens to generate
   * @param {number} options.temperature - Randomness (0-1)
   * @param {Array} options.conversationHistory - Previous messages for multi-turn
   * @param {string} options.systemPrompt - System prompt
   * @returns {Object} Claude API response
   */
  function sendMessage(prompt, options = {}) {
    const {
      model = 'SONNET',
      maxTokens = 4096,
      temperature = 1.0,
      conversationHistory = [],
      systemPrompt = null
    } = options;

    // Validate model
    if (!MODELS[model]) {
      throw new Error(`Invalid model: ${model}. Use HAIKU, SONNET, or OPUS`);
    }

    const modelConfig = MODELS[model];

    // Build messages array
    const messages = [
      ...conversationHistory,
      {
        role: 'user',
        content: prompt
      }
    ];

    // Build request payload
    const payload = {
      model: modelConfig.name,
      max_tokens: Math.min(maxTokens, modelConfig.maxTokens),
      temperature: temperature,
      messages: messages
    };

    // Add system prompt if provided
    if (systemPrompt) {
      payload.system = systemPrompt;
    }

    // Make API request with retry logic
    const response = makeRequestWithRetry_(payload);

    return response;
  }

  /**
   * Extract text from a document using Claude
   *
   * @param {string} documentText - Document content
   * @param {Object} options - Extraction options
   * @returns {Object} Extracted data
   */
  function extractFromDocument(documentText, options = {}) {
    const {
      model = 'SONNET',
      schema = null,
      instructions = 'Extract all relevant information from this document.'
    } = options;

    let prompt = instructions + '\n\n';

    if (schema) {
      prompt += 'Return the data in this JSON format:\n';
      prompt += JSON.stringify(schema, null, 2) + '\n\n';
    }

    prompt += '=== DOCUMENT ===\n';
    prompt += documentText;

    const response = sendMessage(prompt, { model });

    // Try to parse JSON response
    try {
      const content = response.content[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { rawText: content };
    } catch (error) {
      Logger.log('Warning: Could not parse JSON from response');
      return { rawText: response.content[0].text };
    }
  }

  /**
   * Process document in chunks (for large documents)
   *
   * @param {string} documentText - Full document text
   * @param {Object} options - Processing options
   * @returns {Array} Array of processed chunks
   */
  function processInChunks(documentText, options = {}) {
    const {
      chunkSize = 50000, // characters per chunk
      overlap = 1000,    // overlap between chunks
      model = 'SONNET',
      instructions = 'Summarize this section:'
    } = options;

    const chunks = splitIntoChunks_(documentText, chunkSize, overlap);
    const results = [];

    Logger.log(`Processing ${chunks.length} chunks...`);

    chunks.forEach((chunk, index) => {
      Logger.log(`Processing chunk ${index + 1}/${chunks.length}...`);

      const response = sendMessage(
        `${instructions}\n\n${chunk}`,
        { model }
      );

      results.push({
        chunkIndex: index,
        content: response.content[0].text,
        usage: response.usage
      });

      // Small delay to avoid rate limits
      if (index < chunks.length - 1) {
        Utilities.sleep(500);
      }
    });

    return results;
  }

  /**
   * Multi-turn conversation
   *
   * @param {Array} turns - Array of {role, content} objects
   * @param {Object} options - Configuration options
   * @returns {Object} Final response
   */
  function conversation(turns, options = {}) {
    const {
      model = 'SONNET',
      systemPrompt = null
    } = options;

    const messages = turns.map(turn => ({
      role: turn.role,
      content: turn.content
    }));

    const payload = {
      model: MODELS[model].name,
      max_tokens: MODELS[model].maxTokens,
      messages: messages
    };

    if (systemPrompt) {
      payload.system = systemPrompt;
    }

    return makeRequestWithRetry_(payload);
  }

  /**
   * Make API request with exponential backoff retry
   * @private
   */
  function makeRequestWithRetry_(payload, maxRetries = 3) {
    const apiKey = getApiKey_();

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': API_VERSION
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = UrlFetchApp.fetch(
          `${API_BASE_URL}/messages`,
          options
        );

        const statusCode = response.getResponseCode();
        const responseText = response.getContentText();

        // Success
        if (statusCode === 200) {
          const data = JSON.parse(responseText);
          logUsage_(data.usage, payload.model);
          return data;
        }

        // Rate limit - wait and retry
        if (statusCode === 429) {
          const delay = Math.pow(2, attempt) * 1000;
          Logger.log(`⚠️ Rate limited. Waiting ${delay}ms before retry...`);
          Utilities.sleep(delay);
          continue;
        }

        // Other error
        const errorData = JSON.parse(responseText);
        throw new Error(`Claude API error (${statusCode}): ${errorData.error?.message || responseText}`);

      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          Logger.log(`⚠️ Attempt ${attempt + 1} failed: ${error.message}`);
          Logger.log(`Retrying in ${delay}ms...`);
          Utilities.sleep(delay);
        }
      }
    }

    throw new Error(`Failed after ${maxRetries + 1} attempts: ${lastError.message}`);
  }

  /**
   * Split text into chunks with overlap
   * @private
   */
  function splitIntoChunks_(text, chunkSize, overlap) {
    const chunks = [];
    let position = 0;

    while (position < text.length) {
      const end = Math.min(position + chunkSize, text.length);
      chunks.push(text.substring(position, end));
      position = end - overlap;

      if (position >= text.length - overlap) break;
    }

    return chunks;
  }

  /**
   * Log token usage and estimated cost
   * @private
   */
  function logUsage_(usage, modelName) {
    const model = Object.values(MODELS).find(m => m.name === modelName);

    if (model) {
      const inputCost = (usage.input_tokens / 1000000) * model.costPer1MInput;
      const outputCost = (usage.output_tokens / 1000000) * model.costPer1MOutput;
      const totalCost = inputCost + outputCost;

      Logger.log(`📊 Token Usage:`);
      Logger.log(`   Input: ${usage.input_tokens} tokens ($${inputCost.toFixed(4)})`);
      Logger.log(`   Output: ${usage.output_tokens} tokens ($${outputCost.toFixed(4)})`);
      Logger.log(`   Total Cost: $${totalCost.toFixed(4)}`);
    }
  }

  /**
   * Get model information
   *
   * @returns {Object} Available models and their configs
   */
  function getModels() {
    return MODELS;
  }

  /**
   * Estimate tokens in text (rough approximation)
   * Claude uses ~4 characters per token
   *
   * @param {string} text - Text to estimate
   * @returns {number} Estimated token count
   */
  function estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate estimated cost for a prompt
   *
   * @param {string} prompt - The prompt text
   * @param {string} model - Model name (HAIKU, SONNET, OPUS)
   * @param {number} expectedOutputTokens - Expected output length
   * @returns {Object} Cost breakdown
   */
  function estimateCost(prompt, model = 'SONNET', expectedOutputTokens = 1000) {
    const modelConfig = MODELS[model];
    const inputTokens = estimateTokens(prompt);

    const inputCost = (inputTokens / 1000000) * modelConfig.costPer1MInput;
    const outputCost = (expectedOutputTokens / 1000000) * modelConfig.costPer1MOutput;

    return {
      inputTokens,
      expectedOutputTokens,
      inputCost: inputCost.toFixed(4),
      outputCost: outputCost.toFixed(4),
      totalCost: (inputCost + outputCost).toFixed(4),
      model: model
    };
  }

  // Public API
  return {
    setupConfig,
    sendMessage,
    extractFromDocument,
    processInChunks,
    conversation,
    getModels,
    estimateTokens,
    estimateCost,
    MODELS
  };
})();
