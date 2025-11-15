# 🔄 ETL Patterns

**Categoria**: Data → Extract/Transform/Load
**Righe**: ~300
**Parent**: `specialists/data-engineer.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Extract data from BC, APIs, Sheets
- Transform data formats and types
- Load data to Sheets, BC, external systems
- Implement incremental sync
- Handle data mapping

---

## 📥 Extract Patterns

### Extract from Business Central

```javascript
function extractFromBC(lastSync) {
  const filter = lastSync 
    ? `lastModifiedDateTime gt ${lastSync}`
    : '';
  
  const url = `${BC_BASE_URL}/salesOrders?$filter=${filter}`;
  const response = UrlFetchApp.fetch(url, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  
  return JSON.parse(response.getContentText()).value;
}
```

---

### Extract from Sheets

```javascript
function extractFromSheets(sheetName, skipHeader = true) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  
  return skipHeader ? data.slice(1) : data;
}
```

---

## 🔄 Transform Patterns

### Field Mapping

```javascript
const FIELD_MAP = {
  'number': 'orderNumber',
  'customerName': 'customer',
  'totalAmountIncludingTax': 'total',
  'orderDate': 'date',
  'status': 'status'
};

function transformBCOrder(bcOrder) {
  const transformed = {};
  
  for (const [bcField, internalField] of Object.entries(FIELD_MAP)) {
    transformed[internalField] = bcOrder[bcField];
  }
  
  return transformed;
}
```

---

### Type Conversion

```javascript
function convertTypes(record) {
  return {
    orderNumber: String(record.orderNumber),
    date: new Date(record.orderDate),  // ISO string → Date
    total: parseFloat(record.total),
    quantity: parseInt(record.quantity),
    isActive: Boolean(record.status === 'Active')
  };
}
```

---

## 📤 Load Patterns

### Load to Sheets (Batch)

```javascript
function loadToSheets(data, sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  
  // Clear existing (except header)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
  
  // Prepare rows
  const rows = data.map(item => [
    item.id,
    item.customer,
    item.total,
    item.date,
    item.status
  ]);
  
  // Batch write
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
  
  Logger.log(`Loaded ${rows.length} rows to ${sheetName}`);
}
```

---

### Upsert Pattern

```javascript
function upsertToSheets(records, sheetName, keyColumn = 0) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  
  // Build index
  const index = {};
  data.slice(1).forEach((row, idx) => {
    index[row[keyColumn]] = idx + 2; // row number
  });
  
  records.forEach(record) {
    const key = record[keyColumn];
    const rowNumber = index[key];
    
    if (rowNumber) {
      // Update existing
      sheet.getRange(rowNumber, 1, 1, record.length).setValues([record]);
    } else {
      // Insert new
      sheet.appendRow(record);
    }
  });
}
```

---

## 🔄 Complete ETL Pipeline

```javascript
function runETLPipeline() {
  const startTime = Date.now();
  
  try {
    // 1. EXTRACT
    const lastSync = PropertiesService.getScriptProperties().getProperty('LAST_ETL_RUN');
    const bcOrders = extractFromBC(lastSync);
    Logger.log(`Extracted ${bcOrders.length} orders`);
    
    // 2. TRANSFORM
    const transformed = bcOrders.map(order => {
      const mapped = transformBCOrder(order);
      const typed = convertTypes(mapped);
      return typed;
    });
    Logger.log(`Transformed ${transformed.length} orders`);
    
    // 3. LOAD
    loadToSheets(transformed, 'Orders');
    Logger.log(`Loaded ${transformed.length} orders`);
    
    // 4. Update checkpoint
    PropertiesService.getScriptProperties().setProperty(
      'LAST_ETL_RUN',
      new Date().toISOString()
    );
    
    const duration = Date.now() - startTime;
    Logger.log(`✅ ETL complete in ${duration}ms`);
    
  } catch (error) {
    Logger.log(`❌ ETL failed: ${error.message}`);
    throw error;
  }
}
```

---

## ✅ ETL Best Practices

- [x] **Extract incrementally** - Use lastModified filters
- [x] **Transform idempotently** - Same input = same output
- [x] **Load with upsert** - Insert or update based on key
- [x] **Checkpoint progress** - Resume from failure
- [x] **Handle partial failures** - Continue with good records
- [x] **Log metrics** - Records processed, duration, errors

---

## 🔗 Related Files

- `data/sheets-database.md` - Database patterns
- `integration/webhooks-sync.md` - Sync strategies
- `bc/odata-patterns.md` - BC extraction

---

**Versione**: 1.0
**Context Size**: ~300 righe
