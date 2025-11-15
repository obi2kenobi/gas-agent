# 💼 Business Central Entities

**Categoria**: BC → Data Model
**Righe**: ~570
**Parent**: `specialists/bc-specialist.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Comprendere BC data model e entity structure
- Identificare entity relationships (1:N, N:1)
- Conoscere key fields, SystemId, navigation properties
- Validare data types BC-specific (date, decimal, enum formats)
- Mappare BC entities a domain objects o Google Sheets
- Understand required fields per entity type

---

## 📦 Core Entities

### Sales Orders

**Entity Name**: `salesOrders`
**API Path**: `/companies({companyId})/salesOrders`

**Key Fields**:
```javascript
{
  "id": "12345678-1234-1234-1234-123456789012",           // GUID (primary key)
  "number": "SO-001234",                                   // Document number (auto-generated)
  "orderDate": "2024-01-15",                              // Date (YYYY-MM-DD)
  "customerId": "87654321-4321-4321-4321-210987654321",   // GUID (foreign key)
  "customerNumber": "C00001",                             // String
  "customerName": "Contoso Ltd.",                         // String
  "currencyCode": "USD",                                  // String (3-letter)
  "status": "Open",                                       // Enum: "Draft", "In Review", "Open"
  "salesperson": "JOHN",                                  // String
  "totalAmountExcludingTax": 1000.00,                     // Decimal
  "totalAmountIncludingTax": 1100.00,                     // Decimal
  "lastModifiedDateTime": "2024-01-15T10:30:00Z"          // DateTime (ISO 8601)
}
```

**Related Entities** (use `$expand`):
- `customer` - Customer entity
- `salesOrderLines` - Order line items (1:N relationship)
- `shipmentMethod` - Shipping info
- `paymentTerm` - Payment terms

**Example Query**:
```javascript
function getSalesOrder(companyId, orderId) {
  const url = `${BC_BASE_URL}/companies(${companyId})/salesOrders(${orderId})?$expand=salesOrderLines($expand=item),customer`;

  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  });

  return JSON.parse(response.getContentText());
}
```

---

### Sales Order Lines

**Entity Name**: `salesOrderLines`
**API Path**: `/companies({companyId})/salesOrders({salesOrderId})/salesOrderLines`

**Key Fields**:
```javascript
{
  "id": "11111111-1111-1111-1111-111111111111",
  "documentId": "12345678-1234-1234-1234-123456789012", // Parent sales order ID
  "sequence": 10000,                                     // Line number
  "itemId": "22222222-2222-2222-2222-222222222222",     // Item GUID
  "lineType": "Item",                                    // "Item", "Account", "Resource"
  "description": "Widget A",
  "quantity": 10,
  "unitOfMeasureCode": "PCS",
  "unitPrice": 50.00,
  "discountPercent": 5.0,
  "lineAmountExcludingTax": 475.00,
  "taxPercent": 10.0,
  "lineAmountIncludingTax": 522.50
}
```

**Related Entities**:
- `item` - Product details
- `account` - G/L Account (for lineType = "Account")
- `unitOfMeasure` - UOM details

---

### Purchase Orders

**Entity Name**: `purchaseOrders`
**API Path**: `/companies({companyId})/purchaseOrders`

**Key Fields**:
```javascript
{
  "id": "33333333-3333-3333-3333-333333333333",
  "number": "PO-005678",
  "orderDate": "2024-01-15",
  "vendorId": "44444444-4444-4444-4444-444444444444",    // Vendor GUID
  "vendorNumber": "V00100",
  "vendorName": "Fabrikam Supplies",
  "currencyCode": "USD",
  "status": "Open",                                       // "Draft", "In Review", "Open", "Released"
  "purchaser": "MARY",
  "totalAmountExcludingTax": 5000.00,
  "totalAmountIncludingTax": 5500.00,
  "requestedReceiptDate": "2024-02-01",
  "lastModifiedDateTime": "2024-01-15T11:00:00Z"
}
```

**Related Entities**:
- `vendor` - Vendor entity
- `purchaseOrderLines` - PO line items

---

### Items (Products)

**Entity Name**: `items`
**API Path**: `/companies({companyId})/items`

**Key Fields**:
```javascript
{
  "id": "22222222-2222-2222-2222-222222222222",
  "number": "ITEM-001",                                   // Item number (unique)
  "displayName": "Widget A",                              // Product name
  "type": "Inventory",                                    // "Inventory", "Service", "Non-Inventory"
  "blocked": false,                                       // Cannot be sold/purchased if true
  "baseUnitOfMeasureId": "55555555-5555-5555-5555-555555555555",
  "baseUnitOfMeasure": "PCS",                             // Unit code
  "itemCategoryId": "66666666-6666-6666-6666-666666666666",
  "itemCategoryCode": "ELECTRONICS",
  "unitPrice": 50.00,                                     // Default sales price
  "unitCost": 30.00,                                      // Cost
  "taxGroupCode": "TAXABLE",
  "inventory": 100,                                       // Current stock level
  "lastModifiedDateTime": "2024-01-10T09:00:00Z"
}
```

**Related Entities**:
- `itemCategory` - Product category
- `unitOfMeasure` - Unit of measure details
- `defaultDimensions` - Cost centers, projects

---

### Customers

**Entity Name**: `customers`
**API Path**: `/companies({companyId})/customers`

**Key Fields**:
```javascript
{
  "id": "87654321-4321-4321-4321-210987654321",
  "number": "C00001",                                     // Customer number
  "displayName": "Contoso Ltd.",                          // Customer name
  "type": "Company",                                      // "Company", "Person"
  "email": "contact@contoso.com",
  "phoneNumber": "+1 (555) 123-4567",
  "website": "https://contoso.com",
  "taxLiable": true,                                      // Subject to tax
  "taxAreaId": "77777777-7777-7777-7777-777777777777",
  "taxAreaDisplayName": "CA",                             // Tax jurisdiction
  "blocked": " ",                                         // " " (not blocked), "Ship", "Invoice", "All"
  "currencyCode": "USD",
  "paymentTermsId": "88888888-8888-8888-8888-888888888888",
  "paymentMethodId": "99999999-9999-9999-9999-999999999999",
  "balance": 5000.00,                                     // Outstanding balance
  "lastModifiedDateTime": "2024-01-05T14:30:00Z"
}
```

**Address Fields** (nested object):
```javascript
{
  "address": {
    "street": "123 Main St",
    "city": "Seattle",
    "state": "WA",
    "countryLetterCode": "US",
    "postalCode": "98101"
  }
}
```

**Related Entities**:
- `paymentTerm` - Payment terms
- `paymentMethod` - Payment method
- `currency` - Currency details
- `salesOrderHeaders` - Customer orders

---

### Vendors

**Entity Name**: `vendors`
**API Path**: `/companies({companyId})/vendors`

**Key Fields**:
```javascript
{
  "id": "44444444-4444-4444-4444-444444444444",
  "number": "V00100",
  "displayName": "Fabrikam Supplies",
  "email": "orders@fabrikam.com",
  "phoneNumber": "+1 (555) 987-6543",
  "taxLiable": true,
  "taxAreaId": "77777777-7777-7777-7777-777777777777",
  "blocked": " ",                                         // " ", "Payment", "All"
  "currencyCode": "USD",
  "paymentTermsId": "88888888-8888-8888-8888-888888888888",
  "paymentMethodId": "99999999-9999-9999-9999-999999999999",
  "balance": 12000.00,                                    // Amount owed to vendor
  "lastModifiedDateTime": "2024-01-08T16:00:00Z"
}
```

**Related Entities**:
- `paymentTerm`
- `purchaseOrders` - Vendor purchase orders

---

### Sales Invoices

**Entity Name**: `salesInvoices`
**API Path**: `/companies({companyId})/salesInvoices`

**Key Fields**:
```javascript
{
  "id": "AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA",
  "number": "INV-2024-001",
  "invoiceDate": "2024-01-20",
  "dueDate": "2024-02-20",
  "customerId": "87654321-4321-4321-4321-210987654321",
  "customerNumber": "C00001",
  "customerName": "Contoso Ltd.",
  "status": "Open",                                       // "Draft", "In Review", "Open", "Paid", "Canceled", "Corrective"
  "totalAmountExcludingTax": 1000.00,
  "totalAmountIncludingTax": 1100.00,
  "remainingAmount": 1100.00,                             // Unpaid amount
  "lastModifiedDateTime": "2024-01-20T10:00:00Z"
}
```

**Related Entities**:
- `customer`
- `salesInvoiceLines` - Invoice line items
- `pdfDocument` - Invoice PDF

---

### Purchase Invoices

**Entity Name**: `purchaseInvoices`
**API Path**: `/companies({companyId})/purchaseInvoices`

**Similar structure to Sales Invoices**, but for vendor invoices.

---

## 🔗 Entity Relationships

### Relationship Diagram

```
┌─────────────┐
│  Customer   │
└──────┬──────┘
       │
       │ 1:N
       ▼
┌─────────────────┐      1:N      ┌───────────────────┐      N:1      ┌──────────┐
│  Sales Order    ├──────────────►│ Sales Order Lines ├──────────────►│   Item   │
└─────────────────┘                └───────────────────┘                └──────────┘
       │
       │ 1:N
       ▼
┌─────────────────┐
│ Sales Invoice   │
└─────────────────┘

┌─────────────┐
│   Vendor    │
└──────┬──────┘
       │
       │ 1:N
       ▼
┌─────────────────┐      1:N      ┌────────────────────┐      N:1      ┌──────────┐
│ Purchase Order  ├──────────────►│ Purchase Order Lines├──────────────►│   Item   │
└─────────────────┘                └────────────────────┘                └──────────┘
       │
       │ 1:N
       ▼
┌─────────────────┐
│Purchase Invoice │
└─────────────────┘
```

---

### Navigation Properties

**Use `$expand` to load related entities**:

```javascript
// Get sales order with customer and lines
const url = `/salesOrders(${orderId})?$expand=customer,salesOrderLines`;

// Get sales order lines with item details
const url = `/salesOrders(${orderId})/salesOrderLines?$expand=item`;

// Multiple levels of expansion
const url = `/salesOrders(${orderId})?$expand=salesOrderLines($expand=item($expand=itemCategory))`;
```

---

## 📊 Data Types & Formats

### Date & DateTime

**Date**: `YYYY-MM-DD` format
```javascript
// ✅ CORRECT
"orderDate": "2024-01-15"

// ❌ WRONG
"orderDate": "01/15/2024"  // US format
"orderDate": "15-01-2024"  // EU format
```

**DateTime**: ISO 8601 format with timezone
```javascript
// ✅ CORRECT
"lastModifiedDateTime": "2024-01-15T10:30:00Z"            // UTC
"lastModifiedDateTime": "2024-01-15T10:30:00-08:00"       // With offset

// ❌ WRONG
"lastModifiedDateTime": "2024-01-15 10:30:00"
```

**JavaScript Date Handling**:
```javascript
function formatBCDate(date) {
  // Convert JS Date to BC date format
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatBCDateTime(date) {
  // Convert JS Date to BC datetime format (ISO 8601)
  return date.toISOString(); // Returns: "2024-01-15T10:30:00.000Z"
}

function parseBCDate(bcDate) {
  // Parse BC date string to JS Date
  return new Date(bcDate); // "2024-01-15" → Date object
}
```

---

### Decimals & Numbers

**Decimal format**: Use dot (`.`) as decimal separator, no commas
```javascript
// ✅ CORRECT
"unitPrice": 1234.56

// ❌ WRONG
"unitPrice": "1,234.56"  // String with comma
"unitPrice": "1234,56"   // EU format
```

**Validation**:
```javascript
function validateBCDecimal(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value.replace(/,/g, '')); // Remove commas
    return isNaN(num) ? 0 : num;
  }
  return 0;
}
```

---

### GUIDs

**Format**: Standard GUID with hyphens
```javascript
// ✅ CORRECT
"id": "12345678-1234-1234-1234-123456789012"

// Empty GUID (for new records without ID)
"id": "00000000-0000-0000-0000-000000000000"
```

**Validation**:
```javascript
function isValidGuid(guid) {
  const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidPattern.test(guid);
}
```

---

### Enums

**Status Enums**: BC uses string values

**Sales Order Status**:
- `"Draft"` - Not yet submitted
- `"In Review"` - Pending approval
- `"Open"` - Approved, ready to ship
- `"Released"` - Released to warehouse
- `"Partially Shipped"` - Some items shipped
- `"Shipped"` - Fully shipped
- `"Partially Invoiced"` - Some items invoiced
- `"Invoiced"` - Fully invoiced
- `"Canceled"` - Order canceled

**Customer Blocked Status**:
- `" "` (space) - Not blocked
- `"Ship"` - Blocked for shipping
- `"Invoice"` - Blocked for invoicing
- `"All"` - Fully blocked

**Item Type**:
- `"Inventory"` - Physical inventory item
- `"Service"` - Service item (no inventory tracking)
- `"Non-Inventory"` - Non-inventory item

**Validation**:
```javascript
function validateStatus(status, allowedValues) {
  if (!allowedValues.includes(status)) {
    throw new Error(`Invalid status: ${status}. Allowed: ${allowedValues.join(', ')}`);
  }
  return status;
}

// Usage
const SALES_ORDER_STATUSES = ['Draft', 'In Review', 'Open', 'Released', 'Shipped', 'Invoiced', 'Canceled'];
validateStatus(order.status, SALES_ORDER_STATUSES);
```

---

## ✅ Required Fields

### Sales Order (POST)

**Required**:
- `customerId` - Customer GUID
- `currencyCode` - Currency (defaults from customer if not provided)

**Optional but recommended**:
- `orderDate` - Defaults to today
- `salesperson` - Defaults from customer

---

### Sales Order Line (POST)

**Required**:
- `itemId` - Item GUID (if lineType = "Item")
- `lineType` - "Item", "Account", "Resource"
- `quantity` - Must be > 0
- `unitOfMeasureCode` - Defaults from item

**Optional but recommended**:
- `unitPrice` - Defaults from item
- `description` - Defaults from item

---

### Customer (POST)

**Required**:
- `displayName` - Customer name
- `number` - Auto-generated if not provided

**Optional but recommended**:
- `email`
- `address`
- `currencyCode` - Defaults to company currency

---

### Validation Function

```javascript
function validateRequiredFields(entity, requiredFields) {
  const missing = [];

  requiredFields.forEach(field => {
    if (!entity[field] || entity[field] === '') {
      missing.push(field);
    }
  });

  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

// Usage
function createSalesOrder(orderData) {
  validateRequiredFields(orderData, ['customerId', 'currencyCode']);

  // Proceed with POST...
}
```

---

## ✅ BC Entity Best Practices

### Checklist

- [x] **Always use SystemId (GUID)** - More reliable than number fields
- [x] **Validate data types** - Date format, decimal format, enums
- [x] **Use $expand for relationships** - Avoid N+1 queries
- [x] **Check required fields before POST** - Prevent 400 errors
- [x] **Handle null/empty values** - Provide defaults where appropriate
- [x] **Respect enum values** - Use BC-defined strings
- [x] **Use ISO 8601 for dates** - BC standard format
- [x] **Validate GUIDs** - Ensure proper format before API calls
- [x] **Cache entity metadata** - Structure changes rarely
- [x] **Map BC entities to domain objects** - Decouple BC specifics
- [x] **Test with real BC data** - Capture edge cases

---

## 🔗 Related Files

- `bc/odata-patterns.md` - OData query patterns for BC
- `integration/response-parsing.md` - Parsing BC API responses
- `data/etl-patterns.md` - Entity mapping and transformation
- `security/oauth2-patterns.md` - BC OAuth2 authentication

---

**Versione**: 1.0
**Context Size**: ~570 righe
