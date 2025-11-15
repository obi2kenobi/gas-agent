# 🤖 AI Document Processing

**Categoria**: AI Integration → Document Analysis
**Righe**: ~750
**Parent**: `specialists/ai-integration-specialist.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Estrarre dati strutturati da documenti (PDF, invoices, contracts)
- Processare large documents con chunking strategies
- Parsare tabelle da text/PDF extraction
- Comparare versioni di documenti
- Classificare document types
- Correggere OCR errors con AI
- Implementare document validation workflows

---

## 📄 Document Chunking Strategies

### Why Chunk Documents?

**Context window limits**:
- Claude Sonnet 3.5: 200K tokens (~150K words)
- Average invoice: ~1K tokens
- Large contract: ~50K tokens
- Multi-page PDF: varies widely

**When to chunk**:
- ✅ Documents > 50K tokens
- ✅ Multi-page reports (100+ pages)
- ✅ When processing multiple documents in batch
- ✅ Streaming responses for large documents

---

### Chunking Methods

**1. Page-by-Page Chunking**:
```javascript
function chunkDocumentByPages(documentText, metadata) {
  // Assuming document has page markers like "--- PAGE 1 ---"
  const pagePattern = /---\s*PAGE\s+(\d+)\s*---/gi;
  const pages = documentText.split(pagePattern);

  const chunks = [];
  for (let i = 1; i < pages.length; i += 2) {
    const pageNum = pages[i];
    const pageContent = pages[i + 1];

    chunks.push({
      pageNumber: parseInt(pageNum),
      content: pageContent.trim(),
      metadata: {
        ...metadata,
        page: parseInt(pageNum)
      }
    });
  }

  return chunks;
}

// Usage
function processLargePDF(pdfText) {
  const chunks = chunkDocumentByPages(pdfText, { documentId: 'INV-2024-001' });

  const results = [];
  chunks.forEach(chunk => {
    const extracted = callClaudeAPI(`
<task>Extract invoice data from this page</task>
<page_number>${chunk.pageNumber}</page_number>
<content>${chunk.content}</content>
`);
    results.push({ page: chunk.pageNumber, data: extracted });
  });

  return results;
}
```

---

**2. Token-Limited Chunking**:
```javascript
function chunkByTokenLimit(text, maxTokens = 50000) {
  // Rough estimate: 1 token ≈ 4 characters
  const charsPerToken = 4;
  const maxChars = maxTokens * charsPerToken;

  const chunks = [];
  let currentChunk = '';

  // Split by paragraphs to avoid breaking mid-sentence
  const paragraphs = text.split('\n\n');

  paragraphs.forEach(paragraph => {
    if ((currentChunk.length + paragraph.length) > maxChars) {
      // Current chunk is full, start new one
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = paragraph;
    } else {
      currentChunk += '\n\n' + paragraph;
    }
  });

  // Add final chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Usage
function processLargeContract(contractText) {
  const chunks = chunkByTokenLimit(contractText, 30000); // 30K tokens per chunk

  Logger.log(`Contract split into ${chunks.length} chunks`);

  // Process each chunk
  const results = chunks.map((chunk, index) => {
    return callClaudeAPI(`
<task>Extract key terms and obligations from this contract section</task>
<chunk_number>${index + 1} of ${chunks.length}</chunk_number>
<content>${chunk}</content>
`);
  });

  return results;
}
```

---

**3. Semantic Chunking (Section-Based)**:
```javascript
function chunkBySemanticSections(documentText) {
  // Split by markdown headers or common section patterns
  const sectionPattern = /^(#{1,3}|Section \d+:|ARTICLE \d+)/gim;

  const sections = [];
  let currentSection = { title: '', content: '' };

  documentText.split('\n').forEach(line => {
    if (sectionPattern.test(line)) {
      // New section started
      if (currentSection.content.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { title: line.trim(), content: '' };
    } else {
      currentSection.content += line + '\n';
    }
  });

  // Add final section
  if (currentSection.content.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

// Usage
function analyzeContractBySections(contractText) {
  const sections = chunkBySemanticSections(contractText);

  return sections.map(section => {
    const analysis = callClaudeAPI(`
<task>Analyze this contract section</task>
<section_title>${section.title}</section_title>
<content>${section.content}</content>
<output_format>
{
  "section": "${section.title}",
  "summary": "brief summary",
  "key_points": ["point 1", "point 2"],
  "obligations": ["obligation 1"],
  "risks": ["identified risk"]
}
</output_format>
`);

    return {
      section: section.title,
      analysis: JSON.parse(analysis.content[0].text)
    };
  });
}
```

---

## 📋 Structured Data Extraction

### Invoice Processing

**Complete invoice extraction workflow**:
```javascript
function extractInvoiceData(invoiceText) {
  const prompt = `
<role>
You are an invoice data extraction specialist for Business Central ERP.
</role>

<task>
Extract all structured data from this invoice.
</task>

<invoice>
${invoiceText}
</invoice>

<required_fields>
- invoice_number (string)
- invoice_date (YYYY-MM-DD)
- due_date (YYYY-MM-DD)
- vendor_name (string)
- vendor_address (string)
- vendor_tax_id (string)
- customer_name (string)
- line_items (array of {description, quantity, unit_price, total})
- subtotal (number)
- tax_amount (number)
- tax_rate (number, as decimal 0.10 = 10%)
- total (number)
- payment_terms (string)
- currency (string, ISO 4217 code)
</required_fields>

<validation_rules>
1. Verify: subtotal + tax_amount = total (within $0.01 tolerance)
2. Verify: sum of line_items = subtotal
3. If any field is unclear or missing, use null
4. Flag any validation errors
</validation_rules>

<output_format>
{
  "invoice_data": {
    "invoice_number": "...",
    "invoice_date": "...",
    ...
  },
  "validation": {
    "is_valid": true|false,
    "errors": ["list of validation errors"],
    "warnings": ["list of warnings"]
  },
  "confidence": 0.95
}
</output_format>
`;

  const response = callClaudeAPI(prompt, { maxTokens: 4096 });
  const result = JSON.parse(response.content[0].text);

  // Log validation results
  if (!result.validation.is_valid) {
    Logger.log(`Invoice validation failed: ${result.validation.errors.join(', ')}`);
  }

  return result;
}
```

---

### Contract Analysis

**Extract key contract terms**:
```javascript
function analyzeContract(contractText) {
  const prompt = `
<role>
You are a legal contract analysis specialist.
</role>

<task>
Extract and analyze key terms from this contract.
</task>

<contract>
${contractText}
</contract>

<required_information>
1. Parties (all named entities in the contract)
2. Effective Date
3. Termination Date (if any)
4. Payment Terms (amount, frequency, due dates)
5. Deliverables / Scope of Work
6. Key Obligations (for each party)
7. Liability Clauses
8. Termination Conditions
9. Renewal Terms (automatic, manual, none)
10. Governing Law / Jurisdiction
</required_information>

<output_format>
{
  "parties": [
    {"name": "Company A", "role": "Client"},
    {"name": "Company B", "role": "Vendor"}
  ],
  "effective_date": "YYYY-MM-DD",
  "termination_date": "YYYY-MM-DD" | null,
  "payment_terms": {
    "amount": number,
    "currency": "USD",
    "frequency": "monthly|annual|one-time",
    "due_date": "description"
  },
  "deliverables": ["deliverable 1", "deliverable 2"],
  "obligations": {
    "Client": ["obligation 1", "obligation 2"],
    "Vendor": ["obligation 1", "obligation 2"]
  },
  "liability_limit": "description",
  "termination_conditions": ["condition 1"],
  "renewal_terms": "automatic|manual|none - description",
  "governing_law": "State/Country",
  "risks": ["identified risk 1", "identified risk 2"],
  "recommendations": ["recommendation 1"]
}
</output_format>
`;

  const response = callClaudeAPI(prompt, { maxTokens: 8192 });
  return JSON.parse(response.content[0].text);
}
```

---

### Output Validation

**Validate extracted data**:
```javascript
function validateExtractedInvoice(invoiceData) {
  const errors = [];
  const warnings = [];

  // Required field validation
  const requiredFields = ['invoice_number', 'invoice_date', 'vendor_name', 'total'];
  requiredFields.forEach(field => {
    if (!invoiceData[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Math validation
  if (invoiceData.subtotal && invoiceData.tax_amount && invoiceData.total) {
    const calculatedTotal = invoiceData.subtotal + invoiceData.tax_amount;
    const diff = Math.abs(calculatedTotal - invoiceData.total);

    if (diff > 0.01) {
      errors.push(`Total mismatch: ${calculatedTotal} (calculated) vs ${invoiceData.total} (stated)`);
    }
  }

  // Line items validation
  if (invoiceData.line_items && invoiceData.line_items.length > 0) {
    const lineItemsSum = invoiceData.line_items.reduce((sum, item) => sum + (item.total || 0), 0);
    const diff = Math.abs(lineItemsSum - invoiceData.subtotal);

    if (diff > 0.01) {
      warnings.push(`Line items sum (${lineItemsSum}) doesn't match subtotal (${invoiceData.subtotal})`);
    }
  }

  // Date validation
  if (invoiceData.invoice_date && invoiceData.due_date) {
    const invoiceDate = new Date(invoiceData.invoice_date);
    const dueDate = new Date(invoiceData.due_date);

    if (dueDate < invoiceDate) {
      errors.push('Due date is before invoice date');
    }
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings
  };
}

// Usage
function processAndValidateInvoice(invoiceText) {
  const extracted = extractInvoiceData(invoiceText);
  const validation = validateExtractedInvoice(extracted.invoice_data);

  if (!validation.is_valid) {
    Logger.log('Validation failed:', validation.errors);
    // Send for manual review
    flagForManualReview(extracted, validation.errors);
  }

  return {
    ...extracted,
    validation
  };
}
```

---

## 📊 Table Parsing

### Challenge: Tables in PDF Text

**Problem**: PDF-to-text extraction loses table structure
```
Original table:
| Product | Qty | Price | Total |
| Widget A | 10 | $50 | $500 |

Extracted text (messy):
Product Qty Price Total
Widget A 10 $50 $500
```

---

### Table Parsing Strategy

**Prompt Claude to reconstruct structure**:
```javascript
function parseTableFromText(tableText) {
  const prompt = `
<task>
Parse this table data and return structured JSON.
</task>

<table_text>
${tableText}
</table_text>

<instructions>
1. Identify column headers
2. Parse each row
3. Return array of objects where keys are column headers
4. Convert numbers to proper types (not strings)
5. Handle currency symbols ($, €, etc.) by removing them
</instructions>

<output_format>
[
  {"column1": value1, "column2": value2, ...},
  {"column1": value1, "column2": value2, ...}
]
</output_format>
`;

  const response = callClaudeAPI(prompt);
  return JSON.parse(response.content[0].text);
}

// Usage: Parse invoice line items table
function parseInvoiceLineItems(invoiceText) {
  // Extract just the line items section
  const lineItemsPattern = /Line Items:?\n([\s\S]+?)\nSubtotal:/i;
  const match = invoiceText.match(lineItemsPattern);

  if (!match) {
    return [];
  }

  const tableText = match[1];
  const lineItems = parseTableFromText(tableText);

  Logger.log(`Parsed ${lineItems.length} line items`);
  return lineItems;
}
```

---

### Advanced Table Parsing with Few-Shot

```javascript
function parseComplexTable(tableText) {
  const prompt = `
<task>Parse this complex table with merged cells and multi-line entries</task>

<examples>
<example_1>
<input>
Product           Qty   Unit Price   Total
Widget A          10    $50.00       $500.00
  - Color: Red
  - SKU: WGT-A-RED
Widget B          5     $30.00       $150.00
</input>

<output>
[
  {
    "product": "Widget A",
    "quantity": 10,
    "unit_price": 50.00,
    "total": 500.00,
    "details": {"color": "Red", "sku": "WGT-A-RED"}
  },
  {
    "product": "Widget B",
    "quantity": 5,
    "unit_price": 30.00,
    "total": 150.00,
    "details": {}
  }
]
</output>
</example_1>
</examples>

<table_text>
${tableText}
</table_text>

<instructions>
Handle multi-line entries by grouping indented lines with the parent row.
</instructions>
`;

  return callClaudeAPI(prompt);
}
```

---

## 🔄 Multi-Document Comparison

### Use Case: Compare Invoice Versions

**Detect changes between document revisions**:
```javascript
function compareDocumentVersions(doc1Text, doc2Text, documentType = 'invoice') {
  const prompt = `
<task>
Compare these two ${documentType} versions and identify all changes.
</task>

<document_version_1>
${doc1Text}
</document_version_1>

<document_version_2>
${doc2Text}
</document_version_2>

<instructions>
1. Identify added, removed, and modified fields
2. For numeric changes, show old → new values
3. Highlight significant changes (amounts, dates, terms)
4. Flag any suspicious changes (e.g., total decreased)
</instructions>

<output_format>
{
  "changes": [
    {
      "field": "field_name",
      "type": "added|removed|modified",
      "old_value": "...",
      "new_value": "...",
      "significance": "high|medium|low"
    }
  ],
  "summary": "Brief summary of changes",
  "flags": ["suspicious change 1", "suspicious change 2"]
}
</output_format>
`;

  const response = callClaudeAPI(prompt, { maxTokens: 4096 });
  return JSON.parse(response.content[0].text);
}

// Usage
function reviewInvoiceRevision(originalInvoice, revisedInvoice) {
  const comparison = compareDocumentVersions(originalInvoice, revisedInvoice, 'invoice');

  // Alert on suspicious changes
  if (comparison.flags.length > 0) {
    Logger.log('⚠️ Suspicious changes detected:');
    comparison.flags.forEach(flag => Logger.log(`- ${flag}`));

    sendAlertEmail({
      subject: 'Invoice Revision Review Required',
      body: `Suspicious changes detected:\n${comparison.flags.join('\n')}`
    });
  }

  return comparison;
}
```

---

### Contract Change Analysis

```javascript
function analyzeContractChanges(originalContract, amendedContract) {
  const prompt = `
<role>Legal contract change analyst</role>

<task>
Analyze changes between original and amended contract versions.
Focus on material changes that affect obligations, liability, or payment terms.
</task>

<original_contract>
${originalContract}
</original_contract>

<amended_contract>
${amendedContract}
</amended_contract>

<focus_areas>
- Payment terms (amounts, schedules)
- Deliverable changes
- Liability caps
- Termination conditions
- Renewal terms
- Scope of work
</focus_areas>

<output_format>
{
  "material_changes": [
    {
      "section": "section name",
      "change_type": "added|removed|modified",
      "description": "clear explanation",
      "impact": "impact on parties",
      "risk_level": "high|medium|low"
    }
  ],
  "non_material_changes": ["list of minor changes"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "requires_legal_review": true|false,
  "summary": "Executive summary of changes"
}
</output_format>
`;

  return callClaudeAPI(prompt, { maxTokens: 8192 });
}
```

---

## 🏷️ Document Classification

### Automatic Document Type Detection

```javascript
function classifyDocument(documentText) {
  const prompt = `
<task>
Classify this document into one of the predefined types.
</task>

<document>
${documentText.substring(0, 2000)}
</document>

<document_types>
- invoice
- purchase_order
- receipt
- contract
- proposal
- statement
- delivery_note
- credit_note
- quote
- other
</document_types>

<output_format>
{
  "document_type": "one of the types above",
  "confidence": 0.95,
  "reasoning": "brief explanation of classification",
  "key_indicators": ["indicator 1", "indicator 2"]
}
</output_format>
`;

  const response = callClaudeAPI(prompt);
  const classification = JSON.parse(response.content[0].text);

  Logger.log(`Document classified as: ${classification.document_type} (${(classification.confidence * 100).toFixed(1)}% confident)`);

  return classification;
}

// Usage: Route documents to appropriate processors
function processDocument(documentText) {
  const classification = classifyDocument(documentText);

  switch (classification.document_type) {
    case 'invoice':
      return extractInvoiceData(documentText);

    case 'contract':
      return analyzeContract(documentText);

    case 'purchase_order':
      return extractPurchaseOrderData(documentText);

    default:
      Logger.log(`Unknown document type: ${classification.document_type}`);
      return { classification, raw_text: documentText };
  }
}
```

---

## 🔧 Handling OCR Errors

### OCR Error Correction with Claude

**Problem**: OCR output has errors (misread characters, formatting issues)

**Strategy**: Claude can infer correct values from context
```javascript
function correctOCRErrors(ocrText, documentType = 'invoice') {
  const prompt = `
<task>
Correct OCR errors in this ${documentType} text.
Use context to infer correct values for garbled text.
</task>

<ocr_text>
${ocrText}
</ocr_text>

<common_ocr_errors>
- 0 → O (zero to letter O)
- 1 → I or l
- 5 → S
- 8 → B
- Date formats scrambled (20Z4 → 2024)
- Currency symbols misread
</common_ocr_errors>

<instructions>
1. Identify likely OCR errors based on context
2. Correct them using business logic
3. Flag any corrections you made
4. If uncertain, leave original and flag for review
</instructions>

<output_format>
{
  "corrected_text": "...",
  "corrections": [
    {"original": "20Z4-01-15", "corrected": "2024-01-15", "confidence": 0.95}
  ],
  "uncertain_sections": ["section that needs human review"]
}
</output_format>
`;

  const response = callClaudeAPI(prompt);
  const result = JSON.parse(response.content[0].text);

  if (result.corrections.length > 0) {
    Logger.log(`Made ${result.corrections.length} OCR corrections`);
  }

  return result;
}

// Usage: Pre-process OCR text before extraction
function processScannedInvoice(ocrText) {
  // Step 1: Correct OCR errors
  const corrected = correctOCRErrors(ocrText, 'invoice');

  // Step 2: Extract structured data from corrected text
  const extracted = extractInvoiceData(corrected.corrected_text);

  return {
    invoice_data: extracted,
    ocr_corrections: corrected.corrections,
    review_required: corrected.uncertain_sections.length > 0
  };
}
```

---

## ✅ Document Processing Best Practices

### Checklist

- [x] **Chunk large documents** - Use semantic or token-based chunking
- [x] **Validate extracted data** - Math checks, required fields, date logic
- [x] **Use few-shot examples** - Show desired output format
- [x] **Specify output structure** - JSON schema with types
- [x] **Handle partial failures** - Process what you can, flag issues
- [x] **Cache processed documents** - Avoid re-processing same document
- [x] **Preserve source for audit** - Keep original text for review
- [x] **Test with variety of formats** - Different vendors, layouts
- [x] **Log confidence scores** - Track extraction quality over time
- [x] **Route low-confidence to review** - Human-in-the-loop for edge cases

---

### Anti-Patterns to Avoid

**❌ Processing entire 200-page PDF in one call**:
```javascript
// BAD: Will hit token limits or be very slow
const result = callClaudeAPI(massivePDF); // 500K tokens!
```

**✅ Chunk and process incrementally**:
```javascript
// GOOD
const chunks = chunkByTokenLimit(massivePDF, 30000);
const results = chunks.map(chunk => processChunk(chunk));
```

---

**❌ No validation of extracted data**:
```javascript
// BAD: Blindly trust AI output
const invoice = extractInvoiceData(text);
saveToDB(invoice); // What if total is wrong?
```

**✅ Validate before persisting**:
```javascript
// GOOD
const invoice = extractInvoiceData(text);
const validation = validateExtractedInvoice(invoice);

if (validation.is_valid) {
  saveToDB(invoice);
} else {
  flagForReview(invoice, validation.errors);
}
```

---

## 🔗 Related Files

- `document-processing-specialist.md` - PDF extraction with Drive/Docs
- `ai-integration/context-management.md` - Managing large document context
- `ai-integration/prompt-engineering.md` - Extraction prompt patterns
- `ai-integration/token-optimization.md` - Reducing token usage for large docs

---

**Versione**: 1.0
**Context Size**: ~750 righe
