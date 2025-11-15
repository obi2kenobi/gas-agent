# 🌐 HTTP Request Patterns

**Categoria**: Integration → HTTP Best Practices
**Righe**: ~580
**Parent**: `specialists/integration-engineer.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Fare HTTP requests con UrlFetchApp
- Configurare headers, body, e authentication
- Gestire status codes (2xx, 4xx, 5xx)
- Implementare timeout e retry logic
- Parallelizzare requests con fetchAll()
- Handle rate limiting client-side
- Implement request/response logging

---

## 📡 UrlFetchApp Basics

### Simple GET Request

**Minimal example**:
```javascript
function simpleGetRequest() {
  const url = 'https://api.example.com/data';

  const response = UrlFetchApp.fetch(url);
  const data = JSON.parse(response.getContentText());

  Logger.log(data);
  return data;
}
```

**❌ Problem**: No error handling, unhandled exceptions crash script

**✅ Better approach**:
```javascript
function robustGetRequest(url) {
  const options = {
    method: 'get',
    muteHttpExceptions: true, // CRITICAL: Handle errors manually
    headers: {
      'User-Agent': 'GAS-Integration/1.0',
      'Accept': 'application/json'
    }
  };

  const response = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();

  if (statusCode !== 200) {
    throw new Error(`Request failed (${statusCode}): ${response.getContentText()}`);
  }

  return JSON.parse(response.getContentText());
}
```

---

### POST Request with JSON Body

**Standard pattern**:
```javascript
function postJsonData(url, data) {
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(data),
    muteHttpExceptions: true,
    headers: {
      'User-Agent': 'GAS-Integration/1.0'
    }
  };

  const response = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();

  // Accept 200 OK or 201 Created
  if (statusCode !== 200 && statusCode !== 201) {
    throw new Error(`POST failed (${statusCode}): ${response.getContentText()}`);
  }

  return JSON.parse(response.getContentText());
}

// Usage
function example() {
  const orderData = {
    customer: 'Acme Corp',
    items: [{ sku: 'ABC123', quantity: 5 }],
    total: 250.00
  };

  const result = postJsonData('https://api.example.com/orders', orderData);
  Logger.log(`Order created: ${result.id}`);
}
```

---

### PUT and PATCH Requests

**Update existing resource**:
```javascript
// PUT: Full replacement
function updateResource(url, data) {
  const options = {
    method: 'put',
    contentType: 'application/json',
    payload: JSON.stringify(data),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);

  if (response.getResponseCode() !== 200) {
    throw new Error(`PUT failed: ${response.getContentText()}`);
  }

  return JSON.parse(response.getContentText());
}

// PATCH: Partial update
function patchResource(url, changes) {
  const options = {
    method: 'patch',
    contentType: 'application/json',
    payload: JSON.stringify(changes),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);

  if (response.getResponseCode() !== 200) {
    throw new Error(`PATCH failed: ${response.getContentText()}`);
  }

  return JSON.parse(response.getContentText());
}

// Usage
function examplePatch() {
  const url = 'https://api.example.com/orders/12345';

  // Only update status field
  const changes = { status: 'shipped' };

  const updated = patchResource(url, changes);
  Logger.log(`Order updated: ${updated.status}`);
}
```

---

### DELETE Request

```javascript
function deleteResource(url) {
  const options = {
    method: 'delete',
    muteHttpExceptions: true,
    headers: {
      'User-Agent': 'GAS-Integration/1.0'
    }
  };

  const response = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();

  // 204 No Content or 200 OK
  if (statusCode !== 200 && statusCode !== 204) {
    throw new Error(`DELETE failed (${statusCode}): ${response.getContentText()}`);
  }

  Logger.log(`Resource deleted successfully (${statusCode})`);

  // Some APIs return 204 with no content
  if (statusCode === 204) {
    return null;
  }

  return JSON.parse(response.getContentText());
}
```

---

## 🔒 Authentication Patterns

### Bearer Token (OAuth2)

**Most common for APIs**:
```javascript
function requestWithBearerToken(url, token) {
  const options = {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);

  if (response.getResponseCode() === 401) {
    throw new Error('Unauthorized: Invalid or expired token');
  }

  return JSON.parse(response.getContentText());
}

// Usage with token from PropertiesService
function exampleBearerAuth() {
  const token = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
  const url = 'https://api.example.com/data';

  return requestWithBearerToken(url, token);
}
```

---

### Basic Authentication

**Username + Password**:
```javascript
function requestWithBasicAuth(url, username, password) {
  // Encode credentials as Base64
  const credentials = Utilities.base64Encode(`${username}:${password}`);

  const options = {
    method: 'get',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);

  if (response.getResponseCode() === 401) {
    throw new Error('Authentication failed: Invalid credentials');
  }

  return JSON.parse(response.getContentText());
}

// Usage
function exampleBasicAuth() {
  const username = PropertiesService.getScriptProperties().getProperty('API_USERNAME');
  const password = PropertiesService.getScriptProperties().getProperty('API_PASSWORD');

  return requestWithBasicAuth('https://api.example.com/data', username, password);
}
```

---

### API Key Authentication

**API key in header**:
```javascript
function requestWithApiKey(url, apiKey) {
  const options = {
    method: 'get',
    headers: {
      'X-API-Key': apiKey, // Common header name
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);

  if (response.getResponseCode() === 403) {
    throw new Error('Forbidden: Invalid API key');
  }

  return JSON.parse(response.getContentText());
}

// API key in query parameter (less secure, avoid if possible)
function requestWithApiKeyQuery(baseUrl, apiKey) {
  const url = `${baseUrl}?api_key=${encodeURIComponent(apiKey)}`;

  const options = {
    method: 'get',
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);

  return JSON.parse(response.getContentText());
}
```

---

## ⚙️ Request Configuration

### Complete Options Reference

```javascript
function comprehensiveRequestExample(url, data) {
  const options = {
    // HTTP Method
    method: 'post', // 'get', 'post', 'put', 'patch', 'delete'

    // Payload (for POST/PUT/PATCH)
    payload: JSON.stringify(data),

    // Content Type
    contentType: 'application/json', // or 'application/x-www-form-urlencoded', 'multipart/form-data'

    // Headers
    headers: {
      'Authorization': 'Bearer token_here',
      'User-Agent': 'GAS-Integration/1.0',
      'Accept': 'application/json',
      'X-Custom-Header': 'value'
    },

    // Error Handling
    muteHttpExceptions: true, // ✅ ALWAYS set to true

    // Security
    validateHttpsCertificates: true, // ✅ ALWAYS true (default)

    // Redirects
    followRedirects: true, // Follow 3xx redirects (default true)

    // Escaping
    escaping: false // Don't escape URL parameters (useful for pre-encoded URLs)
  };

  const response = UrlFetchApp.fetch(url, options);

  return {
    statusCode: response.getResponseCode(),
    headers: response.getHeaders(),
    body: response.getContentText()
  };
}
```

---

## 🚦 Status Code Handling

### Comprehensive Status Code Handler

```javascript
function handleHttpResponse(response) {
  const statusCode = response.getResponseCode();
  const body = response.getContentText();

  // 2xx Success
  if (statusCode >= 200 && statusCode < 300) {
    Logger.log(`✅ Success (${statusCode})`);

    // 204 No Content
    if (statusCode === 204) {
      return null;
    }

    return JSON.parse(body);
  }

  // 3xx Redirection (shouldn't happen with followRedirects: true)
  if (statusCode >= 300 && statusCode < 400) {
    Logger.log(`↩️ Redirect (${statusCode})`);
    throw new Error(`Unexpected redirect: ${statusCode}`);
  }

  // 4xx Client Errors
  if (statusCode >= 400 && statusCode < 500) {
    Logger.log(`❌ Client error (${statusCode})`);

    switch (statusCode) {
      case 400:
        throw new Error(`Bad Request: ${body}`);
      case 401:
        throw new Error('Unauthorized: Invalid or expired credentials');
      case 403:
        throw new Error('Forbidden: Insufficient permissions');
      case 404:
        throw new Error('Not Found: Resource does not exist');
      case 409:
        throw new Error(`Conflict: ${body}`);
      case 422:
        throw new Error(`Validation Error: ${body}`);
      case 429:
        throw new Error('Rate Limit Exceeded: Too many requests');
      default:
        throw new Error(`Client Error (${statusCode}): ${body}`);
    }
  }

  // 5xx Server Errors (SHOULD RETRY)
  if (statusCode >= 500) {
    Logger.log(`⚠️ Server error (${statusCode})`);
    throw new Error(`Server Error (${statusCode}): ${body}`);
  }

  throw new Error(`Unknown status code: ${statusCode}`);
}

// Usage
function robustAPICall(url, options) {
  const response = UrlFetchApp.fetch(url, {
    ...options,
    muteHttpExceptions: true
  });

  return handleHttpResponse(response);
}
```

---

## ⏱️ Timeout Configuration

**Note**: UrlFetchApp doesn't have explicit timeout parameter, but uses default 60s timeout.

### Timeout Workaround Pattern

```javascript
function requestWithTimeout(url, options = {}, timeoutMs = 30000) {
  // Apps Script doesn't support Promise.race, so we use try-catch
  const startTime = Date.now();

  try {
    const response = UrlFetchApp.fetch(url, {
      ...options,
      muteHttpExceptions: true
    });

    const elapsed = Date.now() - startTime;

    if (elapsed > timeoutMs) {
      Logger.log(`⚠️ Request took ${elapsed}ms (exceeds ${timeoutMs}ms threshold)`);
    }

    return response;

  } catch (error) {
    const elapsed = Date.now() - startTime;

    // Check if it's a timeout error
    if (error.message.includes('timeout') || error.message.includes('timed out')) {
      throw new Error(`Request timeout after ${elapsed}ms: ${url}`);
    }

    throw error;
  }
}
```

---

## 🚀 Parallel Requests with fetchAll()

### Multiple Requests in Parallel

**UrlFetchApp.fetchAll()** - executes multiple requests concurrently

```javascript
function fetchMultipleEndpoints() {
  const requests = [
    {
      url: 'https://api.example.com/customers',
      muteHttpExceptions: true
    },
    {
      url: 'https://api.example.com/orders',
      muteHttpExceptions: true
    },
    {
      url: 'https://api.example.com/products',
      muteHttpExceptions: true
    }
  ];

  // Execute all requests in parallel
  const responses = UrlFetchApp.fetchAll(requests);

  // Process responses
  const results = responses.map((response, index) => {
    const statusCode = response.getResponseCode();

    if (statusCode !== 200) {
      Logger.log(`⚠️ Request ${index} failed (${statusCode})`);
      return null;
    }

    return JSON.parse(response.getContentText());
  });

  return {
    customers: results[0],
    orders: results[1],
    products: results[2]
  };
}
```

---

### Parallel Requests with Authentication

```javascript
function fetchAllWithAuth(endpoints, token) {
  const requests = endpoints.map(url => ({
    url: url,
    method: 'get',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  }));

  const responses = UrlFetchApp.fetchAll(requests);

  return responses.map((response, index) => {
    const statusCode = response.getResponseCode();

    if (statusCode !== 200) {
      Logger.log(`❌ Request to ${endpoints[index]} failed (${statusCode})`);
      return { success: false, url: endpoints[index], statusCode };
    }

    return {
      success: true,
      url: endpoints[index],
      data: JSON.parse(response.getContentText())
    };
  });
}

// Usage
function exampleParallelAuth() {
  const token = PropertiesService.getScriptProperties().getProperty('API_TOKEN');

  const endpoints = [
    'https://api.example.com/resource1',
    'https://api.example.com/resource2',
    'https://api.example.com/resource3'
  ];

  const results = fetchAllWithAuth(endpoints, token);

  results.forEach(result => {
    if (result.success) {
      Logger.log(`✅ ${result.url}: ${result.data.length} items`);
    } else {
      Logger.log(`❌ ${result.url}: Failed (${result.statusCode})`);
    }
  });
}
```

---

## 🔁 Retry Logic for Transient Failures

### Retry with Exponential Backoff

```javascript
function requestWithRetry(url, options = {}, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = UrlFetchApp.fetch(url, {
        ...options,
        muteHttpExceptions: true
      });

      const statusCode = response.getResponseCode();

      // Success
      if (statusCode >= 200 && statusCode < 300) {
        return JSON.parse(response.getContentText());
      }

      // Rate limit (429) - always retry
      if (statusCode === 429) {
        const retryAfter = response.getHeaders()['Retry-After'] || Math.pow(2, attempt);
        Logger.log(`⏳ Rate limited. Retrying after ${retryAfter}s...`);
        Utilities.sleep(parseInt(retryAfter) * 1000);
        continue;
      }

      // Server error (5xx) - retry
      if (statusCode >= 500) {
        Logger.log(`⚠️ Server error (${statusCode}). Retry ${attempt + 1}/${maxRetries}`);

        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          Utilities.sleep(delay);
          continue;
        }
      }

      // Client error (4xx) - don't retry
      throw new Error(`Request failed (${statusCode}): ${response.getContentText()}`);

    } catch (error) {
      // Network errors - retry
      Logger.log(`❌ Request error: ${error.message}`);

      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        Utilities.sleep(delay);
        continue;
      }

      throw error;
    }
  }

  throw new Error(`Request failed after ${maxRetries} retries`);
}
```

---

## 📊 Request/Response Logging

### Safe Logging Pattern

```javascript
function logRequest(url, options, response) {
  // Sanitize sensitive data
  const sanitizedOptions = { ...options };

  if (sanitizedOptions.headers && sanitizedOptions.headers.Authorization) {
    sanitizedOptions.headers.Authorization = '[REDACTED]';
  }

  if (sanitizedOptions.payload) {
    sanitizedOptions.payload = '[PAYLOAD OMITTED]';
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    url: url,
    method: options.method || 'GET',
    statusCode: response ? response.getResponseCode() : null,
    responseTime: null // Calculate if needed
  };

  Logger.log(JSON.stringify(logEntry, null, 2));
}

// Enhanced request with logging
function requestWithLogging(url, options = {}) {
  const startTime = Date.now();

  try {
    const response = UrlFetchApp.fetch(url, {
      ...options,
      muteHttpExceptions: true
    });

    const responseTime = Date.now() - startTime;
    const statusCode = response.getResponseCode();

    Logger.log(`✅ ${options.method || 'GET'} ${url} → ${statusCode} (${responseTime}ms)`);

    return response;

  } catch (error) {
    const responseTime = Date.now() - startTime;
    Logger.log(`❌ ${options.method || 'GET'} ${url} → ERROR (${responseTime}ms): ${error.message}`);
    throw error;
  }
}
```

---

## ✅ HTTP Best Practices Checklist

- [x] **Always set muteHttpExceptions: true** - Handle errors manually
- [x] **Validate HTTPS certificates** - Security (default: true)
- [x] **Handle all status codes** - 2xx, 4xx, 5xx with appropriate logic
- [x] **Implement retry for 429 and 5xx** - Transient failures
- [x] **Use Bearer token for OAuth2** - Secure authentication
- [x] **Never log credentials** - Redact Authorization headers
- [x] **Set User-Agent header** - API analytics and debugging
- [x] **Use fetchAll() for parallel requests** - Performance optimization
- [x] **Cache responses when appropriate** - Reduce API calls
- [x] **Respect rate limits** - Check X-RateLimit headers
- [x] **Handle 204 No Content** - Some DELETE/PUT return no body
- [x] **Validate response structure** - Check expected fields exist
- [x] **Log request metrics** - URL, method, status, response time
- [x] **Use JSON.stringify for payload** - Correct format for APIs

---

## 🔗 Related Files

- `platform/error-handling.md` - Retry logic and exponential backoff
- `platform/caching.md` - Response caching strategies
- `integration/response-parsing.md` - Parsing and validating responses
- `integration/oauth2-implementation.md` - OAuth2 token management
- `security/properties-security.md` - Secure credential storage

---

**Versione**: 1.0
**Context Size**: ~580 righe
