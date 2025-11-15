# 🤖 Token Optimization

**Categoria**: AI Integration → Cost Optimization
**Righe**: ~650
**Parent**: `specialists/ai-integration-specialist.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Ridurre API costs significativamente
- Ottimizzare token usage senza perdere quality
- Implementare aggressive response caching
- Comprimere prompts mantenendo clarity
- Tracciare token usage per budget monitoring
- Selezionare model appropriato per cost/quality tradeoff
- Batch multiple requests per ridurre overhead

---

## 🔢 Token Counting

### Estimation Formula

**Quick estimation** (no external library needed):
```javascript
function estimateTokens(text) {
  // Rough approximation: 1 token ≈ 4 characters (English)
  // For other languages this may vary
  const CHARS_PER_TOKEN = 4;

  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

// Usage
function estimateAPIRequestCost(prompt, expectedResponse = 1000) {
  const inputTokens = estimateTokens(prompt);
  const outputTokens = expectedResponse; // Estimate

  Logger.log(`Estimated tokens: ${inputTokens} input + ${outputTokens} output = ${inputTokens + outputTokens} total`);

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens
  };
}
```

---

### Accurate Token Counting from API Response

**Use actual usage from API**:
```javascript
function callClaudeAPIWithUsageTracking(prompt, options = {}) {
  const response = callClaudeAPI(prompt, options);

  // Extract usage from response
  const usage = response.usage;
  Logger.log(`Actual tokens: ${usage.input_tokens} input + ${usage.output_tokens} output`);

  // Log for cost tracking
  logTokenUsage({
    timestamp: new Date().toISOString(),
    operation: options.operation || 'unknown',
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    model: options.model || 'claude-3-5-sonnet-20241022'
  });

  return {
    response,
    usage
  };
}

function logTokenUsage(usageData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TokenUsage');

  if (!sheet) {
    // Create sheet if doesn't exist
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const newSheet = ss.insertSheet('TokenUsage');
    newSheet.appendRow(['Timestamp', 'Operation', 'Input Tokens', 'Output Tokens', 'Total', 'Model']);
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TokenUsage');
  sheet.appendRow([
    usageData.timestamp,
    usageData.operation,
    usageData.inputTokens,
    usageData.outputTokens,
    usageData.inputTokens + usageData.outputTokens,
    usageData.model
  ]);
}
```

---

## 💾 Response Caching

### Cache Strategy for AI Responses

**Aggressive caching pattern**:
```javascript
const AIResponseCache = (function() {

  function getCacheKey(prompt, model) {
    // Create deterministic cache key from prompt + model
    const combined = prompt + '|' + model;
    const hash = Utilities.computeDigest(
      Utilities.DigestAlgorithm.MD5,
      combined,
      Utilities.Charset.UTF_8
    );

    // Convert byte array to hex string
    return 'ai:' + hash.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
  }

  function get(prompt, model) {
    const key = getCacheKey(prompt, model);
    const cache = CacheService.getScriptCache();

    const cached = cache.get(key);
    if (cached) {
      Logger.log('✅ Cache HIT - saved API call');
      return JSON.parse(cached);
    }

    Logger.log('❌ Cache MISS - calling API');
    return null;
  }

  function put(prompt, model, response, ttl = 21600) {
    // Default TTL: 6 hours (max for CacheService)
    const key = getCacheKey(prompt, model);
    const cache = CacheService.getScriptCache();

    cache.put(key, JSON.stringify(response), ttl);
    Logger.log(`Cached response (TTL: ${ttl}s)`);
  }

  return { get, put };

})();

// Usage with caching
function callClaudeAPICached(prompt, options = {}) {
  const model = options.model || 'claude-3-5-sonnet-20241022';

  // Check cache first
  const cached = AIResponseCache.get(prompt, model);
  if (cached) {
    return cached;
  }

  // Cache miss - call API
  const response = callClaudeAPI(prompt, options);

  // Cache the response
  const cacheTTL = options.cacheTTL || 21600; // 6 hours default
  AIResponseCache.put(prompt, model, response, cacheTTL);

  return response;
}
```

---

### Cache Key Design Patterns

**Different caching strategies**:
```javascript
// 1. Exact match caching (strict)
function exactMatchCacheKey(prompt) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, prompt);
}

// 2. Parameterized caching (flexible)
function parameterizedCacheKey(template, params) {
  // Cache by template, not filled values
  // Useful when only data changes but structure stays same

  const templateHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5,
    template
  );

  return 'ai:template:' + templateHash;
}

// 3. Semantic caching (advanced)
function semanticCacheKey(prompt, operation) {
  // Cache by operation type + key entities
  // E.g., "extract_invoice:INV-123" instead of full prompt

  return `ai:${operation}:${extractKeyEntity(prompt)}`;
}

// Usage example
function extractInvoiceDataCached(invoiceId, invoiceText) {
  // Use operation + ID as cache key (not full text!)
  const cacheKey = `ai:extract_invoice:${invoiceId}`;
  const cache = CacheService.getScriptCache();

  const cached = cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Process with AI
  const result = extractInvoiceData(invoiceText);

  // Cache by invoice ID (reusable across sessions)
  cache.put(cacheKey, JSON.stringify(result), 21600);

  return result;
}
```

---

## 🗜️ Prompt Compression

### Removing Redundancy

**Before compression** (verbose):
```javascript
const verbosePrompt = `
I would like you to please extract the following information from this invoice document.
Please make sure to extract all of the following fields if they are present in the document:
- The invoice number
- The date when the invoice was issued
- The name of the vendor
- The total amount

Here is the invoice text:
${invoiceText}

Please return the extracted information in JSON format with the following structure:
{
  "invoice_number": "the invoice number here",
  "invoice_date": "the date here",
  "vendor_name": "the vendor name here",
  "total": "the total amount here"
}
`;

// Estimated: ~150 tokens
```

**After compression** (concise):
```javascript
const compressedPrompt = `
<task>Extract invoice data</task>

<fields>
- invoice_number
- invoice_date
- vendor_name
- total
</fields>

<invoice>${invoiceText}</invoice>

<output>JSON</output>
`;

// Estimated: ~40 tokens + invoice text
// Savings: ~110 tokens (73% reduction in overhead)
```

---

### Efficient Formatting Techniques

**1. Use abbreviations where clear**:
```javascript
// ❌ VERBOSE (50 tokens overhead)
const verbose = `
Please analyze this Business Central sales order and extract all relevant information including
the order number, customer information, line items with quantities and prices, and calculate the total.
`;

// ✅ CONCISE (15 tokens overhead)
const concise = `
<task>Extract BC sales order: ID, customer, line items (qty, price), total</task>
`;
```

---

**2. Remove filler words**:
```javascript
// ❌ FILLER WORDS
"I would like you to please analyze this document and then return the results in JSON format if possible."

// ✅ DIRECT
"Analyze document. Return JSON."
```

---

**3. Use structured formats**:
```javascript
// ❌ PLAIN TEXT (harder to parse, more tokens)
const unstructured = `
The task is to extract invoice data.
The required fields are invoice number, date, vendor, total.
The invoice text is: ${text}
Please return JSON output.
`;

// ✅ XML STRUCTURE (clearer, fewer tokens)
const structured = `
<task>Extract invoice</task>
<fields>number, date, vendor, total</fields>
<input>${text}</input>
<output>JSON</output>
`;
```

---

### Compression Function

**Automatic prompt compression**:
```javascript
function compressPrompt(prompt) {
  return prompt
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove filler words
    .replace(/\b(please|kindly|I would like|if possible)\b/gi, '')
    // Trim
    .trim();
}

// Usage
function optimizedAPICall(originalPrompt) {
  const compressed = compressPrompt(originalPrompt);

  Logger.log(`Original: ${estimateTokens(originalPrompt)} tokens`);
  Logger.log(`Compressed: ${estimateTokens(compressed)} tokens`);
  Logger.log(`Savings: ${estimateTokens(originalPrompt) - estimateTokens(compressed)} tokens`);

  return callClaudeAPI(compressed);
}
```

---

## 💰 Model Selection for Cost Optimization

### Cost Comparison (2024 Pricing)

**Per 1M tokens** (approximate):

| Model | Input Cost | Output Cost | Use Case |
|-------|-----------|-------------|----------|
| **Haiku** | $0.25 | $1.25 | Simple tasks, high volume |
| **Sonnet 3.5** | $3.00 | $15.00 | Balanced quality/cost |
| **Opus** | $15.00 | $75.00 | Complex reasoning |

---

### Dynamic Model Selection

**Cost-aware model selection**:
```javascript
function selectCostOptimalModel(task, budget) {
  const estimatedComplexity = analyzeTaskComplexity(task);

  // Budget constraints
  const COST_PER_TOKEN = {
    'haiku': 0.000000625,      // $0.25 input + $1.25 output / 1M / 2
    'sonnet': 0.000009,        // $3 input + $15 output / 1M / 2
    'opus': 0.000045           // $15 input + $75 output / 1M / 2
  };

  // Task complexity threshold
  if (estimatedComplexity < 0.3) {
    return 'claude-3-haiku-20240307';
  } else if (estimatedComplexity < 0.7) {
    return 'claude-3-5-sonnet-20241022';
  } else {
    return 'claude-3-opus-20240229';
  }
}

function analyzeTaskComplexity(task) {
  // Heuristics for complexity
  let complexity = 0;

  // Keywords indicating complexity
  const complexKeywords = ['analyze', 'compare', 'evaluate', 'reason', 'complex'];
  const simpleKeywords = ['extract', 'classify', 'summarize', 'list'];

  complexKeywords.forEach(keyword => {
    if (task.toLowerCase().includes(keyword)) complexity += 0.3;
  });

  simpleKeywords.forEach(keyword => {
    if (task.toLowerCase().includes(keyword)) complexity -= 0.2;
  });

  return Math.max(0, Math.min(1, complexity + 0.5)); // Normalize to 0-1
}

// Usage
function processWithBudget(task, input) {
  const model = selectCostOptimalModel(task, { maxCostPerRequest: 0.01 });

  Logger.log(`Selected model: ${model} for task complexity`);

  return callClaudeAPI(input, { model });
}
```

---

### When to Use Each Model

**Haiku** (cheapest, 10x cheaper than Opus):
```javascript
// Use cases:
// - Simple classification (invoice vs receipt)
// - Basic data extraction (name, date, amount)
// - Sentiment analysis
// - Simple Q&A
// - High-volume operations (1000s per day)

function classifyDocumentCheap(documentText) {
  return callClaudeAPI(`Classify: invoice, receipt, or contract?\n${documentText}`, {
    model: 'claude-3-haiku-20240307',
    maxTokens: 10 // Just need one word
  });
}
```

**Sonnet 3.5** (recommended default):
```javascript
// Use cases:
// - Complex data extraction (multi-field invoices)
// - Code generation
// - Document analysis
// - Multi-step reasoning
// - Production applications

function extractInvoiceDataBalanced(invoiceText) {
  return callClaudeAPI(complexExtractionPrompt(invoiceText), {
    model: 'claude-3-5-sonnet-20241022' // Best balance
  });
}
```

**Opus** (most expensive, highest quality):
```javascript
// Use cases:
// - Critical business decisions
// - Legal contract analysis
// - Complex financial modeling
// - Research-grade analysis
// - When accuracy > cost

function analyzeCriticalContract(contractText) {
  return callClaudeAPI(contractAnalysisPrompt(contractText), {
    model: 'claude-3-opus-20240229' // Highest quality
  });
}
```

---

## 🔄 Batch Processing

### Combine Multiple Requests

**Problem**: Making 100 separate API calls
```javascript
// ❌ BAD: 100 API calls, 100x overhead
orders.forEach(order => {
  const analysis = callClaudeAPI(`Analyze order ${order.id}`);
  saveAnalysis(order.id, analysis);
});

// Total cost: 100 calls × (prompt tokens + response tokens)
```

**Solution**: Batch into single call
```javascript
// ✅ GOOD: 1 API call with all orders
function batchAnalyzeOrders(orders) {
  const batchPrompt = `
<task>Analyze these orders and return JSON array</task>

<orders>
${orders.map(order => `<order id="${order.id}">${JSON.stringify(order)}</order>`).join('\n')}
</orders>

<output_format>
[
  {"order_id": "001", "analysis": "..."},
  {"order_id": "002", "analysis": "..."}
]
</output_format>
`;

  const response = callClaudeAPI(batchPrompt, { maxTokens: 8192 });
  const results = JSON.parse(response.content[0].text);

  // Save individually
  results.forEach(result => {
    saveAnalysis(result.order_id, result.analysis);
  });

  return results;
}

// Total cost: 1 call × (batched tokens)
// Savings: ~70-80% due to prompt reuse
```

---

### Batch Processing Pattern

```javascript
function batchProcess(items, processFn, batchSize = 10) {
  const results = [];

  // Split into chunks
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    // Create batch prompt
    const batchPrompt = `
<task>Process these ${batch.length} items</task>

<items>
${batch.map((item, idx) => `<item_${idx}>${JSON.stringify(item)}</item_${idx}>`).join('\n')}
</items>

<output_format>JSON array of results, same order as input</output_format>
`;

    const response = callClaudeAPI(batchPrompt);
    const batchResults = JSON.parse(response.content[0].text);

    results.push(...batchResults);

    // Rate limiting delay between batches
    if (i + batchSize < items.length) {
      Utilities.sleep(1000);
    }
  }

  return results;
}

// Usage: Process 100 invoices in batches of 10
const invoices = getInvoices(); // 100 invoices
const results = batchProcess(invoices, extractInvoiceData, 10);
// Result: 10 API calls instead of 100 (90% savings)
```

---

## 📊 Cost Tracking & Reporting

### Track API Costs

```javascript
const CostTracker = (function() {

  const PRICING = {
    'claude-3-haiku-20240307': { input: 0.25 / 1000000, output: 1.25 / 1000000 },
    'claude-3-5-sonnet-20241022': { input: 3.00 / 1000000, output: 15.00 / 1000000 },
    'claude-3-opus-20240229': { input: 15.00 / 1000000, output: 75.00 / 1000000 }
  };

  function calculateCost(usage, model) {
    const pricing = PRICING[model];
    if (!pricing) {
      Logger.log(`Unknown model: ${model}`);
      return 0;
    }

    const inputCost = usage.input_tokens * pricing.input;
    const outputCost = usage.output_tokens * pricing.output;

    return inputCost + outputCost;
  }

  function logCost(operation, usage, model) {
    const cost = calculateCost(usage, model);

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('APICosts');
    sheet.appendRow([
      new Date().toISOString(),
      operation,
      model,
      usage.input_tokens,
      usage.output_tokens,
      usage.input_tokens + usage.output_tokens,
      cost.toFixed(6)
    ]);

    Logger.log(`Cost: $${cost.toFixed(6)} (${usage.input_tokens}+${usage.output_tokens} tokens)`);
  }

  function getDailyCosts(date = new Date()) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('APICosts');
    const data = sheet.getDataRange().getValues();

    const targetDate = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');

    let totalCost = 0;
    let totalTokens = 0;

    data.slice(1).forEach(row => {
      const timestamp = row[0];
      const rowDate = Utilities.formatDate(new Date(timestamp), Session.getScriptTimeZone(), 'yyyy-MM-dd');

      if (rowDate === targetDate) {
        totalCost += parseFloat(row[6]);
        totalTokens += parseInt(row[5]);
      }
    });

    return { date: targetDate, totalCost, totalTokens };
  }

  function sendCostAlert(threshold = 10.00) {
    const today = getDailyCosts();

    if (today.totalCost > threshold) {
      MailApp.sendEmail({
        to: Session.getActiveUser().getEmail(),
        subject: `⚠️ AI API Cost Alert: $${today.totalCost.toFixed(2)}`,
        body: `
Daily AI API costs have exceeded threshold.

Date: ${today.date}
Total Cost: $${today.totalCost.toFixed(2)}
Total Tokens: ${today.totalTokens.toLocaleString()}
Threshold: $${threshold.toFixed(2)}

Review usage at: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}
        `
      });
    }
  }

  return {
    calculateCost,
    logCost,
    getDailyCosts,
    sendCostAlert
  };

})();

// Usage
function callClaudeAPIWithCostTracking(prompt, options = {}) {
  const response = callClaudeAPI(prompt, options);

  // Log cost
  CostTracker.logCost(
    options.operation || 'unknown',
    response.usage,
    options.model || 'claude-3-5-sonnet-20241022'
  );

  return response;
}

// Set up daily cost alert (via time-based trigger)
function dailyCostCheck() {
  CostTracker.sendCostAlert(10.00); // Alert if >$10/day
}
```

---

## ✅ Token Optimization Best Practices

### Checklist

- [x] **Cache aggressively** - Same prompt = cached response (6 hours TTL)
- [x] **Use cheaper models** - Haiku for simple tasks (10x cheaper)
- [x] **Compress prompts** - Remove filler words, use abbreviations
- [x] **Batch requests** - Combine 10-100 items into single call
- [x] **Track token usage** - Log every API call to spreadsheet
- [x] **Set budget alerts** - Email when daily cost > threshold
- [x] **Review high-cost operations** - Identify optimization opportunities
- [x] **Optimize iteratively** - A/B test prompt variations
- [x] **Use semantic caching** - Cache by entity ID, not full prompt
- [x] **Monitor cache hit rate** - Target >70% hit rate

---

### Cost Optimization Workflow

```
1. ANALYZE: Track current costs (what operations cost most?)
2. OPTIMIZE PROMPTS: Compress, remove redundancy
3. SELECT MODEL: Use Haiku where possible
4. BATCH: Combine similar requests
5. CACHE: Implement aggressive caching
6. MONITOR: Set up alerts for cost spikes
7. ITERATE: Continuously review and optimize
```

---

## 🔗 Related Files

- `platform/caching.md` - Response caching strategies
- `ai-integration/prompt-engineering.md` - Efficient prompt design
- `ai-integration/context-management.md` - Context window optimization
- `platform/monitoring.md` - Cost monitoring and alerting

---

**Versione**: 1.0
**Context Size**: ~650 righe
