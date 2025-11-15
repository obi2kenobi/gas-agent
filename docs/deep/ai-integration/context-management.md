# 🤖 Context Management

**Categoria**: AI Integration → Context Window Optimization
**Righe**: ~500
**Parent**: `specialists/ai-integration-specialist.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Gestire large context windows (approaching 200K tokens)
- Implementare intelligent context summarization
- Gestire multi-turn conversation history
- Ottimizzare context usage per ridurre costs
- Handle context length exceeded errors
- Chunk large documents per processing
- Preserve key information while pruning context

---

## 📏 Context Window Limits

### Claude Models (as of 2024)

**Context limits**:

| Model | Context Window | Recommended Usage |
|-------|----------------|-------------------|
| **Claude 3.5 Sonnet** | 200,000 tokens | ~150,000 words |
| **Claude 3 Opus** | 200,000 tokens | ~150,000 words |
| **Claude 3 Haiku** | 200,000 tokens | ~150,000 words |

**Note**: ~200K tokens = ~600 pages of text

---

### Token Estimation

**Quick estimation formula**:
```javascript
function estimateTokens(text) {
  // Rough approximation: 1 token ≈ 4 characters (English)
  // This varies by language and content type
  const CHARS_PER_TOKEN = 4;

  const estimated = Math.ceil(text.length / CHARS_PER_TOKEN);

  return estimated;
}

// More accurate: count words
function estimateTokensFromWords(text) {
  // English: ~0.75 tokens per word on average
  const words = text.split(/\s+/).length;
  return Math.ceil(words * 0.75);
}

// Usage
function checkContextSize(prompt, conversationHistory = []) {
  const promptTokens = estimateTokens(prompt);
  const historyText = conversationHistory.map(msg => msg.content).join(' ');
  const historyTokens = estimateTokens(historyText);

  const totalTokens = promptTokens + historyTokens;
  const CONTEXT_LIMIT = 200000;

  Logger.log(`Context usage: ${totalTokens.toLocaleString()}/${CONTEXT_LIMIT.toLocaleString()} tokens (${(totalTokens/CONTEXT_LIMIT*100).toFixed(1)}%)`);

  return {
    promptTokens,
    historyTokens,
    totalTokens,
    percentUsed: totalTokens / CONTEXT_LIMIT,
    approaching Limit: totalTokens > CONTEXT_LIMIT * 0.8 // 80% threshold
  };
}
```

---

## 🔍 Intelligent Summarization

### When to Summarize Context

**Triggers for summarization**:
- ✅ Conversation > 20 turns (40+ messages)
- ✅ Context > 80% of limit (160K tokens)
- ✅ Adding new large document would exceed limit
- ✅ Performance degradation (API slowness)

---

### Summarization Strategy

**Comprehensive summarization pattern**:
```javascript
function summarizeConversationHistory(messages, options = {}) {
  const {
    keepRecentTurns = 5,  // Keep last 5 turns (10 messages) intact
    maxSummaryLength = 500 // Max 500 words for summary
  } = options;

  if (messages.length <= keepRecentTurns * 2) {
    // Too short to summarize
    return messages;
  }

  // Split: older messages to summarize, recent to keep
  const recentMessages = messages.slice(-keepRecentTurns * 2);
  const olderMessages = messages.slice(0, -keepRecentTurns * 2);

  // Create summarization prompt
  const conversationText = olderMessages.map(msg =>
    `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
  ).join('\n\n');

  const summaryPrompt = `
<task>
Summarize this conversation history concisely while preserving all key information.
</task>

<conversation>
${conversationText}
</conversation>

<requirements>
- Max ${maxSummaryLength} words
- Preserve key facts, decisions, and context
- Focus on information needed for future turns
- Use bullet points for clarity
</requirements>

<output>
Plain text summary only (no JSON).
</output>
`;

  // Get summary from Claude
  const summaryResponse = callClaudeAPI(summaryPrompt, { maxTokens: 1000 });
  const summary = summaryResponse.content[0].text;

  Logger.log(`Summarized ${olderMessages.length} messages into ${estimateTokens(summary)} tokens`);

  // Return: summary as system message + recent messages
  return [
    {
      role: 'user',
      content: `[Previous conversation summary]\n\n${summary}\n\n[End of summary]`
    },
    ...recentMessages
  ];
}

// Usage
function sendMessageWithSummarization(sessionId, userMessage) {
  const session = ConversationState.getSession(sessionId);

  // Check if summarization needed
  const contextCheck = checkContextSize(userMessage, session.messages);

  let history = session.messages;

  if (contextCheck.approachingLimit) {
    Logger.log('⚠️ Context approaching limit. Summarizing older messages...');
    history = summarizeConversationHistory(session.messages);
  }

  // Add new message
  history.push({ role: 'user', content: userMessage });

  // Call Claude with managed history
  const response = callClaudeAPIWithHistory(userMessage, history.slice(0, -1));

  // Save to full history (not summarized - for audit)
  addUserMessage(sessionId, userMessage);
  addAssistantMessage(sessionId, response.content[0].text);

  return response.content[0].text;
}
```

---

### Selective Summarization

**Preserve important information, summarize rest**:
```javascript
function selectiveSummarization(messages) {
  // Identify important messages to preserve
  const importantPatterns = [
    /order.*created/i,
    /transaction.*completed/i,
    /error.*occurred/i,
    /decision.*made/i
  ];

  const preserved = [];
  const toSummarize = [];

  messages.forEach(msg => {
    const isImportant = importantPatterns.some(pattern =>
      pattern.test(msg.content)
    );

    if (isImportant) {
      preserved.push(msg);
    } else {
      toSummarize.push(msg);
    }
  });

  // Summarize non-critical messages
  let summary = '';
  if (toSummarize.length > 0) {
    const summaryPrompt = `Briefly summarize these messages in 2-3 sentences:\n${
      toSummarize.map(m => m.content).join('\n')
    }`;

    const response = callClaudeAPI(summaryPrompt, { maxTokens: 200 });
    summary = response.content[0].text;
  }

  // Combine: summary + preserved important messages
  return [
    { role: 'user', content: `[Summary of earlier messages: ${summary}]` },
    ...preserved
  ];
}
```

---

## ✂️ Context Pruning Strategies

### Priority-Based Pruning

**What to keep vs drop**:

**Priority 1 (Always keep)**:
- Current user message
- Last 3-5 turns of conversation
- Critical business data (order IDs, customer names)
- System instructions

**Priority 2 (Summarize)**:
- Older conversation turns (>10 turns ago)
- Background context
- Explanatory text

**Priority 3 (Drop if needed)**:
- Redundant information
- Examples
- Verbose explanations
- Formatting/boilerplate

---

### Pruning Implementation

```javascript
function pruneContext(messages, targetReduction = 0.5) {
  // Goal: Reduce context by targetReduction (50% default)

  const originalTokens = estimateTokens(JSON.stringify(messages));
  const targetTokens = originalTokens * (1 - targetReduction);

  Logger.log(`Pruning context from ${originalTokens} to ~${targetTokens} tokens`);

  // Strategy 1: Remove old messages beyond window
  let pruned = messages.slice(-20); // Keep last 20 messages (10 turns)

  // Check if enough reduction
  let prunedTokens = estimateTokens(JSON.stringify(pruned));

  if (prunedTokens <= targetTokens) {
    Logger.log(`✅ Pruning successful: ${prunedTokens} tokens`);
    return pruned;
  }

  // Strategy 2: Compress message content
  pruned = pruned.map(msg => ({
    role: msg.role,
    content: compressMessageContent(msg.content)
  }));

  prunedTokens = estimateTokens(JSON.stringify(pruned));

  Logger.log(`✅ After compression: ${prunedTokens} tokens`);

  return pruned;
}

function compressMessageContent(content) {
  // Remove extra whitespace
  let compressed = content.replace(/\s+/g, ' ').trim();

  // Truncate if still too long
  const MAX_MESSAGE_LENGTH = 2000; // chars
  if (compressed.length > MAX_MESSAGE_LENGTH) {
    compressed = compressed.substring(0, MAX_MESSAGE_LENGTH) + '...[truncated]';
  }

  return compressed;
}
```

---

## 📝 Message History Management

### Sliding Window Approach

**Keep only last N turns**:
```javascript
function manageSlidingWindow(messages, windowSize = 10) {
  // windowSize = number of turns (each turn = user + assistant)
  const maxMessages = windowSize * 2;

  if (messages.length <= maxMessages) {
    return messages;
  }

  // Keep most recent messages
  const recentMessages = messages.slice(-maxMessages);

  Logger.log(`Sliding window: kept ${recentMessages.length}/${messages.length} messages`);

  return recentMessages;
}
```

---

### Hybrid Approach: Summary + Window

**Best of both worlds**:
```javascript
function hybridHistoryManagement(messages, windowSize = 10) {
  const maxMessages = windowSize * 2;

  if (messages.length <= maxMessages) {
    return messages;
  }

  // Split: old (to summarize) + recent (to keep)
  const oldMessages = messages.slice(0, -maxMessages);
  const recentMessages = messages.slice(-maxMessages);

  // Summarize old
  const summary = summarizeMessages(oldMessages);

  // Return: summary + recent window
  return [
    { role: 'user', content: `[Earlier conversation summary: ${summary}]` },
    ...recentMessages
  ];
}

function summarizeMessages(messages) {
  if (messages.length === 0) return '';

  const text = messages.map(m => m.content).join('\n');

  const prompt = `Summarize in 100 words:\n${text}`;
  const response = callClaudeAPI(prompt, { maxTokens: 300 });

  return response.content[0].text;
}
```

---

## 📄 Chunking Large Inputs

### Document Chunking Pattern

**Process large documents in chunks**:
```javascript
function processLargeDocumentInChunks(documentText, chunkSize = 30000) {
  // chunkSize in tokens (30K tokens = ~120K chars = ~20 pages)

  const charsPerChunk = chunkSize * 4; // 4 chars ≈ 1 token

  // Split into chunks
  const chunks = [];
  for (let i = 0; i < documentText.length; i += charsPerChunk) {
    chunks.push(documentText.substring(i, i + charsPerChunk));
  }

  Logger.log(`Split document into ${chunks.length} chunks`);

  // Process each chunk
  const results = [];
  chunks.forEach((chunk, index) => {
    Logger.log(`Processing chunk ${index + 1}/${chunks.length}...`);

    const prompt = `
<task>Extract key information from this document chunk</task>

<chunk>${index + 1} of ${chunks.length}</chunk>

<document>
${chunk}
</document>

<output>JSON with extracted information</output>
`;

    const response = callClaudeAPI(prompt, { maxTokens: 2048 });
    results.push(JSON.parse(response.content[0].text));

    // Rate limiting delay
    Utilities.sleep(500);
  });

  // Aggregate results
  return aggregateChunkResults(results);
}

function aggregateChunkResults(results) {
  // Combine results from all chunks
  const aggregated = {
    extractedData: [],
    metadata: {
      chunksProcessed: results.length,
      timestamp: new Date().toISOString()
    }
  };

  results.forEach(result => {
    if (result.data) {
      aggregated.extractedData.push(...result.data);
    }
  });

  return aggregated;
}
```

---

## 🚨 Context Length Exceeded Handling

### Detection and Recovery

**Comprehensive handling**:
```javascript
function callClaudeAPIWithContextHandling(prompt, options = {}) {
  try {
    return callClaudeAPI(prompt, options);

  } catch (error) {
    // Detect context length error
    const isContextError = error.message.toLowerCase().includes('too long') ||
                           error.message.toLowerCase().includes('context') ||
                           error.message.toLowerCase().includes('maximum');

    if (!isContextError) {
      throw error; // Not a context error
    }

    Logger.log('⚠️ Context length exceeded. Attempting recovery...');

    // Recovery Strategy 1: Prune conversation history
    if (options.conversationHistory && options.conversationHistory.length > 10) {
      Logger.log('Strategy 1: Pruning conversation history');

      const prunedHistory = manageSlidingWindow(options.conversationHistory, 5);

      return callClaudeAPI(prompt, {
        ...options,
        conversationHistory: prunedHistory
      });
    }

    // Recovery Strategy 2: Summarize history
    if (options.conversationHistory && options.conversationHistory.length > 5) {
      Logger.log('Strategy 2: Summarizing conversation history');

      const summarized = summarizeConversationHistory(options.conversationHistory, {
        keepRecentTurns: 2,
        maxSummaryLength: 200
      });

      return callClaudeAPI(prompt, {
        ...options,
        conversationHistory: summarized
      });
    }

    // Recovery Strategy 3: Truncate prompt
    if (prompt.length > 100000) {
      Logger.log('Strategy 3: Truncating prompt');

      const truncated = prompt.substring(0, 100000) + '\n\n[...content truncated due to length]';

      return callClaudeAPI(truncated, options);
    }

    // Recovery Strategy 4: Split into multiple calls
    Logger.log('Strategy 4: Splitting into chunks');

    return processLargeDocumentInChunks(prompt);
  }
}
```

---

## ✅ Context Management Best Practices

### Checklist

- [x] **Estimate token usage before call** - Avoid surprises, plan pruning
- [x] **Implement context pruning** - Sliding window or priority-based
- [x] **Summarize when appropriate** - >20 turns or >80% limit
- [x] **Handle context exceeded gracefully** - Multiple recovery strategies
- [x] **Monitor context usage patterns** - Track average usage per operation
- [x] **Keep only relevant information** - Drop redundant or outdated context
- [x] **Use chunking for large inputs** - Process documents in manageable pieces
- [x] **Set context usage alerts** - Warn at 70%, 80%, 90% thresholds
- [x] **Test with large contexts** - Verify recovery strategies work
- [x] **Document pruning logic** - Make it clear what gets kept vs dropped

---

### Anti-Patterns to Avoid

**❌ Always sending full history**:
```javascript
// BAD: Send entire 100-turn conversation every time
const response = callClaudeAPIWithHistory(newMessage, allMessages); // 50K+ tokens!
```

**✅ Manage history intelligently**:
```javascript
// GOOD: Sliding window or summarization
const managedHistory = hybridHistoryManagement(allMessages, 10);
const response = callClaudeAPIWithHistory(newMessage, managedHistory); // ~5K tokens
```

---

**❌ No monitoring of context size**:
```javascript
// BAD: No awareness of approaching limit
callClaudeAPI(massivePrompt); // Fails unexpectedly
```

**✅ Proactive monitoring**:
```javascript
// GOOD: Check before sending
const check = checkContextSize(prompt, history);
if (check.approachingLimit) {
  history = pruneContext(history);
}
const response = callClaudeAPI(prompt, { conversationHistory: history });
```

---

## 🔗 Related Files

- `ai-integration/document-processing.md` - Document chunking strategies
- `ai-integration/token-optimization.md` - Reducing token usage for cost
- `ai-integration/multi-turn.md` - Conversation history management
- `ai-integration/error-handling-ai.md` - Handling context exceeded errors

---

**Versione**: 1.0
**Context Size**: ~500 righe
