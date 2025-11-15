# 📊 Sheets Automation Patterns

**Categoria**: Workspace → Sheets Operations
**Righe**: ~620
**Parent**: `specialists/workspace-engineer.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Ottimizzare Sheets read/write operations (100x performance gain)
- Implementare batch operations invece di loops
- Gestire formulas, formatting, data validation
- Usare named ranges per maintainability
- Performance optimization per large datasets (1000+ rows)
- Prevent timeout errors su Sheets operations

---

## 📖 Batch Read Operations

### Anti-Pattern: Row-by-Row Reading

**❌ BAD - 1000 API calls**:
```javascript
function readRowByRow() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = [];

  // DISASTER: 1000 separate API calls!
  for (let i = 1; i <= 1000; i++) {
    const value = sheet.getRange(i, 1).getValue(); // Each call = ~100ms
    data.push(value);
  }

  // Total time: ~100 seconds (timeout after 6 minutes!)
  return data;
}
```

**Problems**:
- 1000 separate API calls
- ~100ms per call = 100+ seconds
- Timeout risk (6-minute GAS limit)
- Wastes quota

---

### Best Practice: Batch Read

**✅ GOOD - 1 API call**:
```javascript
function readBatch() {
  const sheet = SpreadsheetApp.getActiveSheet();

  // Single batch read - 1 API call
  const data = sheet.getRange(1, 1, 1000, 1).getValues(); // ~200ms total

  // Returns 2D array: [[val1], [val2], ...]
  // Flatten if needed:
  const flatData = data.map(row => row[0]);

  return flatData;
}
```

**Benefits**:
- **100x faster** (200ms vs 100s)
- Single API call
- No timeout risk
- Efficient quota usage

---

### Reading Multiple Columns

```javascript
function readMultipleColumns() {
  const sheet = SpreadsheetApp.getActiveSheet();

  // Read 4 columns, 1000 rows - still 1 API call
  const data = sheet.getRange(1, 1, 1000, 4).getValues();

  // Returns: [[col1, col2, col3, col4], [...], ...]

  // Process each row
  data.forEach(row => {
    const [id, name, email, phone] = row;
    Logger.log(`${id}: ${name} - ${email}`);
  });

  return data;
}
```

---

### Reading Entire Sheet

```javascript
function readEntireSheet() {
  const sheet = SpreadsheetApp.getActiveSheet();

  // Get all data (auto-detects dimensions)
  const data = sheet.getDataRange().getValues();

  // Skip header row
  const dataWithoutHeader = data.slice(1);

  return dataWithoutHeader;
}
```

---

## ✍️ Batch Write Operations

### Anti-Pattern: Individual Writes

**❌ BAD - N API calls**:
```javascript
function writeRowByRow(data) {
  const sheet = SpreadsheetApp.getActiveSheet();

  // DISASTER: N separate API calls!
  data.forEach((value, i) => {
    sheet.getRange(i + 1, 1).setValue(value); // Each = ~100ms
  });

  // For 1000 rows: ~100 seconds (timeout risk!)
}
```

---

### Best Practice: Batch Write

**✅ GOOD - 1 API call**:
```javascript
function writeBatch(data) {
  const sheet = SpreadsheetApp.getActiveSheet();

  // Convert to 2D array if needed
  const values = data.map(val => [val]); // [[val1], [val2], ...]

  // Single batch write - 1 API call
  sheet.getRange(1, 1, values.length, 1).setValues(values);

  // ~200ms for 1000 rows (100x faster!)
}
```

---

### Writing Multiple Columns

```javascript
function writeMultipleColumns(orders) {
  const sheet = SpreadsheetApp.getActiveSheet();

  // Prepare 2D array
  const values = orders.map(order => [
    order.id,
    order.date,
    order.customer,
    order.total
  ]);

  // Batch write: 1000 rows x 4 columns = 1 API call
  sheet.getRange(2, 1, values.length, 4).setValues(values);

  Logger.log(`Wrote ${values.length} orders in one batch`);
}
```

---

### Appending Data

```javascript
function appendData(newRows) {
  const sheet = SpreadsheetApp.getActiveSheet();

  // Get last row
  const lastRow = sheet.getLastRow();

  // Prepare 2D array
  const values = newRows.map(row => [row.id, row.name, row.value]);

  // Write starting after last row
  sheet.getRange(lastRow + 1, 1, values.length, 3).setValues(values);
}

// Alternative: appendRow() for single row
function appendSingleRow(row) {
  const sheet = SpreadsheetApp.getActiveSheet();
  sheet.appendRow([row.id, row.name, row.value]);
}
```

---

## 🎯 Range Manipulation

### Getting Ranges

```javascript
// Method 1: A1 notation
const range1 = sheet.getRange('A1:D10');

// Method 2: Row, column, numRows, numCols
const range2 = sheet.getRange(1, 1, 10, 4); // Same as A1:D10

// Method 3: Named range (best for maintainability)
const range3 = sheet.getRangeByName('DataRange');

// Get single cell
const cell = sheet.getRange('A1'); // or sheet.getRange(1, 1)

// Get entire column
const colA = sheet.getRange('A:A');

// Get entire row
const row1 = sheet.getRange('1:1');
```

---

### Cache Range References

**❌ BAD - Multiple lookups**:
```javascript
function badCaching() {
  for (let i = 0; i < 100; i++) {
    const sheet = SpreadsheetApp.getActiveSheet(); // 100 calls!
    const range = sheet.getRange('A1'); // 100 calls!
    // Process...
  }
}
```

**✅ GOOD - Cache references**:
```javascript
function goodCaching() {
  // Cache outside loop
  const sheet = SpreadsheetApp.getActiveSheet(); // 1 call
  const range = sheet.getRange('A1:D100'); // 1 call
  const data = range.getValues(); // 1 call

  // Iterate array (no API calls)
  data.forEach(row => {
    // Process in memory
  });
}
```

---

## 📌 Named Ranges

### Benefits

- **Maintainable**: Change range location without changing code
- **Readable**: `'OrderData'` is clearer than `'B2:E1000'`
- **Resilient**: Works when columns are inserted/deleted

---

### Creating Named Ranges

```javascript
function createNamedRanges() {
  const sheet = SpreadsheetApp.getActiveSheet();

  // Create named range
  const range = sheet.getRange('A2:D1000');
  SpreadsheetApp.getActiveSpreadsheet().setNamedRange('OrderData', range);

  Logger.log('✅ Named range "OrderData" created');
}
```

---

### Using Named Ranges

```javascript
function useNamedRange() {
  const sheet = SpreadsheetApp.getActiveSheet();

  // Get named range
  const namedRange = sheet.getRangeByName('OrderData');

  if (!namedRange) {
    throw new Error('Named range "OrderData" not found');
  }

  // Use it like any range
  const data = namedRange.getValues();

  return data;
}
```

---

### List All Named Ranges

```javascript
function listNamedRanges() {
  const namedRanges = SpreadsheetApp.getActiveSpreadsheet().getNamedRanges();

  namedRanges.forEach(nr => {
    Logger.log(`${nr.getName()}: ${nr.getRange().getA1Notation()}`);
  });
}
```

---

## 📐 Formula Injection

### Setting Single Formula

```javascript
function setSingleFormula() {
  const sheet = SpreadsheetApp.getActiveSheet();

  // Set formula in cell
  sheet.getRange('C2').setFormula('=A2+B2');

  // Result: C2 will show sum of A2 and B2
}
```

---

### Batch Formula Setting

```javascript
function batchFormulas(numRows) {
  const sheet = SpreadsheetApp.getActiveSheet();

  // Prepare formulas (2D array)
  const formulas = [];
  for (let i = 2; i <= numRows + 1; i++) {
    formulas.push([
      `=A${i}+B${i}`,        // Column C: sum
      `=A${i}*B${i}`,        // Column D: product
      `=IF(A${i}>100,"High","Low")` // Column E: conditional
    ]);
  }

  // Set all formulas at once - 1 API call
  sheet.getRange(2, 3, formulas.length, 3).setFormulas(formulas);

  Logger.log(`Set ${formulas.length} rows of formulas`);
}
```

---

### Formula Results

```javascript
function getFormulaResults() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const range = sheet.getRange('C2:C10');

  // Get calculated values (not formulas)
  const values = range.getValues(); // Returns [[42], [55], ...]

  // Get formulas themselves
  const formulas = range.getFormulas(); // Returns [['=A2+B2'], ['=A3+B3'], ...]

  // Get display values (formatted)
  const displayValues = range.getDisplayValues(); // Returns [['$42.00'], ['$55.00'], ...]

  return { values, formulas, displayValues };
}
```

---

## ✅ Data Validation

### Dropdown Lists

```javascript
function createDropdown() {
  const sheet = SpreadsheetApp.getActiveSheet();

  // Define dropdown options
  const options = ['Open', 'In Progress', 'Completed', 'Canceled'];

  // Create validation rule
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(options, true) // true = show dropdown
    .setAllowInvalid(false) // Reject invalid values
    .setHelpText('Select order status')
    .build();

  // Apply to range
  sheet.getRange('D2:D1000').setDataValidation(rule);

  Logger.log('✅ Dropdown created for status column');
}
```

---

### Custom Validation Rules

```javascript
function customValidation() {
  const sheet = SpreadsheetApp.getActiveSheet();

  // Number validation: must be > 0
  const numberRule = SpreadsheetApp.newDataValidation()
    .requireNumberGreaterThan(0)
    .setAllowInvalid(false)
    .setHelpText('Must be a positive number')
    .build();

  sheet.getRange('E2:E1000').setDataValidation(numberRule);

  // Date validation: must be in the future
  const today = new Date();
  const dateRule = SpreadsheetApp.newDataValidation()
    .requireDateAfter(today)
    .setAllowInvalid(false)
    .setHelpText('Must be a future date')
    .build();

  sheet.getRange('F2:F1000').setDataValidation(dateRule);

  // Text validation: email format
  const emailRule = SpreadsheetApp.newDataValidation()
    .requireTextIsEmail()
    .setAllowInvalid(false)
    .setHelpText('Must be a valid email')
    .build();

  sheet.getRange('G2:G1000').setDataValidation(emailRule);
}
```

---

## 🎨 Formatting

### Separate Data from Formatting

**❌ BAD - Mixed operations**:
```javascript
function mixedOperations(data) {
  const sheet = SpreadsheetApp.getActiveSheet();

  data.forEach((row, i) => {
    const range = sheet.getRange(i + 2, 1, 1, 4);
    range.setValues([row]);         // Set data
    range.setNumberFormat('$#,##0.00'); // Format immediately
    // 2N API calls!
  });
}
```

**✅ GOOD - Separate batches**:
```javascript
function separatedOperations(data) {
  const sheet = SpreadsheetApp.getActiveSheet();

  // 1. Set all data (1 API call)
  sheet.getRange(2, 1, data.length, 4).setValues(data);

  // 2. Then format (1 API call)
  sheet.getRange(2, 4, data.length, 1).setNumberFormat('$#,##0.00');

  // Total: 2 API calls (vs 2N)
}
```

---

### Common Number Formats

```javascript
function applyNumberFormats() {
  const sheet = SpreadsheetApp.getActiveSheet();

  // Currency: $1,234.56
  sheet.getRange('D2:D1000').setNumberFormat('$#,##0.00');

  // Percentage: 45.60%
  sheet.getRange('E2:E1000').setNumberFormat('0.00%');

  // Date: 2024-01-15
  sheet.getRange('F2:F1000').setNumberFormat('yyyy-mm-dd');

  // DateTime: 2024-01-15 14:30
  sheet.getRange('G2:G1000').setNumberFormat('yyyy-mm-dd hh:mm');

  // Integer with thousand separator: 1,234
  sheet.getRange('H2:H1000').setNumberFormat('#,##0');

  // Text (preserve leading zeros): 00123
  sheet.getRange('I2:I1000').setNumberFormat('@');
}
```

---

### Conditional Formatting

```javascript
function conditionalFormatting() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const range = sheet.getRange('D2:D1000');

  // Clear existing rules
  range.clearConditionalFormatRules();

  // Rule 1: Highlight if > 1000 (green)
  const highValueRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(1000)
    .setBackground('#b7e1cd')
    .setRanges([range])
    .build();

  // Rule 2: Highlight if < 100 (red)
  const lowValueRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(100)
    .setBackground('#f4c7c3')
    .setRanges([range])
    .build();

  // Apply rules
  sheet.setConditionalFormatRules([highValueRule, lowValueRule]);
}
```

---

## 🔍 Sheets as Database - Query Patterns

### Index Lookup (O(1) access)

```javascript
function createIndex(data) {
  // Build index: ID → row
  const index = {};

  data.forEach((row, idx) => {
    const id = row[0]; // First column = ID
    index[id] = {
      rowIndex: idx + 2, // +2 for header and 0-based
      data: row
    };
  });

  return index;
}

// Usage
function lookupById(id) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();

  const index = createIndex(data.slice(1)); // Skip header

  const result = index[id];
  if (result) {
    Logger.log(`Found at row ${result.rowIndex}: ${result.data}`);
  } else {
    Logger.log(`ID ${id} not found`);
  }

  return result;
}
```

---

### Filtering Data

```javascript
function filterData(criteria) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();

  // Skip header
  const dataRows = data.slice(1);

  // Filter: status = 'Open' AND total > 1000
  const filtered = dataRows.filter(row => {
    const [id, date, customer, status, total] = row;
    return status === 'Open' && total > 1000;
  });

  Logger.log(`Found ${filtered.length} matching rows`);
  return filtered;
}
```

---

## ⚡ Performance Optimization

### Minimize API Calls

**Key metrics**:
- `getRange()` / `getValue()` / `setValue()`: ~100ms each
- `getValues()` / `setValues()`: ~200ms (regardless of size up to 10K cells)
- Goal: Minimize calls, maximize batch size

---

### Optimization Checklist

```javascript
function optimizedSheetOperation(orders) {
  // 1. Cache sheet reference (don't call getActiveSheet in loop)
  const sheet = SpreadsheetApp.getActiveSheet();

  // 2. Read all data in one batch
  const existingData = sheet.getDataRange().getValues();

  // 3. Process in memory (no API calls)
  const updatedData = existingData.map(row => {
    // Transform row
    return row;
  });

  // 4. Write all data in one batch
  sheet.getRange(1, 1, updatedData.length, updatedData[0].length)
    .setValues(updatedData);

  // Total: 2 API calls (read + write)
}
```

---

### Avoid Unnecessary Clear/Rewrite

**❌ BAD - Always clear and rewrite**:
```javascript
function inefficientUpdate(newData) {
  const sheet = SpreadsheetApp.getActiveSheet();

  // Clear everything
  sheet.clear(); // API call 1

  // Rewrite everything
  sheet.getRange(1, 1, newData.length, newData[0].length)
    .setValues(newData); // API call 2

  // Problem: Unnecessarily cleared/rewrote unchanged data
}
```

**✅ GOOD - Update only changed rows**:
```javascript
function efficientUpdate(newData) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const existingData = sheet.getDataRange().getValues();

  // Find changed rows
  const updates = [];
  newData.forEach((newRow, i) => {
    const existingRow = existingData[i];

    if (!arraysEqual(newRow, existingRow)) {
      updates.push({ row: i + 1, data: newRow });
    }
  });

  // Update only changed rows
  updates.forEach(update => {
    sheet.getRange(update.row, 1, 1, update.data.length)
      .setValues([update.data]);
  });

  Logger.log(`Updated ${updates.length} rows (out of ${newData.length})`);
}

function arraysEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
```

---

## ✅ Sheets Best Practices

### Checklist

- [x] **Always batch read/write** - Use `getValues()`/`setValues()`, never loops
- [x] **Cache sheet & range references** - Don't call `getActiveSheet()` in loops
- [x] **Use named ranges** - More maintainable than A1 notation
- [x] **Separate data from formatting** - Batch data operations, then format
- [x] **Build indexes for lookups** - O(1) access vs O(N) scan
- [x] **Validate data before writing** - Prevent bad data in Sheets
- [x] **Monitor execution time** - Log start/end, watch for 6-minute limit
- [x] **Handle errors gracefully** - Try-catch on Sheets operations
- [x] **Use `getDataRange()`** - Auto-detects data dimensions
- [x] **Protect ranges from user edits** - Use `protect()` for formulas
- [x] **Test with realistic data volumes** - 1000+ rows

---

## 🔗 Related Files

- `platform/performance.md` - Performance optimization patterns
- `data-engineer.md` - ETL patterns to/from Sheets
- `platform/error-handling.md` - Error handling
- `workspace/properties-triggers.md` - Triggers for Sheets events

---

**Versione**: 1.0
**Context Size**: ~620 righe
