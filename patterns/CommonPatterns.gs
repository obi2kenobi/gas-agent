/**
 * CommonPatterns.gs - Reusable Patterns Library
 *
 * Ready-to-use patterns for common tasks in Google Apps Script.
 * Copy any function to your project and use immediately!
 *
 * Categories:
 * 1. Configuration Management
 * 2. Logging & Debugging
 * 3. Date & Time Utilities
 * 4. String & Formatting
 * 5. Array & Object Utilities
 * 6. Sheets Operations
 * 7. Email Notifications
 * 8. Retry & Resilience
 */

/**
 * ═══════════════════════════════════════════════════════════
 * 1. CONFIGURATION MANAGEMENT
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Get configuration value with fallback
 *
 * @param {string} key - Configuration key
 * @param {*} defaultValue - Default value if not found
 * @returns {string} Configuration value
 */
function getConfig(key, defaultValue = null) {
  const props = PropertiesService.getScriptProperties();
  const value = props.getProperty(key);
  return value !== null ? value : defaultValue;
}

/**
 * Set configuration value
 *
 * @param {string} key - Configuration key
 * @param {*} value - Value to store
 */
function setConfig(key, value) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(key, String(value));
}

/**
 * Get all configuration values as object
 *
 * @returns {Object} All configuration
 */
function getAllConfig() {
  const props = PropertiesService.getScriptProperties();
  return props.getProperties();
}

/**
 * ═══════════════════════════════════════════════════════════
 * 2. LOGGING & DEBUGGING
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Enhanced logger with timestamps and levels
 *
 * @param {string} level - Log level (INFO, WARN, ERROR)
 * @param {string} message - Message to log
 * @param {Object} data - Optional data object
 */
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;

  Logger.log(logMessage);

  if (data) {
    Logger.log(JSON.stringify(data, null, 2));
  }
}

/**
 * Convenience wrappers
 */
function logInfo(message, data = null) {
  log('INFO', message, data);
}

function logWarn(message, data = null) {
  log('WARN', message, data);
}

function logError(message, data = null) {
  log('ERROR', message, data);
}

/**
 * Log execution time of a function
 *
 * @param {string} name - Function name
 * @param {Function} fn - Function to execute
 * @returns {*} Function result
 */
function logExecutionTime(name, fn) {
  const start = Date.now();

  try {
    const result = fn();
    const duration = Date.now() - start;
    logInfo(`${name} completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logError(`${name} failed after ${duration}ms`, { error: error.message });
    throw error;
  }
}

/**
 * ═══════════════════════════════════════════════════════════
 * 3. DATE & TIME UTILITIES
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Format date as YYYY-MM-DD
 *
 * @param {Date} date - Date to format
 * @returns {string} Formatted date
 */
function formatDate(date = new Date()) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-DD');
}

/**
 * Format datetime as ISO 8601
 *
 * @param {Date} date - Date to format
 * @returns {string} ISO 8601 string
 */
function formatISO(date = new Date()) {
  return date.toISOString();
}

/**
 * Parse ISO 8601 string to Date
 *
 * @param {string} isoString - ISO 8601 string
 * @returns {Date} Parsed date
 */
function parseISO(isoString) {
  return new Date(isoString);
}

/**
 * Get date range (start, end)
 *
 * @param {number} daysAgo - Days before today
 * @returns {Object} {start, end} dates
 */
function getDateRange(daysAgo) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysAgo);

  return {
    start: formatDate(start),
    end: formatDate(end)
  };
}

/**
 * Check if date is within range
 *
 * @param {Date|string} date - Date to check
 * @param {Date|string} start - Range start
 * @param {Date|string} end - Range end
 * @returns {boolean} True if in range
 */
function isDateInRange(date, start, end) {
  const d = new Date(date);
  const s = new Date(start);
  const e = new Date(end);
  return d >= s && d <= e;
}

/**
 * ═══════════════════════════════════════════════════════════
 * 4. STRING & FORMATTING
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Slugify string (make URL-safe)
 *
 * @param {string} text - Text to slugify
 * @returns {string} Slugified text
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate string with ellipsis
 *
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncate(text, maxLength = 50) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format number as currency
 *
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency symbol
 * @returns {string} Formatted currency
 */
function formatCurrency(amount, currency = '$') {
  return `${currency}${amount.toFixed(2)}`;
}

/**
 * Format number with thousand separators
 *
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * ═══════════════════════════════════════════════════════════
 * 5. ARRAY & OBJECT UTILITIES
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Chunk array into smaller arrays
 *
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array<Array>} Chunked arrays
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Remove duplicates from array
 *
 * @param {Array} array - Array with duplicates
 * @returns {Array} Unique values
 */
function unique(array) {
  return [...new Set(array)];
}

/**
 * Group array by property
 *
 * @param {Array} array - Array of objects
 * @param {string} key - Property to group by
 * @returns {Object} Grouped object
 */
function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
}

/**
 * Deep clone object
 *
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Merge objects (deep merge)
 *
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = deepClone(target);

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * ═══════════════════════════════════════════════════════════
 * 6. SHEETS OPERATIONS
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Get or create sheet
 *
 * @param {string} name - Sheet name
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} Sheet
 */
function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
    logInfo(`Created new sheet: ${name}`);
  }

  return sheet;
}

/**
 * Clear sheet data (keep header)
 *
 * @param {string} sheetName - Sheet name
 */
function clearSheetData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
}

/**
 * Write array to sheet (batch operation)
 *
 * @param {string} sheetName - Sheet name
 * @param {Array<Array>} data - 2D array data
 * @param {boolean} clearFirst - Clear existing data
 */
function writeToSheet(sheetName, data, clearFirst = false) {
  const sheet = getOrCreateSheet(sheetName);

  if (clearFirst) {
    sheet.clear();
  }

  if (data.length > 0) {
    const startRow = clearFirst ? 1 : sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, data.length, data[0].length).setValues(data);
    logInfo(`Wrote ${data.length} rows to ${sheetName}`);
  }
}

/**
 * Read sheet as array of objects
 *
 * @param {string} sheetName - Sheet name
 * @returns {Array<Object>} Array of row objects
 */
function readSheetAsObjects(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

  return data.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
}

/**
 * ═══════════════════════════════════════════════════════════
 * 7. EMAIL NOTIFICATIONS
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Send simple email notification
 *
 * @param {string} recipient - Email address
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 */
function sendEmail(recipient, subject, body) {
  try {
    GmailApp.sendEmail(recipient, subject, body);
    logInfo(`Email sent to ${recipient}: ${subject}`);
  } catch (error) {
    logError(`Failed to send email to ${recipient}`, { error: error.message });
  }
}

/**
 * Send HTML email
 *
 * @param {string} recipient - Email address
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML body
 */
function sendHTMLEmail(recipient, subject, htmlBody) {
  try {
    GmailApp.sendEmail(recipient, subject, '', {
      htmlBody: htmlBody
    });
    logInfo(`HTML email sent to ${recipient}: ${subject}`);
  } catch (error) {
    logError(`Failed to send HTML email to ${recipient}`, { error: error.message });
  }
}

/**
 * Send error notification
 *
 * @param {string} recipient - Email address
 * @param {string} functionName - Function that failed
 * @param {Error} error - Error object
 */
function sendErrorNotification(recipient, functionName, error) {
  const subject = `❌ Error in ${functionName}`;
  const body = `
Error occurred in: ${functionName}
Time: ${new Date().toISOString()}
Error: ${error.message}
Stack: ${error.stack}
  `;

  sendEmail(recipient, subject, body);
}

/**
 * ═══════════════════════════════════════════════════════════
 * 8. RETRY & RESILIENCE
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Retry function with exponential backoff
 *
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} initialDelay - Initial delay in ms
 * @returns {*} Function result
 */
function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        logWarn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, { error: error.message });
        Utilities.sleep(delay);
      }
    }
  }

  logError(`All ${maxRetries + 1} attempts failed`, { error: lastError.message });
  throw lastError;
}

/**
 * Execute with timeout
 *
 * @param {Function} fn - Function to execute
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {*} defaultValue - Default value on timeout
 * @returns {*} Function result or default
 */
function withTimeout(fn, timeoutMs, defaultValue = null) {
  const start = Date.now();

  try {
    const result = fn();
    const duration = Date.now() - start;

    if (duration > timeoutMs) {
      logWarn(`Function exceeded timeout (${timeoutMs}ms), took ${duration}ms`);
      return defaultValue;
    }

    return result;
  } catch (error) {
    logError('Function failed', { error: error.message });
    return defaultValue;
  }
}

/**
 * Safe execute (catch and log errors)
 *
 * @param {Function} fn - Function to execute
 * @param {*} defaultValue - Default value on error
 * @returns {*} Function result or default
 */
function safeExecute(fn, defaultValue = null) {
  try {
    return fn();
  } catch (error) {
    logError('Safe execute caught error', { error: error.message });
    return defaultValue;
  }
}

/**
 * ═══════════════════════════════════════════════════════════
 * EXAMPLE USAGE
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Example: Complete workflow using patterns
 */
function exampleWorkflow() {
  logInfo('Starting workflow');

  // Get configuration
  const recipientEmail = getConfig('NOTIFICATION_EMAIL', 'default@example.com');

  // Execute with retry and timing
  const result = logExecutionTime('Data Processing', () => {
    return retryWithBackoff(() => {
      // Your logic here
      const data = [
        ['Name', 'Email', 'Amount'],
        ['John Doe', 'john@example.com', 100],
        ['Jane Smith', 'jane@example.com', 200]
      ];

      // Write to sheet
      writeToSheet('Results', data, true);

      return data.length - 1; // Exclude header
    });
  });

  // Send notification
  sendEmail(
    recipientEmail,
    '✅ Workflow Complete',
    `Processed ${result} records at ${formatISO()}`
  );

  logInfo('Workflow completed', { recordCount: result });
}
