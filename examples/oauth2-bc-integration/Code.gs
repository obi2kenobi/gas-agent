/**
 * Code.gs - Practical Examples
 *
 * Real-world examples of Business Central integration patterns
 * Ready to use and adapt for your projects.
 */

/**
 * EXAMPLE 1: Export Customers to Google Sheets
 *
 * Demonstrates:
 * - Fetching data from Business Central
 * - Batch operations for performance
 * - Writing to Google Sheets efficiently
 */
function exportCustomersToSheet() {
  Logger.log('📊 Exporting customers to Google Sheets...');

  try {
    // Get all customers with relevant fields
    const customers = Customers.getAll({
      $select: 'No,Name,Address,City,Post_Code,Country_Region_Code,Phone_No,E_Mail,Balance_LCY,Credit_Limit_LCY',
      $orderby: 'Name',
      $top: 100 // Limit for testing
    });

    Logger.log(`✅ Fetched ${customers.length} customers from BC`);

    // Get or create sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('BC Customers');

    if (!sheet) {
      sheet = ss.insertSheet('BC Customers');
    } else {
      sheet.clear(); // Clear existing data
    }

    // Prepare data with headers
    const headers = ['Customer No', 'Name', 'Address', 'City', 'Post Code', 'Country', 'Phone', 'Email', 'Balance', 'Credit Limit'];
    const data = [headers];

    customers.forEach(customer => {
      data.push([
        customer.No || '',
        customer.Name || '',
        customer.Address || '',
        customer.City || '',
        customer.Post_Code || '',
        customer.Country_Region_Code || '',
        customer.Phone_No || '',
        customer.E_Mail || '',
        customer.Balance_LCY || 0,
        customer.Credit_Limit_LCY || 0
      ]);
    });

    // Write to sheet in one operation (100x faster than row-by-row)
    sheet.getRange(1, 1, data.length, headers.length).setValues(data);

    // Format header
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');

    // Format numbers
    const balanceCol = headers.indexOf('Balance') + 1;
    const creditCol = headers.indexOf('Credit Limit') + 1;
    sheet.getRange(2, balanceCol, customers.length, 1).setNumberFormat('#,##0.00');
    sheet.getRange(2, creditCol, customers.length, 1).setNumberFormat('#,##0.00');

    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);

    Logger.log(`✅ Exported ${customers.length} customers to sheet "${sheet.getName()}"`);
    Logger.log(`📊 View: ${sheet.getParent().getUrl()}`);

    return customers.length;
  } catch (error) {
    Logger.log(`❌ Error: ${error.message}`);
    throw error;
  }
}

/**
 * EXAMPLE 2: Get Customer Balance Summary
 *
 * Demonstrates:
 * - OData $filter queries
 * - Aggregation and data processing
 * - Formatted output
 */
function getCustomerBalanceSummary() {
  Logger.log('💰 Generating customer balance summary...');

  try {
    // Get customers with balances
    const customers = Customers.getAll({
      $select: 'No,Name,Balance_LCY,Credit_Limit_LCY',
      $filter: 'Balance_LCY ne 0',
      $orderby: 'Balance_LCY desc'
    });

    Logger.log(`✅ Found ${customers.length} customers with non-zero balance`);

    // Calculate statistics
    const totalBalance = customers.reduce((sum, c) => sum + (c.Balance_LCY || 0), 0);
    const positiveBalance = customers.filter(c => c.Balance_LCY > 0).reduce((sum, c) => sum + c.Balance_LCY, 0);
    const negativeBalance = customers.filter(c => c.Balance_LCY < 0).reduce((sum, c) => sum + Math.abs(c.Balance_LCY), 0);
    const avgBalance = totalBalance / customers.length;

    // Top 10 customers by balance
    const top10 = customers.slice(0, 10);

    // Display results
    Logger.log('');
    Logger.log('=== BALANCE SUMMARY ===');
    Logger.log(`Total Customers: ${customers.length}`);
    Logger.log(`Total Balance: €${totalBalance.toFixed(2)}`);
    Logger.log(`Positive Balance: €${positiveBalance.toFixed(2)}`);
    Logger.log(`Negative Balance: €${negativeBalance.toFixed(2)}`);
    Logger.log(`Average Balance: €${avgBalance.toFixed(2)}`);
    Logger.log('');
    Logger.log('=== TOP 10 BY BALANCE ===');
    top10.forEach((customer, i) => {
      Logger.log(`${i + 1}. ${customer.Name} - €${customer.Balance_LCY.toFixed(2)}`);
    });

    return {
      totalCustomers: customers.length,
      totalBalance,
      positiveBalance,
      negativeBalance,
      avgBalance,
      top10
    };
  } catch (error) {
    Logger.log(`❌ Error: ${error.message}`);
    throw error;
  }
}

/**
 * EXAMPLE 3: Sync Sales Orders to Sheets (Incremental)
 *
 * Demonstrates:
 * - Incremental sync pattern
 * - Date filtering
 * - State management
 */
function syncSalesOrdersIncremental() {
  Logger.log('🔄 Syncing sales orders (incremental)...');

  try {
    const props = PropertiesService.getScriptProperties();
    const lastSyncKey = 'last_sync_sales_orders';

    // Get last sync date (or default to 30 days ago)
    let lastSync = props.getProperty(lastSyncKey);
    if (!lastSync) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      lastSync = thirtyDaysAgo.toISOString().split('T')[0];
    }

    Logger.log(`Last sync: ${lastSync}`);

    // Fetch orders since last sync
    const orders = SalesOrders.getAll({
      $filter: `Order_Date gt ${lastSync}`,
      $select: 'No,Sell_to_Customer_No,Sell_to_Customer_Name,Order_Date,Status,Amount',
      $orderby: 'Order_Date desc',
      $top: 500
    });

    Logger.log(`✅ Found ${orders.length} new/updated orders`);

    if (orders.length === 0) {
      Logger.log('ℹ️  No new orders to sync');
      return 0;
    }

    // Write to sheet (similar to exportCustomersToSheet)
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('BC Sales Orders');

    if (!sheet) {
      sheet = ss.insertSheet('BC Sales Orders');

      // Add headers
      const headers = ['Order No', 'Customer No', 'Customer Name', 'Order Date', 'Status', 'Amount'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#34a853').setFontColor('#ffffff');
    }

    // Append new orders (not clearing existing)
    const lastRow = sheet.getLastRow();
    const data = orders.map(order => [
      order.No || '',
      order.Sell_to_Customer_No || '',
      order.Sell_to_Customer_Name || '',
      order.Order_Date || '',
      order.Status || '',
      order.Amount || 0
    ]);

    sheet.getRange(lastRow + 1, 1, data.length, 6).setValues(data);

    // Update last sync timestamp
    const now = new Date().toISOString().split('T')[0];
    props.setProperty(lastSyncKey, now);

    Logger.log(`✅ Synced ${orders.length} orders`);
    Logger.log(`📊 Total rows in sheet: ${sheet.getLastRow()}`);

    return orders.length;
  } catch (error) {
    Logger.log(`❌ Error: ${error.message}`);
    throw error;
  }
}

/**
 * EXAMPLE 4: Item Inventory Report
 *
 * Demonstrates:
 * - Complex OData queries
 * - Data transformation
 * - Conditional formatting
 */
function generateItemInventoryReport() {
  Logger.log('📦 Generating item inventory report...');

  try {
    // Get items with inventory info
    const items = Items.getAll({
      $select: 'No,Description,Base_Unit_of_Measure,Inventory,Qty_on_Purch_Order,Qty_on_Sales_Order,Unit_Cost,Unit_Price',
      $filter: 'Type eq \'Inventory\'',
      $orderby: 'Inventory desc',
      $top: 200
    });

    Logger.log(`✅ Fetched ${items.length} inventory items`);

    // Calculate available inventory
    const itemsWithCalc = items.map(item => ({
      ...item,
      Available: (item.Inventory || 0) + (item.Qty_on_Purch_Order || 0) - (item.Qty_on_Sales_Order || 0),
      InventoryValue: (item.Inventory || 0) * (item.Unit_Cost || 0)
    }));

    // Create report sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('BC Inventory Report');

    if (!sheet) {
      sheet = ss.insertSheet('BC Inventory Report');
    } else {
      sheet.clear();
    }

    // Headers
    const headers = ['Item No', 'Description', 'Unit', 'On Hand', 'On Purchase', 'On Sales', 'Available', 'Unit Cost', 'Unit Price', 'Inventory Value'];
    const data = [headers];

    itemsWithCalc.forEach(item => {
      data.push([
        item.No,
        item.Description,
        item.Base_Unit_of_Measure,
        item.Inventory || 0,
        item.Qty_on_Purch_Order || 0,
        item.Qty_on_Sales_Order || 0,
        item.Available,
        item.Unit_Cost || 0,
        item.Unit_Price || 0,
        item.InventoryValue
      ]);
    });

    sheet.getRange(1, 1, data.length, headers.length).setValues(data);

    // Format header
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#fbbc04')
      .setFontColor('#000000');

    // Format numbers
    sheet.getRange(2, 4, items.length, 4).setNumberFormat('#,##0'); // Quantities
    sheet.getRange(2, 8, items.length, 3).setNumberFormat('#,##0.00'); // Costs/Prices

    // Conditional formatting for low stock (Available < 10)
    const availableCol = headers.indexOf('Available') + 1;
    const availableRange = sheet.getRange(2, availableCol, items.length, 1);

    const rule = SpreadsheetApp.newConditionalFormatRule()
      .whenNumberLessThan(10)
      .setBackground('#f4cccc')
      .setRanges([availableRange])
      .build();

    sheet.setConditionalFormatRules([rule]);

    sheet.autoResizeColumns(1, headers.length);

    // Calculate totals
    const totalInventoryValue = itemsWithCalc.reduce((sum, item) => sum + item.InventoryValue, 0);

    Logger.log(`✅ Report generated with ${items.length} items`);
    Logger.log(`💰 Total inventory value: €${totalInventoryValue.toFixed(2)}`);
    Logger.log(`📊 View: ${sheet.getParent().getUrl()}`);

    return {
      itemCount: items.length,
      totalValue: totalInventoryValue
    };
  } catch (error) {
    Logger.log(`❌ Error: ${error.message}`);
    throw error;
  }
}

/**
 * EXAMPLE 5: Search Items by Description
 *
 * Demonstrates:
 * - String search in OData
 * - substringof / contains functions
 */
function searchItems(searchTerm) {
  Logger.log(`🔍 Searching items for: "${searchTerm}"`);

  try {
    // OData substringof function for string search
    const items = Items.getAll({
      $filter: `substringof('${searchTerm}', Description)`,
      $select: 'No,Description,Type,Unit_Price,Inventory',
      $top: 20
    });

    Logger.log(`✅ Found ${items.length} items`);

    items.forEach((item, i) => {
      Logger.log(`${i + 1}. ${item.No} - ${item.Description} (€${item.Unit_Price || 0})`);
    });

    return items;
  } catch (error) {
    Logger.log(`❌ Error: ${error.message}`);
    throw error;
  }
}

/**
 * EXAMPLE 6: Get Posted Invoices for Date Range
 *
 * Demonstrates:
 * - Date range filtering
 * - Complex OData filters
 */
function getInvoicesByDateRange(startDate, endDate) {
  Logger.log(`📄 Getting invoices from ${startDate} to ${endDate}...`);

  try {
    const invoices = PostedSalesInvoices.getAll({
      $filter: `Posting_Date ge ${startDate} and Posting_Date le ${endDate}`,
      $select: 'No,Sell_to_Customer_No,Sell_to_Customer_Name,Posting_Date,Amount_Including_VAT',
      $orderby: 'Posting_Date desc'
    });

    Logger.log(`✅ Found ${invoices.length} invoices`);

    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.Amount_Including_VAT || 0), 0);

    Logger.log(`💰 Total amount: €${totalAmount.toFixed(2)}`);

    return {
      invoices,
      count: invoices.length,
      totalAmount
    };
  } catch (error) {
    Logger.log(`❌ Error: ${error.message}`);
    throw error;
  }
}

/**
 * Run all examples (for testing)
 */
function runAllExamples() {
  Logger.log('🚀 Running all examples...');
  Logger.log('');

  try {
    // Example 1
    Logger.log('=== EXAMPLE 1: Export Customers ===');
    exportCustomersToSheet();
    Logger.log('');

    // Example 2
    Logger.log('=== EXAMPLE 2: Balance Summary ===');
    getCustomerBalanceSummary();
    Logger.log('');

    // Example 3
    Logger.log('=== EXAMPLE 3: Incremental Sync ===');
    syncSalesOrdersIncremental();
    Logger.log('');

    // Example 4
    Logger.log('=== EXAMPLE 4: Inventory Report ===');
    generateItemInventoryReport();
    Logger.log('');

    // Example 5
    Logger.log('=== EXAMPLE 5: Search Items ===');
    searchItems('DESK');
    Logger.log('');

    // Example 6
    Logger.log('=== EXAMPLE 6: Invoices by Date ===');
    getInvoicesByDateRange('2024-01-01', '2024-12-31');
    Logger.log('');

    Logger.log('✅ All examples completed successfully!');
  } catch (error) {
    Logger.log(`❌ Examples failed: ${error.message}`);
    throw error;
  }
}
