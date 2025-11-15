/**
 * CacheManager.gs
 *
 * Multi-level caching system for Claude API responses
 * Dramatically reduces token usage and costs by caching responses
 *
 * Features:
 * - 3-level cache: Memory → CacheService → PropertiesService
 * - MD5 hashing for cache keys
 * - Configurable TTL per level
 * - Cache statistics (hit rate, cost savings)
 * - Automatic cache size management
 * - Cache invalidation
 *
 * Performance Impact:
 * - L1 (Memory): ~0ms access time
 * - L2 (CacheService): ~10ms access time
 * - L3 (PropertiesService): ~50ms access time
 * - API call: ~500-2000ms
 *
 * @version 1.0
 */

const CacheManager = (function() {

  // Configuration
  const CONFIG = {
    namespace: 'claude_cache',
    l1Ttl: 300,      // 5 minutes (memory cache)
    l2Ttl: 21600,    // 6 hours (CacheService)
    l3Ttl: 604800,   // 7 days (PropertiesService)
    maxL1Size: 50,   // Max items in memory
    enableStats: true
  };

  // In-memory cache (L1)
  let memoryCache = {};
  let memoryExpiry = {};
  let memoryCacheSize = 0;

  // Statistics
  let stats = {
    l1Hits: 0,
    l2Hits: 0,
    l3Hits: 0,
    misses: 0,
    totalRequests: 0,
    tokensSaved: 0,
    costSaved: 0
  };

  /**
   * Get cached response or return null
   *
   * @param {string} prompt - The prompt to look up
   * @param {string} model - Model used (for stats)
   * @returns {Object|null} Cached response or null
   */
  function get(prompt, model = 'SONNET') {
    stats.totalRequests++;

    const key = generateCacheKey_(prompt, model);

    // L1: Memory cache (fastest ~0ms)
    const l1Result = getFromL1_(key);
    if (l1Result) {
      stats.l1Hits++;
      logCacheHit_('L1', key);
      updateStats_(l1Result, model);
      return l1Result;
    }

    // L2: CacheService (~10ms)
    const l2Result = getFromL2_(key);
    if (l2Result) {
      stats.l2Hits++;
      logCacheHit_('L2', key);
      promoteToL1_(key, l2Result);
      updateStats_(l2Result, model);
      return l2Result;
    }

    // L3: PropertiesService (~50ms)
    const l3Result = getFromL3_(key);
    if (l3Result) {
      stats.l3Hits++;
      logCacheHit_('L3', key);
      promoteToL2_(key, l3Result);
      promoteToL1_(key, l3Result);
      updateStats_(l3Result, model);
      return l3Result;
    }

    // Cache miss
    stats.misses++;
    Logger.log(`❌ CACHE MISS: ${key.substring(0, 16)}...`);
    return null;
  }

  /**
   * Store response in cache (all levels)
   *
   * @param {string} prompt - The prompt
   * @param {string} model - Model used
   * @param {Object} response - Claude API response
   */
  function set(prompt, model, response) {
    const key = generateCacheKey_(prompt, model);

    // Store in all levels
    setInL1_(key, response);
    setInL2_(key, response);
    setInL3_(key, response);

    Logger.log(`✅ CACHED: ${key.substring(0, 16)}... in all levels`);
  }

  /**
   * Get from L1 (Memory)
   * @private
   */
  function getFromL1_(key) {
    const fullKey = `${CONFIG.namespace}:${key}`;

    if (memoryCache[fullKey]) {
      // Check expiry
      if (Date.now() < memoryExpiry[fullKey]) {
        return memoryCache[fullKey];
      } else {
        // Expired, clean up
        delete memoryCache[fullKey];
        delete memoryExpiry[fullKey];
        memoryCacheSize--;
      }
    }

    return null;
  }

  /**
   * Set in L1 (Memory)
   * @private
   */
  function setInL1_(key, value) {
    const fullKey = `${CONFIG.namespace}:${key}`;

    // Enforce max size
    if (memoryCacheSize >= CONFIG.maxL1Size) {
      evictOldestFromL1_();
    }

    memoryCache[fullKey] = value;
    memoryExpiry[fullKey] = Date.now() + (CONFIG.l1Ttl * 1000);
    memoryCacheSize++;
  }

  /**
   * Promote to L1
   * @private
   */
  function promoteToL1_(key, value) {
    setInL1_(key, value);
  }

  /**
   * Evict oldest entry from L1
   * @private
   */
  function evictOldestFromL1_() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const key in memoryExpiry) {
      if (memoryExpiry[key] < oldestTime) {
        oldestTime = memoryExpiry[key];
        oldestKey = key;
      }
    }

    if (oldestKey) {
      delete memoryCache[oldestKey];
      delete memoryExpiry[oldestKey];
      memoryCacheSize--;
    }
  }

  /**
   * Get from L2 (CacheService)
   * @private
   */
  function getFromL2_(key) {
    try {
      const cache = CacheService.getScriptCache();
      const fullKey = `${CONFIG.namespace}:${key}`;
      const cached = cache.get(fullKey);

      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      Logger.log(`⚠️ L2 cache error: ${error.message}`);
    }

    return null;
  }

  /**
   * Set in L2 (CacheService)
   * @private
   */
  function setInL2_(key, value) {
    try {
      const cache = CacheService.getScriptCache();
      const fullKey = `${CONFIG.namespace}:${key}`;
      cache.put(fullKey, JSON.stringify(value), CONFIG.l2Ttl);
    } catch (error) {
      Logger.log(`⚠️ L2 cache set error: ${error.message}`);
    }
  }

  /**
   * Promote to L2
   * @private
   */
  function promoteToL2_(key, value) {
    setInL2_(key, value);
  }

  /**
   * Get from L3 (PropertiesService)
   * @private
   */
  function getFromL3_(key) {
    try {
      const props = PropertiesService.getScriptProperties();
      const fullKey = `${CONFIG.namespace}:${key}`;
      const cached = props.getProperty(fullKey);

      if (cached) {
        const parsed = JSON.parse(cached);

        // Check expiry
        if (parsed.expiry && Date.now() < parsed.expiry) {
          return parsed.value;
        } else {
          // Expired, remove
          props.deleteProperty(fullKey);
        }
      }
    } catch (error) {
      Logger.log(`⚠️ L3 cache error: ${error.message}`);
    }

    return null;
  }

  /**
   * Set in L3 (PropertiesService)
   * @private
   */
  function setInL3_(key, value) {
    try {
      const props = PropertiesService.getScriptProperties();
      const fullKey = `${CONFIG.namespace}:${key}`;

      const cached = {
        value: value,
        expiry: Date.now() + (CONFIG.l3Ttl * 1000),
        created: new Date().toISOString()
      };

      // PropertiesService has 500KB limit per property
      const serialized = JSON.stringify(cached);
      if (serialized.length > 400000) { // Leave some buffer
        Logger.log('⚠️ Cache value too large for L3, skipping');
        return;
      }

      props.setProperty(fullKey, serialized);
    } catch (error) {
      Logger.log(`⚠️ L3 cache set error: ${error.message}`);
    }
  }

  /**
   * Generate cache key using MD5 hash
   * @private
   */
  function generateCacheKey_(prompt, model) {
    const text = `${model}:${prompt}`;
    return Utilities.computeDigest(
      Utilities.DigestAlgorithm.MD5,
      text,
      Utilities.Charset.UTF_8
    )
      .map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2))
      .join('');
  }

  /**
   * Log cache hit
   * @private
   */
  function logCacheHit_(level, key) {
    Logger.log(`✅ ${level} HIT: ${key.substring(0, 16)}...`);
  }

  /**
   * Update statistics
   * @private
   */
  function updateStats_(response, model) {
    if (!CONFIG.enableStats || !response.usage) return;

    const modelConfig = ClaudeClient.MODELS[model];
    if (!modelConfig) return;

    const inputTokens = response.usage.input_tokens || 0;
    const outputTokens = response.usage.output_tokens || 0;

    stats.tokensSaved += (inputTokens + outputTokens);

    const inputCost = (inputTokens / 1000000) * modelConfig.costPer1MInput;
    const outputCost = (outputTokens / 1000000) * modelConfig.costPer1MOutput;
    stats.costSaved += (inputCost + outputCost);
  }

  /**
   * Get cache statistics
   *
   * @returns {Object} Statistics object
   */
  function getStats() {
    const totalHits = stats.l1Hits + stats.l2Hits + stats.l3Hits;
    const hitRate = stats.totalRequests > 0
      ? ((totalHits / stats.totalRequests) * 100).toFixed(2)
      : 0;

    return {
      ...stats,
      totalHits,
      hitRate: `${hitRate}%`,
      l1Size: memoryCacheSize,
      costSavedFormatted: `$${stats.costSaved.toFixed(4)}`
    };
  }

  /**
   * Reset statistics
   */
  function resetStats() {
    stats = {
      l1Hits: 0,
      l2Hits: 0,
      l3Hits: 0,
      misses: 0,
      totalRequests: 0,
      tokensSaved: 0,
      costSaved: 0
    };

    Logger.log('✅ Statistics reset');
  }

  /**
   * Clear all caches
   *
   * @param {string} level - 'L1', 'L2', 'L3', or 'ALL'
   */
  function clear(level = 'ALL') {
    if (level === 'L1' || level === 'ALL') {
      memoryCache = {};
      memoryExpiry = {};
      memoryCacheSize = 0;
      Logger.log('✅ L1 cache cleared');
    }

    if (level === 'L2' || level === 'ALL') {
      try {
        const cache = CacheService.getScriptCache();
        cache.removeAll(Object.keys(cache.getAll()));
        Logger.log('✅ L2 cache cleared');
      } catch (error) {
        Logger.log(`⚠️ L2 clear error: ${error.message}`);
      }
    }

    if (level === 'L3' || level === 'ALL') {
      try {
        const props = PropertiesService.getScriptProperties();
        const allProps = props.getProperties();

        for (const key in allProps) {
          if (key.startsWith(CONFIG.namespace)) {
            props.deleteProperty(key);
          }
        }
        Logger.log('✅ L3 cache cleared');
      } catch (error) {
        Logger.log(`⚠️ L3 clear error: ${error.message}`);
      }
    }
  }

  /**
   * Print cache statistics to log
   */
  function printStats() {
    const statistics = getStats();

    Logger.log('\n📊 CACHE STATISTICS');
    Logger.log('==================');
    Logger.log(`Total Requests: ${statistics.totalRequests}`);
    Logger.log(`L1 Hits (Memory): ${statistics.l1Hits}`);
    Logger.log(`L2 Hits (CacheService): ${statistics.l2Hits}`);
    Logger.log(`L3 Hits (PropertiesService): ${statistics.l3Hits}`);
    Logger.log(`Cache Misses: ${statistics.misses}`);
    Logger.log(`Hit Rate: ${statistics.hitRate}`);
    Logger.log(`Tokens Saved: ${statistics.tokensSaved.toLocaleString()}`);
    Logger.log(`Cost Saved: ${statistics.costSavedFormatted}`);
    Logger.log(`L1 Size: ${statistics.l1Size}/${CONFIG.maxL1Size}`);
    Logger.log('==================\n');
  }

  /**
   * Configure cache settings
   *
   * @param {Object} options - Configuration options
   */
  function configure(options) {
    if (options.namespace) CONFIG.namespace = options.namespace;
    if (options.l1Ttl) CONFIG.l1Ttl = options.l1Ttl;
    if (options.l2Ttl) CONFIG.l2Ttl = options.l2Ttl;
    if (options.l3Ttl) CONFIG.l3Ttl = options.l3Ttl;
    if (options.maxL1Size) CONFIG.maxL1Size = options.maxL1Size;
    if (options.enableStats !== undefined) CONFIG.enableStats = options.enableStats;

    Logger.log('✅ Cache configuration updated');
  }

  // Public API
  return {
    get,
    set,
    getStats,
    resetStats,
    clear,
    printStats,
    configure
  };
})();
