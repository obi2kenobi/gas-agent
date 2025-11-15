# 🔴 Advanced Learning Path

**Build complex, scalable systems with AI integration**

---

## Overview

**Duration**: 3-5 days
**Prerequisites**: Completed Intermediate Path OR extensive GAS experience
**Goal**: Architect and build enterprise-grade, AI-powered systems

By the end of this path, you'll be able to:
- ✅ Design scalable system architectures
- ✅ Integrate Claude AI for document processing
- ✅ Build complex ETL pipelines
- ✅ Implement monitoring and observability
- ✅ Apply advanced design patterns
- ✅ Build production-ready AI applications

---

## Module 1: System Architecture & Design Patterns (4-6 hours)

### Why Architecture Matters?

As systems grow:
- More components to coordinate
- More failure points
- Harder to maintain
- Performance becomes critical

Good architecture provides:
- Clear separation of concerns
- Testable components
- Maintainable codebase
- Scalable foundation

### Key Patterns for GAS

#### 1. Repository Pattern

Separates data access from business logic:

```javascript
/**
 * Repository Pattern - Data Access Layer
 *
 * Learn more: docs/deep/architecture/patterns.md
 */

/**
 * Order Repository - handles all order data operations
 */
const OrderRepository = (function() {
  const SHEET_NAME = 'Orders';

  /**
   * Find order by ID
   */
  function findById(orderId) {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === orderId) {
        return mapRowToOrder(data[i]);
      }
    }

    return null;
  }

  /**
   * Find all orders matching criteria
   */
  function findAll(criteria = {}) {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();

    return data.slice(1) // Skip header
      .filter(row => matchesCriteria(row, criteria))
      .map(mapRowToOrder);
  }

  /**
   * Save new order
   */
  function save(order) {
    validateOrder(order);

    const sheet = getSheet();

    // Check if exists
    const existing = findById(order.id);
    if (existing) {
      return update(order);
    }

    // Insert new
    const row = mapOrderToRow(order);
    sheet.appendRow(row);

    Logger.log(`✓ Order ${order.id} created`);
    return order;
  }

  /**
   * Update existing order
   */
  function update(order) {
    validateOrder(order);

    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === order.id) {
        const row = mapOrderToRow(order);
        sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
        Logger.log(`✓ Order ${order.id} updated`);
        return order;
      }
    }

    throw new Error(`Order ${order.id} not found`);
  }

  /**
   * Delete order
   */
  function deleteById(orderId) {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === orderId) {
        sheet.deleteRow(i + 1);
        Logger.log(`✓ Order ${orderId} deleted`);
        return true;
      }
    }

    return false;
  }

  // Private helpers

  function getSheet() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error(`Sheet "${SHEET_NAME}" not found`);
    }

    return sheet;
  }

  function mapRowToOrder(row) {
    return {
      id: row[0],
      documentNumber: row[1],
      customerId: row[2],
      customerName: row[3],
      total: row[4],
      status: row[5],
      createdAt: row[6],
      updatedAt: row[7]
    };
  }

  function mapOrderToRow(order) {
    return [
      order.id,
      order.documentNumber,
      order.customerId,
      order.customerName,
      order.total,
      order.status,
      order.createdAt || new Date(),
      new Date()
    ];
  }

  function matchesCriteria(row, criteria) {
    if (criteria.status && row[5] !== criteria.status) {
      return false;
    }
    if (criteria.customerId && row[2] !== criteria.customerId) {
      return false;
    }
    return true;
  }

  function validateOrder(order) {
    if (!order.id) throw new Error('Order ID is required');
    if (!order.customerId) throw new Error('Customer ID is required');
    if (order.total < 0) throw new Error('Total must be positive');
  }

  return {
    findById,
    findAll,
    save,
    update,
    deleteById
  };
})();
```

#### 2. Service Layer Pattern

Business logic layer that uses repositories:

```javascript
/**
 * Order Service - Business Logic Layer
 */
const OrderService = (function() {

  /**
   * Sync orders from Business Central
   */
  function syncFromBC(options = {}) {
    const { since, status } = options;

    try {
      // Fetch from BC API
      const bcOrders = BCClient.getOrders({ since, status });
      Logger.log(`Fetched ${bcOrders.length} orders from BC`);

      // Transform and validate
      const orders = bcOrders.map(transformBCOrder);

      // Save to repository
      let created = 0;
      let updated = 0;

      for (const order of orders) {
        const existing = OrderRepository.findById(order.id);
        if (existing) {
          OrderRepository.update(order);
          updated++;
        } else {
          OrderRepository.save(order);
          created++;
        }
      }

      Logger.log(`✓ Sync complete: ${created} created, ${updated} updated`);

      return { created, updated, total: orders.length };

    } catch (error) {
      Logger.log(`✗ Sync failed: ${error.message}`);
      throw new Error(`Order sync failed: ${error.message}`);
    }
  }

  /**
   * Get orders for customer
   */
  function getCustomerOrders(customerId) {
    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    return OrderRepository.findAll({ customerId });
  }

  /**
   * Calculate customer total
   */
  function getCustomerTotal(customerId) {
    const orders = getCustomerOrders(customerId);
    return orders.reduce((sum, order) => sum + order.total, 0);
  }

  /**
   * Get pending orders (business rule)
   */
  function getPendingOrders() {
    return OrderRepository.findAll({ status: 'Open' })
      .filter(order => {
        // Business rule: orders >30 days old are stale
        const daysOld = (new Date() - order.createdAt) / (1000 * 60 * 60 * 24);
        return daysOld <= 30;
      });
  }

  // Private helpers

  function transformBCOrder(bcOrder) {
    return {
      id: bcOrder.id,
      documentNumber: bcOrder.number,
      customerId: bcOrder.customerId,
      customerName: bcOrder.customerName,
      total: bcOrder.totalAmountIncludingTax,
      status: bcOrder.status,
      createdAt: new Date(bcOrder.orderDate)
    };
  }

  return {
    syncFromBC,
    getCustomerOrders,
    getCustomerTotal,
    getPendingOrders
  };
})();
```

**Benefits:**
- Repository handles all data access
- Service contains business logic
- Easy to test each layer independently
- Changes to data source don't affect business logic

**Learn more**: [Solution Architect - Patterns](../../deep/architecture/patterns.md)

---

## Module 2: Claude AI Integration (6-8 hours)

### AI-Powered Document Processing

Build a system that processes PDFs with Claude AI to extract structured data.

**Use Case**: Extract invoice data from PDF files

```javascript
/**
 * Claude AI Client for Document Processing
 *
 * Learn more: docs/deep/ai-integration/api-setup.md
 */
const ClaudeClient = (function() {

  const API_BASE = 'https://api.anthropic.com/v1';
  const MODEL = 'claude-3-5-sonnet-20241022';

  /**
   * Extract invoice data from PDF
   */
  function extractInvoiceData(pdfContent, options = {}) {
    const {
      format = 'xml', // xml for complex prompts
      useCache = true
    } = options;

    // Build cache key
    const cacheKey = `invoice_extract_${hashContent(pdfContent)}`;

    if (useCache) {
      const cached = CacheManager.get(cacheKey);
      if (cached) {
        Logger.log('Using cached extraction');
        return JSON.parse(cached);
      }
    }

    // Build prompt with XML structure
    const prompt = buildExtractionPrompt(pdfContent);

    // Call Claude API
    const response = callClaudeAPI({
      model: MODEL,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Parse response
    const extracted = parseExtractionResponse(response);

    // Cache result (24 hour TTL)
    if (useCache) {
      CacheManager.put(cacheKey, JSON.stringify(extracted), 86400);
    }

    return extracted;
  }

  /**
   * Build XML-structured prompt for extraction
   */
  function buildExtractionPrompt(pdfContent) {
    return `
<task>
Extract structured invoice data from the provided document.
</task>

<document>
${pdfContent}
</document>

<instructions>
1. Identify the following fields:
   - Invoice number
   - Invoice date
   - Vendor name and address
   - Customer name and address
   - Line items (description, quantity, unit price, total)
   - Subtotal
   - Tax amount
   - Total amount

2. Validate extracted data:
   - Ensure amounts are numeric
   - Check that subtotal + tax = total
   - Verify dates are in ISO format

3. Return JSON with this structure:
{
  "invoiceNumber": "string",
  "invoiceDate": "YYYY-MM-DD",
  "vendor": {
    "name": "string",
    "address": "string"
  },
  "customer": {
    "name": "string",
    "address": "string"
  },
  "lineItems": [
    {
      "description": "string",
      "quantity": number,
      "unitPrice": number,
      "total": number
    }
  ],
  "subtotal": number,
  "tax": number,
  "total": number,
  "confidence": "high|medium|low"
}
</instructions>

<examples>
<example>
<input>
Invoice #INV-001
Date: 2025-01-15
From: Acme Corp, 123 Main St
To: Widget LLC, 456 Oak Ave

Items:
- Widget A (10 @ $5.00) = $50.00
- Widget B (5 @ $10.00) = $50.00

Subtotal: $100.00
Tax: $10.00
Total: $110.00
</input>

<output>
{
  "invoiceNumber": "INV-001",
  "invoiceDate": "2025-01-15",
  "vendor": {
    "name": "Acme Corp",
    "address": "123 Main St"
  },
  "customer": {
    "name": "Widget LLC",
    "address": "456 Oak Ave"
  },
  "lineItems": [
    {
      "description": "Widget A",
      "quantity": 10,
      "unitPrice": 5.00,
      "total": 50.00
    },
    {
      "description": "Widget B",
      "quantity": 5,
      "unitPrice": 10.00,
      "total": 50.00
    }
  ],
  "subtotal": 100.00,
  "tax": 10.00,
  "total": 110.00,
  "confidence": "high"
}
</output>
</example>
</examples>

<output_format>
Return only valid JSON, no additional text or markdown formatting.
</output_format>
    `.trim();
  }

  /**
   * Call Claude API with retry
   */
  function callClaudeAPI(request) {
    const apiKey = getConfig('CLAUDE_API_KEY');
    const url = `${API_BASE}/messages`;

    return retryWithBackoff(() => {
      const response = UrlFetchApp.fetch(url, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        payload: JSON.stringify(request),
        muteHttpExceptions: true
      });

      const statusCode = response.getResponseCode();

      if (statusCode === 429) {
        throw new Error('Rate limit - will retry');
      }

      if (statusCode !== 200) {
        throw new Error(`Claude API error: ${response.getContentText()}`);
      }

      const data = JSON.parse(response.getContentText());
      return data.content[0].text;

    }, { maxRetries: 3, initialDelay: 2000 });
  }

  /**
   * Parse extraction response
   */
  function parseExtractionResponse(response) {
    try {
      // Claude should return clean JSON
      return JSON.parse(response);
    } catch (error) {
      Logger.log(`Failed to parse response: ${response}`);
      throw new Error('Invalid JSON response from Claude');
    }
  }

  /**
   * Hash content for caching
   */
  function hashContent(content) {
    return Utilities.computeDigest(
      Utilities.DigestAlgorithm.MD5,
      content
    ).map(byte => (byte & 0xFF).toString(16).padStart(2, '0')).join('');
  }

  return {
    extractInvoiceData
  };
})();

/**
 * Complete Invoice Processing Pipeline
 */
function processInvoicePipeline() {
  // 1. Get PDFs from Drive
  const folder = DriveApp.getFolderById(getConfig('INVOICE_FOLDER_ID'));
  const files = folder.getFilesByType(MimeType.PDF);

  let processed = 0;
  let errors = 0;

  while (files.hasNext()) {
    const file = files.next();

    try {
      Logger.log(`Processing: ${file.getName()}`);

      // 2. Extract text from PDF
      const pdfBlob = file.getBlob();
      const pdfText = extractTextFromPDF(pdfBlob);

      // 3. Extract structured data with Claude
      const invoiceData = ClaudeClient.extractInvoiceData(pdfText);

      // 4. Validate
      validateInvoiceData(invoiceData);

      // 5. Save to Sheets
      saveInvoiceToSheet(invoiceData, file.getName());

      // 6. Move to processed folder
      const processedFolder = DriveApp.getFolderById(getConfig('PROCESSED_FOLDER_ID'));
      file.moveTo(processedFolder);

      processed++;

    } catch (error) {
      Logger.log(`Error processing ${file.getName()}: ${error.message}`);
      errors++;

      // Move to error folder
      const errorFolder = DriveApp.getFolderById(getConfig('ERROR_FOLDER_ID'));
      file.moveTo(errorFolder);
    }
  }

  Logger.log(`✓ Pipeline complete: ${processed} processed, ${errors} errors`);

  return { processed, errors };
}
```

**Token Optimization:**
- Response caching: 73% hit rate → 73% token savings
- Prompt caching (Claude): Reuse system prompts
- Model selection: Use Haiku for simple tasks, Sonnet for complex

**Learn more**:
- [AI Integration Specialist](../../specialists/ai-integration-specialist.md)
- [Prompt Engineering](../../deep/ai-integration/prompt-engineering.md)
- [Token Optimization](../../deep/ai-integration/token-optimization.md)

---

## Module 3: Advanced ETL Pipelines (4-6 hours)

Build complex data pipelines with transformation, validation, and error recovery.

```javascript
/**
 * Advanced ETL Pipeline
 *
 * Extracts orders from BC, transforms with business rules,
 * loads to Sheets with validation
 *
 * Learn more: docs/deep/data/etl-patterns.md
 */
const ETLPipeline = (function() {

  /**
   * Run complete ETL pipeline
   */
  function run(options = {}) {
    const {
      batchSize = 1000,
      useCheckpoints = true
    } = options;

    try {
      Logger.log('=== ETL Pipeline Starting ===');

      const checkpoint = useCheckpoints ? loadCheckpoint() : null;
      const startFrom = checkpoint ? checkpoint.lastProcessedId : null;

      // Extract
      const rawData = extract(startFrom, batchSize);
      Logger.log(`Extracted ${rawData.length} records`);

      // Transform
      const transformed = transform(rawData);
      Logger.log(`Transformed ${transformed.valid.length} valid, ${transformed.invalid.length} invalid`);

      // Load
      load(transformed.valid);
      Logger.log(`Loaded ${transformed.valid.length} records`);

      // Handle errors
      if (transformed.invalid.length > 0) {
        logErrors(transformed.invalid);
        sendErrorReport(transformed.invalid);
      }

      // Save checkpoint
      if (useCheckpoints) {
        saveCheckpoint({
          lastProcessedId: getLastId(rawData),
          timestamp: new Date(),
          recordsProcessed: transformed.valid.length
        });
      }

      Logger.log('=== ETL Pipeline Complete ===');

      return {
        extracted: rawData.length,
        valid: transformed.valid.length,
        invalid: transformed.invalid.length
      };

    } catch (error) {
      Logger.log(`✗ Pipeline failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract data from source
   */
  function extract(startFrom, batchSize) {
    const url = buildExtractionURL(startFrom, batchSize);
    const token = OAuth2Manager.getToken();

    return fetchWithRetry(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).value;
  }

  /**
   * Transform with business rules
   */
  function transform(rawData) {
    const valid = [];
    const invalid = [];

    for (const record of rawData) {
      try {
        // Apply transformations
        const transformed = applyTransformations(record);

        // Validate
        const validation = validateRecord(transformed);

        if (validation.valid) {
          valid.push(transformed);
        } else {
          invalid.push({
            record: record,
            errors: validation.errors
          });
        }

      } catch (error) {
        invalid.push({
          record: record,
          errors: [error.message]
        });
      }
    }

    return { valid, invalid };
  }

  /**
   * Apply transformation rules
   */
  function applyTransformations(record) {
    return {
      // Map fields
      id: record.id,
      orderNumber: record.number,
      customer: record.sellToCustomerName,

      // Calculate derived fields
      totalItems: record.salesOrderLines
        .reduce((sum, line) => sum + line.quantity, 0),

      // Normalize data
      status: normalizeStatus(record.status),

      // Format dates
      orderDate: Utilities.formatDate(
        new Date(record.orderDate),
        'GMT',
        'yyyy-MM-dd'
      ),

      // Business logic
      priority: calculatePriority(record),

      // Add metadata
      processedAt: new Date(),
      version: '1.0'
    };
  }

  /**
   * Validate transformed record
   */
  function validateRecord(record) {
    const errors = [];

    // Required fields
    if (!record.id) errors.push('Missing ID');
    if (!record.orderNumber) errors.push('Missing order number');
    if (!record.customer) errors.push('Missing customer');

    // Business rules
    if (record.totalItems <= 0) {
      errors.push('Order must have at least one item');
    }

    // Data integrity
    if (record.status === 'Shipped' && !record.shipDate) {
      errors.push('Shipped orders must have ship date');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Load to destination
   */
  function load(records) {
    if (records.length === 0) return;

    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName('ETL_Output');

    // Transform to 2D array
    const values = records.map(r => [
      r.id,
      r.orderNumber,
      r.customer,
      r.totalItems,
      r.status,
      r.orderDate,
      r.priority,
      r.processedAt
    ]);

    // Batch write
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, values.length, 8).setValues(values);
  }

  /**
   * Checkpoint management for long-running jobs
   */
  function loadCheckpoint() {
    const props = PropertiesService.getScriptProperties();
    const checkpoint = props.getProperty('etl_checkpoint');
    return checkpoint ? JSON.parse(checkpoint) : null;
  }

  function saveCheckpoint(checkpoint) {
    PropertiesService.getScriptProperties()
      .setProperty('etl_checkpoint', JSON.stringify(checkpoint));
  }

  // Helper functions
  function normalizeStatus(status) {
    const statusMap = {
      'Open': 'OPEN',
      'Released': 'RELEASED',
      'Pending Approval': 'PENDING',
      'Shipped': 'SHIPPED'
    };
    return statusMap[status] || 'UNKNOWN';
  }

  function calculatePriority(record) {
    const total = record.salesOrderLines
      .reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);

    if (total > 10000) return 'HIGH';
    if (total > 1000) return 'MEDIUM';
    return 'LOW';
  }

  function buildExtractionURL(startFrom, batchSize) {
    let url = `${getConfig('BC_BASE_URL')}/salesOrders?$top=${batchSize}`;
    if (startFrom) {
      url += `&$filter=id gt '${startFrom}'`;
    }
    return url;
  }

  function getLastId(records) {
    return records.length > 0 ? records[records.length - 1].id : null;
  }

  function logErrors(invalid) {
    invalid.forEach(item => {
      Logger.log(`Invalid record ${item.record.id}: ${item.errors.join(', ')}`);
    });
  }

  function sendErrorReport(invalid) {
    if (invalid.length === 0) return;

    const body = `
ETL Pipeline Errors

Total invalid records: ${invalid.length}

Details:
${invalid.map(item =>
  `- Record ${item.record.id}: ${item.errors.join(', ')}`
).join('\n')}
    `.trim();

    MailApp.sendEmail({
      to: getConfig('ERROR_EMAIL'),
      subject: '⚠️ ETL Pipeline Errors',
      body: body
    });
  }

  return {
    run
  };
})();
```

**Learn more**: [Data Engineer - ETL Patterns](../../deep/data/etl-patterns.md)

---

## Module 4: Monitoring & Observability (3-4 hours)

### Building a Monitoring System

```javascript
/**
 * Comprehensive Monitoring System
 *
 * Learn more: docs/deep/platform/monitoring.md
 */
const MonitoringService = (function() {

  /**
   * Record metric
   */
  function recordMetric(name, value, tags = {}) {
    const metric = {
      name: name,
      value: value,
      tags: tags,
      timestamp: new Date().toISOString()
    };

    // Store in Sheets for analysis
    saveMetric(metric);

    // Check thresholds
    checkThreshold(metric);

    Logger.log(`Metric: ${name}=${value} ${JSON.stringify(tags)}`);
  }

  /**
   * Health check
   */
  function healthCheck() {
    const checks = {
      oauth: checkOAuth(),
      bcAPI: checkBCAPI(),
      sheets: checkSheets(),
      cache: checkCache()
    };

    const allHealthy = Object.values(checks).every(c => c.healthy);

    if (!allHealthy) {
      sendHealthAlert(checks);
    }

    return {
      healthy: allHealthy,
      checks: checks,
      timestamp: new Date()
    };
  }

  /**
   * Performance profiler
   */
  function profile(name, fn) {
    const startTime = Date.now();
    const startMemory = getMemoryUsage();

    try {
      const result = fn();
      const duration = Date.now() - startTime;
      const memoryUsed = getMemoryUsage() - startMemory;

      recordMetric('execution_time', duration, { operation: name });
      recordMetric('memory_used', memoryUsed, { operation: name });

      Logger.log(`✓ ${name}: ${duration}ms, ${memoryUsed} bytes`);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      recordMetric('error', 1, { operation: name, error: error.message });
      Logger.log(`✗ ${name} failed after ${duration}ms: ${error.message}`);
      throw error;
    }
  }

  // Private functions

  function checkOAuth() {
    try {
      OAuth2Manager.getToken();
      return { healthy: true };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  function checkBCAPI() {
    try {
      const url = `${getConfig('BC_BASE_URL')}/companies`;
      const token = OAuth2Manager.getToken();

      const response = UrlFetchApp.fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
        muteHttpExceptions: true
      });

      return {
        healthy: response.getResponseCode() === 200,
        latency: response.getResponseTime()
      };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  function checkSheets() {
    try {
      SpreadsheetApp.getActiveSpreadsheet().getName();
      return { healthy: true };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  function checkCache() {
    try {
      CacheService.getScriptCache().get('test');
      return { healthy: true };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  function getMemoryUsage() {
    // Approximate memory usage
    return typeof Process !== 'undefined' ? Process.memoryUsage().heapUsed : 0;
  }

  function saveMetric(metric) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName('Metrics');

    sheet.appendRow([
      metric.timestamp,
      metric.name,
      metric.value,
      JSON.stringify(metric.tags)
    ]);
  }

  function checkThreshold(metric) {
    const thresholds = {
      'execution_time': 10000, // 10 seconds
      'error': 0, // Any error is bad
      'cache_miss_rate': 0.5 // 50%
    };

    const threshold = thresholds[metric.name];
    if (threshold && metric.value > threshold) {
      Logger.log(`⚠️ Threshold exceeded: ${metric.name}=${metric.value} > ${threshold}`);
      // Could send alert here
    }
  }

  function sendHealthAlert(checks) {
    const unhealthy = Object.entries(checks)
      .filter(([_, check]) => !check.healthy)
      .map(([name, check]) => `- ${name}: ${check.error || 'unhealthy'}`)
      .join('\n');

    MailApp.sendEmail({
      to: getConfig('ALERT_EMAIL'),
      subject: '🚨 System Health Alert',
      body: `Unhealthy components:\n\n${unhealthy}`
    });
  }

  return {
    recordMetric,
    healthCheck,
    profile
  };
})();

/**
 * Example: Monitor order sync with profiling
 */
function monitoredOrderSync() {
  return MonitoringService.profile('order_sync', () => {
    const result = OrderService.syncFromBC();

    MonitoringService.recordMetric('orders_synced', result.total, {
      created: result.created,
      updated: result.updated
    });

    return result;
  });
}
```

**Learn more**: [Platform Engineer - Monitoring](../../deep/platform/monitoring.md)

---

## Final Project: Enterprise Document Processing System

Build a complete, production-ready system that combines all advanced concepts:

**System Requirements:**
1. Monitor Drive folder for new PDF invoices
2. Extract structured data using Claude AI
3. Validate and transform data
4. Load to Sheets database (using Repository pattern)
5. Send notifications on success/failure
6. Comprehensive monitoring and health checks
7. Hourly incremental processing
8. Error recovery with checkpoints

**Success Criteria:**
✅ Processes 100+ PDFs/hour
✅ 95%+ extraction accuracy
✅ <5 second per document processing time
✅ Automatic error recovery
✅ Complete audit trail
✅ Health monitoring dashboard
✅ Token optimization (70%+ cache hit rate)
✅ Zero downtime deployments

---

## Congratulations! 🎉

You've completed the Advanced Learning Path!

### What You Mastered

✅ System architecture with Repository/Service patterns
✅ Claude AI integration for document processing
✅ Complex ETL pipelines with validation
✅ Comprehensive monitoring and observability
✅ Production-ready system design
✅ Performance optimization at scale

### You're Now Ready To:

- 🏗️ **Architect complex systems** from scratch
- 🤖 **Build AI-powered applications** with Claude
- 📊 **Design robust data pipelines**
- 🔍 **Implement production monitoring**
- 🚀 **Deploy enterprise-grade solutions**

### Continue Learning

**Explore specialists for deeper knowledge:**
- [Solution Architect](../../specialists/solution-architect.md)
- [AI Integration Specialist](../../specialists/ai-integration-specialist.md)
- [Data Engineer](../../specialists/data-engineer.md)
- [Platform Engineer](../../specialists/platform-engineer.md)

**Or use the Orchestrator:**
- [ORCHESTRATOR.md](../../ORCHESTRATOR.md) - For complete project coordination

---

**You're now an expert GAS developer! Go build amazing things! 🚀**
