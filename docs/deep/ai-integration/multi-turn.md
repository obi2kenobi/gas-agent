# 🤖 Multi-Turn Conversations

**Categoria**: AI Integration → Conversational AI
**Righe**: ~600
**Parent**: `specialists/ai-integration-specialist.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Implementare conversational flows con Claude
- Gestire state tra multiple API calls
- Implementare context carryover per continuità
- Gestire session management con CacheService/PropertiesService
- Build multi-step workflows con AI
- Handle conversational clarifications

---

## 🗂️ State Management

### Session State Storage

**Using CacheService for temporary sessions**:
```javascript
const ConversationState = (function() {

  function createSession(userId) {
    const sessionId = Utilities.getUuid();
    const session = {
      id: sessionId,
      userId: userId,
      createdAt: new Date().toISOString(),
      messages: [],
      metadata: {}
    };

    // Store in CacheService (6 hours TTL)
    const cache = CacheService.getScriptCache();
    cache.put(`session:${sessionId}`, JSON.stringify(session), 21600);

    Logger.log(`Created session: ${sessionId}`);
    return sessionId;
  }

  function getSession(sessionId) {
    const cache = CacheService.getScriptCache();
    const sessionData = cache.get(`session:${sessionId}`);

    if (!sessionData) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    return JSON.parse(sessionData);
  }

  function updateSession(sessionId, updates) {
    const session = getSession(sessionId);

    // Merge updates
    Object.assign(session, updates);

    // Save back
    const cache = CacheService.getScriptCache();
    cache.put(`session:${sessionId}`, JSON.stringify(session), 21600);

    return session;
  }

  function deleteSession(sessionId) {
    const cache = CacheService.getScriptCache();
    cache.remove(`session:${sessionId}`);
    Logger.log(`Deleted session: ${sessionId}`);
  }

  return {
    createSession,
    getSession,
    updateSession,
    deleteSession
  };

})();

// Usage
function startConversation(userId) {
  const sessionId = ConversationState.createSession(userId);
  return sessionId;
}
```

---

### State Persistence (Long-Term)

**Using PropertiesService for persistent conversations**:
```javascript
function saveConversationPermanently(sessionId, conversationData) {
  const props = PropertiesService.getUserProperties();

  // Store with timestamp for cleanup
  const key = `conversation:${sessionId}`;
  const data = {
    ...conversationData,
    savedAt: new Date().toISOString()
  };

  props.setProperty(key, JSON.stringify(data));

  Logger.log(`Saved conversation ${sessionId} permanently`);
}

function loadConversation(sessionId) {
  const props = PropertiesService.getUserProperties();
  const key = `conversation:${sessionId}`;

  const data = props.getProperty(key);
  if (!data) {
    throw new Error(`Conversation not found: ${sessionId}`);
  }

  return JSON.parse(data);
}

// Cleanup old conversations (run periodically)
function cleanupOldConversations(daysToKeep = 30) {
  const props = PropertiesService.getUserProperties();
  const allProps = props.getProperties();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  Object.keys(allProps).forEach(key => {
    if (key.startsWith('conversation:')) {
      const data = JSON.parse(allProps[key]);

      if (new Date(data.savedAt) < cutoffDate) {
        props.deleteProperty(key);
        Logger.log(`Cleaned up old conversation: ${key}`);
      }
    }
  });
}
```

---

## 💬 Conversation History Management

### Message Array Structure

**Claude Messages API format**:
```javascript
const conversationHistory = [
  { role: "user", content: "What is Business Central?" },
  { role: "assistant", content: "Business Central is Microsoft's ERP solution for small to medium-sized businesses..." },
  { role: "user", content: "How do I query sales orders?" },
  { role: "assistant", content: "To query sales orders in Business Central..." },
  { role: "user", content: "Can you show me code for that?" }
];

// Claude expects alternating user/assistant messages
```

---

### Adding Messages to History

**Append user and assistant messages**:
```javascript
function addUserMessage(sessionId, userMessage) {
  const session = ConversationState.getSession(sessionId);

  // Add user message
  session.messages.push({
    role: "user",
    content: userMessage,
    timestamp: new Date().toISOString()
  });

  ConversationState.updateSession(sessionId, { messages: session.messages });

  return session;
}

function addAssistantMessage(sessionId, assistantMessage) {
  const session = ConversationState.getSession(sessionId);

  // Add assistant message
  session.messages.push({
    role: "assistant",
    content: assistantMessage,
    timestamp: new Date().toISOString()
  });

  ConversationState.updateSession(sessionId, { messages: session.messages });

  return session;
}
```

---

### Complete Multi-Turn Flow

**Full conversational flow**:
```javascript
function sendMessage(sessionId, userMessage) {
  // 1. Add user message to history
  const session = addUserMessage(sessionId, userMessage);

  // 2. Prepare messages for Claude (only role + content)
  const claudeMessages = session.messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  // 3. Call Claude API with full history
  const response = callClaudeAPI(claudeMessages[claudeMessages.length - 1].content, {
    conversationHistory: claudeMessages.slice(0, -1) // All except last
  });

  // 4. Extract assistant response
  const assistantMessage = response.content[0].text;

  // 5. Add assistant response to history
  addAssistantMessage(sessionId, assistantMessage);

  return {
    sessionId,
    userMessage,
    assistantMessage,
    turnNumber: session.messages.length / 2
  };
}

// Alternative: callClaudeAPI with history support
function callClaudeAPIWithHistory(userMessage, history = []) {
  const messages = [
    ...history,
    { role: "user", content: userMessage }
  ];

  const payload = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: messages
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
    payload: JSON.stringify(payload)
  });

  return JSON.parse(response.getContentText());
}
```

---

### Usage Example

```javascript
function testMultiTurnConversation() {
  // Start conversation
  const sessionId = ConversationState.createSession('user@example.com');

  // Turn 1
  let response = sendMessage(sessionId, "What is the capital of France?");
  Logger.log(`Turn 1: ${response.assistantMessage}`);

  // Turn 2 (context-aware)
  response = sendMessage(sessionId, "What is its population?");
  Logger.log(`Turn 2: ${response.assistantMessage}`);
  // Claude knows "its" refers to Paris from turn 1

  // Turn 3
  response = sendMessage(sessionId, "And its main landmarks?");
  Logger.log(`Turn 3: ${response.assistantMessage}`);

  // Cleanup
  ConversationState.deleteSession(sessionId);
}
```

---

## 🔄 Context Carryover

### Maintaining Context Across Turns

**Problem**: Context window limits with long conversations

**Solution 1**: Summarize old context
```javascript
function summarizeConversationHistory(messages) {
  // If conversation is getting long (>20 turns), summarize
  if (messages.length > 40) { // 20 turns × 2 messages/turn

    // Extract last 10 turns
    const recentMessages = messages.slice(-20);

    // Summarize older turns
    const olderMessages = messages.slice(0, -20);

    const summaryPrompt = `
<task>Summarize this conversation history concisely</task>

<conversation>
${olderMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}
</conversation>

<output>Brief summary (max 200 words) capturing key points discussed</output>
`;

    const summaryResponse = callClaudeAPI(summaryPrompt, { maxTokens: 500 });
    const summary = summaryResponse.content[0].text;

    // Return: summary + recent messages
    return [
      { role: "user", content: `[Previous conversation summary: ${summary}]` },
      ...recentMessages
    ];
  }

  return messages;
}

// Usage
function sendMessageWithContextManagement(sessionId, userMessage) {
  const session = ConversationState.getSession(sessionId);

  // Manage context size
  const managedHistory = summarizeConversationHistory(session.messages);

  // Add new user message
  managedHistory.push({ role: "user", content: userMessage });

  // Call Claude with managed history
  const response = callClaudeAPIWithHistory(userMessage, managedHistory.slice(0, -1));

  // Save full history (not summarized)
  addUserMessage(sessionId, userMessage);
  addAssistantMessage(sessionId, response.content[0].text);

  return response.content[0].text;
}
```

---

**Solution 2**: Sliding window (keep last N turns)
```javascript
function getRecentHistory(messages, maxTurns = 10) {
  // Keep only last N turns (N×2 messages)
  const maxMessages = maxTurns * 2;

  if (messages.length > maxMessages) {
    return messages.slice(-maxMessages);
  }

  return messages;
}

// Usage
function sendMessageWithSlidingWindow(sessionId, userMessage) {
  const session = ConversationState.getSession(sessionId);

  // Get recent history only
  const recentHistory = getRecentHistory(session.messages, 10);

  // Add user message
  recentHistory.push({ role: "user", content: userMessage });

  // Call Claude
  const response = callClaudeAPIWithHistory(userMessage, recentHistory.slice(0, -1));

  // Save to full history
  addUserMessage(sessionId, userMessage);
  addAssistantMessage(sessionId, response.content[0].text);

  return response.content[0].text;
}
```

---

## 📅 Session Management

### Session Lifecycle

**1. Session Initialization**:
```javascript
function initializeSession(userId, metadata = {}) {
  const sessionId = ConversationState.createSession(userId);

  // Initialize with system prompt or context
  const session = ConversationState.getSession(sessionId);
  session.metadata = {
    ...metadata,
    systemPrompt: "You are a Business Central specialist assistant.",
    maxTurns: 50,
    createdBy: userId
  };

  ConversationState.updateSession(sessionId, session);

  return sessionId;
}
```

---

**2. Session Expiry**:
```javascript
function checkSessionExpiry(sessionId) {
  const session = ConversationState.getSession(sessionId);

  const createdAt = new Date(session.createdAt);
  const now = new Date();
  const ageInHours = (now - createdAt) / (1000 * 60 * 60);

  if (ageInHours > 6) {
    Logger.log(`Session ${sessionId} expired (age: ${ageInHours.toFixed(1)} hours)`);
    ConversationState.deleteSession(sessionId);
    throw new Error('Session expired. Please start a new conversation.');
  }

  return session;
}

// Auto-check expiry before each message
function sendMessageSafe(sessionId, userMessage) {
  try {
    checkSessionExpiry(sessionId);
    return sendMessage(sessionId, userMessage);
  } catch (error) {
    if (error.message.includes('expired')) {
      // Auto-create new session
      const newSessionId = initializeSession(Session.getActiveUser().getEmail());
      Logger.log(`Created new session ${newSessionId} to replace expired ${sessionId}`);

      return sendMessage(newSessionId, userMessage);
    }
    throw error;
  }
}
```

---

**3. Session Storage Strategy**:
```javascript
// CacheService: Temporary (6 hours max)
// - Active conversations
// - Auto-expiry
// - Fast access

// PropertiesService: Permanent
// - Completed conversations (for audit)
// - Important exchanges
// - Manual cleanup needed

function archiveSession(sessionId) {
  const session = ConversationState.getSession(sessionId);

  // Save permanently
  saveConversationPermanently(sessionId, session);

  // Remove from cache
  ConversationState.deleteSession(sessionId);

  Logger.log(`Archived session ${sessionId}`);
}
```

---

## 🔀 Conversational Patterns

### Clarification Flow

**Ask for clarification when needed**:
```javascript
function handleAmbiguousRequest(sessionId, userMessage) {
  // Send to Claude with instruction to ask for clarification

  const clarificationPrompt = `
<context>
User message: "${userMessage}"
</context>

<task>
If this request is ambiguous or needs more information, ask a clarifying question.
If it's clear, proceed with the answer.
</task>

<instructions>
- If ambiguous: Ask ONE specific clarifying question
- If clear: Provide the answer directly
</instructions>
`;

  return sendMessage(sessionId, clarificationPrompt);
}

// Example flow
function testClarificationFlow() {
  const sessionId = initializeSession('user@example.com');

  // Ambiguous request
  let response = handleAmbiguousRequest(sessionId, "Show me sales");
  // Claude might ask: "Do you want to see sales orders, sales invoices, or sales statistics?"

  // User clarifies
  response = sendMessage(sessionId, "Sales orders from last month");
  // Claude can now provide specific answer

  ConversationState.deleteSession(sessionId);
}
```

---

### Multi-Step Workflows

**Guide user through multi-step process**:
```javascript
function multiStepWorkflow(sessionId, workflowType) {
  const workflows = {
    'invoice_extraction': [
      { step: 1, prompt: "Please upload or paste the invoice text you want to extract data from." },
      { step: 2, prompt: "I've extracted the data. Would you like me to validate the totals?" },
      { step: 3, prompt: "Validation complete. Should I save this to Business Central?" }
    ],
    'order_creation': [
      { step: 1, prompt: "Let's create a sales order. What is the customer name or ID?" },
      { step: 2, prompt: "Got it. What items would you like to add to this order?" },
      { step: 3, prompt: "Perfect. Any special delivery instructions or notes?" },
      { step: 4, prompt: "Order ready. Should I submit it to Business Central?" }
    ]
  };

  const workflow = workflows[workflowType];
  if (!workflow) {
    throw new Error(`Unknown workflow: ${workflowType}`);
  }

  // Initialize workflow state
  const session = ConversationState.getSession(sessionId);
  session.metadata.workflow = {
    type: workflowType,
    currentStep: 1,
    steps: workflow
  };
  ConversationState.updateSession(sessionId, session);

  // Send first prompt
  return workflow[0].prompt;
}

function advanceWorkflowStep(sessionId) {
  const session = ConversationState.getSession(sessionId);
  const workflow = session.metadata.workflow;

  workflow.currentStep++;

  if (workflow.currentStep > workflow.steps.length) {
    // Workflow complete
    delete session.metadata.workflow;
    ConversationState.updateSession(sessionId, session);
    return { completed: true, message: "Workflow completed!" };
  }

  // Get next step prompt
  const nextStep = workflow.steps[workflow.currentStep - 1];
  ConversationState.updateSession(sessionId, session);

  return { completed: false, message: nextStep.prompt, step: nextStep.step };
}

// Usage
function testMultiStepWorkflow() {
  const sessionId = initializeSession('user@example.com');

  // Start workflow
  let prompt = multiStepWorkflow(sessionId, 'order_creation');
  Logger.log(`Step 1: ${prompt}`);

  // User responds
  sendMessage(sessionId, "Customer: ACME Corp");

  // Advance to step 2
  const next = advanceWorkflowStep(sessionId);
  Logger.log(`Step 2: ${next.message}`);

  // Continue...
}
```

---

## ✅ Multi-Turn Best Practices

### Checklist

- [x] **Store conversation history** - Persist all user/assistant messages
- [x] **Implement session expiry** - Auto-expire after 6 hours (CacheService limit)
- [x] **Summarize old context** - When conversation >20 turns, summarize older messages
- [x] **Handle session not found** - Gracefully create new session
- [x] **Clear sessions after completion** - Archive or delete when done
- [x] **Limit history size** - Use sliding window (last 10 turns) or summarization
- [x] **Include relevant context only** - Don't send entire history if not needed
- [x] **Set turn limits** - Prevent infinite conversations (e.g., max 50 turns)
- [x] **Track conversation metadata** - Store userId, created timestamp, workflow state
- [x] **Archive important conversations** - Save to PropertiesService for audit

---

### Anti-Patterns to Avoid

**❌ Sending full history every time** (expensive):
```javascript
// BAD: Sending 100-turn history (10,000+ tokens!)
const response = callClaudeAPIWithHistory(newMessage, allMessages);
```

**✅ Manage context size**:
```javascript
// GOOD: Sliding window or summarization
const recentMessages = getRecentHistory(allMessages, 10); // Last 10 turns
const response = callClaudeAPIWithHistory(newMessage, recentMessages);
```

---

**❌ No session expiry** (memory leak):
```javascript
// BAD: Sessions accumulate forever
```

**✅ Auto-expire sessions**:
```javascript
// GOOD: Use CacheService (auto-expires after 6 hours)
// Or implement manual cleanup for PropertiesService
```

---

## 🔗 Related Files

- `ai-integration/context-management.md` - Context window optimization
- `ai-integration/prompt-engineering.md` - Conversational prompt patterns
- `platform/caching.md` - Session storage with CacheService
- `ai-integration/api-setup.md` - Multi-turn API structure

---

**Versione**: 1.0
**Context Size**: ~600 righe
