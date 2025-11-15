# 🛠️ Caching Strategies

**Categoria**: Platform → Performance Optimization
**Righe**: ~270
**Parent**: `specialists/platform-engineer.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Ridurre chiamate a external APIs
- Cachare token OAuth2
- Implementare multi-level caching
- Gestire cache invalidation
- Prevenire cache stampede
- Optimize performance con caching strategico

---

## 📊 CacheService vs PropertiesService

### CacheService (Volatile, Fast)

**Caratteristiche**:
- ✅ **TTL**: Max 6 ore (21600 secondi)
- ✅ **Performance**: Molto veloce (<10ms access)
- ✅ **Scope**: Script, User, Document cache
- ⚠️ **Volatile**: Può essere evicted prima del TTL
- ⚠️ **Size limit**: ~100 KB per entry

**Quando usare**:
```javascript
// API responses (short-lived)
// Computed results (expensive calculations)
// Session data (temporary)
// Rate limiting counters
```

---

### PropertiesService (Persistent, Slower)

**Caratteristiche**:
- ✅ **Persistent**: No expiration (fino a delete manuale)
- ✅ **Size**: 9 KB per property, 500 KB total
- ⚠️ **Performance**: Più lento (~50-100ms access)
- ⚠️ **Quota limits**: 50 reads, 50 writes per execution

**Quando usare**:
```javascript
// OAuth tokens (persistent)
// Configuration (permanent)
// User preferences (long-term)
// Credentials (sensitive, persistent)
```

---

### Comparison Table

| Feature | CacheService | PropertiesService |
|---------|--------------|-------------------|
| **Max TTL** | 6 hours | Infinite |
| **Performance** | Very fast | Slower |
| **Persistence** | Volatile | Persistent |
| **Use for** | API responses | OAuth tokens, config |
| **Size limit** | ~100 KB/entry | 9 KB/property |
| **Scope** | Script/User/Document | Script/User/Document |

---

## 🔑 Cache Key Design

### Good Key Patterns

**Structured, versioned, namespaced**:
```javascript
// ✅ GOOD: Structured key
const cacheKey = `bc:salesOrder:${orderId}:v1`;
//                ^^  ^^^^^^^^^^  ^^^^^^^^^  ^^
//                |   |           |          Version (for invalidation)
//                |   Entity type Resource ID
//                Namespace

// ✅ GOOD: Include relevant params
const cacheKey = `bc:orders:filter=${filter}:top=100:v1`;

// ✅ GOOD: User-specific
const cacheKey = `user:${userId}:preferences:v1`;
```

**❌ BAD: Unstructured keys**:
```javascript
// ❌ BAD: No namespace
const cacheKey = orderId;

// ❌ BAD: No version
const cacheKey = `order_${orderId}`;

// ❌ BAD: Hardcoded params (can't invalidate)
const cacheKey = 'orders';
```

---

### Key Versioning for Invalidation

**Version-based invalidation** (easiest):
```javascript
const CACHE_VERSION = {
  ORDERS: 'v2',      // Bump when schema changes
  CUSTOMERS: 'v1',
  PRODUCTS: 'v3'
};

function getCacheKey(entity, id) {
  const version = CACHE_VERSION[entity.toUpperCase()] || 'v1';
  return `bc:${entity}:${id}:${version}`;
}

// When you need to invalidate ALL orders:
// Just change CACHE_VERSION.ORDERS to 'v3'
// Old 'v2' keys are orphaned (auto-expire after TTL)
```

---

## ⏱️ TTL (Time To Live) Strategies

### TTL Guidelines

**Short TTL** (seconds to minutes):
```javascript
// Real-time data (stock prices, live scores)
const TTL_REALTIME = 30;  // 30 seconds

// User-specific data (user activity)
const TTL_USER_DATA = 300; // 5 minutes
```

**Medium TTL** (minutes to hours):
```javascript
// API responses (semi-static)
const TTL_API_RESPONSE = 1800; // 30 minutes

// Computed reports (aggregations)
const TTL_REPORTS = 3600; // 1 hour
```

**Long TTL** (hours):
```javascript
// Configuration (rarely changes)
const TTL_CONFIG = 21600; // 6 hours (max)

// Static data (product catalog)
const TTL_STATIC = 21600; // 6 hours
```

---

### TTL Configuration

```javascript
const CacheTTL = {
  // OAuth tokens (cache until expiry - 5min buffer)
  OAUTH_TOKEN: 3300,        // 55 minutes (token expires at 60)

  // BC API responses
  BC_SALES_ORDER: 1800,     // 30 minutes
  BC_CUSTOMER: 3600,        // 1 hour (changes rarely)
  BC_ITEM: 7200,            // 2 hours (very stable)

  // Computed results
  REPORT_MONTHLY: 21600,    // 6 hours
  REPORT_DAILY: 3600,       // 1 hour

  // User data
  USER_PREFERENCES: 3600,   // 1 hour
  USER_SESSION: 1800        // 30 minutes
};

// Usage
cache.put(key, value, CacheTTL.BC_SALES_ORDER);
```

---

## 🔄 Cache Invalidation Patterns

### 1. Time-Based Expiration (TTL)

**Automatic expiration**:
```javascript
const cache = CacheService.getScriptCache();
cache.put('bc:order:123', JSON.stringify(order), 1800); // Auto-expires after 30min
```

✅ **Pros**: Simple, automatic
⚠️ **Cons**: Stale data possible during TTL

---

### 2. Explicit Invalidation (Manual Clear)

**Delete specific key**:
```javascript
function invalidateOrder(orderId) {
  const cache = CacheService.getScriptCache();
  const key = `bc:order:${orderId}:v1`;
  cache.remove(key);
}

// Usage: After updating order
function updateOrder(orderId, data) {
  BCClient.updateOrder(orderId, data);
  invalidateOrder(orderId); // Clear cache
}
```

✅ **Pros**: Immediate consistency
⚠️ **Cons**: Must remember to invalidate

---

### 3. Version-Based Invalidation (Bulk Clear)

**Bump version to invalidate all**:
```javascript
// Before
const CACHE_VERSION = { ORDERS: 'v1' };
const key = `bc:order:123:v1`; // All orders use v1

// After schema change
const CACHE_VERSION = { ORDERS: 'v2' };
const key = `bc:order:123:v2`; // New version, old v1 keys ignored

// Old v1 keys auto-expire, no manual deletion needed
```

✅ **Pros**: Invalidate all entries at once
⚠️ **Cons**: Can't selectively invalidate

---

### 4. Pattern-Based Invalidation

**Remove all keys matching pattern** (workaround):
```javascript
function invalidatePattern(pattern) {
  // GAS CacheService doesn't support pattern deletion
  // Workaround: Track keys in separate cache entry

  const cache = CacheService.getScriptCache();
  const keysListKey = `_keys:${pattern}`;
  const keysList = cache.get(keysListKey);

  if (keysList) {
    const keys = JSON.parse(keysList);
    cache.removeAll(keys);
    cache.remove(keysListKey);
  }
}

// When adding to cache, also track key
function cacheWithTracking(key, value, ttl, pattern) {
  const cache = CacheService.getScriptCache();

  // Cache the value
  cache.put(key, value, ttl);

  // Track key for pattern invalidation
  const keysListKey = `_keys:${pattern}`;
  let keysList = cache.get(keysListKey);
  let keys = keysList ? JSON.parse(keysList) : [];
  keys.push(key);
  cache.put(keysListKey, JSON.stringify(keys), ttl);
}
```

---

## 🏗️ Multi-Level Caching

### Layered Cache Pattern

**Memory → CacheService → PropertiesService → Source**:

```javascript
const MultiLevelCache = (function() {

  // Layer 1: In-memory (fastest, execution-scoped)
  const memoryCache = {};

  function get(key) {
    // Layer 1: Check memory
    if (key in memoryCache) {
      return memoryCache[key];
    }

    // Layer 2: Check CacheService
    const cache = CacheService.getScriptCache();
    let value = cache.get(key);
    if (value) {
      memoryCache[key] = value; // Promote to memory
      return value;
    }

    // Layer 3: Check PropertiesService (for persistent data)
    const props = PropertiesService.getScriptProperties();
    value = props.getProperty(key);
    if (value) {
      cache.put(key, value, 3600);  // Promote to CacheService
      memoryCache[key] = value;      // Promote to memory
      return value;
    }

    // Cache miss
    return null;
  }

  function put(key, value, ttl = 3600, persistent = false) {
    // Layer 1: Always store in memory
    memoryCache[key] = value;

    // Layer 2: Always store in CacheService
    const cache = CacheService.getScriptCache();
    cache.put(key, value, ttl);

    // Layer 3: Optionally store in PropertiesService
    if (persistent) {
      const props = PropertiesService.getScriptProperties();
      props.setProperty(key, value);
    }
  }

  function remove(key) {
    delete memoryCache[key];
    CacheService.getScriptCache().remove(key);
    PropertiesService.getScriptProperties().deleteProperty(key);
  }

  return { get, put, remove };

})();

// Usage
const order = MultiLevelCache.get('bc:order:123');
if (!order) {
  const freshOrder = BCClient.getOrder(123);
  MultiLevelCache.put('bc:order:123', JSON.stringify(freshOrder), 1800);
}
```

---

## 🚫 Cache Stampede Prevention

### Problem: Thundering Herd

**Scenario**:
```
Cache expires → 100 concurrent requests → All miss cache → 100 API calls!
```

### Solution: Lock Pattern

```javascript
function getCachedWithLock(key, fetchFn, ttl = 3600) {
  const cache = CacheService.getScriptCache();

  // Try cache first
  let value = cache.get(key);
  if (value) {
    return JSON.parse(value);
  }

  // Cache miss - acquire lock
  const lock = LockService.getScriptLock();
  const lockKey = `lock:${key}`;

  try {
    // Try to acquire lock (30 second timeout)
    if (!lock.tryLock(30000)) {
      // Another execution is fetching, wait and retry cache
      Utilities.sleep(1000);
      value = cache.get(key);
      if (value) {
        return JSON.parse(value); // Another execution cached it!
      }
      // Still no cache, fetch anyway (fallback)
    }

    // Double-check cache (another execution might have filled it)
    value = cache.get(key);
    if (value) {
      return JSON.parse(value);
    }

    // Actually fetch data
    const freshData = fetchFn();

    // Cache it
    cache.put(key, JSON.stringify(freshData), ttl);

    return freshData;

  } finally {
    // Always release lock
    lock.releaseLock();
  }
}

// Usage
const orders = getCachedWithLock('bc:orders', () => {
  return BCClient.getAllOrders(); // Expensive API call
}, 1800);
```

---

## 📦 Cache-Aside Pattern

### Standard Pattern

**Check cache → Miss → Fetch → Cache → Return**:

```javascript
function getOrderCached(orderId) {
  const cache = CacheService.getScriptCache();
  const key = `bc:order:${orderId}:v1`;

  // 1. Check cache
  let order = cache.get(key);

  if (order) {
    // Cache hit
    return JSON.parse(order);
  }

  // 2. Cache miss - fetch from source
  order = BCClient.getOrder(orderId);

  // 3. Store in cache
  cache.put(key, JSON.stringify(order), CacheTTL.BC_SALES_ORDER);

  // 4. Return data
  return order;
}
```

---

### Cache-Aside with Error Handling

```javascript
function getOrderCachedSafe(orderId) {
  const cache = CacheService.getScriptCache();
  const key = `bc:order:${orderId}:v1`;

  // Check cache
  let order = cache.get(key);
  if (order) {
    return JSON.parse(order);
  }

  // Fetch from source
  try {
    order = BCClient.getOrder(orderId);

    // Cache successful fetch
    cache.put(key, JSON.stringify(order), 1800);

    return order;

  } catch (error) {
    // API failed - check if we have stale cache
    const staleKey = `${key}:stale`;
    const stale = cache.get(staleKey);

    if (stale) {
      Logger.log(`Using stale cache for ${orderId} due to API error`);
      return JSON.parse(stale);
    }

    // No stale cache, re-throw error
    throw error;
  }
}
```

---

## 🎯 Common Caching Scenarios

### Scenario 1: OAuth2 Token Caching

```javascript
function getAccessTokenCached() {
  const cache = CacheService.getScriptCache();
  const key = 'bc_access_token';

  // Check cache
  let token = cache.get(key);
  if (token) {
    return token;
  }

  // Fetch new token
  const tokenData = fetchOAuth2Token();

  // Cache with buffer (expires in 3600s, cache for 3300s = 55min)
  const ttl = tokenData.expires_in - 300; // 5 min buffer
  cache.put(key, tokenData.access_token, ttl);

  return tokenData.access_token;
}
```

---

### Scenario 2: API Response Caching

```javascript
function getAllOrdersCached(filters = {}) {
  const cache = CacheService.getScriptCache();

  // Create cache key from filters
  const filterKey = JSON.stringify(filters);
  const key = `bc:orders:${Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, filterKey)}:v1`;

  // Check cache
  let orders = cache.get(key);
  if (orders) {
    return JSON.parse(orders);
  }

  // Fetch from BC
  orders = BCClient.getOrders(filters);

  // Cache for 30 minutes
  cache.put(key, JSON.stringify(orders), 1800);

  return orders;
}
```

---

### Scenario 3: Computed Results Caching

```javascript
function getMonthlyReportCached(year, month) {
  const cache = CacheService.getScriptCache();
  const key = `report:monthly:${year}-${month}:v1`;

  // Check cache
  let report = cache.get(key);
  if (report) {
    return JSON.parse(report);
  }

  // Compute report (expensive!)
  report = computeMonthlyReport(year, month);

  // Cache for 6 hours (reports don't change often)
  cache.put(key, JSON.stringify(report), 21600);

  return report;
}
```

---

### Scenario 4: User Preferences Caching

```javascript
function getUserPreferencesCached(userId) {
  const cache = CacheService.getUserCache(); // User-specific cache
  const key = `prefs:${userId}`;

  // Check cache
  let prefs = cache.get(key);
  if (prefs) {
    return JSON.parse(prefs);
  }

  // Load from PropertiesService (persistent)
  const props = PropertiesService.getUserProperties();
  prefs = props.getProperty(`USER_PREFS_${userId}`);

  if (prefs) {
    // Cache in CacheService for faster access
    cache.put(key, prefs, 3600);
    return JSON.parse(prefs);
  }

  // Default preferences
  return { theme: 'light', notifications: true };
}
```

---

## 🛡️ Caching Best Practices

### Checklist

- [x] **Cache aggressively** - External API calls, expensive computations
- [x] **Use appropriate storage** - CacheService (volatile) vs Properties (persistent)
- [x] **Set reasonable TTLs** - Balance freshness vs performance
- [x] **Version cache keys** - Easy bulk invalidation
- [x] **Handle cache misses gracefully** - Don't crash on miss
- [x] **Prevent cache stampede** - Use locks for expensive operations
- [x] **Monitor cache hit rates** - Log misses to optimize
- [x] **Don't cache sensitive data unencrypted** - Encrypt PII before caching
- [x] **Invalidate on updates** - Clear cache when data changes
- [x] **Multi-level caching** - Memory → CacheService → Properties

---

### Anti-Patterns to Avoid

**❌ No versioning**:
```javascript
// Can't bulk invalidate!
const key = `order_${orderId}`;
```

**❌ Too long TTL**:
```javascript
// 6 hours for real-time data = stale!
cache.put('stock_price', price, 21600);
```

**❌ Too short TTL**:
```javascript
// 30s for static config = wasted performance!
cache.put('config', config, 30);
```

**❌ No lock on expensive operations**:
```javascript
// 100 concurrent cache misses = 100 API calls!
if (!cache.get(key)) {
  const data = expensiveAPICall(); // Stampede!
  cache.put(key, data);
}
```

---

## 🔗 Related Files

- `platform/performance.md` - Performance optimization strategies
- `security/oauth2-patterns.md` - Token caching patterns
- `integration/http-patterns.md` - API response caching
- `platform/error-handling.md` - Cache failure handling

---

**Versione**: 1.0
**Context Size**: ~270 righe
