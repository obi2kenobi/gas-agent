# 📊 Sheets as Database

**Categoria**: Data → Database Patterns
**Righe**: ~400
**Parent**: `specialists/data-engineer.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Design Sheets as relational database
- Implement CRUD operations on Sheets
- Create indexes for fast lookups
- Handle referential integrity
- Implement transaction-like operations
- Optimize for 10K+ rows

---

## 📋 Schema Design

### Table Structure

```javascript
// Orders "table" (Sheet)
const OrdersSchema = {
  sheetName: 'Orders',
  columns: [
    { name: 'ID', type: 'string', primaryKey: true },
    { name: 'Customer_ID', type: 'string', foreignKey: 'Customers.ID' },
    { name: 'Date', type: 'date' },
    { name: 'Total', type: 'number' },
    { name: 'Status', type: 'enum', values: ['Pending', 'Shipped', 'Delivered'] }
  ]
};

// Customers "table"
const CustomersSchema = {
  sheetName: 'Customers',
  columns: [
    { name: 'ID', type: 'string', primaryKey: true },
    { name: 'Name', type: 'string', required: true },
    { name: 'Email', type: 'string', unique: true },
    { name: 'Created', type: 'date' }
  ]
};
```

### Relational Patterns

```
Orders (1:N with OrderLines)
├─ ID (PK)
├─ Customer_ID (FK → Customers.ID)
├─ Date
└─ Total

OrderLines
├─ ID (PK)
├─ Order_ID (FK → Orders.ID)
├─ Item_ID (FK → Items.ID)
├─ Quantity
└─ Price

Customers
├─ ID (PK)
├─ Name
└─ Email (UNIQUE)
```

---

## 🔑 Primary Keys & Foreign Keys

### Generate Primary Keys

```javascript
function generatePK() {
  return Utilities.getUuid(); // UUID
  // OR: timestamp-based
  // return `ORD-${Date.now()}`;
}
```

### Validate Foreign Keys

```javascript
function validateFK(value, referenceSheet, referenceColumn = 0) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(referenceSheet);
  const data = sheet.getDataRange().getValues();
  
  // Check if FK value exists in reference table
  const exists = data.slice(1).some(row => row[referenceColumn] === value);
  
  if (!exists) {
    throw new Error(`Invalid FK: ${value} not found in ${referenceSheet}`);
  }
  
  return true;
}
```

---

## 📖 CRUD Operations

### Create (INSERT)

```javascript
function insertOrder(order) {
  // Validate
  if (!order.customerID) throw new Error('Customer ID required');
  validateFK(order.customerID, 'Customers');
  
  // Generate PK
  order.id = generatePK();
  
  // Insert
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
  sheet.appendRow([
    order.id,
    order.customerID,
    order.date,
    order.total,
    order.status || 'Pending'
  ]);
  
  return order;
}
```

### Read (SELECT)

```javascript
function selectOrders(criteria = {}) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
  const data = sheet.getDataRange().getValues();
  const header = data[0];
  const rows = data.slice(1);
  
  // Filter
  let filtered = rows;
  if (criteria.status) {
    filtered = filtered.filter(row => row[4] === criteria.status);
  }
  if (criteria.minTotal) {
    filtered = filtered.filter(row => row[3] >= criteria.minTotal);
  }
  
  // Map to objects
  return filtered.map(row => ({
    id: row[0],
    customerID: row[1],
    date: row[2],
    total: row[3],
    status: row[4]
  }));
}

// SELECT by PK
function selectOrderById(id) {
  const orders = selectOrders();
  return orders.find(o => o.id === id);
}
```

### Update (UPDATE)

```javascript
function updateOrder(id, updates) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
  const data = sheet.getDataRange().getValues();
  
  // Find row
  const rowIndex = data.findIndex((row, idx) => idx > 0 && row[0] === id);
  
  if (rowIndex === -1) {
    throw new Error(`Order ${id} not found`);
  }
  
  // Update fields
  const row = data[rowIndex];
  if (updates.status) row[4] = updates.status;
  if (updates.total) row[3] = updates.total;
  
  // Write back
  sheet.getRange(rowIndex + 1, 1, 1, row.length).setValues([row]);
  
  return selectOrderById(id);
}
```

### Delete (DELETE)

```javascript
function deleteOrder(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
  const data = sheet.getDataRange().getValues();
  
  // Find row
  const rowIndex = data.findIndex((row, idx) => idx > 0 && row[0] === id);
  
  if (rowIndex === -1) {
    throw new Error(`Order ${id} not found`);
  }
  
  // Delete row
  sheet.deleteRow(rowIndex + 1);
  
  Logger.log(`Deleted order: ${id}`);
}
```

---

## 🔍 Indexing for Performance

### Build In-Memory Index

```javascript
function buildIndex(sheetName, keyColumn = 0) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  
  const index = {};
  data.slice(1).forEach((row, idx) => {
    const key = row[keyColumn];
    index[key] = {
      rowIndex: idx + 2, // +2 for header and 0-based
      data: row
    };
  });
  
  return index;
}

// Usage - O(1) lookup
function lookupByIndex(id) {
  const index = buildIndex('Orders', 0); // Index on column 0 (ID)
  
  const result = index[id];
  if (result) {
    return result.data;
  }
  return null;
}
```

---

## 🔗 JOIN-Like Operations

### Simulate INNER JOIN

```javascript
function joinOrdersWithCustomers() {
  const orders = selectOrders();
  const customers = selectCustomers();
  
  // Build customer index
  const customerIndex = {};
  customers.forEach(c => {
    customerIndex[c.id] = c;
  });
  
  // Join
  return orders.map(order => ({
    ...order,
    customerName: customerIndex[order.customerID]?.name || 'Unknown',
    customerEmail: customerIndex[order.customerID]?.email
  }));
}
```

---

## 🛡️ Referential Integrity

### Cascade Delete

```javascript
function deleteCustomerCascade(customerID) {
  // 1. Delete related orders
  const orders = selectOrders({ customerID });
  orders.forEach(order => deleteOrder(order.id));
  
  // 2. Delete customer
  deleteCustomer(customerID);
  
  Logger.log(`Deleted customer ${customerID} and ${orders.length} orders`);
}
```

### Prevent Delete if References Exist

```javascript
function deleteCustomerRestrict(customerID) {
  // Check for references
  const orders = selectOrders({ customerID });
  
  if (orders.length > 0) {
    throw new Error(`Cannot delete customer: ${orders.length} orders exist`);
  }
  
  deleteCustomer(customerID);
}
```

---

## 🔄 Transaction-Like Operations

### Atomic Batch Update

```javascript
function atomicBatchUpdate(operations) {
  // 1. Read all current data
  const backup = {};
  operations.forEach(op => {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(op.sheet);
    backup[op.sheet] = sheet.getDataRange().getValues();
  });
  
  try {
    // 2. Execute all operations
    operations.forEach(op => {
      if (op.type === 'insert') {
        insertOrder(op.data);
      } else if (op.type === 'update') {
        updateOrder(op.id, op.updates);
      }
    });
    
    Logger.log('✅ Batch update successful');
    
  } catch (error) {
    // 3. Rollback on error
    Logger.log(`❌ Batch update failed, rolling back: ${error.message}`);
    
    Object.keys(backup).forEach(sheetName => {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
      const data = backup[sheetName];
      sheet.clear();
      sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    });
    
    throw error;
  }
}
```

---

## ✅ Best Practices

- [x] **Use UUID for PK** - Avoids collisions
- [x] **Validate FK before insert** - Referential integrity
- [x] **Build indexes for large datasets** - O(1) lookup
- [x] **Batch operations** - getValues/setValues, not loops
- [x] **Normalize to 3NF** - Reduce redundancy
- [x] **Use named ranges** - Schema changes resilient
- [x] **Implement constraints** - Validate before write
- [x] **Handle NULL values** - Empty string vs null
- [x] **Document schema** - Column definitions
- [x] **Test with 10K+ rows** - Performance validation

---

## 🔗 Related Files

- `workspace/sheets-patterns.md` - Sheets operations
- `data/query-patterns.md` - Query patterns
- `data/etl-patterns.md` - ETL operations

---

**Versione**: 1.0
**Context Size**: ~400 righe
