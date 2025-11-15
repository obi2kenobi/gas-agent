/**
 * Schema.gs - Database Schema Definition
 *
 * Defines the database schema for a Google Sheets database.
 * Example: Order Management System with Customers, Orders, and OrderItems.
 *
 * Features:
 * - Primary Key definitions
 * - Foreign Key relationships
 * - Field types and constraints
 * - Indexes for performance
 * - Default values
 */

/**
 * Database Schema Definition
 */
const Schema = {
  /**
   * Customers Table
   */
  Customers: {
    sheetName: 'Customers',
    primaryKey: 'customer_id',
    fields: {
      customer_id: {
        type: 'string',
        required: true,
        unique: true,
        autoGenerate: true, // Auto-generate UUID if not provided
        description: 'Unique customer identifier'
      },
      name: {
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 100,
        description: 'Customer full name'
      },
      email: {
        type: 'email',
        required: true,
        unique: true,
        description: 'Customer email address'
      },
      phone: {
        type: 'string',
        required: false,
        pattern: /^[\d\s\-\+\(\)]+$/,
        description: 'Customer phone number'
      },
      address: {
        type: 'string',
        required: false,
        maxLength: 200,
        description: 'Customer address'
      },
      credit_limit: {
        type: 'number',
        required: false,
        default: 0,
        min: 0,
        description: 'Customer credit limit'
      },
      status: {
        type: 'enum',
        required: true,
        default: 'active',
        values: ['active', 'inactive', 'suspended'],
        description: 'Customer status'
      },
      created_at: {
        type: 'timestamp',
        required: true,
        autoGenerate: true,
        description: 'Creation timestamp'
      },
      updated_at: {
        type: 'timestamp',
        required: true,
        autoGenerate: true,
        autoUpdate: true,
        description: 'Last update timestamp'
      }
    },
    indexes: [
      { fields: ['email'], unique: true },
      { fields: ['status'] },
      { fields: ['created_at'] }
    ]
  },

  /**
   * Orders Table
   */
  Orders: {
    sheetName: 'Orders',
    primaryKey: 'order_id',
    fields: {
      order_id: {
        type: 'string',
        required: true,
        unique: true,
        autoGenerate: true,
        description: 'Unique order identifier'
      },
      customer_id: {
        type: 'string',
        required: true,
        foreignKey: {
          table: 'Customers',
          field: 'customer_id',
          onDelete: 'RESTRICT' // Cannot delete customer with orders
        },
        description: 'Reference to customer'
      },
      order_number: {
        type: 'string',
        required: true,
        unique: true,
        autoGenerate: true,
        format: 'ORD-{YYYY}{MM}{DD}-{NNNN}', // e.g., ORD-20250115-0001
        description: 'Human-readable order number'
      },
      order_date: {
        type: 'date',
        required: true,
        default: 'TODAY',
        description: 'Order date'
      },
      status: {
        type: 'enum',
        required: true,
        default: 'pending',
        values: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        description: 'Order status'
      },
      total_amount: {
        type: 'number',
        required: true,
        default: 0,
        min: 0,
        description: 'Total order amount'
      },
      notes: {
        type: 'text',
        required: false,
        maxLength: 500,
        description: 'Order notes'
      },
      created_at: {
        type: 'timestamp',
        required: true,
        autoGenerate: true,
        description: 'Creation timestamp'
      },
      updated_at: {
        type: 'timestamp',
        required: true,
        autoGenerate: true,
        autoUpdate: true,
        description: 'Last update timestamp'
      }
    },
    indexes: [
      { fields: ['customer_id'] },
      { fields: ['order_number'], unique: true },
      { fields: ['status'] },
      { fields: ['order_date'] }
    ]
  },

  /**
   * OrderItems Table
   */
  OrderItems: {
    sheetName: 'OrderItems',
    primaryKey: 'item_id',
    fields: {
      item_id: {
        type: 'string',
        required: true,
        unique: true,
        autoGenerate: true,
        description: 'Unique item identifier'
      },
      order_id: {
        type: 'string',
        required: true,
        foreignKey: {
          table: 'Orders',
          field: 'order_id',
          onDelete: 'CASCADE' // Delete items when order is deleted
        },
        description: 'Reference to order'
      },
      product_code: {
        type: 'string',
        required: true,
        description: 'Product code/SKU'
      },
      product_name: {
        type: 'string',
        required: true,
        maxLength: 100,
        description: 'Product name'
      },
      quantity: {
        type: 'number',
        required: true,
        min: 1,
        description: 'Quantity ordered'
      },
      unit_price: {
        type: 'number',
        required: true,
        min: 0,
        description: 'Unit price'
      },
      line_total: {
        type: 'number',
        required: true,
        computed: true, // Calculated: quantity * unit_price
        min: 0,
        description: 'Line total (quantity × unit_price)'
      },
      created_at: {
        type: 'timestamp',
        required: true,
        autoGenerate: true,
        description: 'Creation timestamp'
      }
    },
    indexes: [
      { fields: ['order_id'] },
      { fields: ['product_code'] }
    ]
  }
};

/**
 * Get field names for a table (in order)
 * @param {string} tableName - Table name
 * @returns {Array<string>} Field names
 */
function getFieldNames(tableName) {
  const schema = Schema[tableName];
  if (!schema) {
    throw new Error(`Schema not found for table: ${tableName}`);
  }
  return Object.keys(schema.fields);
}

/**
 * Get primary key field for a table
 * @param {string} tableName - Table name
 * @returns {string} Primary key field name
 */
function getPrimaryKey(tableName) {
  const schema = Schema[tableName];
  if (!schema) {
    throw new Error(`Schema not found for table: ${tableName}`);
  }
  return schema.primaryKey;
}

/**
 * Get sheet name for a table
 * @param {string} tableName - Table name
 * @returns {string} Sheet name
 */
function getSheetName(tableName) {
  const schema = Schema[tableName];
  if (!schema) {
    throw new Error(`Schema not found for table: ${tableName}`);
  }
  return schema.sheetName;
}

/**
 * Initialize database schema (create sheets with headers)
 * Run this once to set up the database
 */
function initializeDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Logger.log('🗄️ Initializing database schema...');
  Logger.log('');

  let created = 0;
  let existing = 0;

  for (const [tableName, tableSchema] of Object.entries(Schema)) {
    const sheetName = tableSchema.sheetName;
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      // Create new sheet
      sheet = ss.insertSheet(sheetName);
      Logger.log(`✅ Created sheet: ${sheetName}`);
      created++;
    } else {
      Logger.log(`ℹ️  Sheet exists: ${sheetName}`);
      existing++;
    }

    // Set up headers (only if sheet is empty)
    if (sheet.getLastRow() === 0) {
      const headers = Object.keys(tableSchema.fields);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
      headerRange.setHorizontalAlignment('center');

      // Freeze header row
      sheet.setFrozenRows(1);

      // Auto-resize columns
      for (let i = 1; i <= headers.length; i++) {
        sheet.autoResizeColumn(i);
      }

      Logger.log(`   ✓ Added headers: ${headers.join(', ')}`);
    }
  }

  Logger.log('');
  Logger.log(`📊 Database initialization complete!`);
  Logger.log(`   Created: ${created} sheet(s)`);
  Logger.log(`   Existing: ${existing} sheet(s)`);
  Logger.log(`   Total tables: ${created + existing}`);
}

/**
 * Drop all database tables (DANGEROUS!)
 * Use with caution - this will delete all data
 */
function dropDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Logger.log('⚠️  WARNING: Dropping all database tables...');

  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Drop Database',
    'This will DELETE ALL DATA in the database. Are you sure?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    Logger.log('❌ Operation cancelled');
    return;
  }

  let dropped = 0;

  for (const [tableName, tableSchema] of Object.entries(Schema)) {
    const sheetName = tableSchema.sheetName;
    const sheet = ss.getSheetByName(sheetName);

    if (sheet) {
      ss.deleteSheet(sheet);
      Logger.log(`✅ Dropped: ${sheetName}`);
      dropped++;
    }
  }

  Logger.log('');
  Logger.log(`🗑️  Dropped ${dropped} table(s)`);
}

/**
 * Get database statistics
 */
function getDatabaseStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const stats = {};

  Logger.log('📊 Database Statistics');
  Logger.log('='.repeat(60));

  for (const [tableName, tableSchema] of Object.entries(Schema)) {
    const sheetName = tableSchema.sheetName;
    const sheet = ss.getSheetByName(sheetName);

    if (sheet) {
      const lastRow = sheet.getLastRow();
      const recordCount = Math.max(0, lastRow - 1); // Exclude header

      stats[tableName] = {
        sheetName,
        recordCount,
        lastRow,
        columns: Object.keys(tableSchema.fields).length
      };

      Logger.log(`${tableName}:`);
      Logger.log(`  Records: ${recordCount}`);
      Logger.log(`  Columns: ${stats[tableName].columns}`);
      Logger.log('');
    } else {
      stats[tableName] = {
        sheetName,
        exists: false
      };
      Logger.log(`${tableName}: Sheet not found`);
      Logger.log('');
    }
  }

  Logger.log('='.repeat(60));

  return stats;
}

/**
 * Test schema definition
 */
function testSchema() {
  Logger.log('🧪 Testing schema definition...');
  Logger.log('');

  // Test field names
  const customerFields = getFieldNames('Customers');
  Logger.log(`✅ Customer fields (${customerFields.length}): ${customerFields.join(', ')}`);

  // Test primary key
  const customerPK = getPrimaryKey('Customers');
  Logger.log(`✅ Customer primary key: ${customerPK}`);

  // Test sheet name
  const customerSheet = getSheetName('Customers');
  Logger.log(`✅ Customer sheet name: ${customerSheet}`);

  Logger.log('');
  Logger.log('✅ Schema tests passed!');
}
