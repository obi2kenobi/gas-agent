# Google Sheets as Database - Complete Implementation

A production-ready implementation of the **Repository Pattern** for using Google Sheets as a relational database in Google Apps Script.

## 📋 Overview

This example demonstrates how to use Google Sheets as a structured database with:
- **Schema Definition** - Type system, constraints, relationships
- **Repository Pattern** - Data access abstraction layer
- **CRUD Operations** - Create, Read, Update, Delete with validation
- **Foreign Keys** - Referential integrity (RESTRICT, CASCADE)
- **Query Builder** - Fluent API for complex queries
- **Business Logic Layer** - Services for complex operations
- **Comprehensive Testing** - 7 test suites covering all components

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Service Layer                        │
│  OrderService, CustomerService (Business Logic)         │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────┐
│                  Repository Layer                       │
│  Repository, CustomerRepository, OrderRepository        │
│  (Data Access + CRUD Operations)                        │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────┐
│               Query & Validation Layer                  │
│  QueryBuilder, Validator                                │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────┐
│                   Schema Layer                          │
│  Schema Definition (Customers, Orders, OrderItems)      │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────┐
│                  Google Sheets                          │
│  Physical Storage (Sheets as Tables)                    │
└─────────────────────────────────────────────────────────┘
```

## 📁 File Structure

```
examples/sheets-database/
├── Schema.gs           # Database schema definition
├── Repository.gs       # CRUD operations & data access layer
├── Validator.gs        # Data validation against schema
├── QueryBuilder.gs     # Query builder with fluent API
├── Service.gs          # Business logic layer
├── TEST.gs             # Comprehensive test suite
└── README.md           # This file
```

## 🚀 Quick Start

### 1. Setup

1. Create a new Google Sheets spreadsheet
2. Open **Extensions > Apps Script**
3. Copy all `.gs` files to the script editor
4. Save the project

### 2. Initialize Database

Run the initialization function to create sheets with headers:

```javascript
initializeDatabase();
```

This creates 3 sheets:
- **Customers** - Customer master data
- **Orders** - Order headers
- **OrderItems** - Order line items

### 3. Run Tests

Verify everything works:

```javascript
runAllTests();
```

Check the **Execution log** for test results.

## 📊 Database Schema

### Customers Table

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| customer_id | string | PK, unique, auto-generated | Customer UUID |
| name | string | required, 2-100 chars | Customer name |
| email | email | required, unique | Email address |
| phone | string | optional, pattern | Phone number |
| address | string | optional, max 200 chars | Address |
| credit_limit | number | optional, min 0, default 0 | Credit limit |
| status | enum | required, default 'active' | active/inactive/suspended |
| created_at | timestamp | auto-generated | Creation timestamp |
| updated_at | timestamp | auto-generated, auto-update | Update timestamp |

### Orders Table

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| order_id | string | PK, unique, auto-generated | Order UUID |
| customer_id | string | required, FK → Customers, RESTRICT | Customer reference |
| order_number | string | unique, auto-generated | Human-readable order number |
| order_date | date | required, default TODAY | Order date |
| status | enum | required, default 'pending' | Order status |
| total_amount | number | required, min 0, default 0 | Total amount |
| notes | text | optional, max 500 chars | Order notes |
| created_at | timestamp | auto-generated | Creation timestamp |
| updated_at | timestamp | auto-generated, auto-update | Update timestamp |

### OrderItems Table

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| item_id | string | PK, unique, auto-generated | Item UUID |
| order_id | string | required, FK → Orders, CASCADE | Order reference |
| product_code | string | required | Product SKU |
| product_name | string | required, max 100 chars | Product name |
| quantity | number | required, min 1 | Quantity |
| unit_price | number | required, min 0 | Unit price |
| line_total | number | required, computed, min 0 | Line total |
| created_at | timestamp | auto-generated | Creation timestamp |

## 💻 Usage Examples

### Basic CRUD Operations

```javascript
// Create Repository
const customerRepo = new CustomerRepository();

// CREATE
const customer = customerRepo.create({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1-555-0100',
  credit_limit: 5000,
  status: 'active'
});

// READ by ID
const found = customerRepo.findById(customer.customer_id);

// READ all with filters
const activeCustomers = customerRepo.findAll({
  filter: record => record.status === 'active',
  sort: { field: 'name', order: 'asc' },
  limit: 10
});

// READ with custom methods
const byEmail = customerRepo.findByEmail('john@example.com');
const active = customerRepo.findActive();

// UPDATE
const updated = customerRepo.update(customer.customer_id, {
  credit_limit: 10000
});

// DELETE
const deleted = customerRepo.delete(customer.customer_id);

// COUNT
const totalCustomers = customerRepo.count();
const activeCount = customerRepo.count(r => r.status === 'active');

// EXISTS
const exists = customerRepo.exists(customer.customer_id);
```

### Query Builder

```javascript
// Simple queries
const activeHighCredit = query('Customers')
  .whereEquals('status', 'active')
  .whereGreaterThan('credit_limit', 1000)
  .get();

// Like search
const searchResults = query('Customers')
  .whereLike('name', 'john')
  .get();

// Range queries
const recentOrders = query('Orders')
  .whereDateBetween('created_at', '2025-01-01', '2025-01-31')
  .orderBy('created_at', 'desc')
  .get();

// Pagination
const page = query('Customers')
  .orderBy('name')
  .paginate(1, 10); // page 1, 10 per page

Logger.log(`Page 1/${page.pagination.totalPages}`);
Logger.log(`Total: ${page.pagination.totalCount} customers`);

// Count
const pendingCount = query('Orders')
  .whereEquals('status', 'pending')
  .count();

// First result
const topCustomer = query('Customers')
  .orderBy('credit_limit', 'desc')
  .first();

// Field selection
const namesAndEmails = query('Customers')
  .select(['name', 'email'])
  .get();
```

### Service Layer - Complex Operations

```javascript
// Create order with items
const orderResult = OrderService.createOrder(
  {
    customer_id: 'customer-uuid',
    order_date: '2025-01-15',
    notes: 'Rush order'
  },
  [
    {
      product_code: 'WIDGET-001',
      product_name: 'Blue Widget',
      quantity: 5,
      unit_price: 19.99
    },
    {
      product_code: 'GADGET-002',
      product_name: 'Red Gadget',
      quantity: 2,
      unit_price: 49.99
    }
  ]
);

Logger.log(`Order created: ${orderResult.order.order_number}`);
Logger.log(`Total: $${orderResult.summary.totalAmount}`);
Logger.log(`Items: ${orderResult.summary.itemCount}`);

// Get order details
const details = OrderService.getOrderDetails(orderResult.order.order_id);
Logger.log(`Customer: ${details.customer.name}`);
Logger.log(`Items: ${details.items.length}`);

// Update order status
OrderService.updateOrderStatus(orderResult.order.order_id, 'confirmed');

// Get customer profile
const profile = CustomerService.getCustomerProfile('customer-uuid');
Logger.log(`Total orders: ${profile.statistics.totalOrders}`);
Logger.log(`Total spent: $${profile.statistics.totalSpent}`);
Logger.log(`Average order: $${profile.statistics.averageOrderValue}`);

// Get order statistics
const stats = OrderService.getOrderStatistics();
Logger.log(`Total orders: ${stats.totalOrders}`);
Logger.log(`Total revenue: $${stats.totalRevenue}`);
Logger.log(`By status:`, stats.byStatus);

// Get top customers
const topCustomers = CustomerService.getTopCustomers(10);
topCustomers.forEach(c => {
  Logger.log(`${c.name}: ${c.orderCount} orders, $${c.totalRevenue}`);
});
```

### Foreign Key Validation

```javascript
// Valid foreign key - will succeed
const order = orderRepo.create({
  customer_id: 'existing-customer-id',
  order_date: '2025-01-15',
  total_amount: 100,
  status: 'pending'
});

// Invalid foreign key - will throw error
try {
  orderRepo.create({
    customer_id: 'non-existent-customer',
    order_date: '2025-01-15',
    total_amount: 100,
    status: 'pending'
  });
} catch (error) {
  Logger.log(error); // Foreign key violation: Customers.customer_id = 'non-existent-customer' does not exist
}

// Cascade delete
orderRepo.delete(order.order_id); // Automatically deletes related OrderItems
```

### Batch Operations

```javascript
// Batch create
const customersData = [
  { name: 'Customer 1', email: 'c1@example.com', status: 'active' },
  { name: 'Customer 2', email: 'c2@example.com', status: 'active' },
  { name: 'Customer 3', email: 'c3@example.com', status: 'active' }
];

const results = customerRepo.batchCreate(customersData);
Logger.log(`Created ${results.length} customers`);

// Batch validation
const validationResult = Validator.validateBatch('Customers', customersData);
Logger.log(`Valid: ${validationResult.successCount}`);
Logger.log(`Invalid: ${validationResult.errorCount}`);
```

## 🧪 Testing

Run the complete test suite:

```javascript
runAllTests();
```

Test suites included:
1. **Schema & Initialization** - Database setup
2. **Validator** - Data validation
3. **Repository CRUD** - Create, Read, Update, Delete
4. **Foreign Keys** - Referential integrity
5. **QueryBuilder** - Query operations
6. **Service Layer** - Business logic
7. **Performance** - Batch operations and indexing

## 🎯 Key Features

### 1. Type System & Validation

All data is validated against schema before insert/update:

```javascript
// Supported types:
- string       // Text with min/max length
- number       // Numeric with min/max
- email        // Email validation
- enum         // Fixed set of values
- timestamp    // ISO 8601 datetime
- date         // YYYY-MM-DD
- text         // Long text
- boolean      // True/false
```

### 2. Auto-Generated Fields

```javascript
// Auto-generated on create:
- customer_id (UUID)
- order_id (UUID)
- item_id (UUID)
- order_number (ORD-20250115-0001)
- created_at (ISO timestamp)
- updated_at (ISO timestamp)

// Auto-updated on update:
- updated_at (ISO timestamp)
```

### 3. Index-Based Lookups

O(1) performance for indexed fields:

```javascript
// First call: Builds index (slow)
const result1 = customerRepo.findBy('status', 'active');

// Subsequent calls: Uses cache (fast)
const result2 = customerRepo.findBy('status', 'active'); // O(1)
```

### 4. Cascade Delete

```javascript
// Delete order cascades to items
orderRepo.delete(orderId);
// All OrderItems with this order_id are automatically deleted

// RESTRICT prevents deletion
customerRepo.delete(customerId); // Fails if customer has orders
```

### 5. Transaction-Like Operations

```javascript
// Service layer handles multi-table operations
OrderService.createOrder(orderData, items);
// - Validates customer
// - Checks credit limit
// - Creates order
// - Creates all items
// - Rollback on error (manual cleanup)
```

## 📈 Performance Tips

### 1. Use Batch Operations

```javascript
// ❌ Slow: Row-by-row
customers.forEach(c => repo.create(c)); // N calls to Sheets

// ✅ Fast: Batch
repo.batchCreate(customers); // 1 call to Sheets
```

### 2. Use Indexes for Frequent Lookups

```javascript
// Indexes defined in schema:
indexes: [
  { fields: ['email'], unique: true },
  { fields: ['status'] },
  { fields: ['created_at'] }
]

// Use findBy() to leverage indexes:
const activeCustomers = repo.findBy('status', 'active'); // O(1) with cache
```

### 3. Use Query Builder Efficiently

```javascript
// ❌ Fetch all then filter in code
const all = repo.findAll();
const active = all.filter(c => c.status === 'active');

// ✅ Filter in query
const active = query('Customers')
  .whereEquals('status', 'active')
  .get();
```

### 4. Limit Results

```javascript
// Always use limit for large datasets
const recent = query('Orders')
  .orderBy('created_at', 'desc')
  .limit(100)
  .get();
```

### 5. Select Only Needed Fields

```javascript
// ❌ Fetch all fields
const customers = repo.findAll();

// ✅ Select only needed fields
const names = query('Customers')
  .select(['name', 'email'])
  .get();
```

## 🔒 Security Best Practices

1. **Validate All Input**
   ```javascript
   // Validation happens automatically in Repository
   repo.create(data); // Validates against schema
   ```

2. **Check Foreign Keys**
   ```javascript
   // Foreign keys validated automatically
   orderRepo.create({ customer_id: 'xxx' }); // Checks customer exists
   ```

3. **Enforce Business Rules**
   ```javascript
   // Use Service layer for business logic
   OrderService.createOrder(data, items); // Checks credit limit
   ```

4. **Use Enum Constraints**
   ```javascript
   status: {
     type: 'enum',
     values: ['active', 'inactive', 'suspended']
   }
   ```

## 🐛 Troubleshooting

### Issue: "Schema not found for table"
**Solution**: Ensure `Schema.gs` is loaded before Repository. Run `initializeDatabase()` first.

### Issue: "Foreign key violation"
**Solution**: Create parent record first:
```javascript
// 1. Create customer
const customer = customerRepo.create({...});

// 2. Create order with valid customer_id
const order = orderRepo.create({
  customer_id: customer.customer_id,
  ...
});
```

### Issue: "Validation failed"
**Solution**: Check validation error details:
```javascript
try {
  repo.create(data);
} catch (error) {
  Logger.log(error.message); // Shows which fields failed
}
```

### Issue: Slow queries
**Solutions**:
1. Use indexes: `repo.findBy(field, value)`
2. Limit results: `.limit(100)`
3. Use batch operations
4. Cache frequently accessed data

### Issue: "Cannot read property of undefined"
**Solution**: Check record exists before accessing:
```javascript
const customer = repo.findById(id);
if (!customer) {
  Logger.log('Customer not found');
  return;
}
Logger.log(customer.name);
```

## 📚 API Reference

### Schema.gs

```javascript
Schema                    // Schema definition object
getFieldNames(tableName)  // Get field names array
getPrimaryKey(tableName)  // Get primary key field
getSheetName(tableName)   // Get sheet name
initializeDatabase()      // Create sheets with headers
getDatabaseStats()        // Get database statistics
```

### Repository.gs

```javascript
new Repository(tableName)
  .create(data)                    // Create record
  .findById(id)                    // Find by primary key
  .findAll(options)                // Find all with options
  .findOne(filter)                 // Find first matching
  .findBy(field, value)            // Find by field (indexed)
  .update(id, data)                // Update record
  .delete(id)                      // Delete record
  .count(filter)                   // Count records
  .exists(id)                      // Check if exists
  .batchCreate(dataArray)          // Batch insert
  .generateId()                    // Generate UUID
  .getIndex(field)                 // Get/build index
  .truncate()                      // Delete all records
```

### Validator.gs

```javascript
Validator.validate(tableName, data, isUpdate)
Validator.validateBatch(tableName, dataArray, isUpdate)
Validator.isUnique(tableName, fieldName, value, excludeId)
```

### QueryBuilder.gs

```javascript
query(tableName)
  .where(condition)                // Add filter
  .whereEquals(field, value)       // Field = value
  .whereNotEquals(field, value)    // Field != value
  .whereIn(field, values)          // Field IN (...)
  .whereGreaterThan(field, value)  // Field > value
  .whereLessThan(field, value)     // Field < value
  .whereBetween(field, min, max)   // Field BETWEEN min AND max
  .whereLike(field, substring)     // Field LIKE '%substring%'
  .whereNull(field)                // Field IS NULL
  .whereNotNull(field)             // Field IS NOT NULL
  .whereDateBetween(field, start, end)
  .orderBy(field, order)           // Sort (asc/desc)
  .limit(n)                        // Limit results
  .offset(n)                       // Skip records
  .select(fields)                  // Select specific fields
  .get()                           // Execute and return array
  .first()                         // Execute and return first
  .count()                         // Count results
  .exists()                        // Check if any match
  .paginate(page, pageSize)        // Get paginated results
```

### Service.gs

```javascript
// OrderService
OrderService.createOrder(orderData, items)
OrderService.updateOrderStatus(orderId, newStatus)
OrderService.cancelOrder(orderId)
OrderService.getOrderDetails(orderId)
OrderService.getCustomerOrders(customerId)
OrderService.recalculateOrderTotal(orderId)
OrderService.getOrderStatistics()

// CustomerService
CustomerService.createCustomer(customerData)
CustomerService.getCustomerProfile(customerId)
CustomerService.updateCustomerStatus(customerId, newStatus)
CustomerService.getTopCustomers(limit)
```

## 🎓 Learning Path

1. **Start Here**: Run `initializeDatabase()` and explore sheets
2. **Basic CRUD**: Try creating, reading, updating customers
3. **Relationships**: Create orders linked to customers
4. **Query Builder**: Practice complex queries
5. **Service Layer**: Use high-level business operations
6. **Advanced**: Build your own custom repositories and services

## 🚢 Production Deployment

Before deploying to production:

1. ✅ Run `runAllTests()` - Ensure all tests pass
2. ✅ Test with production data volume
3. ✅ Set up error monitoring
4. ✅ Document custom schema extensions
5. ✅ Train users on data entry constraints
6. ✅ Set up regular backups
7. ✅ Monitor performance metrics

## 📖 Related Documentation

- [Repository Pattern Overview](../../docs/patterns/repository-pattern.md)
- [Data Engineer Specialist](../../docs/specialists/data-engineer.md)
- [Sheets Database Deep Dive](../../docs/deep/data/sheets-database.md)
- [ETL Patterns](../../docs/deep/data/etl-patterns.md)
- [Query Optimization](../../docs/deep/data/query-patterns.md)

## 💡 Extending This Example

### Add New Table

1. Define schema in `Schema.gs`:
   ```javascript
   Products: {
     sheetName: 'Products',
     primaryKey: 'product_id',
     fields: { ... }
   }
   ```

2. Create repository:
   ```javascript
   class ProductRepository extends Repository {
     constructor() { super('Products'); }
   }
   ```

3. Run `initializeDatabase()` to create sheet

### Add Custom Business Logic

```javascript
const ProductService = (function() {
  const productRepo = new ProductRepository();

  function getPopularProducts(limit = 10) {
    // Custom logic here
  }

  return { getPopularProducts };
})();
```

## 📄 License

This example is part of the gas-Agent project.
Free to use and modify for your projects.

## 🤝 Contributing

Found a bug or have an improvement? Please open an issue or submit a pull request!

---

**Happy Coding! 🎉**
