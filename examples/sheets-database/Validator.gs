/**
 * Validator.gs - Data Validation
 *
 * Validates data against schema definitions before CRUD operations.
 *
 * Features:
 * - Type validation (string, number, email, enum, timestamp, date, text)
 * - Constraint validation (required, unique, min/max, length, pattern)
 * - Enum value validation
 * - Custom error messages
 * - Support for partial validation (updates)
 */

const Validator = (function() {

  /**
   * Validate data against table schema
   *
   * @param {string} tableName - Table name from Schema
   * @param {Object} data - Data to validate
   * @param {boolean} isUpdate - If true, allows partial data (optional fields can be missing)
   * @returns {Object} Validated data with defaults applied
   * @throws {Error} If validation fails
   */
  function validate(tableName, data, isUpdate = false) {
    const schema = Schema[tableName];

    if (!schema) {
      throw new Error(`Schema not found for table: ${tableName}`);
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Data must be an object');
    }

    const validated = {};
    const errors = [];

    // Validate each field in schema
    for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
      const value = data[fieldName];
      const hasValue = value !== undefined && value !== null && value !== '';

      // Check required fields
      if (fieldSchema.required && !hasValue && !isUpdate && !fieldSchema.autoGenerate) {
        errors.push(`Field '${fieldName}' is required`);
        continue;
      }

      // Skip validation if field not provided and not required (for updates)
      if (!hasValue && isUpdate) {
        continue;
      }

      // Skip validation if field will be auto-generated
      if (!hasValue && fieldSchema.autoGenerate) {
        continue;
      }

      // Apply default value if not provided
      if (!hasValue && fieldSchema.default !== undefined) {
        validated[fieldName] = applyDefault(fieldSchema.default);
        continue;
      }

      // Validate field type and constraints
      try {
        validated[fieldName] = validateField(fieldName, value, fieldSchema);
      } catch (error) {
        errors.push(error.message);
      }
    }

    // Check for unknown fields (not in schema)
    for (const fieldName of Object.keys(data)) {
      if (!schema.fields[fieldName]) {
        errors.push(`Unknown field '${fieldName}' not in schema`);
      }
    }

    // Throw error if validation failed
    if (errors.length > 0) {
      throw new Error(`Validation failed for ${tableName}:\n  - ${errors.join('\n  - ')}`);
    }

    return validated;
  }

  /**
   * Validate individual field
   */
  function validateField(fieldName, value, fieldSchema) {
    const type = fieldSchema.type;

    // Type validation
    switch (type) {
      case 'string':
        return validateString(fieldName, value, fieldSchema);

      case 'number':
        return validateNumber(fieldName, value, fieldSchema);

      case 'email':
        return validateEmail(fieldName, value, fieldSchema);

      case 'enum':
        return validateEnum(fieldName, value, fieldSchema);

      case 'timestamp':
        return validateTimestamp(fieldName, value, fieldSchema);

      case 'date':
        return validateDate(fieldName, value, fieldSchema);

      case 'text':
        return validateText(fieldName, value, fieldSchema);

      case 'boolean':
        return validateBoolean(fieldName, value, fieldSchema);

      default:
        throw new Error(`Unknown type '${type}' for field '${fieldName}'`);
    }
  }

  /**
   * Validate string type
   */
  function validateString(fieldName, value, fieldSchema) {
    if (typeof value !== 'string') {
      throw new Error(`Field '${fieldName}' must be a string, got ${typeof value}`);
    }

    // Check length constraints
    if (fieldSchema.minLength !== undefined && value.length < fieldSchema.minLength) {
      throw new Error(`Field '${fieldName}' must be at least ${fieldSchema.minLength} characters`);
    }

    if (fieldSchema.maxLength !== undefined && value.length > fieldSchema.maxLength) {
      throw new Error(`Field '${fieldName}' must be at most ${fieldSchema.maxLength} characters`);
    }

    // Check pattern
    if (fieldSchema.pattern && !fieldSchema.pattern.test(value)) {
      throw new Error(`Field '${fieldName}' does not match required pattern`);
    }

    return value;
  }

  /**
   * Validate number type
   */
  function validateNumber(fieldName, value, fieldSchema) {
    const num = typeof value === 'number' ? value : Number(value);

    if (isNaN(num)) {
      throw new Error(`Field '${fieldName}' must be a number, got '${value}'`);
    }

    // Check min/max constraints
    if (fieldSchema.min !== undefined && num < fieldSchema.min) {
      throw new Error(`Field '${fieldName}' must be at least ${fieldSchema.min}`);
    }

    if (fieldSchema.max !== undefined && num > fieldSchema.max) {
      throw new Error(`Field '${fieldName}' must be at most ${fieldSchema.max}`);
    }

    return num;
  }

  /**
   * Validate email type
   */
  function validateEmail(fieldName, value, fieldSchema) {
    if (typeof value !== 'string') {
      throw new Error(`Field '${fieldName}' must be a string`);
    }

    // Basic email pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(value)) {
      throw new Error(`Field '${fieldName}' must be a valid email address`);
    }

    // Apply string constraints if present
    if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
      throw new Error(`Field '${fieldName}' must be at most ${fieldSchema.maxLength} characters`);
    }

    return value;
  }

  /**
   * Validate enum type
   */
  function validateEnum(fieldName, value, fieldSchema) {
    if (!fieldSchema.values || !Array.isArray(fieldSchema.values)) {
      throw new Error(`Field '${fieldName}' has invalid enum definition`);
    }

    if (!fieldSchema.values.includes(value)) {
      throw new Error(
        `Field '${fieldName}' must be one of: ${fieldSchema.values.join(', ')}. Got '${value}'`
      );
    }

    return value;
  }

  /**
   * Validate timestamp type (ISO 8601 string or Date object)
   */
  function validateTimestamp(fieldName, value, fieldSchema) {
    let date;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string') {
      date = new Date(value);
    } else {
      throw new Error(`Field '${fieldName}' must be a Date object or ISO 8601 string`);
    }

    if (isNaN(date.getTime())) {
      throw new Error(`Field '${fieldName}' has invalid date format`);
    }

    // Return as ISO string
    return date.toISOString();
  }

  /**
   * Validate date type (YYYY-MM-DD)
   */
  function validateDate(fieldName, value, fieldSchema) {
    if (typeof value !== 'string') {
      throw new Error(`Field '${fieldName}' must be a date string (YYYY-MM-DD)`);
    }

    // Check date format
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(value)) {
      throw new Error(`Field '${fieldName}' must be in format YYYY-MM-DD`);
    }

    // Validate date is valid
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error(`Field '${fieldName}' has invalid date value`);
    }

    return value;
  }

  /**
   * Validate text type (long text, similar to string but no length limit by default)
   */
  function validateText(fieldName, value, fieldSchema) {
    if (typeof value !== 'string') {
      throw new Error(`Field '${fieldName}' must be a string, got ${typeof value}`);
    }

    // Check max length if specified
    if (fieldSchema.maxLength !== undefined && value.length > fieldSchema.maxLength) {
      throw new Error(`Field '${fieldName}' must be at most ${fieldSchema.maxLength} characters`);
    }

    return value;
  }

  /**
   * Validate boolean type
   */
  function validateBoolean(fieldName, value, fieldSchema) {
    if (typeof value === 'boolean') {
      return value;
    }

    // Allow string conversions
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === '1' || lower === 'yes') {
        return true;
      }
      if (lower === 'false' || lower === '0' || lower === 'no') {
        return false;
      }
    }

    // Allow number conversions
    if (typeof value === 'number') {
      return value !== 0;
    }

    throw new Error(`Field '${fieldName}' must be a boolean value`);
  }

  /**
   * Apply default value
   */
  function applyDefault(defaultValue) {
    // Handle special defaults
    if (defaultValue === 'TODAY') {
      return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    }

    if (defaultValue === 'NOW') {
      return new Date().toISOString();
    }

    return defaultValue;
  }

  /**
   * Validate multiple records (batch validation)
   *
   * @param {string} tableName - Table name
   * @param {Array<Object>} dataArray - Array of records to validate
   * @param {boolean} isUpdate - If true, allows partial data
   * @returns {Object} Result with valid and invalid records
   */
  function validateBatch(tableName, dataArray, isUpdate = false) {
    const valid = [];
    const invalid = [];

    dataArray.forEach((data, index) => {
      try {
        const validated = validate(tableName, data, isUpdate);
        valid.push({ index, data: validated });
      } catch (error) {
        invalid.push({ index, data, error: error.message });
      }
    });

    return {
      valid,
      invalid,
      successCount: valid.length,
      errorCount: invalid.length,
      totalCount: dataArray.length
    };
  }

  /**
   * Check if field value is unique in table (called by Repository before insert/update)
   *
   * @param {string} tableName - Table name
   * @param {string} fieldName - Field name
   * @param {*} value - Value to check
   * @param {string} excludeId - Primary key value to exclude (for updates)
   * @returns {boolean} True if unique
   */
  function isUnique(tableName, fieldName, value, excludeId = null) {
    const schema = Schema[tableName];
    if (!schema) {
      throw new Error(`Schema not found for table: ${tableName}`);
    }

    const fieldSchema = schema.fields[fieldName];
    if (!fieldSchema || !fieldSchema.unique) {
      return true; // Not a unique field
    }

    // Use Repository to check
    const repo = new Repository(tableName);
    const existing = repo.findBy(fieldName, value);

    if (existing.length === 0) {
      return true; // No duplicates
    }

    // If updating, allow if only match is the record being updated
    if (excludeId && existing.length === 1) {
      const primaryKey = schema.primaryKey;
      return existing[0][primaryKey] === excludeId;
    }

    return false; // Duplicates found
  }

  // Public API
  return {
    validate,
    validateBatch,
    isUnique
  };
})();

/**
 * Test function
 */
function testValidator() {
  Logger.log('🧪 Testing Validator...');
  Logger.log('');

  // Test 1: Valid customer data
  try {
    const validData = Validator.validate('Customers', {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1-555-0100',
      credit_limit: 5000,
      status: 'active'
    });
    Logger.log('✅ Test 1 passed: Valid customer data');
    Logger.log(`   Data: ${JSON.stringify(validData)}`);
  } catch (error) {
    Logger.log(`❌ Test 1 failed: ${error.message}`);
  }

  Logger.log('');

  // Test 2: Missing required field
  try {
    Validator.validate('Customers', {
      email: 'john@example.com'
      // Missing required 'name'
    });
    Logger.log('❌ Test 2 failed: Should have thrown error for missing field');
  } catch (error) {
    Logger.log('✅ Test 2 passed: Caught missing required field');
    Logger.log(`   Error: ${error.message}`);
  }

  Logger.log('');

  // Test 3: Invalid email format
  try {
    Validator.validate('Customers', {
      name: 'John Doe',
      email: 'invalid-email',
      status: 'active'
    });
    Logger.log('❌ Test 3 failed: Should have thrown error for invalid email');
  } catch (error) {
    Logger.log('✅ Test 3 passed: Caught invalid email');
    Logger.log(`   Error: ${error.message}`);
  }

  Logger.log('');

  // Test 4: Invalid enum value
  try {
    Validator.validate('Customers', {
      name: 'John Doe',
      email: 'john@example.com',
      status: 'invalid-status'
    });
    Logger.log('❌ Test 4 failed: Should have thrown error for invalid enum');
  } catch (error) {
    Logger.log('✅ Test 4 passed: Caught invalid enum value');
    Logger.log(`   Error: ${error.message}`);
  }

  Logger.log('');

  // Test 5: Number constraints
  try {
    Validator.validate('Customers', {
      name: 'John Doe',
      email: 'john@example.com',
      status: 'active',
      credit_limit: -100 // Violates min: 0
    });
    Logger.log('❌ Test 5 failed: Should have thrown error for negative credit_limit');
  } catch (error) {
    Logger.log('✅ Test 5 passed: Caught number constraint violation');
    Logger.log(`   Error: ${error.message}`);
  }

  Logger.log('');

  // Test 6: String length constraints
  try {
    Validator.validate('Customers', {
      name: 'J', // Violates minLength: 2
      email: 'j@example.com',
      status: 'active'
    });
    Logger.log('❌ Test 6 failed: Should have thrown error for short name');
  } catch (error) {
    Logger.log('✅ Test 6 passed: Caught string length violation');
    Logger.log(`   Error: ${error.message}`);
  }

  Logger.log('');

  // Test 7: Update with partial data (should pass)
  try {
    const partialData = Validator.validate('Customers', {
      credit_limit: 10000
    }, true); // isUpdate = true
    Logger.log('✅ Test 7 passed: Partial data allowed for updates');
    Logger.log(`   Data: ${JSON.stringify(partialData)}`);
  } catch (error) {
    Logger.log(`❌ Test 7 failed: ${error.message}`);
  }

  Logger.log('');

  // Test 8: Batch validation
  const batchData = [
    { name: 'John Doe', email: 'john@example.com', status: 'active' },
    { name: 'Jane Smith', email: 'invalid-email', status: 'active' }, // Invalid
    { name: 'Bob', email: 'bob@example.com', status: 'active' }
  ];

  const batchResult = Validator.validateBatch('Customers', batchData);
  Logger.log(`✅ Test 8: Batch validation completed`);
  Logger.log(`   Valid: ${batchResult.successCount}/${batchResult.totalCount}`);
  Logger.log(`   Invalid: ${batchResult.errorCount}/${batchResult.totalCount}`);

  Logger.log('');
  Logger.log('✅ Validator tests completed!');
}
