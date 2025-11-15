/**
 * Config.gs - Secure Configuration Management
 *
 * Handles secure storage of Business Central credentials and configuration
 * using PropertiesService (Script Properties).
 *
 * SECURITY: Never hardcode credentials in code. Always use PropertiesService.
 */

/**
 * Setup configuration - Run this ONCE to store credentials securely
 *
 * Usage:
 * 1. Open Script Editor
 * 2. Run setupConfig() function
 * 3. Credentials will be stored in Script Properties (encrypted by Google)
 *
 * Note: You need to be the script owner to run this function
 */
function setupConfig() {
  const props = PropertiesService.getScriptProperties();

  // Business Central OAuth2 Configuration
  // ⚠️ REPLACE WITH YOUR CREDENTIALS FROM AZURE AD
  const config = {
    // OAuth2 Credentials
    'BC_TENANT_ID': 'YOUR-TENANT-ID',
    'BC_CLIENT_ID': 'YOUR-CLIENT-ID',
    'BC_CLIENT_SECRET': 'YOUR-CLIENT-SECRET',
    'BC_TOKEN_URL': 'https://login.microsoftonline.com/YOUR-TENANT-ID/oauth2/v2.0/token',
    'BC_SCOPE': 'https://api.businesscentral.dynamics.com/.default',

    // Business Central API Configuration
    'BC_BASE_URL': 'https://api.businesscentral.dynamics.com/v2.0/YOUR-TENANT-ID/Production/ODataV4',
    'BC_ENVIRONMENT': 'Production',
    'BC_COMPANY': 'YOUR COMPANY NAME',
    'BC_COMPANY_ENCODED': 'YOUR%20COMPANY%20NAME',

    // Cache Configuration
    'TOKEN_CACHE_KEY': 'bc_access_token',
    'TOKEN_EXPIRY_BUFFER': '300', // 5 minutes buffer before token expiry

    // Performance Configuration
    'DEFAULT_PAGE_SIZE': '100',
    'MAX_RETRIES': '3',
    'INITIAL_BACKOFF_MS': '1000'
  };

  props.setProperties(config);

  Logger.log('✅ Configuration stored securely in Script Properties');
  Logger.log('⚠️  IMPORTANT: Remove credentials from this function after first run for security');
  Logger.log('📝 Next step: Run testConfiguration() to verify setup');
}

/**
 * Get configuration value safely
 * @param {string} key - Configuration key
 * @returns {string} Configuration value
 * @throws {Error} If key not found
 */
function getConfig(key) {
  const props = PropertiesService.getScriptProperties();
  const value = props.getProperty(key);

  if (!value) {
    throw new Error(`Configuration key not found: ${key}. Run setupConfig() first.`);
  }

  return value;
}

/**
 * Get all Business Central configuration
 * @returns {Object} Configuration object
 */
function getBCConfig() {
  return {
    tenantId: getConfig('BC_TENANT_ID'),
    clientId: getConfig('BC_CLIENT_ID'),
    clientSecret: getConfig('BC_CLIENT_SECRET'),
    tokenUrl: getConfig('BC_TOKEN_URL'),
    scope: getConfig('BC_SCOPE'),
    baseUrl: getConfig('BC_BASE_URL'),
    environment: getConfig('BC_ENVIRONMENT'),
    company: getConfig('BC_COMPANY'),
    companyEncoded: getConfig('BC_COMPANY_ENCODED'),
    tokenCacheKey: getConfig('TOKEN_CACHE_KEY'),
    tokenExpiryBuffer: parseInt(getConfig('TOKEN_EXPIRY_BUFFER')),
    defaultPageSize: parseInt(getConfig('DEFAULT_PAGE_SIZE')),
    maxRetries: parseInt(getConfig('MAX_RETRIES')),
    initialBackoffMs: parseInt(getConfig('INITIAL_BACKOFF_MS'))
  };
}

/**
 * Test configuration setup
 * Verifies all required config keys are present
 */
function testConfiguration() {
  try {
    const config = getBCConfig();

    Logger.log('✅ Configuration test passed!');
    Logger.log('');
    Logger.log('Configuration Summary:');
    Logger.log(`  Environment: ${config.environment}`);
    Logger.log(`  Company: ${config.company}`);
    Logger.log(`  Base URL: ${config.baseUrl}`);
    Logger.log(`  Tenant ID: ${config.tenantId.substring(0, 8)}...`);
    Logger.log(`  Client ID: ${config.clientId.substring(0, 8)}...`);
    Logger.log('');
    Logger.log('🔐 Credentials are stored securely');
    Logger.log('📝 Next step: Run testOAuth2() to verify OAuth2 flow');

    return true;
  } catch (error) {
    Logger.log('❌ Configuration test failed!');
    Logger.log(`Error: ${error.message}`);
    Logger.log('');
    Logger.log('⚠️  Please run setupConfig() first to store credentials');

    return false;
  }
}

/**
 * Clear all stored configuration (use with caution!)
 * Useful for testing or changing environments
 */
function clearConfiguration() {
  const props = PropertiesService.getScriptProperties();
  props.deleteAllProperties();

  Logger.log('⚠️  All configuration cleared from Script Properties');
  Logger.log('📝 Run setupConfig() to reconfigure');
}

/**
 * Get Business Central company URL
 * @returns {string} Full company endpoint URL
 */
function getCompanyUrl() {
  const config = getBCConfig();
  return `${config.baseUrl}/Company('${config.companyEncoded}')`;
}

/**
 * Build endpoint URL for a specific entity
 * @param {string} entityName - Entity name (e.g., 'Customers', 'Items')
 * @returns {string} Full endpoint URL
 */
function buildEndpointUrl(entityName) {
  return `${getCompanyUrl()}/${entityName}`;
}

/**
 * Example: List all available configuration keys
 * Useful for debugging (doesn't show values for security)
 */
function listConfigurationKeys() {
  const props = PropertiesService.getScriptProperties();
  const allKeys = props.getKeys();

  Logger.log('Configured Keys:');
  allKeys.forEach(key => {
    Logger.log(`  - ${key}`);
  });
  Logger.log(`Total: ${allKeys.length} keys`);
}
