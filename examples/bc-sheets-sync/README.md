# BC-to-Sheets Database Sync

**Cross-Example Integration**: Combines `oauth2-bc-integration` + `sheets-database`

## 🎯 What This Does

Syncs data from Business Central to a structured Sheets database with validation, foreign keys, and business logic.

## 📋 Prerequisites

Install both example components:

1. **oauth2-bc-integration**:
   - Config.gs
   - OAuth2Manager.gs
   - BCClient.gs

2. **sheets-database**:
   - Schema.gs
   - Repository.gs
   - Validator.gs
   - Service.gs

3. **This integration**:
   - BCSheetsSync.gs (this file)

## 🚀 Quick Start

```javascript
// 1. Configure BC connection
setupConfig();

// 2. Initialize Sheets database
initializeDatabase();

// 3. Sync customers from BC to Sheets
syncCustomersFromBC();

// 4. Sync orders from BC to Sheets
syncOrdersFromBC();
```

## 💻 Usage Examples

### Example 1: Sync Customers

```javascript
function syncCustomersExample() {
  // Fetch from Business Central
  const bcCustomers = BCClient.get('customers', {
    $select: 'id,displayName,email,phoneNumber',
    $filter: "blocked eq false"
  });

  Logger.log(`Fetched ${bcCustomers.length} customers from BC`);

  // Transform and save to Sheets database
  const customerRepo = new CustomerRepository();
  let created = 0;
  let updated = 0;

  bcCustomers.forEach(bcCustomer => {
    // Transform BC format to our schema
    const customerData = {
      customer_id: bcCustomer.id,
      name: bcCustomer.displayName,
      email: bcCustomer.email || `${bcCustomer.id}@noemail.com`,
      phone: bcCustomer.phoneNumber,
      status: 'active'
    };

    // Check if exists
    const existing = customerRepo.findById(bcCustomer.id);

    if (existing) {
      customerRepo.update(bcCustomer.id, customerData);
      updated++;
    } else {
      customerRepo.create(customerData);
      created++;
    }
  });

  Logger.log(`✅ Sync complete: ${created} created, ${updated} updated`);
}
```

### Example 2: Incremental Sync

```javascript
function incrementalSyncCustomers() {
  // Get last sync time
  const lastSync = getConfig('LAST_CUSTOMER_SYNC', '1900-01-01T00:00:00Z');

  // Fetch only changed records
  const bcCustomers = BCClient.get('customers', {
    $filter: `lastModifiedDateTime gt ${lastSync}`
  });

  Logger.log(`Found ${bcCustomers.length} changed customers since ${lastSync}`);

  // Update in database
  const customerRepo = new CustomerRepository();

  bcCustomers.forEach(bcCustomer => {
    const customerData = transformBCCustomer(bcCustomer);

    if (customerRepo.exists(bcCustomer.id)) {
      customerRepo.update(bcCustomer.id, customerData);
    } else {
      customerRepo.create(customerData);
    }
  });

  // Update last sync time
  setConfig('LAST_CUSTOMER_SYNC', new Date().toISOString());

  Logger.log(`✅ Incremental sync complete`);
}
```

### Example 3: Sync Orders with Items

```javascript
function syncOrdersWithItems() {
  // Fetch orders from BC
  const bcOrders = BCClient.get('salesOrders', {
    $expand: 'salesOrderLines',
    $filter: "status eq 'Open'"
  });

  Logger.log(`Fetched ${bcOrders.length} orders from BC`);

  // Sync each order with its items
  bcOrders.forEach(bcOrder => {
    // Ensure customer exists
    const customerRepo = new CustomerRepository();
    if (!customerRepo.exists(bcOrder.customerId)) {
      Logger.log(`⚠️  Skipping order ${bcOrder.number}: customer not found`);
      return;
    }

    // Create order with items using Service layer
    const items = bcOrder.salesOrderLines.map(line => ({
      product_code: line.itemId,
      product_name: line.description,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      line_total: line.quantity * line.unitPrice
    }));

    try {
      OrderService.createOrder(
        {
          customer_id: bcOrder.customerId,
          order_date: bcOrder.orderDate,
          total_amount: bcOrder.totalAmountIncludingTax,
          status: mapBCStatus(bcOrder.status),
          notes: `BC Order: ${bcOrder.number}`
        },
        items
      );

      Logger.log(`✅ Synced order: ${bcOrder.number}`);
    } catch (error) {
      Logger.log(`❌ Failed to sync order ${bcOrder.number}: ${error.message}`);
    }
  });
}

function mapBCStatus(bcStatus) {
  const mapping = {
    'Open': 'pending',
    'Released': 'confirmed',
    'Pending Approval': 'pending',
    'Pending Prepayment': 'pending'
  };
  return mapping[bcStatus] || 'pending';
}
```

### Example 4: Two-Way Sync

```javascript
function twoWaySyncOrders() {
  Logger.log('Starting two-way sync...');

  // 1. BC → Sheets (import new orders)
  syncNewOrdersFromBC();

  // 2. Sheets → BC (export status updates)
  syncOrderStatusToBC();

  Logger.log('✅ Two-way sync complete');
}

function syncNewOrdersFromBC() {
  // Get orders not yet in Sheets
  const lastOrderNumber = getConfig('LAST_BC_ORDER_NUMBER', '0');

  const bcOrders = BCClient.get('salesOrders', {
    $filter: `number gt '${lastOrderNumber}'`
  });

  // Import to Sheets
  // ... (same as syncOrdersWithItems)

  if (bcOrders.length > 0) {
    const latestNumber = bcOrders[bcOrders.length - 1].number;
    setConfig('LAST_BC_ORDER_NUMBER', latestNumber);
  }
}

function syncOrderStatusToBC() {
  // Get orders with status updates in Sheets
  const orderRepo = new OrderRepository();
  const updatedOrders = orderRepo.findAll({
    filter: record => record.status === 'shipped' && !record.synced_to_bc
  });

  updatedOrders.forEach(order => {
    try {
      // Update in BC
      BCClient.patch(`salesOrders(${order.order_id})`, {
        status: 'Shipped'
      });

      // Mark as synced
      orderRepo.update(order.order_id, { synced_to_bc: true });

      Logger.log(`✅ Synced status for order: ${order.order_id}`);
    } catch (error) {
      Logger.log(`❌ Failed to sync order ${order.order_id}: ${error.message}`);
    }
  });
}
```

## 🔄 Automated Sync

Set up time-based triggers for automatic synchronization:

```javascript
function setupAutomatedSync() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));

  // Sync customers every 6 hours
  ScriptApp.newTrigger('incrementalSyncCustomers')
    .timeBased()
    .everyHours(6)
    .create();

  // Sync orders every hour
  ScriptApp.newTrigger('syncNewOrdersFromBC')
    .timeBased()
    .everyHours(1)
    .create();

  Logger.log('✅ Automated sync configured');
}
```

## 📊 Benefits of This Integration

| Feature | Benefit |
|---------|---------|
| **Structured Data** | BC data stored with schema validation |
| **Foreign Keys** | Customer-Order relationships enforced |
| **Business Logic** | Order totals calculated automatically |
| **Query Builder** | Complex queries on synced data |
| **Incremental Sync** | Only fetch changed records |
| **Two-Way Sync** | Update BC from Sheets |
| **Caching** | 160x faster with multi-level cache |
| **Error Handling** | Retries + exponential backoff |

## 🎯 Use Cases

1. **Daily BC Backup**: Full daily sync of BC data to Sheets
2. **Order Dashboard**: Query and analyze orders in Sheets
3. **Custom Reporting**: Use Sheets formulas on BC data
4. **Data Validation**: Validate BC data before import
5. **Offline Access**: Work with BC data when offline
6. **Cross-Company Analytics**: Combine data from multiple BC companies

## 🔒 Security Notes

- ✅ BC credentials stored in PropertiesService (secure)
- ✅ OAuth2 tokens cached with expiry
- ✅ Foreign key validation prevents orphaned records
- ✅ Schema validation prevents invalid data

## 🚀 Next Steps

1. Customize transformBCCustomer() for your schema
2. Add more BC entities (items, invoices, etc.)
3. Set up automated sync triggers
4. Build dashboards with synced data
5. Add custom business rules

---

**This is the power of gas-Agent**: Combine examples to build complex systems quickly! 🎉
