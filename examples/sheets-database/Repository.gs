/**
 * Repository.gs - Data Access Layer (Repository Pattern)
 *
 * Implements CRUD operations for Google Sheets as a database.
 * Provides abstraction layer between business logic and data storage.
 *
 * Features:
 * - CRUD operations (Create, Read, Update, Delete)
 * - Query builder integration
 * - Index-based lookups (O(1) performance)
 * - Batch operations
 * - Transaction-like operations
 * - Foreign key validation
 */

/**
 * Base Repository Class
 * Provides generic CRUD operations for any table
 */
class Repository {
  /**
   * Constructor
   * @param {string} tableName - Table name from Schema
   */
  constructor(tableName) {
    this.tableName = tableName;
    this.schema = Schema[tableName];

    if (!this.schema) {
      throw new Error(`Schema not found for table: ${tableName}`);
    }

    this.sheetName = this.schema.sheetName;
    this.primaryKey = this.schema.primaryKey;
    this.fields = Object.keys(this.schema.fields);

    // Cache for performance
    this.indexCache = {};
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.lastCacheTime = 0;
  }

  /**
   * Get sheet reference
   * @returns {GoogleAppsScript.Spreadsheet.Sheet}
   */
  getSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(this.sheetName);

    if (!sheet) {
      throw new Error(`Sheet not found: ${this.sheetName}`);
    }

    return sheet;
  }

  /**
   * CREATE - Insert new record
   * @param {Object} data - Record data
   * @returns {Object} Created record with generated fields
   */
  create(data) {
    // Validate data
    const validatedData = Validator.validate(this.tableName, data);

    // Auto-generate fields
    validatedData[this.primaryKey] = validatedData[this.primaryKey] || this.generateId();

    // Auto-generate timestamps
    const now = new Date().toISOString();
    if (this.schema.fields.created_at?.autoGenerate) {
      validatedData.created_at = now;
    }
    if (this.schema.fields.updated_at?.autoGenerate) {
      validatedData.updated_at = now;
    }

    // Validate foreign keys
    this.validateForeignKeys(validatedData);

    // Build row data
    const rowData = this.fields.map(field => validatedData[field] || '');

    // Insert into sheet
    const sheet = this.getSheet();
    sheet.appendRow(rowData);

    // Invalidate cache
    this.invalidateCache();

    Logger.log(`✅ Created ${this.tableName}: ${validatedData[this.primaryKey]}`);

    return validatedData;
  }

  /**
   * READ - Find record by primary key
   * @param {string} id - Primary key value
   * @returns {Object|null} Record or null if not found
   */
  findById(id) {
    const records = this.findAll();
    return records.find(r => r[this.primaryKey] === id) || null;
  }

  /**
   * READ - Find all records
   * @param {Object} options - Query options (filter, sort, limit)
   * @returns {Array<Object>} Records
   */
  findAll(options = {}) {
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return []; // No data (only header)
    }

    // Get all data at once (batch operation)
    const range = sheet.getRange(2, 1, lastRow - 1, this.fields.length);
    const values = range.getValues();

    // Convert to objects
    let records = values.map(row => {
      const record = {};
      this.fields.forEach((field, index) => {
        record[field] = row[index];
      });
      return record;
    });

    // Apply filter
    if (options.filter) {
      records = records.filter(options.filter);
    }

    // Apply sort
    if (options.sort) {
      const { field, order = 'asc' } = options.sort;
      records.sort((a, b) => {
        if (a[field] < b[field]) return order === 'asc' ? -1 : 1;
        if (a[field] > b[field]) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply limit
    if (options.limit) {
      records = records.slice(0, options.limit);
    }

    return records;
  }

  /**
   * READ - Find one record matching filter
   * @param {Function} filter - Filter function
   * @returns {Object|null} First matching record or null
   */
  findOne(filter) {
    const records = this.findAll({ filter, limit: 1 });
    return records.length > 0 ? records[0] : null;
  }

  /**
   * READ - Find records by field value (with index)
   * @param {string} field - Field name
   * @param {*} value - Field value
   * @returns {Array<Object>} Matching records
   */
  findBy(field, value) {
    // Use index if available
    const index = this.getIndex(field);

    if (index && index[value]) {
      return index[value];
    }

    // Fallback to full scan
    return this.findAll({
      filter: record => record[field] === value
    });
  }

  /**
   * UPDATE - Update record by primary key
   * @param {string} id - Primary key value
   * @param {Object} data - Fields to update
   * @returns {Object|null} Updated record or null if not found
   */
  update(id, data) {
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return null; // No data
    }

    // Find record row
    const pkIndex = this.fields.indexOf(this.primaryKey);
    const range = sheet.getRange(2, pkIndex + 1, lastRow - 1, 1);
    const ids = range.getValues().flat();
    const rowIndex = ids.indexOf(id);

    if (rowIndex === -1) {
      return null; // Not found
    }

    const actualRow = rowIndex + 2; // +2 because: +1 for header, +1 for 0-based index

    // Get current record
    const currentRange = sheet.getRange(actualRow, 1, 1, this.fields.length);
    const currentValues = currentRange.getValues()[0];
    const currentRecord = {};
    this.fields.forEach((field, index) => {
      currentRecord[field] = currentValues[index];
    });

    // Merge updates
    const updatedRecord = { ...currentRecord, ...data };

    // Auto-update timestamp
    if (this.schema.fields.updated_at?.autoUpdate) {
      updatedRecord.updated_at = new Date().toISOString();
    }

    // Validate updated data
    const validatedData = Validator.validate(this.tableName, updatedRecord, true);

    // Validate foreign keys
    this.validateForeignKeys(validatedData);

    // Build row data
    const rowData = this.fields.map(field => validatedData[field] || '');

    // Update sheet
    currentRange.setValues([rowData]);

    // Invalidate cache
    this.invalidateCache();

    Logger.log(`✅ Updated ${this.tableName}: ${id}`);

    return validatedData;
  }

  /**
   * DELETE - Delete record by primary key
   * @param {string} id - Primary key value
   * @returns {boolean} True if deleted, false if not found
   */
  delete(id) {
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return false; // No data
    }

    // Find record row
    const pkIndex = this.fields.indexOf(this.primaryKey);
    const range = sheet.getRange(2, pkIndex + 1, lastRow - 1, 1);
    const ids = range.getValues().flat();
    const rowIndex = ids.indexOf(id);

    if (rowIndex === -1) {
      return false; // Not found
    }

    // Check cascade delete for dependent records
    this.handleCascadeDelete(id);

    // Delete row
    const actualRow = rowIndex + 2;
    sheet.deleteRow(actualRow);

    // Invalidate cache
    this.invalidateCache();

    Logger.log(`✅ Deleted ${this.tableName}: ${id}`);

    return true;
  }

  /**
   * COUNT - Count records matching filter
   * @param {Function} filter - Optional filter function
   * @returns {number} Record count
   */
  count(filter = null) {
    const records = this.findAll(filter ? { filter } : {});
    return records.length;
  }

  /**
   * EXISTS - Check if record exists
   * @param {string} id - Primary key value
   * @returns {boolean} True if exists
   */
  exists(id) {
    return this.findById(id) !== null;
  }

  /**
   * BATCH INSERT - Insert multiple records
   * @param {Array<Object>} dataArray - Array of records
   * @returns {Array<Object>} Created records
   */
  batchCreate(dataArray) {
    const results = [];

    for (const data of dataArray) {
      try {
        const created = this.create(data);
        results.push(created);
      } catch (error) {
        Logger.log(`⚠️  Failed to create record: ${error.message}`);
        results.push({ error: error.message, data });
      }
    }

    Logger.log(`✅ Batch created ${results.length} ${this.tableName} records`);

    return results;
  }

  /**
   * Generate unique ID
   * @returns {string} UUID
   */
  generateId() {
    return Utilities.getUuid();
  }

  /**
   * Validate foreign keys
   * @param {Object} data - Record data
   * @throws {Error} If foreign key validation fails
   */
  validateForeignKeys(data) {
    for (const [field, fieldSchema] of Object.entries(this.schema.fields)) {
      if (fieldSchema.foreignKey && data[field]) {
        const fkTable = fieldSchema.foreignKey.table;
        const fkField = fieldSchema.foreignKey.field;
        const fkRepo = new Repository(fkTable);

        const exists = fkRepo.findBy(fkField, data[field]).length > 0;

        if (!exists) {
          throw new Error(
            `Foreign key violation: ${fkTable}.${fkField} = '${data[field]}' does not exist`
          );
        }
      }
    }
  }

  /**
   * Handle cascade delete for dependent records
   * @param {string} id - Primary key value
   */
  handleCascadeDelete(id) {
    // Find tables with foreign keys pointing to this table
    for (const [otherTable, otherSchema] of Object.entries(Schema)) {
      for (const [field, fieldSchema] of Object.entries(otherSchema.fields)) {
        if (fieldSchema.foreignKey &&
            fieldSchema.foreignKey.table === this.tableName &&
            fieldSchema.foreignKey.onDelete === 'CASCADE') {

          // Delete dependent records
          const otherRepo = new Repository(otherTable);
          const dependentRecords = otherRepo.findBy(field, id);

          for (const record of dependentRecords) {
            const otherPK = otherSchema.primaryKey;
            otherRepo.delete(record[otherPK]);
            Logger.log(`   ✓ Cascade deleted ${otherTable}: ${record[otherPK]}`);
          }
        }
      }
    }
  }

  /**
   * Build index for field (for O(1) lookups)
   * @param {string} field - Field name
   * @returns {Object} Index map
   */
  getIndex(field) {
    // Check cache
    const now = Date.now();
    if (this.indexCache[field] && (now - this.lastCacheTime) < this.cacheExpiry) {
      return this.indexCache[field];
    }

    // Build index
    const records = this.findAll();
    const index = {};

    for (const record of records) {
      const value = record[field];
      if (!index[value]) {
        index[value] = [];
      }
      index[value].push(record);
    }

    // Cache index
    this.indexCache[field] = index;
    this.lastCacheTime = now;

    return index;
  }

  /**
   * Invalidate cache
   */
  invalidateCache() {
    this.indexCache = {};
    this.lastCacheTime = 0;
  }

  /**
   * Clear all records (DANGEROUS!)
   * @returns {number} Number of deleted records
   */
  truncate() {
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return 0; // No data
    }

    const count = lastRow - 1;

    // Delete all data rows (keep header)
    sheet.deleteRows(2, count);

    // Invalidate cache
    this.invalidateCache();

    Logger.log(`🗑️  Truncated ${this.tableName}: ${count} records deleted`);

    return count;
  }
}

/**
 * Specific Repository Classes (Optional - can use base Repository directly)
 */

class CustomerRepository extends Repository {
  constructor() {
    super('Customers');
  }

  /**
   * Find customer by email
   * @param {string} email - Customer email
   * @returns {Object|null} Customer or null
   */
  findByEmail(email) {
    return this.findOne(record => record.email === email);
  }

  /**
   * Find active customers
   * @returns {Array<Object>} Active customers
   */
  findActive() {
    return this.findAll({
      filter: record => record.status === 'active'
    });
  }
}

class OrderRepository extends Repository {
  constructor() {
    super('Orders');
  }

  /**
   * Find orders by customer
   * @param {string} customerId - Customer ID
   * @returns {Array<Object>} Customer orders
   */
  findByCustomer(customerId) {
    return this.findBy('customer_id', customerId);
  }

  /**
   * Find orders by status
   * @param {string} status - Order status
   * @returns {Array<Object>} Orders with status
   */
  findByStatus(status) {
    return this.findBy('status', status);
  }

  /**
   * Find pending orders
   * @returns {Array<Object>} Pending orders
   */
  findPending() {
    return this.findByStatus('pending');
  }
}

class OrderItemRepository extends Repository {
  constructor() {
    super('OrderItems');
  }

  /**
   * Find items by order
   * @param {string} orderId - Order ID
   * @returns {Array<Object>} Order items
   */
  findByOrder(orderId) {
    return this.findBy('order_id', orderId);
  }

  /**
   * Calculate order total
   * @param {string} orderId - Order ID
   * @returns {number} Order total
   */
  calculateOrderTotal(orderId) {
    const items = this.findByOrder(orderId);
    return items.reduce((sum, item) => sum + (item.line_total || 0), 0);
  }
}
