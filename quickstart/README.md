# 🚀 Quick Start - Get Started in 5 Minutes!

Welcome to gas-Agent! This guide will get you up and running in just a few minutes.

## 📋 Table of Contents

1. [Super Quick Start](#super-quick-start) (1 minute)
2. [First Project Setup](#first-project-setup) (5 minutes)
3. [Common Use Cases](#common-use-cases)
4. [Interactive Menu Guide](#interactive-menu-guide)
5. [Next Steps](#next-steps)

---

## ⚡ Super Quick Start (1 minute)

The absolute fastest way to start:

### Step 1: Copy One File

1. Open your Google Sheet
2. Go to **Extensions > Apps Script**
3. Copy [`QUICKSTART.gs`](./QUICKSTART.gs) to your project
4. Save (Ctrl+S)

### Step 2: Run Setup

```javascript
setupNewProject();
```

**Done!** 🎉 You now have a custom "gas-Agent" menu in your spreadsheet.

---

## 🎯 First Project Setup (5 minutes)

Let's set up your first complete project step-by-step.

### Choose Your Path:

#### 🅰️ Path A: Sheets as Database
**Best for:** Data management, CRUD operations, relational data

#### 🅱️ Path B: Business Central Integration
**Best for:** BC data sync, ERP integration, data migration

#### 🅲 Path C: AI-Powered Orchestrator
**Best for:** Complex projects, automatic planning, specialist selection

---

### 🅰️ Path A: Sheets Database (5 min)

Build a complete database system with validation and relationships.

**1. Copy Files** (2 min)

From `examples/sheets-database/` copy:
- ✅ `Schema.gs`
- ✅ `Repository.gs`
- ✅ `Validator.gs`
- ✅ `QueryBuilder.gs`
- ✅ `Service.gs`
- ✅ `QUICKSTART.gs` (from quickstart/)

**2. Initialize Database** (1 min)

```javascript
// Option 1: Use menu
gas-Agent > Database > Initialize Database

// Option 2: Run function
initializeDatabase();
```

**3. Create Your First Record** (2 min)

```javascript
// Create a customer
const customer = CustomerService.createCustomer({
  name: 'Acme Corp',
  email: 'contact@acme.com',
  credit_limit: 10000,
  status: 'active'
});

// Create an order
const order = OrderService.createOrder(
  {
    customer_id: customer.customer_id,
    order_date: '2025-01-15'
  },
  [
    {
      product_code: 'WIDGET-001',
      product_name: 'Blue Widget',
      quantity: 5,
      unit_price: 29.99
    }
  ]
);

Logger.log(`✅ Order created: ${order.order.order_number}`);
```

**✅ You're Done!** You now have:
- 3 relational tables (Customers, Orders, OrderItems)
- Full CRUD operations
- Foreign key validation
- Query builder
- Business logic layer

---

### 🅱️ Path B: Business Central Integration (5 min)

Sync data from Business Central to Google Sheets.

**1. Copy Files** (2 min)

From `examples/oauth2-bc-integration/` copy:
- ✅ `Config.gs`
- ✅ `OAuth2Manager.gs`
- ✅ `BCClient.gs`
- ✅ `Code.gs`
- ✅ `QUICKSTART.gs` (from quickstart/)

**2. Configure Credentials** (2 min)

```javascript
// Run configuration
setupConfig();
```

Enter your Business Central credentials:
- Tenant ID
- Client ID
- Client Secret
- Environment name
- Company ID

**3. Test & Sync** (1 min)

```javascript
// Test connection
testConnection();

// Sync customers
exportCustomersToSheet();

// Or sync orders
exportSalesOrdersToSheet();
```

**✅ You're Done!** You now have:
- OAuth2 authentication
- Multi-level token caching (160x faster)
- Complete BC API client
- OData v4 support
- Production-ready error handling

---

### 🅲 Path C: Orchestrator (3 min)

Let the system automatically analyze your project and recommend specialists.

**1. Copy Files** (1 min)

From `orchestrator/` copy:
- ✅ `RequirementsAnalyzer.gs`
- ✅ `SpecialistSelector.gs`
- ✅ `ExecutionPlanner.gs`
- ✅ `Orchestrator.gs`
- ✅ `QUICKSTART.gs` (from quickstart/)

**2. Analyze Your Project** (2 min)

```javascript
// Option 1: Use menu
gas-Agent > Orchestrator > Analyze Project Requirements

// Option 2: Run function
const result = orchestrateProject(`
  Build a system that:
  - Syncs orders from Business Central
  - Stores them in Sheets with validation
  - Sends email notifications
  - Has monitoring dashboard
`);

// View results
Logger.log(result);
```

**Output Example:**
```
📊 COMPLEXITY: HIGH
⏱️ ESTIMATED: 12h (1.5 days)

👥 SPECIALISTS NEEDED (5):
1. Security Engineer (OAuth2, credentials)
2. Integration Engineer (BC API)
3. Data Engineer (Sheets database)
4. Workspace Engineer (Gmail)
5. Platform Engineer (monitoring)

📋 EXECUTION PLAN:
Phase 1: Foundation & Security (2h)
Phase 2: Integration (4h)
Phase 3: Data Layer (3h)
Phase 4: Notifications (2h)
Phase 5: Monitoring (1h)
```

**✅ You're Done!** You now have:
- Automatic requirements analysis
- Specialist recommendations
- Detailed execution plan
- Time estimates
- Recommended patterns

---

## 🎮 Common Use Cases

### Use Case 1: Customer Database

```javascript
// Initialize
initializeDatabase();

// Create customer
const customer = CustomerService.createCustomer({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1-555-0100',
  status: 'active'
});

// Query customers
const activeCustomers = query('Customers')
  .whereEquals('status', 'active')
  .orderBy('name')
  .get();

// Get customer profile
const profile = CustomerService.getCustomerProfile(customer.customer_id);
Logger.log(`Orders: ${profile.statistics.totalOrders}`);
Logger.log(`Spent: $${profile.statistics.totalSpent}`);
```

### Use Case 2: Business Central Sync

```javascript
// One-time setup
setupConfig();

// Sync customers (with caching)
const customers = BCClient.get('customers', {
  $select: 'id,displayName,email',
  $filter: "blocked eq false"
});

// Write to Sheets
const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Customers');
customers.forEach(customer => {
  sheet.appendRow([customer.id, customer.displayName, customer.email]);
});

Logger.log(`✅ Synced ${customers.length} customers`);
```

### Use Case 3: Order Management

```javascript
// Create order with items
const order = OrderService.createOrder(
  {
    customer_id: 'customer-uuid',
    order_date: '2025-01-15',
    notes: 'Expedited shipping'
  },
  [
    { product_code: 'A1', product_name: 'Product A', quantity: 2, unit_price: 50 },
    { product_code: 'B1', product_name: 'Product B', quantity: 1, unit_price: 100 }
  ]
);

// Update status
OrderService.updateOrderStatus(order.order.order_id, 'confirmed');

// Get order details
const details = OrderService.getOrderDetails(order.order.order_id);
Logger.log(`Customer: ${details.customer.name}`);
Logger.log(`Items: ${details.items.length}`);
Logger.log(`Total: $${details.order.total_amount}`);
```

### Use Case 4: Advanced Queries

```javascript
// Complex query with QueryBuilder
const results = query('Orders')
  .whereEquals('status', 'pending')
  .whereGreaterThan('total_amount', 100)
  .whereDateBetween('order_date', '2025-01-01', '2025-01-31')
  .orderBy('total_amount', 'desc')
  .limit(10)
  .get();

// Pagination
const page = query('Customers')
  .whereEquals('status', 'active')
  .orderBy('name')
  .paginate(1, 20); // page 1, 20 per page

Logger.log(`Page 1 of ${page.pagination.totalPages}`);
Logger.log(`Showing ${page.data.length} of ${page.pagination.totalCount} customers`);
```

### Use Case 5: Project Planning

```javascript
// Analyze project requirements
const result = orchestrateProject(`
  E-commerce order management system with:
  - Customer registration and profiles
  - Product catalog with images
  - Shopping cart with discounts
  - Payment processing integration
  - Order tracking and notifications
  - Admin dashboard with analytics
`);

// Review recommendations
Logger.log(`Complexity: ${result.analysis.complexity.level}`);
Logger.log(`Specialists: ${result.selection.count}`);
Logger.log(`Estimated: ${result.selection.complexity.estimatedHours}h`);

// View detailed plan
Logger.log(ExecutionPlanner.formatPlan(result.plan));
```

---

## 📋 Interactive Menu Guide

Once you run `setupNewProject()`, you'll have this menu:

```
gas-Agent
├── 🎯 Orchestrator
│   ├── Analyze Project Requirements
│   └── View Specialist Library
├── 📊 Database
│   ├── Initialize Database
│   ├── View Database Stats
│   └── Run Database Tests
├── 🔐 Business Central
│   ├── Configure BC Connection
│   ├── Test BC Connection
│   └── Sync from BC
├── 📈 Monitoring
│   ├── View Dashboard
│   ├── View Logs
│   └── Health Check
├── ───────────────
├── 📖 Quick Start Guide
└── ⚙️ Settings
```

### Menu Functions:

| Menu Item | What It Does | When to Use |
|-----------|--------------|-------------|
| **Analyze Project Requirements** | Opens dialog to describe your project in natural language | Starting new project |
| **View Specialist Library** | Shows all 12 available specialists | Understanding capabilities |
| **Initialize Database** | Creates Customers, Orders, OrderItems tables | First time setup |
| **View Database Stats** | Shows record counts for all tables | Checking data |
| **Run Database Tests** | Runs 7 test suites | Verifying installation |
| **Configure BC Connection** | Guides you through BC credential setup | First time BC setup |
| **Test BC Connection** | Verifies BC API is accessible | After configuration |
| **Sync from BC** | Imports customers or orders from BC | Data synchronization |
| **View Dashboard** | Opens monitoring dashboard | System overview |
| **View Logs** | Shows where to find execution logs | Debugging |
| **Health Check** | Checks which components are installed | Troubleshooting |

---

## 🎓 Next Steps

### After Quick Start, You Can:

1. **Explore Examples**
   - Read [`examples/sheets-database/README.md`](../examples/sheets-database/README.md)
   - Read [`examples/oauth2-bc-integration/README.md`](../examples/oauth2-bc-integration/README.md)

2. **Run Tests**
   ```javascript
   // Database tests
   runAllTests(); // from TEST.gs

   // BC integration tests
   testOAuth2Manager();
   testBCClient();
   ```

3. **Customize for Your Needs**
   - Add tables to Schema.gs
   - Create custom repositories
   - Add business logic to Service.gs
   - Build custom BC sync functions

4. **Use the Orchestrator**
   - Analyze your project requirements
   - Get specialist recommendations
   - Follow the generated execution plan

5. **Learn Patterns**
   - Repository Pattern (data access layer)
   - Service Layer (business logic)
   - Query Builder (fluent API)
   - Multi-level Caching (performance)

---

## 💡 Pro Tips

### Tip 1: Use the Menu
The interactive menu is the fastest way to access features. Just click `gas-Agent` in the top menu bar.

### Tip 2: Check Logs
Always check the execution log after running functions:
- **In Sheet**: Extensions > Apps Script > Executions
- **In Editor**: View > Logs (Ctrl+Enter)

### Tip 3: Start Simple
Don't try to use everything at once:
1. Start with ONE example (sheets-database OR BC integration)
2. Get it working
3. Add more features gradually

### Tip 4: Copy-Paste is OK
All examples are production-ready. Feel free to:
- Copy entire files
- Modify for your needs
- Combine multiple patterns

### Tip 5: Use Test Functions
Every component has test functions. Run them to:
- Verify installation
- See examples in action
- Learn the API

---

## 🆘 Troubleshooting

### Issue: "Function not defined"
**Solution**: Make sure you copied all required files. Check which files each example needs.

### Issue: "Schema not found"
**Solution**: You're using Repository without Schema.gs. Copy Schema.gs first.

### Issue: "Permission denied"
**Solution**: First time running? Authorize the script when prompted.

### Issue: Menu doesn't appear
**Solution**:
1. Refresh your spreadsheet
2. Or run `onOpen()` manually
3. Or run `createCustomMenu()`

### Issue: "Cannot read property of undefined"
**Solution**: Check if the record exists before accessing:
```javascript
const customer = customerRepo.findById(id);
if (!customer) {
  Logger.log('Customer not found');
  return;
}
Logger.log(customer.name); // Safe now
```

---

## 📚 Additional Resources

- [Main README](../README.md) - Complete system documentation
- [Orchestrator Guide](../orchestrator/README.md) - Intelligent planning system
- [Sheets Database Guide](../examples/sheets-database/README.md) - Complete database system
- [BC Integration Guide](../examples/oauth2-bc-integration/README.md) - Business Central sync
- [Specialist Library](../docs/specialists/) - All 12 specialists
- [Deep Patterns](../docs/deep/) - Advanced patterns

---

## ✅ Quick Start Checklist

- [ ] Copied QUICKSTART.gs to my project
- [ ] Ran `setupNewProject()`
- [ ] Installed at least one example (Database OR BC)
- [ ] Ran initialization function
- [ ] Tested with sample data
- [ ] Checked execution logs
- [ ] Customized for my needs

**All checked?** 🎉 **You're a gas-Agent pro now!**

---

## 🎯 What's Next?

Choose your adventure:

- 🏗️ **Build More**: Add more tables, sync more BC entities
- 🧪 **Test Everything**: Run all test suites
- 📊 **Monitor**: Set up dashboard and logging
- 🚀 **Deploy**: Use in production projects
- 💡 **Contribute**: Share your patterns with the community

---

**Happy Coding! 🚀**

Need help? Check the full documentation or open an issue on GitHub.
