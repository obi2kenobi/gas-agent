# 🔍 Query Patterns for Sheets

**Categoria**: Data → Query Operations
**Righe**: ~350
**Parent**: `specialists/data-engineer.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Implement complex queries on Sheets data
- Use QUERY function for SQL-like operations
- Combine FILTER, SORT, UNIQUE functions
- Optimize query performance
- Build dynamic queries

---

## 📊 QUERY Function (SQL-like)

### Basic SELECT

```javascript
// In Sheet formula:
=QUERY(Orders!A2:E1000, "SELECT A, B, E WHERE E = 'Pending'")

// Equivalent GAS code:
function queryOrders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ordersSheet = ss.getSheetByName('Orders');
  const data = ordersSheet.getRange('A2:E1000').getValues();
  
  // Filter: status = 'Pending'
  const filtered = data.filter(row => row[4] === 'Pending');
  
  // Select columns A, B, E (0, 1, 4)
  return filtered.map(row => [row[0], row[1], row[4]]);
}
```

---

### WHERE Clause

```javascript
// Multiple conditions
=QUERY(Orders!A:E, "SELECT * WHERE D > 1000 AND E = 'Pending'")

// Date filtering
=QUERY(Orders!A:E, "SELECT * WHERE C >= date '2024-01-01'")

// Text contains
=QUERY(Orders!A:E, "SELECT * WHERE B CONTAINS 'Acme'")

// IN clause
=QUERY(Orders!A:E, "SELECT * WHERE E = 'Pending' OR E = 'Shipped'")
```

---

### ORDER BY

```javascript
// Sort descending
=QUERY(Orders!A:E, "SELECT * ORDER BY D DESC")

// Multiple columns
=QUERY(Orders!A:E, "SELECT * ORDER BY E ASC, D DESC")
```

---

### GROUP BY & Aggregates

```javascript
// Count by status
=QUERY(Orders!A:E, "SELECT E, COUNT(A) GROUP BY E")

// Sum by customer
=QUERY(Orders!A:E, "SELECT B, SUM(D) GROUP BY B ORDER BY SUM(D) DESC")

// Average
=QUERY(Orders!A:E, "SELECT E, AVG(D) GROUP BY E")
```

---

## 🔍 FILTER Function

### Basic Filtering

```javascript
// Formula
=FILTER(Orders!A2:E1000, Orders!E2:E1000="Pending")

// GAS equivalent
function filterPendingOrders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
  const data = sheet.getRange('A2:E1000').getValues();
  
  return data.filter(row => row[4] === 'Pending');
}
```

---

### Multiple Conditions (AND)

```javascript
// Formula: status='Pending' AND total>1000
=FILTER(Orders!A2:E1000, 
  (Orders!E2:E1000="Pending") * (Orders!D2:D1000>1000)
)

// GAS
function filterHighValuePending() {
  const data = sheet.getDataRange().getValues().slice(1);
  return data.filter(row => row[4] === 'Pending' && row[3] > 1000);
}
```

---

### OR Conditions

```javascript
// Formula: status='Pending' OR status='Shipped'
=FILTER(Orders!A2:E1000,
  (Orders!E2:E1000="Pending") + (Orders!E2:E1000="Shipped")
)
```

---

## 🔀 SORT Function

```javascript
// Sort by column D descending
=SORT(Orders!A2:E1000, 4, FALSE)

// Multiple columns
=SORT(Orders!A2:E1000, {5, 4}, {TRUE, FALSE})
// Sort by column 5 ASC, then column 4 DESC
```

---

## 🎯 UNIQUE Function

```javascript
// Unique customers
=UNIQUE(Orders!B2:B1000)

// Unique combinations
=UNIQUE(Orders!B2:C1000)  // Customer + Date pairs
```

---

## 🔗 Combining Functions

### FILTER + SORT

```javascript
=SORT(
  FILTER(Orders!A2:E1000, Orders!E2:E1000="Pending"),
  4,
  FALSE
)
// Pending orders sorted by total (desc)
```

---

### QUERY + JOIN-like

```javascript
// Query Orders with customer lookup
=QUERY({Orders!A2:E1000, VLOOKUP(Orders!B2:B1000, Customers!A:C, 2, FALSE)},
  "SELECT Col1, Col2, Col6 WHERE Col5 = 'Pending'"
)
```

---

## ⚡ ARRAYFORMULA

### Dynamic Calculations

```javascript
// Calculate line total for all rows
=ARRAYFORMULA(IF(A2:A<>"", C2:C * D2:D, ""))

// Conditional formatting
=ARRAYFORMULA(IF(E2:E="Pending", "⏳ " & E2:E, E2:E))
```

---

## 🎯 GAS Query Builder

```javascript
function buildDynamicQuery(criteria) {
  let query = "SELECT *";
  const whereClauses = [];
  
  if (criteria.status) {
    whereClauses.push(`E = '${criteria.status}'`);
  }
  
  if (criteria.minTotal) {
    whereClauses.push(`D >= ${criteria.minTotal}`);
  }
  
  if (criteria.startDate) {
    whereClauses.push(`C >= date '${criteria.startDate}'`);
  }
  
  if (whereClauses.length > 0) {
    query += " WHERE " + whereClauses.join(" AND ");
  }
  
  if (criteria.orderBy) {
    query += ` ORDER BY ${criteria.orderBy}`;
  }
  
  if (criteria.limit) {
    query += ` LIMIT ${criteria.limit}`;
  }
  
  return query;
}

// Usage
const query = buildDynamicQuery({
  status: 'Pending',
  minTotal: 1000,
  orderBy: 'D DESC',
  limit: 10
});
// Result: "SELECT * WHERE E = 'Pending' AND D >= 1000 ORDER BY D DESC LIMIT 10"
```

---

## 📊 Performance Optimization

### Index-Based Lookup (O(1))

```javascript
function buildLookupIndex(data, keyColumn) {
  const index = {};
  data.forEach(row => {
    index[row[keyColumn]] = row;
  });
  return index;
}

// Usage
const customers = sheet.getDataRange().getValues();
const customerIndex = buildLookupIndex(customers, 0); // Index by ID

// O(1) lookup vs O(n) scan
const customer = customerIndex['CUST-123'];
```

---

## ✅ Query Best Practices

- [x] **Use QUERY for complex filters** - More readable than nested IF
- [x] **FILTER for simple conditions** - Faster than QUERY
- [x] **Build indexes for joins** - O(1) vs O(n)
- [x] **Cache query results** - Don't recompute on every call
- [x] **Limit result sets** - Use LIMIT in QUERY
- [x] **Test with production data volumes** - 10K+ rows

---

## 🔗 Related Files

- `data/sheets-database.md` - Database patterns
- `workspace/sheets-patterns.md` - Sheets operations
- `data/etl-patterns.md` - ETL patterns

---

**Versione**: 1.0
**Context Size**: ~350 righe
