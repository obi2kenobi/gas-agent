# 🛠️ Performance Optimization

**Categoria**: Platform → Performance
**Righe**: ~310
**Parent**: `specialists/platform-engineer.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Ottimizzare script lenti
- Evitare timeout (6 min limit)
- Ridurre execution time
- Ottimizzare batch operations
- Gestire large datasets
- Analyze bottlenecks
- Improve user experience

---

## 📊 Profiling Techniques

### Measuring Execution Time

**Basic Timing**:
```javascript
function profileOperation() {
  const start = Date.now();

  // Operation to profile
  processOrders();

  const duration = Date.now() - start;
  Logger.log(`Operation took ${duration}ms`);
}
```

**Detailed Profiling**:
```javascript
const Profiler = (function() {
  const timings = {};

  function start(label) {
    timings[label] = Date.now();
  }

  function end(label) {
    if (!timings[label]) {
      Logger.log(`Warning: No start time for ${label}`);
      return;
    }

    const duration = Date.now() - timings[label];
    Logger.log(`[PROFILE] ${label}: ${duration}ms`);
    delete timings[label];

    return duration;
  }

  function report() {
    Logger.log('=== Performance Report ===');
    Object.entries(timings).forEach(([label, startTime]) => {
      const duration = Date.now() - startTime;
      Logger.log(`${label}: ${duration}ms (still running)`);
    });
  }

  return { start, end, report };
})();

// Usage
function syncOrders() {
  Profiler.start('total');

  Profiler.start('fetch_bc');
  const orders = BCClient.getAllOrders();
  Profiler.end('fetch_bc');

  Profiler.start('process');
  orders.forEach(processOrder);
  Profiler.end('process');

  Profiler.start('write_sheets');
  writeToSheets(orders);
  Profiler.end('write_sheets');

  Profiler.end('total');
}

// Output:
// [PROFILE] fetch_bc: 2500ms
// [PROFILE] process: 800ms
// [PROFILE] write_sheets: 5000ms ← BOTTLENECK!
// [PROFILE] total: 8300ms
```

---

### Identifying Bottlenecks

**Common Bottlenecks**:
1. **Sheets API calls** (row-by-row operations)
2. **External API calls** (BC, Claude, etc.)
3. **Large dataset processing** (memory limits)
4. **Synchronous operations** (no parallelization)

**Detection Strategy**:
```javascript
function findBottlenecks() {
  // Profile each major operation
  const timings = {
    'API Calls': profileAPICalls(),
    'Data Processing': profileProcessing(),
    'Sheets Operations': profileSheets(),
    'Computation': profileComputation()
  };

  // Sort by duration
  const sorted = Object.entries(timings).sort((a, b) => b[1] - a[1]);

  Logger.log('=== Bottlenecks (slowest first) ===');
  sorted.forEach(([operation, ms]) => {
    const percent = (ms / sorted[0][1] * 100).toFixed(1);
    Logger.log(`${operation}: ${ms}ms (${percent}%)`);
  });

  // Focus optimization on top 2-3 bottlenecks
}
```

---

## 📦 Batch Operations

### ❌ Anti-Pattern: Row-by-Row Operations

**BAD - Individual API calls**:
```javascript
// ❌ TERRIBLE: 1000 API calls = ~30 seconds!
function updateOrdersBad(orders) {
  const sheet = SpreadsheetApp.getActiveSheet();

  orders.forEach((order, index) => {
    sheet.getRange(index + 2, 1).setValue(order.id);        // API call
    sheet.getRange(index + 2, 2).setValue(order.customer);  // API call
    sheet.getRange(index + 2, 3).setValue(order.total);     // API call
  });
  // Total: 3000 API calls for 1000 orders!
}
```

**Performance**: ~30,000ms for 1000 orders

---

### ✅ Good Pattern: Batch Operations

**GOOD - Single API call**:
```javascript
// ✅ EXCELLENT: 1 API call = ~100ms!
function updateOrdersGood(orders) {
  const sheet = SpreadsheetApp.getActiveSheet();

  // Build 2D array
  const values = orders.map(order => [
    order.id,
    order.customer,
    order.total
  ]);

  // Single batch write
  sheet.getRange(2, 1, values.length, 3).setValues(values);
  // Total: 1 API call for 1000 orders!
}
```

**Performance**: ~100ms for 1000 orders
**Improvement**: 300x faster! 🚀

---

### Batch Read Operations

**❌ BAD: Read row-by-row**:
```javascript
// ❌ SLOW: 1000 API calls
function readOrdersBad() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const orders = [];

  for (let i = 2; i <= 1001; i++) {
    orders.push({
      id: sheet.getRange(i, 1).getValue(),       // API call
      customer: sheet.getRange(i, 2).getValue(), // API call
      total: sheet.getRange(i, 3).getValue()     // API call
    });
  }
  return orders;
}
```

**✅ GOOD: Batch read**:
```javascript
// ✅ FAST: 1 API call
function readOrdersGood() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();

  // Single batch read
  const values = sheet.getRange(2, 1, lastRow - 1, 3).getValues();

  // Transform to objects
  return values.map(([id, customer, total]) => ({
    id,
    customer,
    total
  }));
}
```

---

## 🔌 Reducing API Calls

### Google Workspace Services Optimization

**Cache Sheet References**:
```javascript
// ❌ BAD: Retrieves sheet reference 1000 times
function processBad() {
  for (let i = 0; i < 1000; i++) {
    const sheet = SpreadsheetApp.getActiveSheet(); // Slow!
    // process...
  }
}

// ✅ GOOD: Cache reference once
function processGood() {
  const sheet = SpreadsheetApp.getActiveSheet(); // Once
  for (let i = 0; i < 1000; i++) {
    // Use cached reference
  }
}
```

---

**Use Named Ranges**:
```javascript
// Instead of hardcoded A1 notation
const range = sheet.getRange('A2:C1000'); // Fragile

// Use named ranges (faster + maintainable)
const range = sheet.getRangeByName('OrdersData'); // Fast + clear
```

---

**Batch Format Operations**:
```javascript
// ❌ BAD: Format cells individually
function formatBad(sheet, rows) {
  rows.forEach(row => {
    sheet.getRange(row, 1).setFontWeight('bold');     // API call
    sheet.getRange(row, 2).setNumberFormat('$#,##0'); // API call
  });
}

// ✅ GOOD: Batch format
function formatGood(sheet, rows) {
  const ranges = rows.map(row => sheet.getRange(row, 1));
  sheet.getRangeList(ranges).setFontWeight('bold'); // 1 API call

  const priceRanges = rows.map(row => sheet.getRange(row, 2));
  sheet.getRangeList(priceRanges).setNumberFormat('$#,##0'); // 1 API call
}
```

---

### External APIs Optimization

**Use Query Parameters** ($expand, $select):
```javascript
// ❌ BAD: Multiple requests
function getOrderWithLinesBad(orderId) {
  const order = BCClient.get(`/salesOrders('${orderId}')`);
  const lines = BCClient.get(`/salesOrders('${orderId}')/salesOrderLines`);
  return { ...order, lines };
  // 2 HTTP requests
}

// ✅ GOOD: Single request with $expand
function getOrderWithLinesGood(orderId) {
  const order = BCClient.get(`/salesOrders('${orderId}')?$expand=salesOrderLines`);
  return order;
  // 1 HTTP request
}
```

---

**Parallel API Calls**:
```javascript
// ❌ BAD: Sequential (5 seconds total)
function fetchMultipleBad(ids) {
  const results = [];
  ids.forEach(id => {
    results.push(BCClient.get(`/orders('${id}')`)); // 1s each
  });
  return results;
  // 5 IDs = 5 seconds
}

// ✅ GOOD: Parallel (1 second total)
function fetchMultipleGood(ids) {
  const requests = ids.map(id => ({
    url: `${BC_BASE_URL}/orders('${id}')`,
    method: 'get',
    headers: { Authorization: `Bearer ${token}` }
  }));

  const responses = UrlFetchApp.fetchAll(requests);
  return responses.map(r => JSON.parse(r.getContentText()));
  // 5 IDs = 1 second (parallel)
}
```

---

**Pagination with Reasonable Page Sizes**:
```javascript
// ❌ BAD: Fetch all at once (slow + may timeout)
function getAllOrdersBad() {
  return BCClient.get('/salesOrders'); // Returns 10,000 orders!
  // Timeout risk, memory issues
}

// ✅ GOOD: Paginate with caching
function getAllOrdersGood() {
  const PAGE_SIZE = 100;
  let allOrders = [];
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const orders = BCClient.get(`/salesOrders?$top=${PAGE_SIZE}&$skip=${skip}`);
    allOrders = allOrders.concat(orders.value);

    hasMore = orders.value.length === PAGE_SIZE;
    skip += PAGE_SIZE;

    // Optional: Cache each page
    cacheOrders(orders.value, skip);
  }

  return allOrders;
}
```

---

## 💾 Memory Management

### GAS Memory Limits

**Limits**:
- **Execution memory**: ~100-200 MB
- **Exceeded**: Script terminates with "Service invoked too many times"

### Chunked Processing

**❌ BAD: Load entire dataset**:
```javascript
// ❌ MEMORY ERROR for 50,000 rows
function processAllBad() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues(); // 50,000 rows in memory!

  data.forEach(row => processRow(row));
}
```

**✅ GOOD: Process in chunks**:
```javascript
// ✅ Process 1,000 rows at a time
function processAllGood() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  const CHUNK_SIZE = 1000;

  for (let startRow = 2; startRow <= lastRow; startRow += CHUNK_SIZE) {
    const numRows = Math.min(CHUNK_SIZE, lastRow - startRow + 1);
    const chunk = sheet.getRange(startRow, 1, numRows, 10).getValues();

    chunk.forEach(row => processRow(row));

    // Clear variables to free memory
    chunk.length = 0;
  }
}
```

---

**Stream Processing Pattern**:
```javascript
function streamProcessOrders() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  const BATCH_SIZE = 500;

  for (let i = 2; i <= lastRow; i += BATCH_SIZE) {
    const batch = sheet.getRange(i, 1, Math.min(BATCH_SIZE, lastRow - i + 1), 5).getValues();

    // Process batch
    const processed = batch.map(processOrder);

    // Write results immediately
    sheet.getRange(i, 6, processed.length, 1).setValues(processed.map(p => [p]));

    // Free memory
    batch.length = 0;
    processed.length = 0;

    // Flush execution (prevent timeout)
    SpreadsheetApp.flush();
  }
}
```

---

## ⏱️ Time-Based Execution Optimization

### 6-Minute Timeout Workaround

**Problem**: GAS scripts timeout after 6 minutes

**Solution: Checkpointing + Resume**:
```javascript
function longRunningOperation() {
  const props = PropertiesService.getScriptProperties();
  const CHECKPOINT_KEY = 'LONG_OP_CHECKPOINT';
  const MAX_EXECUTION_TIME = 5 * 60 * 1000; // 5 minutes (with buffer)

  const startTime = Date.now();
  let checkpoint = parseInt(props.getProperty(CHECKPOINT_KEY) || '0');

  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();

  for (let i = checkpoint + 2; i <= lastRow; i++) {
    // Check if approaching timeout
    if (Date.now() - startTime > MAX_EXECUTION_TIME) {
      // Save checkpoint
      props.setProperty(CHECKPOINT_KEY, String(i - 2));

      // Schedule continuation
      ScriptApp.newTrigger('longRunningOperation')
        .timeBased()
        .after(1000) // 1 second delay
        .create();

      Logger.log(`Checkpoint at row ${i}. Resuming in 1 second...`);
      return;
    }

    // Process row
    const row = sheet.getRange(i, 1, 1, 5).getValues()[0];
    processRow(row);
  }

  // Completed!
  props.deleteProperty(CHECKPOINT_KEY);
  Logger.log('Long operation completed successfully');
}
```

---

### Trigger Chaining

**For operations >30 minutes**:
```javascript
function startLongOperation() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('OPERATION_STATUS', 'RUNNING');
  props.setProperty('PROCESSED_COUNT', '0');

  // Start first chunk
  processChunk();
}

function processChunk() {
  const props = PropertiesService.getScriptProperties();
  const processed = parseInt(props.getProperty('PROCESSED_COUNT') || '0');
  const CHUNK_SIZE = 5000;

  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();

  const startRow = processed + 2;
  const endRow = Math.min(startRow + CHUNK_SIZE - 1, lastRow);

  if (startRow > lastRow) {
    // Completed
    props.setProperty('OPERATION_STATUS', 'COMPLETED');
    sendCompletionEmail();
    return;
  }

  // Process chunk
  const data = sheet.getRange(startRow, 1, endRow - startRow + 1, 5).getValues();
  data.forEach(processRow);

  // Update checkpoint
  props.setProperty('PROCESSED_COUNT', String(endRow - 1));

  // Schedule next chunk
  ScriptApp.newTrigger('processChunk')
    .timeBased()
    .after(60 * 1000) // 1 minute delay
    .create();
}
```

---

## 🗄️ Database Query Optimization (Sheets as DB)

### Use Filters Instead of Iteration

**❌ BAD: Iterate all rows**:
```javascript
function findActiveOrdersBad() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();

  const active = [];
  data.forEach(row => {
    if (row[3] === 'Active') { // Check every row
      active.push(row);
    }
  });
  return active;
}
```

**✅ GOOD: Use filter formula**:
```javascript
function findActiveOrdersGood() {
  const sheet = SpreadsheetApp.getActiveSheet();

  // Use FILTER formula (runs on Google servers, faster!)
  const formula = '=FILTER(A2:E, D2:D="Active")';
  const tempSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('_temp');
  tempSheet.getRange('A1').setFormula(formula);

  const results = tempSheet.getDataRange().getValues();
  SpreadsheetApp.getActiveSpreadsheet().deleteSheet(tempSheet);

  return results;
}
```

---

### Index Lookups with Objects

**❌ BAD: Linear search**:
```javascript
function findOrderBad(orderId, orders) {
  return orders.find(o => o.id === orderId); // O(n)
}
```

**✅ GOOD: Object index**:
```javascript
function buildOrderIndex(orders) {
  const index = {};
  orders.forEach(order => {
    index[order.id] = order;
  });
  return index;
}

// O(1) lookup!
const orderIndex = buildOrderIndex(orders);
const order = orderIndex[orderId];
```

---

### Avoid getRange() in Loops

**❌ BAD: getRange in loop**:
```javascript
function updateStatusBad(sheet, updates) {
  updates.forEach(update => {
    const range = sheet.getRange(update.row, update.col); // API call!
    range.setValue(update.value);
  });
}
```

**✅ GOOD: Build ranges array first**:
```javascript
function updateStatusGood(sheet, updates) {
  const ranges = updates.map(u => sheet.getRange(u.row, u.col));
  const values = updates.map(u => [[u.value]]);

  // Batch update
  sheet.getRangeList(ranges).setValues(values);
}
```

---

## 🛡️ Performance Best Practices

### Checklist

- [x] **Profile before optimizing** - Measure first, don't guess!
- [x] **Batch all operations** - Single API call > multiple calls
- [x] **Cache aggressively** - Reduce redundant fetches
- [x] **Minimize API calls** - Use $expand, fetchAll, batch operations
- [x] **Process data in chunks** - Avoid memory limits
- [x] **Use appropriate data structures** - Objects for lookups, arrays for lists
- [x] **Parallelize independent operations** - UrlFetchApp.fetchAll()
- [x] **Set reasonable timeouts** - Don't wait forever
- [x] **Monitor execution times** - Log slow operations
- [x] **Implement checkpointing** - For operations >5 minutes

---

### Performance Targets

| Operation | Target | Critical |
|-----------|--------|----------|
| **Single Sheet read** | <100ms | <500ms |
| **Batch Sheet write (1000 rows)** | <200ms | <1s |
| **API call** | <1s | <3s |
| **Data processing (1000 records)** | <500ms | <2s |
| **Total execution** | <5min | <6min |

---

## 🚫 Common Performance Anti-Patterns

### Anti-Pattern 1: getRange() in Loop

```javascript
// ❌ ANTI-PATTERN: 1000 API calls
for (let i = 2; i <= 1001; i++) {
  sheet.getRange(i, 1).setValue(data[i-2]); // SLOW!
}

// ✅ SOLUTION: 1 API call
sheet.getRange(2, 1, data.length, 1).setValues(data.map(d => [d]));
```

**Impact**: 100x-300x slower

---

### Anti-Pattern 2: No Caching

```javascript
// ❌ ANTI-PATTERN: Fetch same data repeatedly
function processBad() {
  for (let i = 0; i < 100; i++) {
    const orders = BCClient.getAllOrders(); // 100 API calls!
    processOrder(orders[i]);
  }
}

// ✅ SOLUTION: Fetch once, cache
function processGood() {
  const orders = getCachedOrders(); // 1 API call or cache hit
  orders.forEach(processOrder);
}
```

**Impact**: 100x slower, rate limit risk

---

### Anti-Pattern 3: Loading Entire Dataset

```javascript
// ❌ ANTI-PATTERN: Memory error on large sheets
const allData = sheet.getDataRange().getValues(); // 50,000 rows!

// ✅ SOLUTION: Process in chunks
for (let i = 0; i < lastRow; i += 1000) {
  const chunk = sheet.getRange(i, 1, 1000, cols).getValues();
  processChunk(chunk);
}
```

**Impact**: Out of memory error

---

## 🔗 Related Files

- `platform/caching.md` - Caching strategies for performance
- `workspace/sheets-patterns.md` - Sheets-specific optimization
- `platform/error-handling.md` - Timeout handling
- `platform/monitoring.md` - Performance monitoring

---

**Versione**: 1.0
**Context Size**: ~310 righe
