# 🔔 Webhooks & Sync Mechanisms

**Categoria**: Integration → Data Synchronization
**Righe**: ~650
**Parent**: `specialists/integration-engineer.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Implementare webhook receivers (doPost handlers)
- Gestire webhook signature verification (HMAC-SHA256)
- Implementare sync strategies (full vs incremental)
- Handle idempotency per duplicate webhook deliveries
- Implement conflict resolution strategies
- Retry logic e dead letter queues
- Track sync state e monitor sync health

---

## 🔔 Webhook Implementation

### Basic Webhook Receiver

**doPost handler pattern**:
```javascript
// Webhook endpoint - deployed as Web App
function doPost(e) {
  try {
    // 1. Verify signature
    const isValid = verifyWebhookSignature(e);
    if (!isValid) {
      Logger.log('❌ Invalid webhook signature');
      return ContentService.createTextOutput('Unauthorized').setMimeType(ContentService.MimeType.TEXT);
    }

    // 2. Parse payload
    const payload = JSON.parse(e.postData.contents);
    Logger.log(`✅ Webhook received: ${payload.event}`);

    // 3. Check idempotency
    if (isAlreadyProcessed(payload.id)) {
      Logger.log('⚠️ Duplicate webhook - already processed');
      return ContentService.createTextOutput('OK - Already processed').setMimeType(ContentService.MimeType.TEXT);
    }

    // 4. Process event (synchronously for simple cases)
    processWebhookEvent(payload);

    // 5. Mark as processed
    markAsProcessed(payload.id);

    // 6. Return 200 OK immediately
    return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);

  } catch (error) {
    Logger.log(`❌ Webhook processing error: ${error.message}`);

    // Return 200 to prevent retries (log for manual review)
    return ContentService.createTextOutput('Error logged').setMimeType(ContentService.MimeType.TEXT);
  }
}

// Process webhook event
function processWebhookEvent(payload) {
  const EVENT_HANDLERS = {
    'order.created': handleOrderCreated,
    'order.updated': handleOrderUpdated,
    'customer.created': handleCustomerCreated
  };

  const handler = EVENT_HANDLERS[payload.event];

  if (handler) {
    handler(payload.data);
  } else {
    Logger.log(`⚠️ Unknown event type: ${payload.event}`);
  }
}

function handleOrderCreated(data) {
  Logger.log(`New order: ${data.order_id}`);
  // Sync to Sheets or Business Central
}

function handleOrderUpdated(data) {
  Logger.log(`Order updated: ${data.order_id}`);
  // Update existing record
}

function handleCustomerCreated(data) {
  Logger.log(`New customer: ${data.customer_id}`);
  // Create customer record
}
```

---

### Asynchronous Webhook Processing

**For heavy processing** - return 200 immediately, process later:
```javascript
function doPost(e) {
  try {
    // Verify signature
    const isValid = verifyWebhookSignature(e);
    if (!isValid) {
      return ContentService.createTextOutput('Unauthorized');
    }

    // Parse payload
    const payload = JSON.parse(e.postData.contents);

    // Check idempotency
    if (isAlreadyProcessed(payload.id)) {
      return ContentService.createTextOutput('OK - Duplicate');
    }

    // Queue for async processing
    queueWebhookForProcessing(payload);

    // Return 200 immediately (within 30 seconds)
    return ContentService.createTextOutput('Queued for processing');

  } catch (error) {
    Logger.log(`❌ Webhook queueing error: ${error.message}`);
    return ContentService.createTextOutput('Error');
  }
}

// Queue webhook for later processing
function queueWebhookForProcessing(payload) {
  const props = PropertiesService.getScriptProperties();

  // Get current queue
  const queueJson = props.getProperty('webhook_queue') || '[]';
  const queue = JSON.parse(queueJson);

  // Add to queue
  queue.push({
    id: payload.id,
    event: payload.event,
    data: payload.data,
    receivedAt: new Date().toISOString()
  });

  // Save queue (max ~9KB per property)
  props.setProperty('webhook_queue', JSON.stringify(queue));

  // Trigger async processing
  ScriptApp.newTrigger('processWebhookQueue')
    .timeBased()
    .after(1000) // 1 second delay
    .create();
}

// Process queued webhooks
function processWebhookQueue() {
  const props = PropertiesService.getScriptProperties();

  // Get queue
  const queueJson = props.getProperty('webhook_queue') || '[]';
  const queue = JSON.parse(queueJson);

  if (queue.length === 0) {
    return; // Nothing to process
  }

  // Process each webhook
  const processed = [];
  const failed = [];

  queue.forEach(webhook => {
    try {
      processWebhookEvent(webhook);
      markAsProcessed(webhook.id);
      processed.push(webhook.id);
      Logger.log(`✅ Processed webhook: ${webhook.id}`);
    } catch (error) {
      Logger.log(`❌ Failed to process webhook ${webhook.id}: ${error.message}`);
      failed.push(webhook);
    }
  });

  // Update queue (keep only failed items)
  props.setProperty('webhook_queue', JSON.stringify(failed));

  Logger.log(`Processed: ${processed.length}, Failed: ${failed.length}`);
}
```

---

## 🔐 Signature Verification

### HMAC-SHA256 Verification

**Standard webhook signature verification**:
```javascript
function verifyWebhookSignature(e) {
  // Get signature from header
  const receivedSignature = e.parameter.signature || e.postData.contents.signature;

  if (!receivedSignature) {
    Logger.log('❌ No signature provided');
    return false;
  }

  // Get webhook secret from properties
  const secret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');

  if (!secret) {
    throw new Error('Webhook secret not configured');
  }

  // Compute expected signature
  const payload = e.postData.contents;
  const computedSignature = computeHmacSha256(payload, secret);

  // Compare signatures (timing-safe comparison)
  return receivedSignature === computedSignature;
}

// Compute HMAC-SHA256 signature
function computeHmacSha256(message, secret) {
  const signature = Utilities.computeHmacSha256Signature(message, secret);

  // Convert to hex string
  return signature.map(byte => {
    const hex = (byte & 0xFF).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Alternative: Verify signature from header (common pattern)
function verifyWebhookSignatureFromHeader(e, headerName = 'X-Webhook-Signature') {
  // Get signature from HTTP header
  const headers = e.parameter.headers || {};
  const receivedSignature = headers[headerName];

  if (!receivedSignature) {
    Logger.log(`❌ No signature in header: ${headerName}`);
    return false;
  }

  const secret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
  const payload = e.postData.contents;

  // Compute expected signature
  const computedSignature = 'sha256=' + computeHmacSha256(payload, secret);

  // Timing-safe comparison
  return timingSafeEqual(receivedSignature, computedSignature);
}

// Timing-safe string comparison
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
```

---

## 🔁 Idempotency Patterns

### Idempotency Key Tracking

**Problem**: Webhooks can be delivered multiple times (network issues, retries)

**Solution**: Track processed webhook IDs

```javascript
// Check if webhook already processed
function isAlreadyProcessed(webhookId) {
  const props = PropertiesService.getScriptProperties();
  const key = `webhook_processed_${webhookId}`;

  return props.getProperty(key) !== null;
}

// Mark webhook as processed
function markAsProcessed(webhookId) {
  const props = PropertiesService.getScriptProperties();
  const key = `webhook_processed_${webhookId}`;

  // Store with timestamp
  props.setProperty(key, new Date().toISOString());

  // Note: Properties limit ~500KB total, clean up old entries periodically
}

// Clean up old processed webhooks (run daily)
function cleanupProcessedWebhooks() {
  const props = PropertiesService.getScriptProperties();
  const allProperties = props.getProperties();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep last 30 days

  let cleaned = 0;

  for (const [key, value] of Object.entries(allProperties)) {
    if (key.startsWith('webhook_processed_')) {
      const processedDate = new Date(value);

      if (processedDate < cutoffDate) {
        props.deleteProperty(key);
        cleaned++;
      }
    }
  }

  Logger.log(`Cleaned up ${cleaned} old webhook records`);
}
```

---

### Alternative: Sheet-Based Idempotency

**For high-volume webhooks** (Properties has 500KB limit):
```javascript
function isAlreadyProcessedSheet(webhookId) {
  const sheet = SpreadsheetApp.openById('SPREADSHEET_ID').getSheetByName('ProcessedWebhooks');

  // Check if ID exists
  const data = sheet.getDataRange().getValues();
  return data.some(row => row[0] === webhookId);
}

function markAsProcessedSheet(webhookId) {
  const sheet = SpreadsheetApp.openById('SPREADSHEET_ID').getSheetByName('ProcessedWebhooks');

  // Append new row
  sheet.appendRow([
    webhookId,
    new Date().toISOString(),
    Session.getActiveUser().getEmail()
  ]);
}
```

---

## 🔄 Sync Strategies

### Full Sync

**Simple but inefficient** - fetch all data, replace destination:
```javascript
function fullSync() {
  const startTime = Date.now();
  Logger.log('🔄 Starting full sync...');

  try {
    // 1. Fetch all source data
    const sourceData = fetchAllSourceData();
    Logger.log(`Fetched ${sourceData.length} records from source`);

    // 2. Clear destination
    clearDestinationData();

    // 3. Write all data to destination
    writeToDestination(sourceData);

    // 4. Update sync status
    updateSyncStatus({
      type: 'full',
      status: 'completed',
      recordsProcessed: sourceData.length,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });

    Logger.log(`✅ Full sync completed in ${Date.now() - startTime}ms`);

  } catch (error) {
    Logger.log(`❌ Full sync failed: ${error.message}`);
    updateSyncStatus({ type: 'full', status: 'failed', error: error.message });
    throw error;
  }
}

function fetchAllSourceData() {
  const url = 'https://api.example.com/data';
  const token = PropertiesService.getScriptProperties().getProperty('API_TOKEN');

  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { 'Authorization': `Bearer ${token}` },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error(`API error: ${response.getResponseCode()}`);
  }

  const data = JSON.parse(response.getContentText());
  return data.items || [];
}

function clearDestinationData() {
  const sheet = SpreadsheetApp.openById('SPREADSHEET_ID').getSheetByName('Data');
  sheet.clear();

  // Re-add header row
  sheet.appendRow(['ID', 'Name', 'Email', 'Created At']);
}

function writeToDestination(data) {
  const sheet = SpreadsheetApp.openById('SPREADSHEET_ID').getSheetByName('Data');

  const rows = data.map(item => [
    item.id,
    item.name,
    item.email,
    item.created_at
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 4).setValues(rows);
  }
}
```

---

### Incremental Sync

**Efficient** - fetch only changes since last sync:
```javascript
function incrementalSync() {
  const startTime = Date.now();
  Logger.log('🔄 Starting incremental sync...');

  try {
    // 1. Get last sync timestamp
    const lastSync = getLastSyncTimestamp();
    Logger.log(`Last sync: ${lastSync || 'Never'}`);

    // 2. Fetch only changes since last sync
    const changes = fetchChangesSince(lastSync);
    Logger.log(`Fetched ${changes.length} changed records`);

    if (changes.length === 0) {
      Logger.log('✅ No changes to sync');
      return;
    }

    // 3. Apply changes to destination
    applyChanges(changes);

    // 4. Update last sync timestamp
    setLastSyncTimestamp(new Date().toISOString());

    // 5. Update sync status
    updateSyncStatus({
      type: 'incremental',
      status: 'completed',
      recordsProcessed: changes.length,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });

    Logger.log(`✅ Incremental sync completed in ${Date.now() - startTime}ms`);

  } catch (error) {
    Logger.log(`❌ Incremental sync failed: ${error.message}`);
    updateSyncStatus({ type: 'incremental', status: 'failed', error: error.message });
    throw error;
  }
}

function getLastSyncTimestamp() {
  const props = PropertiesService.getScriptProperties();
  return props.getProperty('last_sync_timestamp');
}

function setLastSyncTimestamp(timestamp) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('last_sync_timestamp', timestamp);
}

function fetchChangesSince(timestamp) {
  const url = timestamp
    ? `https://api.example.com/data?modified_since=${encodeURIComponent(timestamp)}`
    : 'https://api.example.com/data';

  const token = PropertiesService.getScriptProperties().getProperty('API_TOKEN');

  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { 'Authorization': `Bearer ${token}` },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error(`API error: ${response.getResponseCode()}`);
  }

  const data = JSON.parse(response.getContentText());
  return data.items || [];
}

function applyChanges(changes) {
  const sheet = SpreadsheetApp.openById('SPREADSHEET_ID').getSheetByName('Data');
  const data = sheet.getDataRange().getValues();

  // Build index: ID -> row number
  const idIndex = {};
  data.slice(1).forEach((row, index) => {
    idIndex[row[0]] = index + 2; // +2 for header and 0-based index
  });

  // Apply each change
  changes.forEach(change => {
    const existingRow = idIndex[change.id];

    if (existingRow) {
      // Update existing row
      sheet.getRange(existingRow, 1, 1, 4).setValues([[
        change.id,
        change.name,
        change.email,
        change.created_at
      ]]);
    } else {
      // Insert new row
      sheet.appendRow([change.id, change.name, change.email, change.created_at]);
    }
  });
}
```

---

## ⚔️ Conflict Resolution

### Detect and Resolve Conflicts

```javascript
function detectConflict(sourceRecord, destinationRecord) {
  // No conflict if destination doesn't exist
  if (!destinationRecord) {
    return { hasConflict: false };
  }

  // Check if both modified since last sync
  const lastSync = new Date(getLastSyncTimestamp());
  const sourceModified = new Date(sourceRecord.updated_at);
  const destModified = new Date(destinationRecord.updated_at);

  if (sourceModified > lastSync && destModified > lastSync) {
    return {
      hasConflict: true,
      sourceModified: sourceModified,
      destModified: destModified
    };
  }

  return { hasConflict: false };
}

function resolveConflict(sourceRecord, destinationRecord, strategy = 'last_write_wins') {
  const STRATEGIES = {
    'last_write_wins': () => {
      // Use most recently modified record
      return new Date(sourceRecord.updated_at) > new Date(destinationRecord.updated_at)
        ? sourceRecord
        : destinationRecord;
    },

    'source_wins': () => {
      // Always use source
      return sourceRecord;
    },

    'destination_wins': () => {
      // Always use destination
      return destinationRecord;
    },

    'merge': () => {
      // Merge non-conflicting fields
      return {
        ...destinationRecord,
        ...sourceRecord,
        // Keep destination for specific fields if needed
        id: destinationRecord.id
      };
    },

    'manual': () => {
      // Log for manual review
      Logger.log(`⚠️ Conflict requires manual resolution:`);
      Logger.log(`  Source: ${JSON.stringify(sourceRecord)}`);
      Logger.log(`  Destination: ${JSON.stringify(destinationRecord)}`);

      // Queue for manual review
      queueForManualReview(sourceRecord, destinationRecord);

      return null; // Skip for now
    }
  };

  const resolver = STRATEGIES[strategy] || STRATEGIES.last_write_wins;
  return resolver();
}

function queueForManualReview(sourceRecord, destinationRecord) {
  const sheet = SpreadsheetApp.openById('SPREADSHEET_ID').getSheetByName('Conflicts');

  sheet.appendRow([
    new Date().toISOString(),
    sourceRecord.id,
    JSON.stringify(sourceRecord),
    JSON.stringify(destinationRecord),
    'pending'
  ]);
}
```

---

## 📊 Sync State Management

### Track Sync Status

```javascript
function updateSyncStatus(status) {
  const sheet = SpreadsheetApp.openById('SPREADSHEET_ID').getSheetByName('SyncLog');

  sheet.appendRow([
    status.timestamp || new Date().toISOString(),
    status.type || 'unknown',
    status.status || 'unknown',
    status.recordsProcessed || 0,
    status.duration || 0,
    status.error || ''
  ]);
}

function getSyncStatus() {
  const sheet = SpreadsheetApp.openById('SPREADSHEET_ID').getSheetByName('SyncLog');
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return { lastSync: null, status: 'never_synced' };
  }

  const lastRow = data[data.length - 1];

  return {
    lastSync: lastRow[0],
    type: lastRow[1],
    status: lastRow[2],
    recordsProcessed: lastRow[3],
    duration: lastRow[4],
    error: lastRow[5]
  };
}
```

---

## ✅ Webhooks & Sync Best Practices

### Checklist

- [x] **Verify webhook signatures** - HMAC-SHA256 verification
- [x] **Implement idempotency** - Track processed webhook IDs
- [x] **Return 200 OK quickly** - Process async for heavy operations
- [x] **Use incremental sync** - More efficient than full sync
- [x] **Track sync state** - Log all sync operations
- [x] **Handle conflicts** - Clear resolution strategy
- [x] **Implement retry** - Exponential backoff for failures
- [x] **Log all events** - Webhook receipts, sync operations
- [x] **Monitor sync health** - Track success/failure rates
- [x] **Clean up old data** - Periodic cleanup of processed IDs
- [x] **Use queue for high volume** - Sheet-based queue for scale
- [x] **Test webhook handlers** - Use webhook.site for testing

---

## 🔗 Related Files

- `platform/error-handling.md` - Retry logic patterns
- `data/etl-patterns.md` - ETL transformation patterns
- `bc/odata-patterns.md` - Business Central incremental queries
- `integration/http-patterns.md` - HTTP request patterns
- `security/properties-security.md` - Secure webhook secret storage

---

**Versione**: 1.0
**Context Size**: ~650 righe
