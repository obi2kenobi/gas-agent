# 🔍 Response Parsing & Validation

**Categoria**: Integration → Response Handling
**Righe**: ~530
**Parent**: `specialists/integration-engineer.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Parsare JSON/XML responses da API
- Validare response structure e schema
- Gestire malformed o unexpected responses
- Implementare safe data access patterns
- Type coercion e data transformation
- Handle null/undefined values
- Parse error responses from APIs

---

## 📝 JSON Parsing

### Basic Parsing with Error Handling

**❌ Unsafe parsing**:
```javascript
function unsafeParse(responseText) {
  return JSON.parse(responseText); // Throws on malformed JSON
}
```

**✅ Safe parsing**:
```javascript
function safeJsonParse(responseText, defaultValue = null) {
  try {
    return JSON.parse(responseText);
  } catch (error) {
    Logger.log(`❌ JSON parse error: ${error.message}`);
    Logger.log(`Malformed JSON: ${responseText.substring(0, 100)}...`);
    return defaultValue;
  }
}

// Usage
function exampleSafeParse() {
  const response = UrlFetchApp.fetch('https://api.example.com/data');
  const data = safeJsonParse(response.getContentText(), { items: [] });

  // data is guaranteed to be object (not null)
  Logger.log(`Received ${data.items.length} items`);
}
```

---

### Nested Data Access

**Problem**: Accessing nested properties can throw errors

```javascript
// ❌ Unsafe: Throws if any level is undefined
const value = response.data.user.profile.email;
```

**✅ Safe nested access**:
```javascript
function getNestedValue(obj, path, defaultValue = null) {
  const keys = path.split('.');

  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[key];
  }

  return current !== undefined ? current : defaultValue;
}

// Usage
function exampleNestedAccess(response) {
  const email = getNestedValue(response, 'data.user.profile.email', 'no-email@example.com');
  const age = getNestedValue(response, 'data.user.age', 0);
  const tags = getNestedValue(response, 'data.tags', []);

  Logger.log(`Email: ${email}, Age: ${age}, Tags: ${tags.length}`);
}
```

---

### Complete JSON Response Handler

```javascript
function parseJsonResponse(response, options = {}) {
  const {
    expectedStatus = 200,
    schema = null,
    defaultValue = null
  } = options;

  // Check status code
  const statusCode = response.getResponseCode();
  if (statusCode !== expectedStatus) {
    throw new Error(`Unexpected status ${statusCode}, expected ${expectedStatus}`);
  }

  // Parse JSON
  const responseText = response.getContentText();
  const data = safeJsonParse(responseText, defaultValue);

  if (data === null) {
    throw new Error('Failed to parse JSON response');
  }

  // Validate schema if provided
  if (schema) {
    const validation = validateSchema(data, schema);
    if (!validation.valid) {
      throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
    }
  }

  return data;
}

// Usage
function exampleFullParsing() {
  const url = 'https://api.example.com/orders/123';
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

  const schema = {
    id: 'string',
    customer: 'string',
    total: 'number',
    items: 'array'
  };

  const order = parseJsonResponse(response, {
    expectedStatus: 200,
    schema: schema
  });

  Logger.log(`Order ${order.id}: ${order.customer} - $${order.total}`);
}
```

---

## 📊 XML Parsing

### Basic XML Parsing with XmlService

```javascript
function parseXmlResponse(responseText) {
  try {
    const document = XmlService.parse(responseText);
    const root = document.getRootElement();

    return root;

  } catch (error) {
    Logger.log(`❌ XML parse error: ${error.message}`);
    throw new Error('Failed to parse XML response');
  }
}

// Extract data from XML
function extractXmlData(xmlText) {
  const root = parseXmlResponse(xmlText);

  // Get single element value
  const status = root.getChildText('status');

  // Get multiple elements
  const items = root.getChildren('item').map(item => ({
    id: item.getChildText('id'),
    name: item.getChildText('name'),
    price: parseFloat(item.getChildText('price'))
  }));

  return {
    status: status,
    items: items
  };
}

// Usage
function exampleXmlParsing() {
  const xmlResponse = `
    <response>
      <status>success</status>
      <item>
        <id>1</id>
        <name>Product A</name>
        <price>19.99</price>
      </item>
      <item>
        <id>2</id>
        <name>Product B</name>
        <price>29.99</price>
      </item>
    </response>
  `;

  const data = extractXmlData(xmlResponse);
  Logger.log(`Status: ${data.status}, Items: ${data.items.length}`);
}
```

---

### XML with Namespaces

```javascript
function parseXmlWithNamespace(xmlText, namespace) {
  const root = parseXmlResponse(xmlText);
  const ns = XmlService.getNamespace(namespace);

  // Access elements with namespace
  const elements = root.getChildren('item', ns);

  return elements.map(elem => ({
    id: elem.getChildText('id', ns),
    value: elem.getChildText('value', ns)
  }));
}

// Usage
function exampleXmlNamespace() {
  const xmlResponse = `
    <root xmlns="http://example.com/schema">
      <item>
        <id>1</id>
        <value>Test</value>
      </item>
    </root>
  `;

  const data = parseXmlWithNamespace(xmlResponse, 'http://example.com/schema');
  Logger.log(JSON.stringify(data, null, 2));
}
```

---

## ✅ Response Schema Validation

### Simple Schema Validator

```javascript
function validateSchema(data, schema) {
  const errors = [];

  for (const [field, expectedType] of Object.entries(schema)) {
    // Check if field exists
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`);
      continue;
    }

    const value = data[field];
    const actualType = Array.isArray(value) ? 'array' : typeof value;

    // Check type
    if (actualType !== expectedType) {
      errors.push(`Field '${field}' has type '${actualType}', expected '${expectedType}'`);
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

// Usage
function exampleValidation(response) {
  const schema = {
    id: 'string',
    name: 'string',
    price: 'number',
    available: 'boolean',
    tags: 'array'
  };

  const validation = validateSchema(response, schema);

  if (!validation.valid) {
    Logger.log('❌ Validation errors:');
    validation.errors.forEach(err => Logger.log(`  - ${err}`));
    throw new Error('Schema validation failed');
  }

  Logger.log('✅ Response validated successfully');
}
```

---

### Advanced Schema Validation

```javascript
function validateAdvancedSchema(data, schema) {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Required check
    if (rules.required && (value === null || value === undefined)) {
      errors.push(`Required field '${field}' is missing`);
      continue;
    }

    // Skip validation if optional and missing
    if (!rules.required && (value === null || value === undefined)) {
      continue;
    }

    // Type check
    if (rules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rules.type) {
        errors.push(`Field '${field}' has type '${actualType}', expected '${rules.type}'`);
        continue;
      }
    }

    // Min/Max for numbers
    if (rules.type === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`Field '${field}' (${value}) is less than minimum (${rules.min})`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`Field '${field}' (${value}) exceeds maximum (${rules.max})`);
      }
    }

    // String length
    if (rules.type === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`Field '${field}' length (${value.length}) is less than minimum (${rules.minLength})`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`Field '${field}' length (${value.length}) exceeds maximum (${rules.maxLength})`);
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`Field '${field}' value '${value}' is not in allowed values: ${rules.enum.join(', ')}`);
    }

    // Pattern matching
    if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
      errors.push(`Field '${field}' does not match pattern: ${rules.pattern}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

// Usage
function exampleAdvancedValidation(data) {
  const schema = {
    id: { type: 'string', required: true, pattern: '^[A-Z]{2}-\\d{4}$' },
    email: { type: 'string', required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
    age: { type: 'number', required: false, min: 0, max: 120 },
    status: { type: 'string', required: true, enum: ['active', 'inactive', 'pending'] },
    name: { type: 'string', required: true, minLength: 2, maxLength: 100 }
  };

  const validation = validateAdvancedSchema(data, schema);

  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
  }

  return data;
}
```

---

## ⚠️ Error Response Handling

### Parse API Error Responses

```javascript
function parseErrorResponse(response) {
  const statusCode = response.getResponseCode();
  const bodyText = response.getContentText();

  // Try to parse as JSON
  const errorData = safeJsonParse(bodyText);

  if (errorData) {
    // Common error formats
    const errorMessage =
      errorData.error?.message ||
      errorData.error_description ||
      errorData.message ||
      errorData.error ||
      'Unknown error';

    const errorCode =
      errorData.error?.code ||
      errorData.error_code ||
      errorData.code ||
      statusCode;

    return {
      statusCode: statusCode,
      code: errorCode,
      message: errorMessage,
      details: errorData
    };
  }

  // Not JSON, return plain text
  return {
    statusCode: statusCode,
    code: statusCode,
    message: bodyText || 'No error message',
    details: null
  };
}

// Usage
function exampleErrorParsing(url) {
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

  if (response.getResponseCode() !== 200) {
    const error = parseErrorResponse(response);
    Logger.log(`❌ API Error ${error.code}: ${error.message}`);
    throw new Error(error.message);
  }

  return JSON.parse(response.getContentText());
}
```

---

### Provider-Specific Error Formats

**Business Central OData Error**:
```javascript
function parseBCError(response) {
  const bodyText = response.getContentText();
  const errorData = safeJsonParse(bodyText);

  if (errorData && errorData.error) {
    return {
      code: errorData.error.code || 'BC_ERROR',
      message: errorData.error.message || 'Business Central error',
      details: errorData.error.innererror || {}
    };
  }

  return { code: 'UNKNOWN', message: bodyText };
}
```

**Google API Error**:
```javascript
function parseGoogleError(response) {
  const bodyText = response.getContentText();
  const errorData = safeJsonParse(bodyText);

  if (errorData && errorData.error) {
    return {
      code: errorData.error.code || response.getResponseCode(),
      message: errorData.error.message || 'Google API error',
      status: errorData.error.status,
      details: errorData.error.details || []
    };
  }

  return { code: response.getResponseCode(), message: bodyText };
}
```

---

## 🔄 Type Coercion & Transformation

### Safe Type Conversion

```javascript
// String to Number
function toNumber(value, defaultValue = 0) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  }
  return defaultValue;
}

// To Integer
function toInteger(value, defaultValue = 0) {
  const num = toNumber(value, defaultValue);
  return Math.floor(num);
}

// String to Boolean
function toBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (lower === 'true' || lower === '1' || lower === 'yes') return true;
    if (lower === 'false' || lower === '0' || lower === 'no') return false;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return false;
}

// Usage
function exampleTypeCoercion(data) {
  const transformed = {
    price: toNumber(data.price, 0),
    quantity: toInteger(data.quantity, 1),
    available: toBoolean(data.available),
    discount: toNumber(data.discount, 0) / 100 // Convert percentage
  };

  Logger.log(JSON.stringify(transformed, null, 2));
  return transformed;
}
```

---

### Date Parsing

```javascript
function parseDate(value, defaultValue = null) {
  if (!value) return defaultValue;

  // Already a Date
  if (value instanceof Date) return value;

  // ISO 8601 string (standard)
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Unix timestamp (milliseconds)
  if (typeof value === 'number') {
    return new Date(value);
  }

  return defaultValue;
}

// Format date for API
function formatDateForAPI(date) {
  if (!(date instanceof Date)) return null;

  // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
  return date.toISOString();
}

// Usage
function exampleDateParsing(data) {
  const createdAt = parseDate(data.created_at, new Date());
  const updatedAt = parseDate(data.updated_at);

  Logger.log(`Created: ${createdAt.toLocaleString()}`);
  if (updatedAt) {
    Logger.log(`Updated: ${updatedAt.toLocaleString()}`);
  }
}
```

---

## 🛡️ Null/Undefined Handling

### Safe Property Access

```javascript
// Manual safe access
function safeGet(obj, key, defaultValue = null) {
  return obj && obj[key] !== undefined ? obj[key] : defaultValue;
}

// Chained access
function safeChain(obj, ...keys) {
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return null;
    current = current[key];
  }
  return current;
}

// Usage
function exampleSafeAccess(response) {
  // Safe single property
  const name = safeGet(response, 'name', 'Unknown');

  // Safe chained access
  const city = safeChain(response, 'address', 'city') || 'Unknown city';
  const zipCode = safeChain(response, 'address', 'postal', 'code');

  Logger.log(`${name} from ${city}${zipCode ? ' (' + zipCode + ')' : ''}`);
}
```

---

### Default Values & Fallbacks

```javascript
function normalizeResponse(data) {
  return {
    id: data.id || generateId(),
    name: data.name || 'Unnamed',
    email: data.email || null,
    phone: data.phone || null,
    address: {
      street: safeGet(data.address, 'street', ''),
      city: safeGet(data.address, 'city', ''),
      country: safeGet(data.address, 'country', 'US')
    },
    tags: Array.isArray(data.tags) ? data.tags : [],
    metadata: data.metadata || {},
    createdAt: parseDate(data.created_at, new Date()),
    updatedAt: parseDate(data.updated_at)
  };
}

function generateId() {
  return Utilities.getUuid();
}
```

---

## ✅ Response Parsing Best Practices

### Checklist

- [x] **Always use try-catch for JSON.parse()** - Handle malformed responses
- [x] **Validate response schema** - Ensure expected fields exist
- [x] **Check required fields first** - Fail fast on missing critical data
- [x] **Use safe nested access** - Prevent "cannot read property of undefined"
- [x] **Provide default values** - Fallbacks for optional fields
- [x] **Type coercion with validation** - Convert types safely
- [x] **Parse dates consistently** - Use ISO 8601 format
- [x] **Handle null/undefined** - Explicit null checks
- [x] **Log parsing errors** - Include response snippet (first 100 chars)
- [x] **Test with real API responses** - Capture edge cases
- [x] **Document expected format** - Schema documentation
- [x] **Handle provider-specific errors** - Parse error formats correctly

---

## 🔗 Related Files

- `integration/http-patterns.md` - Making HTTP requests
- `platform/error-handling.md` - Error handling strategies
- `bc/odata-patterns.md` - Business Central response formats
- `ai-integration/document-processing.md` - Processing complex documents

---

**Versione**: 1.0
**Context Size**: ~530 righe
