# 🤖 Prompt Engineering

**Categoria**: AI Integration → Prompt Design
**Righe**: ~650
**Parent**: `specialists/ai-integration-specialist.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Creare effective prompts per Claude API
- Strutturare prompts con XML tags
- Implementare few-shot examples
- Ottimizzare prompt performance e accuracy
- Usare chain-of-thought per reasoning complesso
- Testare prompt variations con A/B testing
- Design prompts per data extraction, classification, summarization

---

## 📐 XML Prompt Structure

### Why XML?

**Benefits**:
- ✅ **Clear structure** - Reduces ambiguity, improves parsing
- ✅ **Easy for Claude** - Native understanding of XML semantics
- ✅ **Composable** - Modular sections, easy to maintain
- ✅ **Debuggable** - Clear boundaries between sections

---

### Basic XML Template

**Standard structure**:
```javascript
function createStructuredPrompt(data) {
  return `
<task>
Extract invoice data from the following document.
</task>

<document>
${data.invoiceText}
</document>

<required_fields>
- Invoice Number
- Date
- Total Amount
- Vendor Name
- Line Items
</required_fields>

<output_format>
Return JSON with the extracted fields. Use this structure:
{
  "invoice_number": "string",
  "date": "YYYY-MM-DD",
  "total": number,
  "vendor": "string",
  "line_items": [{"description": "string", "amount": number}]
}
</output_format>
`;
}

// Usage
function extractInvoiceData(invoiceText) {
  const prompt = createStructuredPrompt({ invoiceText });
  const response = callClaudeAPI(prompt);
  return JSON.parse(response.content[0].text);
}
```

---

### Advanced XML Structure with Context

**Multi-section prompts**:
```javascript
function createAdvancedPrompt(options) {
  const { task, context, data, rules, examples, outputFormat } = options;

  return `
<context>
${context}
</context>

<task>
${task}
</task>

<rules>
${rules.map(rule => `- ${rule}`).join('\n')}
</rules>

<examples>
${examples.map((ex, i) => `
<example_${i + 1}>
<input>${ex.input}</input>
<output>${ex.output}</output>
</example_${i + 1}>
`).join('\n')}
</examples>

<data>
${data}
</data>

<output_format>
${outputFormat}
</output_format>
`;
}

// Usage
const prompt = createAdvancedPrompt({
  context: 'You are a financial analyst extracting data from invoices.',
  task: 'Extract all invoice data and validate totals.',
  rules: [
    'Calculate subtotal + tax = total',
    'Flag any discrepancies',
    'Convert all currencies to USD'
  ],
  examples: [
    {
      input: 'Invoice #001: Item A $100, Tax $10, Total $110',
      output: '{"invoice_number": "001", "subtotal": 100, "tax": 10, "total": 110, "valid": true}'
    }
  ],
  data: invoiceText,
  outputFormat: 'JSON with validation field'
});
```

---

## 💬 System vs User Messages

### System Message (Context & Role)

**Sets behavior, constraints, personality**:
```javascript
function callClaudeWithSystem(userMessage, systemPrompt) {
  const payload = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    system: systemPrompt,  // System-level instructions
    messages: [
      { role: 'user', content: userMessage }
    ]
  };

  // ... API call
}

// Example: Data extraction specialist
const SYSTEM_PROMPT = `You are a data extraction specialist for Business Central ERP.

Your role:
- Extract structured data from unstructured text
- Always return valid JSON
- Validate data against Business Central schemas
- Flag any missing or invalid fields

Constraints:
- Never fabricate data if unclear - use null
- Always include a "confidence" score (0-1)
- Use ISO 8601 for dates
- Currency amounts as numbers (no symbols)

Output format:
{
  "data": { ... extracted fields ... },
  "confidence": 0.95,
  "warnings": ["list of validation issues"]
}`;

function extractOrderData(orderText) {
  return callClaudeWithSystem(
    `Extract order data from:\n\n${orderText}`,
    SYSTEM_PROMPT
  );
}
```

---

### User Message (Specific Task)

**Provides concrete task and input**:
```javascript
function createUserMessage(task, data) {
  // User message is the specific task
  return `
<task>${task}</task>

<input_data>
${data}
</input_data>

Please process this data according to your role as defined in the system message.
`;
}

// Usage
const userMsg = createUserMessage(
  'Extract customer information',
  customerDocumentText
);

callClaudeWithSystem(userMsg, SYSTEM_PROMPT);
```

---

## 📚 Few-Shot Examples

### Pattern: Show Desired Behavior

**Include 2-5 examples of input → output**:
```javascript
function createFewShotPrompt(task, examples, newInput) {
  return `
<task>
${task}
</task>

<examples>
${examples.map((ex, i) => `
<example_${i + 1}>
<input>${ex.input}</input>
<output>${ex.output}</output>
</example_${i + 1}>
`).join('\n')}
</examples>

<new_input>
${newInput}
</new_input>

<instructions>
Process the new_input following the same pattern as the examples.
</instructions>
`;
}

// Usage: Order status classification
const orderClassificationExamples = [
  {
    input: 'Order #123 shipped via FedEx, tracking 1234567890',
    output: '{"order_id": "123", "status": "shipped", "carrier": "FedEx", "tracking": "1234567890"}'
  },
  {
    input: 'Order #456 pending payment',
    output: '{"order_id": "456", "status": "pending_payment", "carrier": null, "tracking": null}'
  },
  {
    input: 'Order #789 delivered on 2024-01-15',
    output: '{"order_id": "789", "status": "delivered", "carrier": null, "tracking": null, "delivered_date": "2024-01-15"}'
  }
];

function classifyOrderStatus(orderText) {
  const prompt = createFewShotPrompt(
    'Classify order status and extract relevant fields',
    orderClassificationExamples,
    orderText
  );

  const response = callClaudeAPI(prompt);
  return JSON.parse(response.content[0].text);
}
```

---

### Few-Shot for Data Extraction

**Business Central sales order example**:
```javascript
const bcOrderExtractionExamples = [
  {
    input: `
Sales Order #SO-2024-001
Customer: Contoso Ltd.
Date: 2024-01-15
Items:
- Widget A x 10 @ $50.00 = $500.00
- Widget B x 5 @ $30.00 = $150.00
Tax: $65.00
Total: $715.00
`,
    output: `{
  "order_number": "SO-2024-001",
  "customer_name": "Contoso Ltd.",
  "order_date": "2024-01-15",
  "line_items": [
    {"description": "Widget A", "quantity": 10, "unit_price": 50.00, "total": 500.00},
    {"description": "Widget B", "quantity": 5, "unit_price": 30.00, "total": 150.00}
  ],
  "tax": 65.00,
  "total": 715.00
}`
  },
  {
    input: `
Order: SO-2024-002
Customer: Fabrikam Inc.
Date: 2024-01-16
Item: Service Plan - Annual @ $1200
Total: $1200.00 (no tax - service)
`,
    output: `{
  "order_number": "SO-2024-002",
  "customer_name": "Fabrikam Inc.",
  "order_date": "2024-01-16",
  "line_items": [
    {"description": "Service Plan - Annual", "quantity": 1, "unit_price": 1200.00, "total": 1200.00}
  ],
  "tax": 0.00,
  "total": 1200.00
}`
  }
];

function extractSalesOrderData(orderDocument) {
  const prompt = createFewShotPrompt(
    'Extract sales order data into structured JSON',
    bcOrderExtractionExamples,
    orderDocument
  );

  return callClaudeAPI(prompt);
}
```

---

## 🧠 Chain-of-Thought Prompting

### When to Use CoT

**Use cases**:
- ✅ Complex reasoning (multi-step calculations)
- ✅ Logical deduction (if X then Y)
- ✅ Problem-solving (requires breaking down)
- ✅ Validation (check data consistency)

---

### CoT Pattern

**Ask Claude to "think step by step"**:
```javascript
function chainOfThoughtPrompt(problem) {
  return `
<problem>
${problem}
</problem>

<instructions>
Solve this problem step by step. Show your reasoning before providing the final answer.

Structure your response as:

<reasoning>
Step 1: [First step]
Step 2: [Second step]
...
</reasoning>

<answer>
[Final answer]
</answer>
</instructions>
`;
}

// Example: Invoice validation
function validateInvoiceWithCoT(invoice) {
  const problem = `
Validate this invoice:
Invoice #INV-2024-123
Line items:
- Item A: 10 units x $50.00 = $500.00
- Item B: 5 units x $30.00 = $150.00
Subtotal: $650.00
Tax (10%): $65.00
Total: $715.00

Is this invoice mathematically correct?
`;

  const prompt = chainOfThoughtPrompt(problem);
  const response = callClaudeAPI(prompt);

  return response.content[0].text;
  // Response will show reasoning:
  // Step 1: Calculate line item totals
  // Step 2: Sum line items for subtotal
  // Step 3: Calculate tax (10% of $650 = $65)
  // Step 4: Calculate total ($650 + $65 = $715)
  // Answer: Yes, invoice is correct
}
```

---

### CoT for Complex Business Logic

```javascript
function analyzeSalesOrderEligibility(order, customer) {
  const prompt = `
<scenario>
Customer: ${customer.name}
Credit Limit: $${customer.creditLimit}
Current Outstanding: $${customer.outstandingBalance}
New Order Total: $${order.total}
Payment Terms: ${customer.paymentTerms}
</scenario>

<task>
Determine if this sales order can be approved. Think through the decision step by step.

Consider:
1. Will this order exceed the customer's credit limit?
2. Does the customer have any overdue invoices?
3. Are there any special conditions based on payment terms?

Show your reasoning, then provide a final decision (APPROVE / REJECT / REVIEW).
</task>

<output_format>
<reasoning>
[Your step-by-step analysis]
</reasoning>

<decision>APPROVE|REJECT|REVIEW</decision>

<explanation>
[Brief explanation for the decision]
</explanation>
</output_format>
`;

  return callClaudeAPI(prompt);
}
```

---

## 🧪 Prompt Testing Strategies

### A/B Testing Framework

**Compare prompt variations**:
```javascript
const PromptTester = (function() {

  function testPromptVariations(variations, testCases) {
    const results = [];

    variations.forEach((variant, variantIndex) => {
      Logger.log(`Testing variant ${variantIndex + 1}/${variations.length}: ${variant.name}`);

      const variantResults = {
        name: variant.name,
        prompt: variant.prompt,
        testResults: []
      };

      testCases.forEach((testCase, caseIndex) => {
        const startTime = Date.now();

        try {
          // Generate prompt with test input
          const prompt = variant.promptFunction(testCase.input);

          // Call API
          const response = callClaudeAPI(prompt);
          const duration = Date.now() - startTime;

          // Parse response
          const output = parseClaudeResponse(response);

          // Evaluate
          const correct = testCase.evaluate(output.text, testCase.expectedOutput);

          variantResults.testResults.push({
            caseIndex,
            correct,
            duration,
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            output: output.text
          });

        } catch (error) {
          variantResults.testResults.push({
            caseIndex,
            correct: false,
            error: error.message
          });
        }

        // Rate limiting delay
        Utilities.sleep(500);
      });

      results.push(variantResults);
    });

    return results;
  }

  function analyzeResults(results) {
    return results.map(variant => {
      const totalTests = variant.testResults.length;
      const correct = variant.testResults.filter(r => r.correct).length;
      const accuracy = correct / totalTests;

      const avgDuration = variant.testResults
        .filter(r => r.duration)
        .reduce((sum, r) => sum + r.duration, 0) / totalTests;

      const avgTokens = variant.testResults
        .filter(r => r.inputTokens)
        .reduce((sum, r) => sum + (r.inputTokens + r.outputTokens), 0) / totalTests;

      return {
        name: variant.name,
        accuracy,
        correct,
        totalTests,
        avgDuration: Math.round(avgDuration),
        avgTokens: Math.round(avgTokens)
      };
    });
  }

  return { testPromptVariations, analyzeResults };

})();

// Usage
function testOrderExtractionPrompts() {
  // Define prompt variations
  const variations = [
    {
      name: 'Simple',
      promptFunction: (input) => `Extract order data from:\n${input}\n\nReturn JSON.`
    },
    {
      name: 'XML Structured',
      promptFunction: (input) => `
<task>Extract order data</task>
<input>${input}</input>
<output_format>JSON with fields: order_number, customer, total</output_format>
`
    },
    {
      name: 'XML + Few-Shot',
      promptFunction: (input) => createFewShotPrompt(
        'Extract order data',
        bcOrderExtractionExamples,
        input
      )
    }
  ];

  // Define test cases
  const testCases = [
    {
      input: 'Order SO-001, Customer: ACME Corp, Total: $500',
      expectedOutput: { order_number: 'SO-001', customer: 'ACME Corp', total: 500 },
      evaluate: (output, expected) => {
        const parsed = JSON.parse(output);
        return parsed.order_number === expected.order_number &&
               parsed.customer === expected.customer &&
               parsed.total === expected.total;
      }
    },
    // ... more test cases
  ];

  // Run tests
  const results = PromptTester.testPromptVariations(variations, testCases);
  const analysis = PromptTester.analyzeResults(results);

  Logger.log('Prompt Testing Results:');
  analysis.forEach(a => {
    Logger.log(`${a.name}: ${(a.accuracy * 100).toFixed(1)}% accurate, ${a.avgDuration}ms, ${a.avgTokens} tokens`);
  });

  return analysis;
}
```

---

## 📋 Common Prompt Patterns

### Data Extraction Pattern

```javascript
const DATA_EXTRACTION_TEMPLATE = `
<role>
You are a data extraction specialist. Extract structured data from unstructured text.
</role>

<input>
{{INPUT_TEXT}}
</input>

<schema>
{{EXPECTED_SCHEMA}}
</schema>

<rules>
- Return valid JSON matching the schema
- Use null for missing fields
- Include a "confidence" score (0-1)
- Flag any ambiguous data in "warnings" array
</rules>

<output_format>
{
  "data": { ... },
  "confidence": 0.95,
  "warnings": []
}
</output_format>
`;
```

---

### Classification Pattern

```javascript
const CLASSIFICATION_TEMPLATE = `
<task>
Classify the following item into one of these categories:
{{CATEGORIES}}
</task>

<item>
{{ITEM_TEXT}}
</item>

<rules>
- Choose exactly one category
- Provide confidence score
- Explain reasoning briefly
</rules>

<output_format>
{
  "category": "category_name",
  "confidence": 0.95,
  "reasoning": "brief explanation"
}
</output_format>
`;

// Usage
function classifyDocument(documentText) {
  const prompt = CLASSIFICATION_TEMPLATE
    .replace('{{CATEGORIES}}', 'invoice, purchase_order, receipt, contract')
    .replace('{{ITEM_TEXT}}', documentText);

  return callClaudeAPI(prompt);
}
```

---

### Summarization Pattern

```javascript
const SUMMARIZATION_TEMPLATE = `
<task>
Summarize the following document for {{AUDIENCE}}.
</task>

<document>
{{DOCUMENT_TEXT}}
</document>

<constraints>
- Maximum {{MAX_WORDS}} words
- Focus on {{FOCUS_AREAS}}
- Use {{TONE}} tone
</constraints>

<output_format>
Return plain text summary (no JSON).
</output_format>
`;

// Usage
function summarizeForExecutive(document) {
  const prompt = SUMMARIZATION_TEMPLATE
    .replace('{{AUDIENCE}}', 'C-level executives')
    .replace('{{DOCUMENT_TEXT}}', document)
    .replace('{{MAX_WORDS}}', '100')
    .replace('{{FOCUS_AREAS}}', 'key decisions, financial impact, risks')
    .replace('{{TONE}}', 'professional and concise');

  return callClaudeAPI(prompt);
}
```

---

### Transformation Pattern

```javascript
const TRANSFORMATION_TEMPLATE = `
<task>
Transform the input data from {{SOURCE_FORMAT}} to {{TARGET_FORMAT}}.
</task>

<input_data>
{{INPUT_DATA}}
</input_data>

<transformation_rules>
{{RULES}}
</transformation_rules>

<target_schema>
{{TARGET_SCHEMA}}
</target_schema>

<output_format>
Return the transformed data in {{TARGET_FORMAT}}.
</output_format>
`;

// Usage: CSV to BC API format
function transformCSVToBC(csvData) {
  const prompt = TRANSFORMATION_TEMPLATE
    .replace('{{SOURCE_FORMAT}}', 'CSV')
    .replace('{{TARGET_FORMAT}}', 'Business Central API JSON')
    .replace('{{INPUT_DATA}}', csvData)
    .replace('{{RULES}}', `
- Map "Customer Name" → "customerName"
- Map "Order #" → "orderNumber"
- Convert date format to ISO 8601
- Calculate line totals (quantity * unit_price)
`)
    .replace('{{TARGET_SCHEMA}}', `
{
  "orderNumber": "string",
  "customerName": "string",
  "orderDate": "ISO 8601 date",
  "lineItems": [...]
}
`);

  return callClaudeAPI(prompt);
}
```

---

## ✅ Prompt Engineering Best Practices

### Checklist

- [x] **Use XML tags** - Clear structure, reduces ambiguity
- [x] **Be specific and explicit** - Don't rely on implicit understanding
- [x] **Include few-shot examples** - 2-5 examples for complex tasks
- [x] **Specify output format** - JSON schema, XML structure, or plain text
- [x] **Use chain-of-thought** - For multi-step reasoning
- [x] **Test multiple variations** - A/B test prompt designs
- [x] **Iterate based on failures** - Analyze errors, refine prompts
- [x] **Document successful prompts** - Create template library
- [x] **Set clear constraints** - Max length, required fields, forbidden actions
- [x] **Handle edge cases** - Specify behavior for missing/invalid data

---

### Anti-Patterns to Avoid

**❌ Vague instructions**:
```javascript
// BAD
const prompt = 'Process this data: ' + data;
```

**✅ Specific instructions**:
```javascript
// GOOD
const prompt = `
<task>Extract customer name, order number, and total from this invoice</task>
<data>${data}</data>
<output>JSON with fields: customer_name, order_number, total</output>
`;
```

---

**❌ No output format**:
```javascript
// BAD
const prompt = 'Analyze this sales report and give insights';
```

**✅ Structured output**:
```javascript
// GOOD
const prompt = `
<task>Analyze sales report</task>
<output_format>
{
  "total_sales": number,
  "top_products": [{"name": "string", "revenue": number}],
  "trends": ["string"],
  "recommendations": ["string"]
}
</output_format>
`;
```

---

## 🔗 Related Files

- `ai-integration/context-management.md` - Managing large prompts and context
- `ai-integration/token-optimization.md` - Reducing token usage in prompts
- `ai-integration/document-processing.md` - Document-specific prompt patterns
- `ai-integration/multi-turn.md` - Conversation-based prompting

---

**Versione**: 1.0
**Context Size**: ~650 righe
