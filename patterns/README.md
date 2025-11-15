# 📚 Common Patterns Library

Ready-to-use code patterns for Google Apps Script. Copy any pattern and use it immediately in your project!

## 📋 Available Patterns

| Pattern File | What It Contains | Use When |
|--------------|------------------|----------|
| **CommonPatterns.gs** | General utilities (config, logging, dates, arrays, sheets, email) | Every project |

## 🚀 Quick Start

### 1. Copy the Pattern File

Copy `CommonPatterns.gs` to your Apps Script project.

### 2. Use Any Function

All functions are independent - use what you need!

```javascript
// Example: Log with timestamp
logInfo('Processing started');
log Error('Failed to fetch data', { error: 'Network timeout' });

// Example: Retry with exponential backoff
const result = retryWithBackoff(() => {
  return UrlFetchApp.fetch('https://api.example.com/data');
}, 3, 1000);

// Example: Write data to sheet
writeToSheet('Results', [
  ['Name', 'Email', 'Amount'],
  ['John', 'john@example.com', 100]
], true); // clearFirst = true
```

## 📖 Pattern Categories

### 1. Configuration Management

**Store and retrieve configuration securely:**

```javascript
// Set configuration
setConfig('API_KEY', 'your-api-key');
setConfig('MAX_RETRIES', '3');

// Get configuration with fallback
const apiKey = getConfig('API_KEY', 'default-key');
const maxRetries = parseInt(getConfig('MAX_RETRIES', '5'));

// Get all config
const allConfig = getAllConfig();
```

**Benefits:**
- ✅ Secure storage in PropertiesService
- ✅ No hardcoded values
- ✅ Easy to change without code edits
- ✅ Fallback defaults

---

### 2. Logging & Debugging

**Enhanced logging with timestamps and levels:**

```javascript
// Structured logging
logInfo('User logged in', { userId: '123', email: 'user@example.com' });
logWarn('API rate limit approaching', { remaining: 10 });
logError('Database connection failed', { error: error.message });

// Measure execution time
const result = logExecutionTime('Fetch Data', () => {
  return UrlFetchApp.fetch('https://api.example.com/data');
});
// Logs: "Fetch Data completed in 234ms"
```

**Benefits:**
- ✅ ISO timestamps
- ✅ Log levels (INFO, WARN, ERROR)
- ✅ Structured data logging
- ✅ Performance monitoring

---

### 3. Date & Time Utilities

**Common date operations made easy:**

```javascript
// Format dates
const today = formatDate(); // "2025-01-15"
const timestamp = formatISO(); // "2025-01-15T10:30:00.000Z"

// Date ranges
const last30Days = getDateRange(30);
// { start: "2024-12-16", end: "2025-01-15" }

// Check date range
if (isDateInRange('2025-01-10', '2025-01-01', '2025-01-31')) {
  Logger.log('Date is in January 2025');
}

// Parse ISO strings
const date = parseISO('2025-01-15T10:30:00.000Z');
```

**Benefits:**
- ✅ Consistent date formatting
- ✅ Timezone-aware
- ✅ Range calculations
- ✅ ISO 8601 support

---

### 4. String & Formatting

**String manipulation and formatting:**

```javascript
// Slugify (URL-safe strings)
slugify('Hello World! 2025'); // "hello-world-2025"

// Truncate long text
truncate('This is a very long text...', 20); // "This is a very lo..."

// Format numbers
formatCurrency(1234.56); // "$1,234.56"
formatNumber(1234567); // "1,234,567"
```

**Benefits:**
- ✅ URL-safe strings
- ✅ Display-friendly formatting
- ✅ Consistent number display
- ✅ Currency formatting

---

### 5. Array & Object Utilities

**Array and object manipulation:**

```javascript
// Chunk large arrays
const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const batches = chunkArray(items, 3);
// [[1,2,3], [4,5,6], [7,8,9], [10]]

// Remove duplicates
const unique = unique([1, 2, 2, 3, 3, 3]); // [1, 2, 3]

// Group by property
const orders = [
  { status: 'pending', amount: 100 },
  { status: 'complete', amount: 200 },
  { status: 'pending', amount: 150 }
];
const grouped = groupBy(orders, 'status');
// { pending: [...], complete: [...] }

// Deep clone (avoid reference issues)
const original = { a: { b: 1 } };
const copy = deepClone(original);
copy.a.b = 2; // original unchanged!

// Deep merge objects
const defaults = { timeout: 30, retries: 3 };
const options = { retries: 5 };
const config = deepMerge(defaults, options);
// { timeout: 30, retries: 5 }
```

**Benefits:**
- ✅ Batch processing
- ✅ Data deduplication
- ✅ Grouping and aggregation
- ✅ Safe object operations

---

### 6. Sheets Operations

**Common Google Sheets operations:**

```javascript
// Get or create sheet
const sheet = getOrCreateSheet('MyData');
// Creates if doesn't exist, returns if exists

// Clear data (keep header)
clearSheetData('MyData');

// Write data (batch operation - fast!)
writeToSheet('Results', [
  ['Name', 'Email', 'Status'],
  ['John', 'john@example.com', 'Active'],
  ['Jane', 'jane@example.com', 'Pending']
], true); // clearFirst

// Read sheet as objects
const records = readSheetAsObjects('Customers');
// [ { Name: 'John', Email: 'john@example.com', ... }, ... ]

records.forEach(record => {
  Logger.log(`Customer: ${record.Name}, ${record.Email}`);
});
```

**Benefits:**
- ✅ Automatic sheet creation
- ✅ Batch operations (fast!)
- ✅ Object-based access
- ✅ Clean data management

---

### 7. Email Notifications

**Send email notifications:**

```javascript
// Simple text email
sendEmail(
  'user@example.com',
  '✅ Process Complete',
  'Your data export completed successfully'
);

// HTML email
sendHTMLEmail(
  'user@example.com',
  '📊 Daily Report',
  `
    <h2>Daily Report</h2>
    <p>Records processed: <strong>1,234</strong></p>
    <p>Status: <span style="color: green;">✅ Success</span></p>
  `
);

// Error notification
try {
  // your code
} catch (error) {
  sendErrorNotification(
    'admin@example.com',
    'processData',
    error
  );
}
```

**Benefits:**
- ✅ Simple API
- ✅ HTML support
- ✅ Error reporting
- ✅ Automatic logging

---

### 8. Retry & Resilience

**Handle transient failures gracefully:**

```javascript
// Retry with exponential backoff
const data = retryWithBackoff(() => {
  return UrlFetchApp.fetch('https://api.example.com/data');
}, 3, 1000); // 3 retries, 1s initial delay
// Retries at: 1s, 2s, 4s if needed

// Execute with timeout
const result = withTimeout(() => {
  // Potentially slow operation
  return heavyComputation();
}, 5000, null); // 5 second timeout, return null on timeout

// Safe execute (never throws)
const safeResult = safeExecute(() => {
  return riskyOperation();
}, { default: 'value' }); // Returns default on error
```

**Benefits:**
- ✅ Handles network hiccups
- ✅ Automatic retry logic
- ✅ Timeout protection
- ✅ Graceful degradation

---

## 💡 Complete Examples

### Example 1: Data Export with Error Handling

```javascript
function exportDataWithErrorHandling() {
  const adminEmail = getConfig('ADMIN_EMAIL', 'admin@example.com');

  try {
    logInfo('Starting data export');

    // Fetch data with retry
    const data = retryWithBackoff(() => {
      return UrlFetchApp.fetch('https://api.example.com/data');
    }, 3, 2000);

    const json = JSON.parse(data.getContentText());

    // Transform to sheet format
    const rows = [['ID', 'Name', 'Amount']];
    json.items.forEach(item => {
      rows.push([item.id, item.name, item.amount]);
    });

    // Write to sheet
    writeToSheet('Export_' + formatDate(), rows, true);

    // Send success notification
    sendEmail(
      adminEmail,
      '✅ Export Complete',
      `Exported ${rows.length - 1} records at ${formatISO()}`
    );

    logInfo('Export completed', { recordCount: rows.length - 1 });

  } catch (error) {
    logError('Export failed', { error: error.message });
    sendErrorNotification(adminEmail, 'exportDataWithErrorHandling', error);
    throw error;
  }
}
```

### Example 2: Batch Processing

```javascript
function processBatchData() {
  logInfo('Starting batch processing');

  // Read data from sheet
  const records = readSheetAsObjects('InputData');
  logInfo(`Loaded ${records.length} records`);

  // Process in chunks (avoid quota limits)
  const chunks = chunkArray(records, 10);
  const results = [];

  chunks.forEach((chunk, i) => {
    logInfo(`Processing chunk ${i + 1}/${chunks.length}`);

    // Process chunk
    const chunkResults = chunk.map(record => {
      return retryWithBackoff(() => {
        // Process each record
        return processRecord(record);
      }, 2, 1000);
    });

    results.push(...chunkResults);

    // Sleep between chunks to avoid rate limits
    if (i < chunks.length - 1) {
      Utilities.sleep(2000);
    }
  });

  // Write results
  const outputRows = [['ID', 'Status', 'Result']];
  results.forEach(result => {
    outputRows.push([result.id, result.status, result.message]);
  });

  writeToSheet('Results_' + formatDate(), outputRows, true);

  logInfo('Batch processing complete', {
    totalRecords: records.length,
    successCount: results.filter(r => r.status === 'success').length
  });
}

function processRecord(record) {
  // Your processing logic here
  return {
    id: record.ID,
    status: 'success',
    message: 'Processed successfully'
  };
}
```

### Example 3: Configuration-Driven Workflow

```javascript
function configDrivenWorkflow() {
  // Load configuration
  const config = {
    apiUrl: getConfig('API_URL', 'https://api.example.com'),
    maxRetries: parseInt(getConfig('MAX_RETRIES', '3')),
    batchSize: parseInt(getConfig('BATCH_SIZE', '10')),
    notifyEmail: getConfig('NOTIFY_EMAIL', 'admin@example.com'),
    outputSheet: getConfig('OUTPUT_SHEET', 'Results')
  };

  logInfo('Workflow started', config);

  try {
    // Fetch data
    const data = logExecutionTime('API Fetch', () => {
      return retryWithBackoff(() => {
        return UrlFetchApp.fetch(config.apiUrl);
      }, config.maxRetries, 1000);
    });

    // Process and write
    const json = JSON.parse(data.getContentText());
    writeToSheet(config.outputSheet, json.data, true);

    // Notify success
    sendEmail(
      config.notifyEmail,
      '✅ Workflow Success',
      `Processed ${json.data.length} records`
    );

  } catch (error) {
    sendErrorNotification(config.notifyEmail, 'configDrivenWorkflow', error);
    throw error;
  }
}
```

---

## 🎯 Best Practices

### 1. Always Use Try-Catch
```javascript
// ❌ Bad
function myFunction() {
  const data = fetchData();
  processData(data);
}

// ✅ Good
function myFunction() {
  try {
    logInfo('Starting myFunction');
    const data = fetchData();
    processData(data);
    logInfo('Completed successfully');
  } catch (error) {
    logError('Failed', { error: error.message });
    throw error;
  }
}
```

### 2. Use Batch Operations
```javascript
// ❌ Bad: Row-by-row (100 API calls)
records.forEach(record => {
  sheet.appendRow([record.id, record.name]);
});

// ✅ Good: Batch write (1 API call)
const rows = records.map(r => [r.id, r.name]);
writeToSheet('Results', rows, false);
```

### 3. Retry Network Operations
```javascript
// ❌ Bad: No retry
const data = UrlFetchApp.fetch('https://api.example.com');

// ✅ Good: Retry with backoff
const data = retryWithBackoff(() => {
  return UrlFetchApp.fetch('https://api.example.com');
}, 3, 2000);
```

### 4. Log Everything
```javascript
// ❌ Bad: Silent operations
function processData() {
  const data = fetchData();
  transform(data);
  save(data);
}

// ✅ Good: Logged operations
function processData() {
  logInfo('Processing started');
  const data = fetchData();
  logInfo('Data fetched', { count: data.length });
  transform(data);
  logInfo('Data transformed');
  save(data);
  logInfo('Data saved successfully');
}
```

### 5. Use Configuration
```javascript
// ❌ Bad: Hardcoded
const API_KEY = 'abc123';
const MAX_RETRIES = 3;

// ✅ Good: Configurable
const API_KEY = getConfig('API_KEY');
const MAX_RETRIES = parseInt(getConfig('MAX_RETRIES', '3'));
```

---

## 🚀 Getting Started

1. **Copy** `CommonPatterns.gs` to your project
2. **Choose** patterns you need
3. **Use** them in your code
4. **Customize** as needed

## 📚 Related Documentation

- [Quick Start Guide](../quickstart/README.md)
- [Orchestrator](../orchestrator/README.md)
- [sheets-database Example](../examples/sheets-database/README.md)
- [oauth2-bc-integration Example](../examples/oauth2-bc-integration/README.md)

---

**Happy Coding! 🎉**

These patterns are battle-tested and production-ready. Use them with confidence!
