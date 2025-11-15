/**
 * ChangeDetector.gs
 *
 * Tracks changes for incremental synchronization
 *
 * Features:
 * - Track last sync times
 * - Detect modified records
 * - Change history logging
 * - Cleanup old tracking data
 *
 * @version 1.0
 */

const ChangeDetector = (function() {

  // Storage keys
  const STORAGE_PREFIX = 'sync_tracking_';
  const LAST_SYNC_KEY = 'last_sync_time';
  const CHANGE_LOG_KEY = 'change_log';

  /**
   * Get last sync time for entity and direction
   *
   * @param {string} entityType - Entity type
   * @param {string} direction - Sync direction
   * @returns {Date|null} Last sync time or null
   */
  function getLastSyncTime(entityType, direction) {
    const key = `${STORAGE_PREFIX}${entityType}_${direction}_${LAST_SYNC_KEY}`;
    const props = PropertiesService.getScriptProperties();
    const timestamp = props.getProperty(key);

    if (timestamp) {
      return new Date(timestamp);
    }

    return null;
  }

  /**
   * Update last sync time
   *
   * @param {string} entityType - Entity type
   * @param {string} direction - Sync direction
   */
  function updateLastSyncTime(entityType, direction) {
    const key = `${STORAGE_PREFIX}${entityType}_${direction}_${LAST_SYNC_KEY}`;
    const props = PropertiesService.getScriptProperties();
    const now = new Date().toISOString();

    props.setProperty(key, now);

    Logger.log(`📅 Updated last sync time for ${entityType} (${direction}): ${now}`);
  }

  /**
   * Track a change
   *
   * @param {string} entityType - Entity type
   * @param {string} recordId - Record ID
   * @param {string} direction - Sync direction
   * @param {Object} data - Record data
   */
  function trackChange(entityType, recordId, direction, data) {
    const change = {
      entityType,
      recordId,
      direction,
      timestamp: new Date().toISOString(),
      checksum: calculateChecksum_(data)
    };

    // Store in change log
    const changeLog = getChangeLog_(entityType);
    changeLog.push(change);

    // Keep only last 1000 changes
    if (changeLog.length > 1000) {
      changeLog.shift();
    }

    saveChangeLog_(entityType, changeLog);
  }

  /**
   * Get modified records since timestamp
   *
   * @param {string} entityType - Entity type
   * @param {Date} since - Timestamp
   * @returns {Array} Modified records
   */
  function getModifiedRecords(entityType, since) {
    const changeLog = getChangeLog_(entityType);

    if (!since) {
      // No previous sync - return all
      const repository = getRepository_(entityType);
      return repository ? repository.findAll() : [];
    }

    // Filter changes since timestamp
    const modifiedIds = changeLog
      .filter(change => {
        const changeTime = new Date(change.timestamp);
        return changeTime > since && change.entityType === entityType;
      })
      .map(change => change.recordId);

    // Remove duplicates
    const uniqueIds = [...new Set(modifiedIds)];

    // Fetch records
    const repository = getRepository_(entityType);
    if (!repository) return [];

    return uniqueIds
      .map(id => repository.findById(id))
      .filter(record => record !== null);
  }

  /**
   * Detect if record has changed
   *
   * @param {string} entityType - Entity type
   * @param {string} recordId - Record ID
   * @param {Object} newData - New data
   * @returns {boolean} True if changed
   */
  function hasChanged(entityType, recordId, newData) {
    const changeLog = getChangeLog_(entityType);
    const newChecksum = calculateChecksum_(newData);

    // Find last change for this record
    const lastChange = changeLog
      .filter(c => c.entityType === entityType && c.recordId === recordId)
      .pop();

    if (!lastChange) {
      return true; // No previous record - consider it changed
    }

    return lastChange.checksum !== newChecksum;
  }

  /**
   * Get change history for record
   *
   * @param {string} entityType - Entity type
   * @param {string} recordId - Record ID
   * @returns {Array} Change history
   */
  function getChangeHistory(entityType, recordId) {
    const changeLog = getChangeLog_(entityType);

    return changeLog.filter(change =>
      change.entityType === entityType && change.recordId === recordId
    );
  }

  /**
   * Clear change tracking for entity
   *
   * @param {string} entityType - Entity type
   */
  function clearTracking(entityType) {
    const props = PropertiesService.getScriptProperties();

    // Clear last sync times
    const directions = ['BC_TO_SHEETS', 'SHEETS_TO_BC', 'BIDIRECTIONAL'];
    directions.forEach(direction => {
      const key = `${STORAGE_PREFIX}${entityType}_${direction}_${LAST_SYNC_KEY}`;
      props.deleteProperty(key);
    });

    // Clear change log
    const logKey = `${STORAGE_PREFIX}${entityType}_${CHANGE_LOG_KEY}`;
    props.deleteProperty(logKey);

    Logger.log(`🗑️  Cleared change tracking for ${entityType}`);
  }

  /**
   * Cleanup old tracking data
   *
   * @param {number} daysToKeep - Days to keep (default 30)
   */
  function cleanup(daysToKeep = 30) {
    Logger.log(`🧹 Cleaning up tracking data older than ${daysToKeep} days...`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const entities = ['customers', 'orders', 'items'];
    let totalRemoved = 0;

    entities.forEach(entityType => {
      const changeLog = getChangeLog_(entityType);
      const originalLength = changeLog.length;

      // Filter out old changes
      const filtered = changeLog.filter(change => {
        const changeDate = new Date(change.timestamp);
        return changeDate > cutoffDate;
      });

      const removed = originalLength - filtered.length;
      if (removed > 0) {
        saveChangeLog_(entityType, filtered);
        totalRemoved += removed;
        Logger.log(`   Removed ${removed} old changes for ${entityType}`);
      }
    });

    Logger.log(`✅ Cleanup complete. Removed ${totalRemoved} old changes.`);
  }

  /**
   * Get sync statistics
   *
   * @param {string} entityType - Entity type
   * @returns {Object} Statistics
   */
  function getStats(entityType) {
    const changeLog = getChangeLog_(entityType);

    const stats = {
      entityType,
      totalChanges: changeLog.length,
      lastSync: {},
      recentChanges: {
        last24h: 0,
        last7days: 0,
        last30days: 0
      }
    };

    // Get last sync times
    const directions = ['BC_TO_SHEETS', 'SHEETS_TO_BC'];
    directions.forEach(direction => {
      stats.lastSync[direction] = getLastSyncTime(entityType, direction);
    });

    // Count recent changes
    const now = new Date();
    const day = 24 * 60 * 60 * 1000;

    changeLog.forEach(change => {
      const changeTime = new Date(change.timestamp);
      const age = now - changeTime;

      if (age < day) stats.recentChanges.last24h++;
      if (age < 7 * day) stats.recentChanges.last7days++;
      if (age < 30 * day) stats.recentChanges.last30days++;
    });

    return stats;
  }

  /**
   * Get change log from storage
   * @private
   */
  function getChangeLog_(entityType) {
    const key = `${STORAGE_PREFIX}${entityType}_${CHANGE_LOG_KEY}`;
    const props = PropertiesService.getScriptProperties();
    const data = props.getProperty(key);

    if (data) {
      try {
        return JSON.parse(data);
      } catch (error) {
        Logger.log(`⚠️  Failed to parse change log: ${error.message}`);
        return [];
      }
    }

    return [];
  }

  /**
   * Save change log to storage
   * @private
   */
  function saveChangeLog_(entityType, changeLog) {
    const key = `${STORAGE_PREFIX}${entityType}_${CHANGE_LOG_KEY}`;
    const props = PropertiesService.getScriptProperties();

    try {
      const data = JSON.stringify(changeLog);

      // Check size limit (PropertiesService: 500KB per property)
      if (data.length > 400000) {
        // Too large - keep only recent 500 changes
        const trimmed = changeLog.slice(-500);
        props.setProperty(key, JSON.stringify(trimmed));
        Logger.log(`⚠️  Change log trimmed to 500 entries due to size`);
      } else {
        props.setProperty(key, data);
      }
    } catch (error) {
      Logger.log(`❌ Failed to save change log: ${error.message}`);
    }
  }

  /**
   * Calculate checksum for data
   * @private
   */
  function calculateChecksum_(data) {
    const str = JSON.stringify(data);
    return Utilities.computeDigest(
      Utilities.DigestAlgorithm.MD5,
      str,
      Utilities.Charset.UTF_8
    )
      .map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2))
      .join('');
  }

  /**
   * Get repository for entity type
   * @private
   */
  function getRepository_(entityType) {
    switch (entityType) {
      case 'customers':
        return typeof CustomerRepository !== 'undefined' ? new CustomerRepository() : null;
      case 'orders':
        return typeof OrderRepository !== 'undefined' ? new OrderRepository() : null;
      case 'items':
        return typeof ItemRepository !== 'undefined' ? new ItemRepository() : null;
      default:
        return null;
    }
  }

  // Public API
  return {
    getLastSyncTime,
    updateLastSyncTime,
    trackChange,
    getModifiedRecords,
    hasChanged,
    getChangeHistory,
    clearTracking,
    cleanup,
    getStats
  };
})();
