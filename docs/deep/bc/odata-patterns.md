# 💼 OData Query Patterns

**Categoria**: BC → Query Construction
**Righe**: ~680
**Parent**: `specialists/bc-specialist.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Costruire OData queries per Business Central API
- Usare `$filter`, `$expand`, `$select` query options
- Implementare paginazione con `$top`/`$skip`
- Ottimizzare query performance (ridurre payload, API calls)
- Gestire complex filters con logical operators
- Implementare incremental sync con lastModifiedDateTime

---

## 🌐 OData Basics

### BC API URL Structure

**Format**:
```
https://{tenant}.api.businesscentral.dynamics.com/v2.0/{environment}/api/v2.0/companies({companyId})/{entitySet}?{queryOptions}
```

**Components**:
- `{tenant}`: BC tenant (e.g., "contoso")
- `{environment}`: Environment name (e.g., "production", "sandbox")
- `{companyId}`: Company GUID
- `{entitySet}`: Entity collection (e.g., "salesOrders", "customers")
- `{queryOptions}`: OData query parameters

**Example**:
```javascript
const BC_BASE_URL = 'https://contoso.api.businesscentral.dynamics.com/v2.0/production/api/v2.0';
const COMPANY_ID = '12345678-1234-1234-1234-123456789012';

const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders?$filter=status eq 'Open'&$top=100`;
```

---

## 🔍 $filter - Server-Side Filtering

### Basic Filter Operators

**Equality (`eq`)**:
```javascript
// Get specific order by number
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders?$filter=number eq 'SO-001234'`;

// Get open orders
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders?$filter=status eq 'Open'`;

// Get customer by email
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/customers?$filter=email eq 'contact@contoso.com'`;
```

**Inequality (`ne`)**:
```javascript
// Get all non-canceled orders
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders?$filter=status ne 'Canceled'`;
```

**Comparison Operators** (`gt`, `ge`, `lt`, `le`):
```javascript
// Orders after 2024-01-01
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders?$filter=orderDate gt 2024-01-01`;

// Orders with total > 1000
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders?$filter=totalAmountIncludingTax gt 1000`;

// Items with low stock
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/items?$filter=inventory le 10`;
```

---

### String Functions

**`contains()` - Substring search**:
```javascript
// Find customers with "Contoso" in name
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/customers?$filter=contains(displayName, 'Contoso')`;

// Search items by description
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/items?$filter=contains(description, 'Widget')`;
```

**`startswith()` - Prefix search**:
```javascript
// Customers starting with "A"
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/customers?$filter=startswith(displayName, 'A')`;
```

**`endswith()` - Suffix search**:
```javascript
// Items ending with specific code
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/items?$filter=endswith(number, '-XL')`;
```

---

### Logical Operators

**AND (`and`)**:
```javascript
// Open orders from 2024
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders?$filter=status eq 'Open' and orderDate ge 2024-01-01`;

// Items in specific category and low stock
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/items?$filter=itemCategoryCode eq 'ELECTRONICS' and inventory lt 20`;
```

**OR (`or`)**:
```javascript
// Orders that are Open or Released
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders?$filter=status eq 'Open' or status eq 'Released'`;

// Items from multiple categories
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/items?$filter=itemCategoryCode eq 'ELECTRONICS' or itemCategoryCode eq 'FURNITURE'`;
```

**NOT (`not`)**:
```javascript
// All non-closed orders
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders?$filter=not (status eq 'Closed')`;
```

**Grouping with parentheses**:
```javascript
// Complex logic: (A AND B) OR (C AND D)
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders?$filter=(status eq 'Open' and orderDate gt 2024-01-01) or (status eq 'Released' and orderDate gt 2023-12-01)`;
```

---

### Date Filtering

**Date ranges**:
```javascript
// Orders in date range
function getOrdersInDateRange(startDate, endDate) {
  const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders?$filter=orderDate ge ${startDate} and orderDate le ${endDate}`;

  return fetchBCData(url);
}

// Usage
const orders = getOrdersInDateRange('2024-01-01', '2024-12-31');
```

**Current year/month**:
```javascript
// Orders this year
function getOrdersThisYear() {
  const year = new Date().getFullYear();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  return getOrdersInDateRange(startDate, endDate);
}

// Orders this month
function getOrdersThisMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  const startDate = `${year}-${month}-01`;

  // Last day of month
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  const endDate = `${year}-${month}-${lastDay}`;

  return getOrdersInDateRange(startDate, endDate);
}
```

---

## 📦 $expand - Load Related Entities

### Single Expand

**Load customer with sales order**:
```javascript
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders(${orderId})?$expand=customer`;

// Response includes customer object:
{
  "id": "...",
  "number": "SO-001234",
  "customer": {
    "id": "...",
    "displayName": "Contoso Ltd.",
    "email": "contact@contoso.com"
  }
}
```

---

### Multiple Expand

**Load multiple related entities**:
```javascript
// Sales order with customer AND lines
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders(${orderId})?$expand=customer,salesOrderLines`;

// Response includes both:
{
  "id": "...",
  "number": "SO-001234",
  "customer": { ... },
  "salesOrderLines": [
    { "id": "...", "description": "Widget A", "quantity": 10 },
    { "id": "...", "description": "Widget B", "quantity": 5 }
  ]
}
```

---

### Nested Expand

**Multi-level relationships**:
```javascript
// Sales order → lines → item
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders(${orderId})?$expand=salesOrderLines($expand=item)`;

// Response:
{
  "id": "...",
  "salesOrderLines": [
    {
      "id": "...",
      "quantity": 10,
      "item": {
        "id": "...",
        "displayName": "Widget A",
        "unitPrice": 50.00
      }
    }
  ]
}
```

**Three levels**:
```javascript
// Order → Lines → Item → ItemCategory
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders(${orderId})?$expand=salesOrderLines($expand=item($expand=itemCategory))`;
```

---

### Expand Benefits

**Without `$expand` (N+1 problem)**:
```javascript
// ❌ BAD: 1 + N API calls
// 1. Get order
const order = fetchOrder(orderId);

// 2-N. Get each line's item (10 lines = 10 API calls)
order.salesOrderLines.forEach(line => {
  const item = fetchItem(line.itemId); // 10 separate calls!
});

// Total: 11 API calls
```

**With `$expand` (1 call)**:
```javascript
// ✅ GOOD: 1 API call
const order = fetchOrderWithLines(orderId); // Includes all line items

// Total: 1 API call (saves 10 calls!)
```

---

## 📝 $select - Field Projection

### Select Specific Fields

**Reduce payload size**:
```javascript
// ❌ BAD: Fetch all fields (~2KB per order)
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders?$top=100`;
// Returns ~200KB for 100 orders

// ✅ GOOD: Select only needed fields (~500 bytes per order)
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders?$select=number,orderDate,customerName,totalAmountIncludingTax&$top=100`;
// Returns ~50KB for 100 orders (75% reduction!)
```

**Example**:
```javascript
function getOrderSummaries() {
  const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders?$select=id,number,orderDate,customerName,status,totalAmountIncludingTax&$filter=orderDate gt 2024-01-01&$orderby=orderDate desc&$top=100`;

  return fetchBCData(url);
}
```

---

### Combining $select with $expand

```javascript
// Select fields from main entity AND expanded entity
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders?$select=number,orderDate,totalAmountIncludingTax&$expand=customer($select=displayName,email)`;

// Response:
[
  {
    "number": "SO-001234",
    "orderDate": "2024-01-15",
    "totalAmountIncludingTax": 1100.00,
    "customer": {
      "displayName": "Contoso Ltd.",
      "email": "contact@contoso.com"
    }
  }
]
```

---

## 📄 $top / $skip - Pagination

### Basic Pagination

```javascript
function fetchOrdersPage(pageNumber, pageSize = 50) {
  const skip = (pageNumber - 1) * pageSize;

  const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders?$top=${pageSize}&$skip=${skip}&$orderby=orderDate desc`;

  return fetchBCData(url);
}

// Usage
const page1 = fetchOrdersPage(1, 50); // Records 0-49
const page2 = fetchOrdersPage(2, 50); // Records 50-99
const page3 = fetchOrdersPage(3, 50); // Records 100-149
```

---

### Fetch All with Pagination

```javascript
function fetchAllOrders(filter = '') {
  const PAGE_SIZE = 100;
  let allOrders = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const skip = (page - 1) * PAGE_SIZE;
    const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders?$top=${PAGE_SIZE}&$skip=${skip}${filter ? '&$filter=' + filter : ''}`;

    const orders = fetchBCData(url);

    if (orders.length > 0) {
      allOrders = allOrders.concat(orders);
      page++;

      // Check if we got full page (more might exist)
      hasMore = orders.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }

    Logger.log(`Fetched page ${page - 1}: ${orders.length} orders`);

    // Safety limit
    if (page > 100) {
      Logger.log('⚠️ Reached 100 pages (10,000 records). Stopping.');
      break;
    }
  }

  Logger.log(`✅ Total orders fetched: ${allOrders.length}`);
  return allOrders;
}
```

---

## 📊 $orderby - Sorting

### Basic Sorting

```javascript
// Sort by date (descending - most recent first)
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders?$orderby=orderDate desc`;

// Sort by customer name (ascending - A to Z)
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/customers?$orderby=displayName asc`;

// Sort by total amount (descending - highest first)
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders?$orderby=totalAmountIncludingTax desc`;
```

---

### Multiple Sort Fields

```javascript
// Sort by status first, then by date
const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders?$orderby=status asc,orderDate desc`;

// Equivalent to SQL: ORDER BY status ASC, orderDate DESC
```

---

## 🔗 Complex Query Examples

### Full-Featured Query

```javascript
function getRecentOpenOrders() {
  // Combine multiple OData options
  const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders?` +
    `$filter=status eq 'Open' and orderDate ge 2024-01-01` +
    `&$expand=customer,salesOrderLines($expand=item)` +
    `&$select=id,number,orderDate,customerName,totalAmountIncludingTax` +
    `&$orderby=orderDate desc` +
    `&$top=50`;

  return fetchBCData(url);
}
```

---

### Incremental Sync Pattern

**Track changes since last sync**:
```javascript
function syncOrdersSince(lastSyncTimestamp) {
  // Get orders modified since last sync
  const filter = `lastModifiedDateTime gt ${lastSyncTimestamp}`;

  const url = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders?$filter=${filter}&$orderby=lastModifiedDateTime asc`;

  const changes = fetchBCData(url);

  Logger.log(`Found ${changes.length} orders modified since ${lastSyncTimestamp}`);

  return changes;
}

// Usage
function incrementalOrderSync() {
  const props = PropertiesService.getScriptProperties();
  const lastSync = props.getProperty('last_order_sync') || '2024-01-01T00:00:00Z';

  const changes = syncOrdersSince(lastSync);

  // Process changes...

  // Update last sync timestamp
  const now = new Date().toISOString();
  props.setProperty('last_order_sync', now);

  return changes;
}
```

---

## ⚡ Performance Optimization

### Anti-Pattern: Client-Side Filtering

**❌ BAD** - Fetch everything, filter in code:
```javascript
// Fetches ALL orders (could be thousands!)
const allOrders = fetchBCData(`${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders`);

// Filter in JavaScript
const openOrders = allOrders.filter(order => order.status === 'Open');

// Problems:
// - Transfers excessive data (MBs)
// - Slow (network + parsing)
// - Risk of timeout
// - Wastes API quota
```

**✅ GOOD** - Server-side filtering:
```javascript
// Fetch only what you need
const openOrders = fetchBCData(`${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders?$filter=status eq 'Open'`);

// Benefits:
// - Transfers only necessary data (KBs)
// - Fast (server-optimized query)
// - No timeout risk
// - Efficient API usage
```

---

### Optimization Checklist

- [x] **Always use `$filter`** - Server-side filtering is 10-100x faster
- [x] **Use `$select`** - Reduce payload by 50-70%
- [x] **Use `$expand`** - Avoid N+1 queries (1 call vs 10+)
- [x] **Implement pagination** - Use `$top`/`$skip` for large datasets
- [x] **Cache results** - Cache frequently-accessed data (items, customers)
- [x] **Index on BC side** - Ensure BC has indexes on filter fields
- [x] **Monitor query performance** - Log response times
- [x] **Batch reads** - Combine related queries with `$expand`

---

## 🛠️ Helper Functions

### OData Query Builder

```javascript
const ODataQueryBuilder = (function() {
  function build(baseUrl, options = {}) {
    const {
      filter = null,
      expand = null,
      select = null,
      orderby = null,
      top = null,
      skip = null
    } = options;

    let query = baseUrl;
    const params = [];

    if (filter) params.push(`$filter=${encodeURIComponent(filter)}`);
    if (expand) params.push(`$expand=${expand}`);
    if (select) params.push(`$select=${select}`);
    if (orderby) params.push(`$orderby=${orderby}`);
    if (top) params.push(`$top=${top}`);
    if (skip) params.push(`$skip=${skip}`);

    if (params.length > 0) {
      query += '?' + params.join('&');
    }

    return query;
  }

  return { build };
})();

// Usage
function getFilteredOrders() {
  const baseUrl = `${BC_BASE_URL}/companies(${COMPANY_ID})/salesOrders`;

  const url = ODataQueryBuilder.build(baseUrl, {
    filter: "status eq 'Open' and orderDate ge 2024-01-01",
    expand: 'customer,salesOrderLines',
    select: 'id,number,orderDate,customerName,totalAmountIncludingTax',
    orderby: 'orderDate desc',
    top: 100
  });

  return fetchBCData(url);
}
```

---

## ✅ OData Best Practices

### Checklist

- [x] **Always filter server-side** - Use `$filter`, never client-side filtering
- [x] **Use `$select` to minimize payload** - 50-70% reduction typical
- [x] **Use `$expand` for related entities** - Avoid N+1 queries
- [x] **Implement pagination for large datasets** - Use `$top`/`$skip`
- [x] **Cache metadata** - Entity structure rarely changes
- [x] **Validate OData syntax** - Test queries before deploying
- [x] **Log queries for debugging** - Include URL in logs
- [x] **Handle empty results** - Check for zero-length arrays
- [x] **Use `$count` for totals** - Get count without fetching data
- [x] **Monitor API usage** - Track calls per day/hour
- [x] **Respect BC rate limits** - Implement throttling if needed
- [x] **Test with production-like data volumes** - Ensure queries scale

---

## 🔗 Related Files

- `bc/entities.md` - BC entity structures and relationships
- `integration/http-patterns.md` - Making BC API calls with UrlFetchApp
- `platform/caching.md` - Caching query results
- `security/oauth2-patterns.md` - BC authentication
- `integration/webhooks-sync.md` - Incremental sync strategies

---

**Versione**: 1.0
**Context Size**: ~680 righe
