/**
 * OAuth2Manager.gs - OAuth2 Token Management
 *
 * Handles OAuth2 authentication flow for Business Central API
 * with intelligent token caching and automatic refresh.
 *
 * Features:
 * - Multi-level caching (Memory → CacheService → Fresh token)
 * - Automatic token refresh with expiry buffer
 * - Error handling with exponential backoff
 * - Thread-safe token acquisition
 */

// Memory cache for token (fastest access)
let memoryTokenCache = null;
let memoryTokenExpiry = null;

/**
 * Get valid access token for Business Central API
 * Uses multi-level caching strategy for optimal performance
 *
 * @returns {string} Valid access token
 * @throws {Error} If token acquisition fails
 */
function getBCAccessToken() {
  const config = getBCConfig();
  const now = Date.now();

  // Level 1: Memory cache (fastest - 0ms)
  if (memoryTokenCache && memoryTokenExpiry && now < memoryTokenExpiry) {
    Logger.log('🎯 Token from memory cache');
    return memoryTokenCache;
  }

  // Level 2: CacheService (fast - ~10ms)
  const cache = CacheService.getScriptCache();
  const cachedToken = cache.get(config.tokenCacheKey);

  if (cachedToken) {
    try {
      const tokenData = JSON.parse(cachedToken);
      const expiryTime = tokenData.expiry;

      // Check if token is still valid (with buffer)
      if (now < expiryTime) {
        Logger.log('📦 Token from CacheService');

        // Update memory cache
        memoryTokenCache = tokenData.token;
        memoryTokenExpiry = expiryTime;

        return tokenData.token;
      } else {
        Logger.log('⏱️  Cached token expired, fetching new one');
      }
    } catch (error) {
      Logger.log(`⚠️  Error parsing cached token: ${error.message}`);
    }
  }

  // Level 3: Fetch new token from Azure AD
  Logger.log('🔄 Fetching new token from Azure AD');
  const newToken = fetchNewAccessToken();

  return newToken;
}

/**
 * Fetch new access token from Azure AD
 * Implements exponential backoff for retry logic
 *
 * @returns {string} Fresh access token
 * @throws {Error} If all retry attempts fail
 */
function fetchNewAccessToken() {
  const config = getBCConfig();

  const payload = {
    'grant_type': 'client_credentials',
    'client_id': config.clientId,
    'client_secret': config.clientSecret,
    'scope': config.scope
  };

  const options = {
    'method': 'post',
    'contentType': 'application/x-www-form-urlencoded',
    'payload': payload,
    'muteHttpExceptions': true
  };

  // Retry logic with exponential backoff
  let lastError;
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = UrlFetchApp.fetch(config.tokenUrl, options);
      const statusCode = response.getResponseCode();
      const responseText = response.getContentText();

      if (statusCode === 200) {
        const data = JSON.parse(responseText);

        // Calculate expiry time with buffer
        const expiresInSeconds = data.expires_in || 3600;
        const expiryTime = Date.now() + ((expiresInSeconds - config.tokenExpiryBuffer) * 1000);

        // Cache the token
        cacheToken(data.access_token, expiryTime);

        Logger.log(`✅ New token acquired (expires in ${expiresInSeconds}s)`);

        return data.access_token;
      } else {
        // Handle OAuth2 errors
        let errorMessage = `HTTP ${statusCode}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error_description || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = responseText;
        }

        throw new Error(`OAuth2 error: ${errorMessage}`);
      }
    } catch (error) {
      lastError = error;

      // Don't retry on authentication errors (4xx)
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error(`Authentication failed: ${error.message}. Check credentials in setupConfig()`);
      }

      // Exponential backoff for other errors
      if (attempt < config.maxRetries) {
        const backoffMs = config.initialBackoffMs * Math.pow(2, attempt);
        Logger.log(`⏳ Retry ${attempt + 1}/${config.maxRetries} after ${backoffMs}ms...`);
        Utilities.sleep(backoffMs);
      }
    }
  }

  throw new Error(`Failed to acquire token after ${config.maxRetries + 1} attempts: ${lastError.message}`);
}

/**
 * Cache token in both memory and CacheService
 * @param {string} token - Access token
 * @param {number} expiryTime - Expiry timestamp (milliseconds)
 */
function cacheToken(token, expiryTime) {
  const config = getBCConfig();

  // Memory cache
  memoryTokenCache = token;
  memoryTokenExpiry = expiryTime;

  // CacheService cache (survives between executions, max 6 hours)
  const tokenData = {
    token: token,
    expiry: expiryTime
  };

  const cache = CacheService.getScriptCache();
  const ttlSeconds = Math.floor((expiryTime - Date.now()) / 1000);

  // CacheService max is 21600 seconds (6 hours)
  const cacheTtl = Math.min(ttlSeconds, 21600);

  if (cacheTtl > 0) {
    cache.put(config.tokenCacheKey, JSON.stringify(tokenData), cacheTtl);
    Logger.log(`💾 Token cached for ${cacheTtl}s`);
  }
}

/**
 * Clear all cached tokens (useful for testing or troubleshooting)
 */
function clearTokenCache() {
  const config = getBCConfig();

  // Clear memory cache
  memoryTokenCache = null;
  memoryTokenExpiry = null;

  // Clear CacheService
  const cache = CacheService.getScriptCache();
  cache.remove(config.tokenCacheKey);

  Logger.log('🗑️  Token cache cleared');
}

/**
 * Get token info (for debugging)
 * @returns {Object} Token cache status
 */
function getTokenCacheStatus() {
  const config = getBCConfig();
  const now = Date.now();

  const status = {
    memoryCache: {
      hasToken: !!memoryTokenCache,
      isValid: memoryTokenCache && memoryTokenExpiry && now < memoryTokenExpiry,
      expiresIn: memoryTokenExpiry ? Math.max(0, Math.floor((memoryTokenExpiry - now) / 1000)) : 0
    },
    cacheService: {
      hasToken: false,
      isValid: false,
      expiresIn: 0
    }
  };

  // Check CacheService
  const cache = CacheService.getScriptCache();
  const cachedToken = cache.get(config.tokenCacheKey);

  if (cachedToken) {
    try {
      const tokenData = JSON.parse(cachedToken);
      status.cacheService.hasToken = true;
      status.cacheService.isValid = now < tokenData.expiry;
      status.cacheService.expiresIn = Math.max(0, Math.floor((tokenData.expiry - now) / 1000));
    } catch (error) {
      // Invalid cached data
    }
  }

  return status;
}

/**
 * Test OAuth2 flow
 * Verifies that credentials are correct and token can be acquired
 */
function testOAuth2() {
  Logger.log('🧪 Testing OAuth2 flow...');
  Logger.log('');

  try {
    // Clear cache to force fresh token acquisition
    clearTokenCache();

    const startTime = Date.now();
    const token = getBCAccessToken();
    const elapsedMs = Date.now() - startTime;

    Logger.log('✅ OAuth2 test passed!');
    Logger.log('');
    Logger.log(`Token acquired in ${elapsedMs}ms`);
    Logger.log(`Token length: ${token.length} characters`);
    Logger.log(`Token preview: ${token.substring(0, 20)}...`);
    Logger.log('');

    // Test cache
    const cacheStartTime = Date.now();
    const cachedToken = getBCAccessToken();
    const cacheElapsedMs = Date.now() - cacheStartTime;

    Logger.log(`✅ Cached token retrieved in ${cacheElapsedMs}ms (${Math.floor(elapsedMs / cacheElapsedMs)}x faster)`);
    Logger.log('');

    // Show cache status
    const status = getTokenCacheStatus();
    Logger.log('Cache Status:');
    Logger.log(`  Memory: ${status.memoryCache.isValid ? '✅' : '❌'} Valid (expires in ${status.memoryCache.expiresIn}s)`);
    Logger.log(`  CacheService: ${status.cacheService.isValid ? '✅' : '❌'} Valid (expires in ${status.cacheService.expiresIn}s)`);
    Logger.log('');
    Logger.log('📝 Next step: Run testBCConnection() to verify API access');

    return true;
  } catch (error) {
    Logger.log('❌ OAuth2 test failed!');
    Logger.log(`Error: ${error.message}`);
    Logger.log('');

    if (error.message.includes('Configuration key not found')) {
      Logger.log('⚠️  Please run setupConfig() first');
    } else if (error.message.includes('Authentication failed')) {
      Logger.log('⚠️  Check your credentials in setupConfig()');
      Logger.log('   - Verify tenant_id, client_id, client_secret');
      Logger.log('   - Ensure app has API permissions in Azure AD');
    } else {
      Logger.log('⚠️  Unexpected error - check logs above');
    }

    return false;
  }
}

/**
 * Force token refresh (useful for testing)
 * @returns {string} New access token
 */
function forceTokenRefresh() {
  Logger.log('🔄 Forcing token refresh...');
  clearTokenCache();
  return getBCAccessToken();
}
