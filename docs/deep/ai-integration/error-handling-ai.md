# 🤖 AI Error Handling

**Categoria**: AI Integration → Error Management
**Righe**: ~550
**Parent**: `specialists/ai-integration-specialist.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Gestire Claude API errors (rate limit, context exceeded, timeout)
- Implement retry logic con exponential backoff
- Validate AI outputs against schemas
- Detect hallucinations o output incorretti
- Implement graceful degradation strategies
- Log AI errors per debugging e monitoring
- Handle authentication failures

---

## 🚨 Common AI API Errors

### Rate Limit Error (429)

**Causa**: Too many requests per minute/day

**Error Response**:
```json
{
  "error": {
    "type": "rate_limit_error",
    "message": "Rate limit exceeded. Please wait before retrying."
  }
}
```

**Handling**:
```javascript
function handleRateLimitError(error, attempt = 0, maxRetries = 5) {
  const isRateLimit = error.message.includes('429') ||
                      error.message.toLowerCase().includes('rate limit');

  if (!isRateLimit) {
    throw error; // Not a rate limit error
  }

  if (attempt >= maxRetries) {
    throw new Error(`Rate limit exceeded after ${maxRetries} retries`);
  }

  // Exponential backoff with jitter
  const baseDelay = 2000; // 2 seconds
  const delay = baseDelay * Math.pow(2, attempt) * (0.8 + Math.random() * 0.4);

  Logger.log(`Rate limited. Retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`);

  Utilities.sleep(delay);

  return { shouldRetry: true, delay };
}

// Usage
function callClaudeAPIWithRateLimitHandling(prompt, options = {}) {
  const maxRetries = 5;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return callClaudeAPI(prompt, options);

    } catch (error) {
      const rateLimitInfo = handleRateLimitError(error, attempt, maxRetries);

      if (!rateLimitInfo.shouldRetry) {
        throw error;
      }
      // Loop continues after sleep
    }
  }

  throw new Error('Max retries exceeded');
}
```

---

### Context Length Exceeded Error

**Causa**: Prompt + conversation history exceeds model's context window

**Error Response**:
```json
{
  "error": {
    "type": "invalid_request_error",
    "message": "prompt is too long: ... tokens"
  }
}
```

**Handling**:
```javascript
function handleContextLengthError(prompt, conversationHistory = []) {
  // Estimate tokens
  const estimatedTokens = estimateTokens(prompt + JSON.stringify(conversationHistory));

  const CONTEXT_LIMITS = {
    'claude-3-5-sonnet-20241022': 200000,
    'claude-3-opus-20240229': 200000,
    'claude-3-haiku-20240307': 200000
  };

  const model = 'claude-3-5-sonnet-20241022';
  const limit = CONTEXT_LIMITS[model];

  if (estimatedTokens > limit * 0.8) { // 80% of limit
    Logger.log(`⚠️ Approaching context limit: ${estimatedTokens}/${limit} tokens`);

    // Strategy 1: Summarize conversation history
    if (conversationHistory.length > 10) {
      const summarizedHistory = summarizeConversationHistory(conversationHistory);
      Logger.log(`Reduced history from ${conversationHistory.length} to ${summarizedHistory.length} messages`);
      return { summarizedHistory, truncated: true };
    }

    // Strategy 2: Truncate prompt
    if (prompt.length > 100000) {
      const truncatedPrompt = prompt.substring(0, 100000) + '\n\n[Content truncated due to length...]';
      Logger.log(`Truncated prompt from ${prompt.length} to 100000 chars`);
      return { prompt: truncatedPrompt, truncated: true };
    }
  }

  return { prompt, conversationHistory, truncated: false };
}

// Usage
function callClaudeAPISafe(prompt, options = {}) {
  try {
    return callClaudeAPI(prompt, options);

  } catch (error) {
    if (error.message.includes('too long') || error.message.includes('context')) {
      // Handle context exceeded
      const adjusted = handleContextLengthError(prompt, options.conversationHistory || []);

      if (adjusted.truncated) {
        Logger.log('Retrying with truncated content...');
        return callClaudeAPI(adjusted.prompt, {
          ...options,
          conversationHistory: adjusted.summarizedHistory || options.conversationHistory
        });
      }
    }

    throw error;
  }
}
```

---

### Model Timeout Error

**Causa**: Request takes too long, API times out

**Handling**:
```javascript
function callClaudeAPIWithTimeout(prompt, options = {}, timeoutMs = 120000) {
  const startTime = Date.now();

  try {
    const response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': getClaudeAPIKey(),
        'anthropic-version': '2023-06-01'
      },
      payload: JSON.stringify({
        model: options.model || 'claude-3-5-sonnet-20241022',
        max_tokens: options.maxTokens || 4096,
        messages: [{ role: 'user', content: prompt }]
      }),
      muteHttpExceptions: true
    });

    const duration = Date.now() - startTime;

    if (duration > timeoutMs) {
      Logger.log(`⚠️ Request took ${duration}ms (threshold: ${timeoutMs}ms)`);
    }

    return JSON.parse(response.getContentText());

  } catch (error) {
    const duration = Date.now() - startTime;

    if (duration >= timeoutMs || error.message.includes('timeout')) {
      Logger.log(`❌ Request timed out after ${duration}ms`);

      // Retry with smaller max_tokens
      if (options.maxTokens && options.maxTokens > 1000) {
        Logger.log(`Retrying with reduced max_tokens: ${options.maxTokens / 2}`);

        return callClaudeAPIWithTimeout(prompt, {
          ...options,
          maxTokens: Math.floor(options.maxTokens / 2)
        }, timeoutMs);
      }
    }

    throw error;
  }
}
```

---

### Authentication Error (401)

**Causa**: Invalid or missing API key

**Troubleshooting**:
```javascript
function validateAPIKey() {
  const apiKey = getClaudeAPIKey();

  // Check if API key exists
  if (!apiKey) {
    throw new Error('Claude API key not configured. Set CLAUDE_API_KEY in Script Properties.');
  }

  // Check format
  if (!apiKey.startsWith('sk-ant-api')) {
    throw new Error('Invalid API key format. Should start with "sk-ant-api"');
  }

  // Test API key
  try {
    const testResponse = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      payload: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      }),
      muteHttpExceptions: true
    });

    const statusCode = testResponse.getResponseCode();

    if (statusCode === 401) {
      throw new Error('API key authentication failed. Check your API key in Anthropic Console.');
    }

    if (statusCode === 200) {
      Logger.log('✅ API key validated successfully');
      return true;
    }

  } catch (error) {
    if (error.message.includes('401') || error.message.includes('authentication')) {
      throw new Error('Claude API authentication failed. Please check your API key.');
    }

    throw error;
  }
}

// Run on setup
function setupClaudeAPI() {
  validateAPIKey();
  Logger.log('Claude API setup complete');
}
```

---

## 🔄 Retry Strategies

### AI-Specific Retry Logic

**Comprehensive retry with classification**:
```javascript
function callClaudeAPIWithRetry(prompt, options = {}) {
  const maxRetries = options.maxRetries || 3;
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return callClaudeAPI(prompt, options);

    } catch (error) {
      lastError = error;

      // Classify error
      const errorType = classifyAIError(error);

      Logger.log(`Attempt ${attempt + 1}/${maxRetries} failed: ${errorType}`);

      // Decide if should retry
      if (!shouldRetryAIError(errorType, attempt, maxRetries)) {
        throw error;
      }

      // Calculate backoff delay
      const delay = calculateBackoffDelay(errorType, attempt);

      Logger.log(`Retrying in ${Math.round(delay)}ms...`);
      Utilities.sleep(delay);
    }
  }

  throw new Error(`Failed after ${maxRetries} retries: ${lastError.message}`);
}

function classifyAIError(error) {
  const message = error.message.toLowerCase();

  if (message.includes('429') || message.includes('rate limit')) {
    return 'RATE_LIMIT';
  }

  if (message.includes('timeout')) {
    return 'TIMEOUT';
  }

  if (message.includes('too long') || message.includes('context')) {
    return 'CONTEXT_EXCEEDED';
  }

  if (message.includes('401') || message.includes('authentication')) {
    return 'AUTH_ERROR';
  }

  if (message.includes('500') || message.includes('502') || message.includes('503')) {
    return 'SERVER_ERROR';
  }

  return 'UNKNOWN';
}

function shouldRetryAIError(errorType, attempt, maxRetries) {
  if (attempt >= maxRetries) {
    return false;
  }

  // Don't retry auth errors (permanent)
  if (errorType === 'AUTH_ERROR') {
    return false;
  }

  // Don't retry context exceeded (needs different handling)
  if (errorType === 'CONTEXT_EXCEEDED') {
    return false;
  }

  // Retry transient errors
  const RETRIABLE = ['RATE_LIMIT', 'TIMEOUT', 'SERVER_ERROR', 'UNKNOWN'];
  return RETRIABLE.includes(errorType);
}

function calculateBackoffDelay(errorType, attempt) {
  const baseDelay = {
    'RATE_LIMIT': 5000,  // 5 seconds base for rate limits
    'TIMEOUT': 2000,     // 2 seconds for timeouts
    'SERVER_ERROR': 3000, // 3 seconds for server errors
    'UNKNOWN': 1000      // 1 second for unknown
  };

  const base = baseDelay[errorType] || 1000;

  // Exponential backoff with jitter
  const exponential = base * Math.pow(2, attempt);
  const jitter = exponential * (0.8 + Math.random() * 0.4);

  // Cap at 60 seconds
  return Math.min(jitter, 60000);
}
```

---

## ✅ Output Validation

### Schema Validation

**Validate AI output against expected schema**:
```javascript
function validateAIOutput(output, expectedSchema) {
  const errors = [];

  // Parse JSON if needed
  let data;
  try {
    data = typeof output === 'string' ? JSON.parse(output) : output;
  } catch (error) {
    errors.push('Invalid JSON format');
    return { valid: false, errors, data: null };
  }

  // Validate required fields
  if (expectedSchema.required) {
    expectedSchema.required.forEach(field => {
      if (!(field in data) || data[field] === null || data[field] === undefined) {
        errors.push(`Missing required field: ${field}`);
      }
    });
  }

  // Validate field types
  if (expectedSchema.properties) {
    Object.keys(expectedSchema.properties).forEach(field => {
      if (field in data) {
        const expected = expectedSchema.properties[field].type;
        const actual = typeof data[field];

        if (expected === 'number' && actual !== 'number') {
          errors.push(`Field "${field}" should be number, got ${actual}`);
        }

        if (expected === 'string' && actual !== 'string') {
          errors.push(`Field "${field}" should be string, got ${actual}`);
        }

        if (expected === 'array' && !Array.isArray(data[field])) {
          errors.push(`Field "${field}" should be array`);
        }
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? data : null
  };
}

// Usage
function extractInvoiceDataValidated(invoiceText) {
  const schema = {
    required: ['invoice_number', 'invoice_date', 'vendor_name', 'total'],
    properties: {
      invoice_number: { type: 'string' },
      invoice_date: { type: 'string' },
      vendor_name: { type: 'string' },
      total: { type: 'number' },
      line_items: { type: 'array' }
    }
  };

  const response = callClaudeAPI(`Extract invoice data from:\n${invoiceText}`);
  const output = response.content[0].text;

  const validation = validateAIOutput(output, schema);

  if (!validation.valid) {
    Logger.log('⚠️ AI output validation failed:', validation.errors);

    // Retry with more explicit schema in prompt
    const retryPrompt = `
Extract invoice data. Return VALID JSON matching this schema:
${JSON.stringify(schema, null, 2)}

Invoice:
${invoiceText}
`;

    const retryResponse = callClaudeAPI(retryPrompt);
    const retryOutput = retryResponse.content[0].text;

    const retryValidation = validateAIOutput(retryOutput, schema);

    if (!retryValidation.valid) {
      throw new Error(`AI output validation failed: ${retryValidation.errors.join(', ')}`);
    }

    return retryValidation.data;
  }

  return validation.data;
}
```

---

### Business Logic Validation

**Validate extracted data makes business sense**:
```javascript
function validateBusinessLogic(invoiceData) {
  const errors = [];
  const warnings = [];

  // Math validation: subtotal + tax = total
  if (invoiceData.subtotal && invoiceData.tax && invoiceData.total) {
    const calculatedTotal = invoiceData.subtotal + invoiceData.tax;
    const diff = Math.abs(calculatedTotal - invoiceData.total);

    if (diff > 0.01) {
      errors.push(`Total mismatch: subtotal(${invoiceData.subtotal}) + tax(${invoiceData.tax}) ≠ total(${invoiceData.total})`);
    }
  }

  // Date validation: due_date > invoice_date
  if (invoiceData.invoice_date && invoiceData.due_date) {
    const invoiceDate = new Date(invoiceData.invoice_date);
    const dueDate = new Date(invoiceData.due_date);

    if (dueDate < invoiceDate) {
      errors.push('Due date cannot be before invoice date');
    }
  }

  // Amount validation: reasonable ranges
  if (invoiceData.total < 0) {
    errors.push('Total cannot be negative');
  }

  if (invoiceData.total > 1000000) {
    warnings.push('Total is unusually high (>$1M). Please verify.');
  }

  // Line items validation
  if (invoiceData.line_items && invoiceData.line_items.length > 0) {
    invoiceData.line_items.forEach((item, index) => {
      if (item.quantity <= 0) {
        errors.push(`Line item ${index + 1}: quantity must be positive`);
      }

      if (item.unit_price < 0) {
        errors.push(`Line item ${index + 1}: unit price cannot be negative`);
      }

      // Verify calculated total
      const calculatedItemTotal = item.quantity * item.unit_price;
      if (Math.abs(calculatedItemTotal - item.total) > 0.01) {
        errors.push(`Line item ${index + 1}: total mismatch`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// Usage
function extractAndValidateInvoice(invoiceText) {
  const extracted = extractInvoiceDataValidated(invoiceText);

  const businessValidation = validateBusinessLogic(extracted);

  if (!businessValidation.valid) {
    Logger.log('❌ Business logic validation failed:', businessValidation.errors);

    // Flag for manual review
    return {
      success: false,
      data: extracted,
      errors: businessValidation.errors,
      requiresReview: true
    };
  }

  if (businessValidation.warnings.length > 0) {
    Logger.log('⚠️ Warnings:', businessValidation.warnings);
  }

  return {
    success: true,
    data: extracted,
    warnings: businessValidation.warnings
  };
}
```

---

## 🛡️ Graceful Degradation

### Fallback Strategies

**Multiple levels of fallback**:
```javascript
function extractInvoiceDataWithFallback(invoiceText) {
  // Strategy 1: Try AI extraction
  try {
    const aiResult = extractInvoiceDataValidated(invoiceText);
    Logger.log('✅ AI extraction successful');
    return { method: 'AI', data: aiResult };

  } catch (aiError) {
    Logger.log('⚠️ AI extraction failed, trying fallbacks...');

    // Strategy 2: Try cached result (if same invoice processed before)
    const cacheKey = `invoice:${Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, invoiceText)}`;
    const cached = CacheService.getScriptCache().get(cacheKey);

    if (cached) {
      Logger.log('✅ Using cached extraction');
      return { method: 'CACHED', data: JSON.parse(cached) };
    }

    // Strategy 3: Try regex-based extraction (basic fields only)
    try {
      const regexResult = extractInvoiceDataRegex(invoiceText);
      Logger.log('✅ Regex extraction successful (partial data)');
      return { method: 'REGEX', data: regexResult, partial: true };

    } catch (regexError) {
      // Strategy 4: Return empty template for manual entry
      Logger.log('❌ All extraction methods failed. Returning template.');

      return {
        method: 'MANUAL',
        data: {
          invoice_number: null,
          invoice_date: null,
          vendor_name: null,
          total: null,
          requiresManualEntry: true
        },
        error: aiError.message
      };
    }
  }
}

function extractInvoiceDataRegex(invoiceText) {
  // Basic regex extraction (fallback only)
  const patterns = {
    invoice_number: /invoice\s*#?\s*:?\s*([A-Z0-9-]+)/i,
    invoice_date: /date\s*:?\s*(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/i,
    total: /total\s*:?\s*\$?(\d+\.\d{2})/i
  };

  const extracted = {};

  Object.keys(patterns).forEach(field => {
    const match = invoiceText.match(patterns[field]);
    extracted[field] = match ? match[1] : null;
  });

  // Convert total to number
  if (extracted.total) {
    extracted.total = parseFloat(extracted.total);
  }

  return extracted;
}
```

---

## 📊 Error Logging for AI

**Comprehensive AI error logging**:
```javascript
function logAIError(error, context = {}) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    errorType: classifyAIError(error),
    errorMessage: error.message,
    prompt: context.prompt ? context.prompt.substring(0, 500) + '...' : null, // Sanitized
    model: context.model || 'claude-3-5-sonnet-20241022',
    attemptNumber: context.attemptNumber || 1,
    maxRetries: context.maxRetries || 3,
    userId: Session.getActiveUser().getEmail(),
    operation: context.operation || 'unknown'
  };

  // Log to sheet
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AIErrors');

  if (!sheet) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const newSheet = ss.insertSheet('AIErrors');
    newSheet.appendRow(['Timestamp', 'Error Type', 'Message', 'Model', 'Operation', 'Attempt', 'User']);
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AIErrors');
  sheet.appendRow([
    errorLog.timestamp,
    errorLog.errorType,
    errorLog.errorMessage,
    errorLog.model,
    errorLog.operation,
    errorLog.attemptNumber,
    errorLog.userId
  ]);

  // Also log to Logger for immediate debugging
  Logger.log(`AI Error [${errorLog.errorType}]: ${errorLog.errorMessage}`);

  return errorLog;
}

// Usage in retry logic
function callClaudeAPIWithLogging(prompt, options = {}) {
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return callClaudeAPI(prompt, options);

    } catch (error) {
      logAIError(error, {
        prompt,
        model: options.model,
        attemptNumber: attempt + 1,
        maxRetries,
        operation: options.operation
      });

      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Retry logic...
    }
  }
}
```

---

## ✅ AI Error Handling Best Practices

### Checklist

- [x] **Implement retry with exponential backoff** - For rate limits, timeouts, server errors
- [x] **Validate all AI outputs** - Schema + business logic validation
- [x] **Handle rate limits gracefully** - Respect API limits, use exponential backoff
- [x] **Log errors with context** - Include prompt (sanitized), model, operation
- [x] **Have fallback strategies** - Cached → Regex → Manual template
- [x] **Monitor error rates** - Track by error type, set up alerts
- [x] **Alert on unusual patterns** - Spike in errors, consistent failures
- [x] **Manual review for critical failures** - Human-in-the-loop for important operations
- [x] **Validate API key on setup** - Test authentication before production
- [x] **Handle context exceeded** - Summarize history or truncate prompt

---

## 🔗 Related Files

- `platform/error-handling.md` - General error handling patterns
- `ai-integration/context-management.md` - Managing context length
- `platform/logging.md` - Structured error logging
- `ai-integration/token-optimization.md` - Reducing token usage to avoid limits

---

**Versione**: 1.0
**Context Size**: ~550 righe
