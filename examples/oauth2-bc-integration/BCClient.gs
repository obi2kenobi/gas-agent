/**
 * BCClient.gs - Business Central OData Client
 *
 * Production-ready client for Business Central OData API
 * with error handling, retry logic, and OData query patterns.
 *
 * Features:
 * - OData v4 query support ($filter, $select, $expand, $orderby, $top, $skip)
 * - Automatic OAuth2 authentication
 * - Error handling with exponential backoff
 * - Response parsing and validation
 * - Pagination support for large datasets
 */

/**
 * Business Central API Client
 */
const BCClient = (function() {

  /**
   * Make authenticated request to Business Central API
   *
   * @param {string} endpoint - Endpoint path (e.g., 'Customers', 'Items')
   * @param {Object} options - Request options
   * @returns {Object} Parsed response data
   * @throws {Error} If request fails after retries
   */
  function request(endpoint, options = {}) {
    const config = getBCConfig();
    const token = getBCAccessToken();

    const url = `${getCompanyUrl()}/${endpoint}`;

    const fetchOptions = {
      'method': options.method || 'GET',
      'headers': {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers
      },
      'muteHttpExceptions': true
    };

    if (options.payload) {
      fetchOptions.payload = JSON.stringify(options.payload);
    }

    // Retry logic with exponential backoff
    let lastError;
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const response = UrlFetchApp.fetch(url, fetchOptions);
        const statusCode = response.getResponseCode();
        const responseText = response.getContentText();

        // Success
        if (statusCode >= 200 && statusCode < 300) {
          if (!responseText) {
            return null; // No content (e.g., DELETE)
          }

          const data = JSON.parse(responseText);
          return data;
        }

        // Handle specific errors
        if (statusCode === 401) {
          // Token might be expired, clear cache and retry once
          if (attempt === 0) {
            Logger.log('🔄 Token expired, refreshing...');
            clearTokenCache();
            continue; // Retry with fresh token
          }
          throw new Error('Authentication failed after token refresh');
        }

        if (statusCode === 404) {
          throw new Error(`Resource not found: ${endpoint}`);
        }

        if (statusCode === 429) {
          // Rate limited - use longer backoff
          const backoffMs = config.initialBackoffMs * Math.pow(2, attempt + 2);
          Logger.log(`⏳ Rate limited, waiting ${backoffMs}ms...`);
          Utilities.sleep(backoffMs);
          continue;
        }

        // Parse error message
        let errorMessage = `HTTP ${statusCode}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }

        throw new Error(errorMessage);

      } catch (error) {
        lastError = error;

        // Don't retry client errors (4xx except 401, 429)
        const is4xxError = error.message.includes('400') ||
                          error.message.includes('403') ||
                          error.message.includes('404');

        if (is4xxError) {
          throw error;
        }

        // Exponential backoff for retryable errors
        if (attempt < config.maxRetries) {
          const backoffMs = config.initialBackoffMs * Math.pow(2, attempt);
          Logger.log(`⏳ Retry ${attempt + 1}/${config.maxRetries} after ${backoffMs}ms...`);
          Utilities.sleep(backoffMs);
        }
      }
    }

    throw new Error(`Request failed after ${config.maxRetries + 1} attempts: ${lastError.message}`);
  }

  /**
   * Build OData query string from options
   *
   * @param {Object} options - Query options
   * @returns {string} Query string
   */
  function buildQuery(options = {}) {
    const params = [];

    if (options.$filter) params.push(`$filter=${encodeURIComponent(options.$filter)}`);
    if (options.$select) params.push(`$select=${encodeURIComponent(options.$select)}`);
    if (options.$expand) params.push(`$expand=${encodeURIComponent(options.$expand)}`);
    if (options.$orderby) params.push(`$orderby=${encodeURIComponent(options.$orderby)}`);
    if (options.$top) params.push(`$top=${options.$top}`);
    if (options.$skip) params.push(`$skip=${options.$skip}`);
    if (options.$count) params.push(`$count=true`);

    return params.length > 0 ? '?' + params.join('&') : '';
  }

  /**
   * GET request with OData query support
   *
   * @param {string} entity - Entity name
   * @param {Object} queryOptions - OData query options
   * @returns {Object} Response data
   */
  function get(entity, queryOptions = {}) {
    const query = buildQuery(queryOptions);
    const endpoint = `${entity}${query}`;

    const response = request(endpoint);

    // OData wraps results in 'value' property
    return response.value !== undefined ? response.value : response;
  }

  /**
   * GET single record by ID
   *
   * @param {string} entity - Entity name
   * @param {string} id - Record ID
   * @param {Object} queryOptions - OData query options ($select, $expand)
   * @returns {Object} Single record
   */
  function getById(entity, id, queryOptions = {}) {
    const query = buildQuery(queryOptions);
    const endpoint = `${entity}('${id}')${query}`;

    return request(endpoint);
  }

  /**
   * POST - Create new record
   *
   * @param {string} entity - Entity name
   * @param {Object} data - Record data
   * @returns {Object} Created record
   */
  function create(entity, data) {
    return request(entity, {
      method: 'POST',
      payload: data
    });
  }

  /**
   * PATCH - Update existing record
   *
   * @param {string} entity - Entity name
   * @param {string} id - Record ID
   * @param {Object} data - Updated fields
   * @returns {Object} Updated record
   */
  function update(entity, id, data) {
    return request(`${entity}('${id}')`, {
      method: 'PATCH',
      payload: data
    });
  }

  /**
   * DELETE - Delete record
   *
   * @param {string} entity - Entity name
   * @param {string} id - Record ID
   * @returns {null}
   */
  function remove(entity, id) {
    return request(`${entity}('${id}')`, {
      method: 'DELETE'
    });
  }

  /**
   * Get all records with automatic pagination
   * WARNING: Use with caution on large datasets
   *
   * @param {string} entity - Entity name
   * @param {Object} queryOptions - OData query options
   * @param {number} maxRecords - Maximum records to fetch (default: 1000)
   * @returns {Array} All records
   */
  function getAll(entity, queryOptions = {}, maxRecords = 1000) {
    const pageSize = queryOptions.$top || 100;
    const results = [];
    let skip = 0;

    while (results.length < maxRecords) {
      const options = {
        ...queryOptions,
        $top: Math.min(pageSize, maxRecords - results.length),
        $skip: skip
      };

      const page = get(entity, options);

      if (!page || page.length === 0) {
        break; // No more records
      }

      results.push(...page);
      skip += page.length;

      // If we got fewer records than requested, we've reached the end
      if (page.length < pageSize) {
        break;
      }
    }

    Logger.log(`📦 Fetched ${results.length} records from ${entity}`);
    return results;
  }

  /**
   * Count records matching filter
   *
   * @param {string} entity - Entity name
   * @param {string} filter - OData filter
   * @returns {number} Record count
   */
  function count(entity, filter = null) {
    const options = { $count: true, $top: 0 };
    if (filter) options.$filter = filter;

    const endpoint = `${entity}${buildQuery(options)}`;
    const response = request(endpoint);

    return response['@odata.count'] || 0;
  }

  // Public API
  return {
    request,
    get,
    getById,
    create,
    update,
    delete: remove,
    getAll,
    count,
    buildQuery
  };
})();

/**
 * Entity-specific helper functions for common Business Central entities
 */

// Customers
const Customers = {
  getAll: (options) => BCClient.get('Customers', options),
  getById: (id, options) => BCClient.getById('Customers', id, options),
  create: (data) => BCClient.create('Customers', data),
  update: (id, data) => BCClient.update('Customers', id, data),
  count: (filter) => BCClient.count('Customers', filter)
};

// Items
const Items = {
  getAll: (options) => BCClient.get('Items', options),
  getById: (no, options) => BCClient.getById('Items', no, options),
  create: (data) => BCClient.create('Items', data),
  update: (no, data) => BCClient.update('Items', no, data),
  count: (filter) => BCClient.count('Items', filter)
};

// Sales Orders
const SalesOrders = {
  getAll: (options) => BCClient.get('Ordine_vendita_Excel', options),
  getById: (no, options) => BCClient.getById('Ordine_vendita_Excel', no, options),
  count: (filter) => BCClient.count('Ordine_vendita_Excel', filter)
};

// Purchase Orders
const PurchaseOrders = {
  getAll: (options) => BCClient.get('Ordine_acquisto_Excel', options),
  getById: (no, options) => BCClient.getById('Ordine_acquisto_Excel', no, options),
  count: (filter) => BCClient.count('Ordine_acquisto_Excel', filter)
};

// Posted Sales Invoices
const PostedSalesInvoices = {
  getAll: (options) => BCClient.get('Fatture_vendita_reg__Excel', options),
  getById: (no, options) => BCClient.getById('Fatture_vendita_reg__Excel', no, options),
  count: (filter) => BCClient.count('Fatture_vendita_reg__Excel', filter)
};

// G/L Entries
const GLEntries = {
  getAll: (options) => BCClient.get('Movimenti_C_G_Excel', options),
  count: (filter) => BCClient.count('Movimenti_C_G_Excel', filter)
};

// Item Ledger Entries
const ItemLedgerEntries = {
  getAll: (options) => BCClient.get('Mov_contabili_articoli', options),
  count: (filter) => BCClient.count('Mov_contabili_articoli', filter)
};

/**
 * Test Business Central API connection
 */
function testBCConnection() {
  Logger.log('🧪 Testing Business Central API connection...');
  Logger.log('');

  try {
    // Test 1: Get company info
    Logger.log('Test 1: Company Information');
    const companyInfo = BCClient.get('ExcelTemplateViewCompanyInformation');
    Logger.log(`✅ Company: ${companyInfo[0]?.Name || 'Retrieved'}`);
    Logger.log('');

    // Test 2: Count customers
    Logger.log('Test 2: Count Customers');
    const customerCount = BCClient.count('Customers');
    Logger.log(`✅ Total customers: ${customerCount}`);
    Logger.log('');

    // Test 3: Get first 5 customers
    Logger.log('Test 3: Get First 5 Customers');
    const customers = Customers.getAll({ $top: 5, $select: 'No,Name,Balance_LCY' });
    Logger.log(`✅ Retrieved ${customers.length} customers:`);
    customers.forEach((customer, i) => {
      Logger.log(`   ${i + 1}. ${customer.No} - ${customer.Name} (Balance: ${customer.Balance_LCY || 0})`);
    });
    Logger.log('');

    // Test 4: OData $filter query
    Logger.log('Test 4: OData $filter Query (Customers with balance > 0)');
    const customersWithBalance = Customers.getAll({
      $filter: 'Balance_LCY gt 0',
      $select: 'No,Name,Balance_LCY',
      $top: 3
    });
    Logger.log(`✅ Found ${customersWithBalance.length} customers with positive balance`);
    Logger.log('');

    Logger.log('✅ All tests passed!');
    Logger.log('📝 Business Central API is working correctly');
    Logger.log('');
    Logger.log('💡 Next steps:');
    Logger.log('   - Explore examples in Code.gs');
    Logger.log('   - Run runAllExamples() for comprehensive demos');

    return true;
  } catch (error) {
    Logger.log('❌ Connection test failed!');
    Logger.log(`Error: ${error.message}`);
    Logger.log('');

    if (error.message.includes('Authentication failed')) {
      Logger.log('⚠️  OAuth2 issue - run testOAuth2() first');
    } else if (error.message.includes('Resource not found')) {
      Logger.log('⚠️  Entity not found - check endpoint names');
    } else {
      Logger.log('⚠️  Check error message above for details');
    }

    return false;
  }
}
