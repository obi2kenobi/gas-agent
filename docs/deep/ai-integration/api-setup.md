# 🤖 Claude API Setup

**Categoria**: AI Integration → API Configuration
**Righe**: ~420
**Parent**: `specialists/ai-integration-specialist.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Configurare Claude API integration da zero
- Gestire API keys con PropertiesService
- Costruire request/response structure per Messages API
- Selezionare model appropriato (Sonnet, Opus, Haiku)
- Gestire rate limiting e retry logic
- Implementare streaming responses
- Configurare headers e authentication

---

## 🔑 API Key Management

### Secure Storage con PropertiesService

**❌ NEVER hardcode API keys**:
```javascript
// ❌ BAD: Hardcoded in code (security violation!)
const API_KEY = "sk-ant-api03-...";
```

**✅ ALWAYS use PropertiesService**:
```javascript
// ✅ GOOD: Store in Script Properties
function setupClaudeAPIKey() {
  const props = PropertiesService.getScriptProperties();

  // Set API key (do this once via UI or setup script)
  const apiKey = "sk-ant-api03-..."; // Get from Anthropic console
  props.setProperty('CLAUDE_API_KEY', apiKey);

  Logger.log('Claude API key configured successfully');
}

// Retrieve API key securely
function getClaudeAPIKey() {
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('CLAUDE_API_KEY');

  if (!apiKey) {
    throw new Error('Claude API key not configured. Run setupClaudeAPIKey() first.');
  }

  return apiKey;
}
```

---

### API Key Rotation

**Best Practice**: Rotate keys periodically
```javascript
function rotateClaudeAPIKey(newApiKey) {
  const props = PropertiesService.getScriptProperties();

  // Backup old key (for rollback)
  const oldKey = props.getProperty('CLAUDE_API_KEY');
  if (oldKey) {
    props.setProperty('CLAUDE_API_KEY_BACKUP', oldKey);
    props.setProperty('CLAUDE_API_KEY_ROTATED_AT', new Date().toISOString());
  }

  // Set new key
  props.setProperty('CLAUDE_API_KEY', newApiKey);

  Logger.log('API key rotated successfully');

  // Test new key
  try {
    testClaudeAPIConnection();
    Logger.log('New API key validated');
  } catch (error) {
    // Rollback on failure
    Logger.log('New API key invalid, rolling back');
    props.setProperty('CLAUDE_API_KEY', oldKey);
    throw new Error('API key rotation failed: ' + error.message);
  }
}
```

---

## 📡 Claude Messages API Structure

### Basic Request Pattern

**Anthropic Messages API** (v1):
```javascript
function callClaudeAPI(userMessage, options = {}) {
  const {
    model = 'claude-3-5-sonnet-20241022',
    maxTokens = 4096,
    temperature = 1.0,
    systemPrompt = null
  } = options;

  // Build messages array
  const messages = [
    { role: 'user', content: userMessage }
  ];

  // Build payload
  const payload = {
    model: model,
    max_tokens: maxTokens,
    temperature: temperature,
    messages: messages
  };

  // Add system prompt if provided
  if (systemPrompt) {
    payload.system = systemPrompt;
  }

  // API endpoint
  const url = 'https://api.anthropic.com/v1/messages';

  // Headers
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': getClaudeAPIKey(),
    'anthropic-version': '2023-06-01'
  };

  // Make request
  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    headers: headers,
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (statusCode !== 200) {
    throw new Error(`Claude API error (${statusCode}): ${responseText}`);
  }

  const result = JSON.parse(responseText);
  return result;
}

// Usage
function example() {
  const response = callClaudeAPI('Explain Google Apps Script in one sentence.');
  const assistantMessage = response.content[0].text;
  Logger.log(assistantMessage);
}
```

---

### Multi-Turn Conversation

**Maintain conversation history**:
```javascript
function multiTurnConversation(conversationHistory, newUserMessage, options = {}) {
  const {
    model = 'claude-3-5-sonnet-20241022',
    maxTokens = 4096
  } = options;

  // Add new user message to history
  conversationHistory.push({
    role: 'user',
    content: newUserMessage
  });

  // Build payload
  const payload = {
    model: model,
    max_tokens: maxTokens,
    messages: conversationHistory
  };

  const url = 'https://api.anthropic.com/v1/messages';
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': getClaudeAPIKey(),
    'anthropic-version': '2023-06-01'
  };

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    headers: headers,
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const result = JSON.parse(response.getContentText());

  // Add assistant response to history
  conversationHistory.push({
    role: 'assistant',
    content: result.content
  });

  return {
    response: result,
    history: conversationHistory
  };
}

// Usage
function exampleMultiTurn() {
  let history = [];

  // Turn 1
  let result = multiTurnConversation(history, 'What is the capital of France?');
  Logger.log('Assistant:', result.response.content[0].text);
  history = result.history;

  // Turn 2 (context aware)
  result = multiTurnConversation(history, 'What is its population?');
  Logger.log('Assistant:', result.response.content[0].text);
}
```

---

## 🎛️ Model Selection

### Available Models

| Model | Use Case | Speed | Intelligence | Cost | Max Output |
|-------|----------|-------|--------------|------|------------|
| **claude-3-5-sonnet-20241022** | Best balance | Fast | Very High | Medium | 8192 tokens |
| **claude-3-opus-20240229** | Highest intelligence | Slow | Highest | Highest | 4096 tokens |
| **claude-3-haiku-20240307** | Speed & economy | Fastest | Good | Lowest | 4096 tokens |

---

### Model Selection Guide

**Use Sonnet 3.5** (recommended default):
```javascript
// ✅ Best for most use cases
const model = 'claude-3-5-sonnet-20241022';

// Use cases:
// - Complex reasoning (SQL generation, code analysis)
// - Document processing (PDF summarization)
// - Multi-step workflows
// - Production applications
```

**Use Opus**:
```javascript
// ✅ When you need absolute best quality
const model = 'claude-3-opus-20240229';

// Use cases:
// - Critical business decisions
// - Complex legal/medical analysis
// - Research-grade outputs
// - When accuracy > cost
```

**Use Haiku**:
```javascript
// ✅ For high-volume, simple tasks
const model = 'claude-3-haiku-20240307';

// Use cases:
// - Classification tasks
// - Simple Q&A
// - Data extraction (structured)
// - High-frequency operations (1000s per day)
```

---

### Dynamic Model Selection

```javascript
function selectModel(taskComplexity) {
  const MODEL_MAP = {
    'simple': 'claude-3-haiku-20240307',
    'medium': 'claude-3-5-sonnet-20241022',
    'complex': 'claude-3-opus-20240229'
  };

  return MODEL_MAP[taskComplexity] || MODEL_MAP.medium;
}

// Usage
function processTask(task) {
  const complexity = estimateComplexity(task); // 'simple', 'medium', 'complex'
  const model = selectModel(complexity);

  return callClaudeAPI(task, { model });
}
```

---

## 🔄 Response Handling

### Parse Standard Response

**Extract assistant message**:
```javascript
function parseClaudeResponse(apiResponse) {
  // Standard response structure:
  // {
  //   id: "msg_...",
  //   type: "message",
  //   role: "assistant",
  //   content: [{ type: "text", text: "..." }],
  //   model: "claude-3-5-sonnet-20241022",
  //   stop_reason: "end_turn",
  //   usage: { input_tokens: 10, output_tokens: 20 }
  // }

  if (!apiResponse.content || apiResponse.content.length === 0) {
    throw new Error('No content in Claude response');
  }

  // Extract text from first content block
  const textContent = apiResponse.content.find(block => block.type === 'text');
  if (!textContent) {
    throw new Error('No text content in response');
  }

  return {
    text: textContent.text,
    stopReason: apiResponse.stop_reason,
    usage: apiResponse.usage,
    model: apiResponse.model,
    id: apiResponse.id
  };
}

// Usage
function example() {
  const response = callClaudeAPI('Explain quantum computing in 50 words.');
  const parsed = parseClaudeResponse(response);

  Logger.log('Response:', parsed.text);
  Logger.log('Tokens used:', parsed.usage.input_tokens + parsed.usage.output_tokens);
}
```

---

### Error Response Handling

**Handle API errors gracefully**:
```javascript
function callClaudeAPISafe(userMessage, options = {}) {
  try {
    const response = callClaudeAPI(userMessage, options);
    return {
      success: true,
      data: parseClaudeResponse(response)
    };

  } catch (error) {
    // Parse error response
    let errorDetails = {
      message: error.message,
      type: 'unknown'
    };

    try {
      // Try to parse JSON error from API
      const errorMatch = error.message.match(/\{.*\}/);
      if (errorMatch) {
        const errorJson = JSON.parse(errorMatch[0]);
        errorDetails = {
          type: errorJson.error?.type || 'api_error',
          message: errorJson.error?.message || error.message
        };
      }
    } catch (parseError) {
      // Couldn't parse JSON, use original error
    }

    Logger.log(`Claude API error: ${errorDetails.type} - ${errorDetails.message}`);

    return {
      success: false,
      error: errorDetails
    };
  }
}

// Usage
function robustExample() {
  const result = callClaudeAPISafe('Generate a report.');

  if (result.success) {
    Logger.log('Success:', result.data.text);
  } else {
    Logger.log('Error:', result.error.message);
    // Handle error (show user message, retry, etc.)
  }
}
```

---

## ⏱️ Rate Limiting

### Claude API Rate Limits (as of 2024)

**Tier 1** (Free):
- 50 requests per minute (RPM)
- 40,000 tokens per minute (TPM)

**Tier 2** (Build):
- 1,000 RPM
- 80,000 TPM

**Tier 3** (Scale):
- 2,000 RPM
- 400,000 TPM

**Rate limit headers**:
```
x-ratelimit-requests-limit: 50
x-ratelimit-requests-remaining: 49
x-ratelimit-requests-reset: 2024-01-01T00:00:00Z
x-ratelimit-tokens-limit: 40000
x-ratelimit-tokens-remaining: 38500
x-ratelimit-tokens-reset: 2024-01-01T00:00:00Z
```

---

### Handle Rate Limit Errors

**Retry with exponential backoff**:
```javascript
function callClaudeAPIWithRetry(userMessage, options = {}, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return callClaudeAPI(userMessage, options);

    } catch (error) {
      lastError = error;

      // Check if rate limit error (HTTP 429)
      if (error.message.includes('429') || error.message.includes('rate_limit')) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        Logger.log(`Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        Utilities.sleep(delay);
        continue;
      }

      // Non-rate-limit error, don't retry
      throw error;
    }
  }

  throw new Error(`Failed after ${maxRetries} retries: ${lastError.message}`);
}
```

---

### Token Budget Management

**Track token usage**:
```javascript
const TokenTracker = (function() {
  const CACHE_KEY = 'claude_token_usage';
  const TPM_LIMIT = 40000; // Tier 1 limit

  function recordUsage(inputTokens, outputTokens) {
    const cache = CacheService.getScriptCache();
    const now = Date.now();

    // Get current usage
    let usage = cache.get(CACHE_KEY);
    usage = usage ? JSON.parse(usage) : { tokens: 0, resetAt: now + 60000 };

    // Reset if past minute
    if (now >= usage.resetAt) {
      usage = { tokens: 0, resetAt: now + 60000 };
    }

    // Add new tokens
    usage.tokens += inputTokens + outputTokens;

    // Cache for 60 seconds
    cache.put(CACHE_KEY, JSON.stringify(usage), 60);

    return usage;
  }

  function canMakeRequest(estimatedTokens) {
    const cache = CacheService.getScriptCache();
    const usage = JSON.parse(cache.get(CACHE_KEY) || '{"tokens": 0}');

    return (usage.tokens + estimatedTokens) <= TPM_LIMIT;
  }

  return { recordUsage, canMakeRequest };
})();

// Usage
function safeAPICall(userMessage) {
  const estimatedTokens = userMessage.length * 0.75; // Rough estimate

  if (!TokenTracker.canMakeRequest(estimatedTokens)) {
    throw new Error('Token budget exceeded. Wait 60 seconds.');
  }

  const response = callClaudeAPI(userMessage);
  TokenTracker.recordUsage(response.usage.input_tokens, response.usage.output_tokens);

  return response;
}
```

---

## 🔗 Related Files

- `security/properties-security.md` - Secure API key storage patterns
- `platform/error-handling.md` - Retry logic and exponential backoff
- `ai-integration/prompt-engineering.md` - Crafting effective prompts
- `ai-integration/token-optimization.md` - Context window management
- `ai-integration/multi-turn.md` - Conversation state management

---

**Versione**: 1.0
**Context Size**: ~420 righe
