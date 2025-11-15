/**
 * QuotaManagement.gs - Quota Management & Rate Limiting
 *
 * Google Apps Script has strict quotas:
 * - 6 min execution time (scripts)
 * - 20,000 UrlFetch calls/day (free), 100,000 (workspace)
 * - 20,000 email recipients/day
 * - Read/write limits for Sheets API
 *
 * Strategies to stay within quotas.
 */

/**
 * Track quota usage
 */
class QuotaTracker {
  constructor() {
    this.props = PropertiesService.getScriptProperties();
    this.today = new Date().toDateString();
  }

  /**
   * Increment quota counter
   */
  increment(quotaType) {
    const key = `quota_${quotaType}_${this.today}`;
    const current = parseInt(this.props.getProperty(key) || '0');
    this.props.setProperty(key, String(current + 1));
    return current + 1;
  }

  /**
   * Get current usage
   */
  getUsage(quotaType) {
    const key = `quota_${quotaType}_${this.today}`;
    return parseInt(this.props.getProperty(key) || '0');
  }

  /**
   * Check if quota exceeded
   */
  isExceeded(quotaType, limit) {
    return this.getUsage(quotaType) >= limit;
  }

  /**
   * Get remaining quota
   */
  getRemaining(quotaType, limit) {
    return Math.max(0, limit - this.getUsage(quotaType));
  }
}

/**
 * Rate limiter with exponential backoff
 */
function rateLimitedOperation(operation, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return operation();
    } catch (error) {
      lastError = error;

      // Check if quota/rate limit error
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        Logger.log(`⚠️  Rate limit hit, waiting ${delay}ms...`);
        Utilities.sleep(delay);
      } else {
        throw error; // Not a rate limit error
      }
    }
  }

  throw new Error(`Max retries exceeded: ${lastError.message}`);
}

/**
 * Split work across multiple executions
 * Use triggers to continue processing
 */
function longRunningTask() {
  const props = PropertiesService.getScriptProperties();
  const cursor = parseInt(props.getProperty('task_cursor') || '0');
  const batchSize = 1000;

  // Process batch
  const startTime = Date.now();
  let processed = 0;

  for (let i = cursor; i < cursor + batchSize; i++) {
    // Process item
    processItem(i);
    processed++;

    // Check execution time (stay under 6 min)
    if (Date.now() - startTime > 300000) { // 5 minutes
      Logger.log(`⏱️  Time limit approaching, stopping at item ${i}`);
      props.setProperty('task_cursor', String(i + 1));

      // Schedule continuation
      ScriptApp.newTrigger('longRunningTask')
        .timeBased()
        .after(60000) // Continue in 1 minute
        .create();

      return;
    }
  }

  // Task complete
  props.deleteProperty('task_cursor');
  Logger.log(`✅ Task complete: processed ${processed} items`);
}

function processItem(index) {
  // Your processing logic
}

/**
 * Quota-aware batch processor
 */
function quotaAwareBatchProcessor() {
  const tracker = new QuotaTracker();
  const DAILY_LIMIT = 20000; // UrlFetch calls

  const items = generateItems(1000);

  items.forEach(item => {
    // Check quota
    if (tracker.isExceeded('urlfetch', DAILY_LIMIT)) {
      Logger.log('❌ Daily quota exceeded, stopping');
      return;
    }

    // Make API call
    // UrlFetchApp.fetch(item.url);
    tracker.increment('urlfetch');

    Logger.log(`✅ Processed item (${tracker.getRemaining('urlfetch', DAILY_LIMIT)} calls remaining)`);
  });
}

function generateItems(count) {
  return Array.from({ length: count }, (_, i) => ({ url: `https://api.example.com/${i}` }));
}
