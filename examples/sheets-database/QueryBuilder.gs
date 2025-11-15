/**
 * QueryBuilder.gs - Query Optimization and Builder
 *
 * Provides fluent API for building complex queries with optimization.
 *
 * Features:
 * - Method chaining for query building
 * - Filter helpers for common patterns
 * - Sorting and pagination
 * - Query optimization
 * - Performance hints
 */

/**
 * QueryBuilder Class
 * Provides fluent interface for building queries
 */
class QueryBuilder {
  /**
   * Constructor
   * @param {string} tableName - Table name
   */
  constructor(tableName) {
    this.tableName = tableName;
    this.schema = Schema[tableName];

    if (!this.schema) {
      throw new Error(`Schema not found for table: ${tableName}`);
    }

    this.repository = new Repository(tableName);

    // Query state
    this._filters = [];
    this._sortField = null;
    this._sortOrder = 'asc';
    this._limitValue = null;
    this._offsetValue = 0;
    this._selectFields = null;
  }

  /**
   * Add filter condition
   * @param {Function|Object} condition - Filter function or field-value object
   * @returns {QueryBuilder} this for chaining
   */
  where(condition) {
    if (typeof condition === 'function') {
      this._filters.push(condition);
    } else if (typeof condition === 'object') {
      // Convert object to filter function
      // e.g., { status: 'active' } => record => record.status === 'active'
      for (const [field, value] of Object.entries(condition)) {
        this._filters.push(record => record[field] === value);
      }
    } else {
      throw new Error('where() requires a function or object');
    }

    return this;
  }

  /**
   * Add field equals filter
   * @param {string} field - Field name
   * @param {*} value - Value to match
   * @returns {QueryBuilder} this for chaining
   */
  whereEquals(field, value) {
    this._filters.push(record => record[field] === value);
    return this;
  }

  /**
   * Add field not equals filter
   * @param {string} field - Field name
   * @param {*} value - Value to exclude
   * @returns {QueryBuilder} this for chaining
   */
  whereNotEquals(field, value) {
    this._filters.push(record => record[field] !== value);
    return this;
  }

  /**
   * Add field in list filter
   * @param {string} field - Field name
   * @param {Array} values - Values to match
   * @returns {QueryBuilder} this for chaining
   */
  whereIn(field, values) {
    this._filters.push(record => values.includes(record[field]));
    return this;
  }

  /**
   * Add field not in list filter
   * @param {string} field - Field name
   * @param {Array} values - Values to exclude
   * @returns {QueryBuilder} this for chaining
   */
  whereNotIn(field, values) {
    this._filters.push(record => !values.includes(record[field]));
    return this;
  }

  /**
   * Add greater than filter
   * @param {string} field - Field name
   * @param {number} value - Minimum value (exclusive)
   * @returns {QueryBuilder} this for chaining
   */
  whereGreaterThan(field, value) {
    this._filters.push(record => record[field] > value);
    return this;
  }

  /**
   * Add greater than or equal filter
   * @param {string} field - Field name
   * @param {number} value - Minimum value (inclusive)
   * @returns {QueryBuilder} this for chaining
   */
  whereGreaterOrEqual(field, value) {
    this._filters.push(record => record[field] >= value);
    return this;
  }

  /**
   * Add less than filter
   * @param {string} field - Field name
   * @param {number} value - Maximum value (exclusive)
   * @returns {QueryBuilder} this for chaining
   */
  whereLessThan(field, value) {
    this._filters.push(record => record[field] < value);
    return this;
  }

  /**
   * Add less than or equal filter
   * @param {string} field - Field name
   * @param {number} value - Maximum value (inclusive)
   * @returns {QueryBuilder} this for chaining
   */
  whereLessOrEqual(field, value) {
    this._filters.push(record => record[field] <= value);
    return this;
  }

  /**
   * Add range filter (between)
   * @param {string} field - Field name
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (inclusive)
   * @returns {QueryBuilder} this for chaining
   */
  whereBetween(field, min, max) {
    this._filters.push(record => record[field] >= min && record[field] <= max);
    return this;
  }

  /**
   * Add like filter (contains substring)
   * @param {string} field - Field name
   * @param {string} substring - Substring to search
   * @param {boolean} caseSensitive - Case sensitive search (default: false)
   * @returns {QueryBuilder} this for chaining
   */
  whereLike(field, substring, caseSensitive = false) {
    if (caseSensitive) {
      this._filters.push(record =>
        String(record[field]).includes(substring)
      );
    } else {
      const lower = substring.toLowerCase();
      this._filters.push(record =>
        String(record[field]).toLowerCase().includes(lower)
      );
    }
    return this;
  }

  /**
   * Add starts with filter
   * @param {string} field - Field name
   * @param {string} prefix - Prefix to match
   * @returns {QueryBuilder} this for chaining
   */
  whereStartsWith(field, prefix) {
    this._filters.push(record =>
      String(record[field]).startsWith(prefix)
    );
    return this;
  }

  /**
   * Add ends with filter
   * @param {string} field - Field name
   * @param {string} suffix - Suffix to match
   * @returns {QueryBuilder} this for chaining
   */
  whereEndsWith(field, suffix) {
    this._filters.push(record =>
      String(record[field]).endsWith(suffix)
    );
    return this;
  }

  /**
   * Add null check filter
   * @param {string} field - Field name
   * @returns {QueryBuilder} this for chaining
   */
  whereNull(field) {
    this._filters.push(record =>
      record[field] === null || record[field] === undefined || record[field] === ''
    );
    return this;
  }

  /**
   * Add not null check filter
   * @param {string} field - Field name
   * @returns {QueryBuilder} this for chaining
   */
  whereNotNull(field) {
    this._filters.push(record =>
      record[field] !== null && record[field] !== undefined && record[field] !== ''
    );
    return this;
  }

  /**
   * Add date range filter
   * @param {string} field - Field name (timestamp or date field)
   * @param {string|Date} startDate - Start date
   * @param {string|Date} endDate - End date
   * @returns {QueryBuilder} this for chaining
   */
  whereDateBetween(field, startDate, endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    this._filters.push(record => {
      const recordDate = new Date(record[field]).getTime();
      return recordDate >= start && recordDate <= end;
    });

    return this;
  }

  /**
   * Set sort order
   * @param {string} field - Field to sort by
   * @param {string} order - 'asc' or 'desc' (default: 'asc')
   * @returns {QueryBuilder} this for chaining
   */
  orderBy(field, order = 'asc') {
    this._sortField = field;
    this._sortOrder = order;
    return this;
  }

  /**
   * Set limit (max records to return)
   * @param {number} limit - Maximum number of records
   * @returns {QueryBuilder} this for chaining
   */
  limit(limit) {
    this._limitValue = limit;
    return this;
  }

  /**
   * Set offset (skip records)
   * @param {number} offset - Number of records to skip
   * @returns {QueryBuilder} this for chaining
   */
  offset(offset) {
    this._offsetValue = offset;
    return this;
  }

  /**
   * Select specific fields (projection)
   * @param {Array<string>} fields - Fields to select
   * @returns {QueryBuilder} this for chaining
   */
  select(fields) {
    this._selectFields = fields;
    return this;
  }

  /**
   * Execute query and return results
   * @returns {Array<Object>} Query results
   */
  get() {
    // Build composite filter
    const compositeFilter = record => {
      for (const filter of this._filters) {
        if (!filter(record)) {
          return false;
        }
      }
      return true;
    };

    // Build query options
    const options = {};

    if (this._filters.length > 0) {
      options.filter = compositeFilter;
    }

    if (this._sortField) {
      options.sort = {
        field: this._sortField,
        order: this._sortOrder
      };
    }

    // Execute query
    let results = this.repository.findAll(options);

    // Apply offset
    if (this._offsetValue > 0) {
      results = results.slice(this._offsetValue);
    }

    // Apply limit
    if (this._limitValue !== null) {
      results = results.slice(0, this._limitValue);
    }

    // Apply field selection (projection)
    if (this._selectFields) {
      results = results.map(record => {
        const projected = {};
        for (const field of this._selectFields) {
          projected[field] = record[field];
        }
        return projected;
      });
    }

    return results;
  }

  /**
   * Execute query and return first result
   * @returns {Object|null} First matching record or null
   */
  first() {
    this._limitValue = 1;
    const results = this.get();
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Execute query and return count
   * @returns {number} Number of matching records
   */
  count() {
    // Don't apply limit/offset for count
    const savedLimit = this._limitValue;
    const savedOffset = this._offsetValue;

    this._limitValue = null;
    this._offsetValue = 0;

    const results = this.get();
    const count = results.length;

    // Restore limit/offset
    this._limitValue = savedLimit;
    this._offsetValue = savedOffset;

    return count;
  }

  /**
   * Check if any records match
   * @returns {boolean} True if at least one record matches
   */
  exists() {
    return this.count() > 0;
  }

  /**
   * Get paginated results
   * @param {number} page - Page number (1-based)
   * @param {number} pageSize - Records per page
   * @returns {Object} Paginated result with data and metadata
   */
  paginate(page = 1, pageSize = 10) {
    // Get total count
    const totalCount = this.count();
    const totalPages = Math.ceil(totalCount / pageSize);

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Get page data
    this._offsetValue = offset;
    this._limitValue = pageSize;
    const data = this.get();

    return {
      data,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }
}

/**
 * Helper function to create QueryBuilder
 * @param {string} tableName - Table name
 * @returns {QueryBuilder} New query builder instance
 */
function query(tableName) {
  return new QueryBuilder(tableName);
}

/**
 * Quick query helpers
 */
const Q = {
  /**
   * Find all records matching conditions
   * @param {string} tableName - Table name
   * @param {Object} conditions - Field-value conditions
   * @returns {Array<Object>} Matching records
   */
  findWhere(tableName, conditions) {
    return query(tableName).where(conditions).get();
  },

  /**
   * Find first record matching conditions
   * @param {string} tableName - Table name
   * @param {Object} conditions - Field-value conditions
   * @returns {Object|null} First matching record or null
   */
  findOneWhere(tableName, conditions) {
    return query(tableName).where(conditions).first();
  },

  /**
   * Count records matching conditions
   * @param {string} tableName - Table name
   * @param {Object} conditions - Field-value conditions
   * @returns {number} Count
   */
  countWhere(tableName, conditions) {
    return query(tableName).where(conditions).count();
  }
};

/**
 * Test function
 */
function testQueryBuilder() {
  Logger.log('🧪 Testing QueryBuilder...');
  Logger.log('');

  // Note: These tests assume data exists in the database
  // Run initializeDatabase() and add test data first

  // Test 1: Simple where query
  Logger.log('Test 1: Find active customers');
  const activeCustomers = query('Customers')
    .whereEquals('status', 'active')
    .get();
  Logger.log(`  Found ${activeCustomers.length} active customers`);

  Logger.log('');

  // Test 2: Chained filters
  Logger.log('Test 2: Find customers with credit_limit > 1000 AND active status');
  const highCreditCustomers = query('Customers')
    .whereEquals('status', 'active')
    .whereGreaterThan('credit_limit', 1000)
    .get();
  Logger.log(`  Found ${highCreditCustomers.length} high credit customers`);

  Logger.log('');

  // Test 3: Like search
  Logger.log('Test 3: Find customers with "john" in name');
  const johnCustomers = query('Customers')
    .whereLike('name', 'john')
    .get();
  Logger.log(`  Found ${johnCustomers.length} customers`);

  Logger.log('');

  // Test 4: Sorting
  Logger.log('Test 4: Get top 5 customers by credit_limit');
  const topCustomers = query('Customers')
    .orderBy('credit_limit', 'desc')
    .limit(5)
    .get();
  Logger.log(`  Top 5 customers:`);
  topCustomers.forEach(c => {
    Logger.log(`    - ${c.name}: $${c.credit_limit}`);
  });

  Logger.log('');

  // Test 5: Pagination
  Logger.log('Test 5: Paginate customers (page 1, 10 per page)');
  const page1 = query('Customers')
    .orderBy('name')
    .paginate(1, 10);
  Logger.log(`  Page 1: ${page1.data.length} records`);
  Logger.log(`  Total: ${page1.pagination.totalCount} records, ${page1.pagination.totalPages} pages`);

  Logger.log('');

  // Test 6: Field selection
  Logger.log('Test 6: Get only name and email fields');
  const nameAndEmail = query('Customers')
    .select(['name', 'email'])
    .limit(3)
    .get();
  Logger.log(`  Selected fields: ${JSON.stringify(nameAndEmail[0])}`);

  Logger.log('');

  // Test 7: Count
  Logger.log('Test 7: Count pending orders');
  const pendingCount = query('Orders')
    .whereEquals('status', 'pending')
    .count();
  Logger.log(`  Pending orders: ${pendingCount}`);

  Logger.log('');

  // Test 8: Date range
  Logger.log('Test 8: Find orders from last 30 days');
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentOrders = query('Orders')
    .whereDateBetween('created_at', thirtyDaysAgo, new Date())
    .get();
  Logger.log(`  Recent orders: ${recentOrders.length}`);

  Logger.log('');

  // Test 9: Quick helpers
  Logger.log('Test 9: Quick helpers');
  const activeCount = Q.countWhere('Customers', { status: 'active' });
  Logger.log(`  Active customers (via Q.countWhere): ${activeCount}`);

  Logger.log('');
  Logger.log('✅ QueryBuilder tests completed!');
}
