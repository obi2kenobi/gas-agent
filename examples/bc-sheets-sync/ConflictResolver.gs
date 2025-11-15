/**
 * ConflictResolver.gs
 *
 * Handles conflicts when same record is modified in both BC and Sheets
 *
 * Features:
 * - Multiple resolution strategies
 * - Conflict detection
 * - Conflict logging
 * - Manual conflict resolution
 * - Field-level conflict detection
 *
 * Strategies:
 * - BC_WINS: Business Central always wins
 * - SHEETS_WINS: Sheets always wins
 * - NEWEST_WINS: Most recent modification wins
 * - MANUAL: Flag for manual resolution
 * - MERGE: Attempt to merge non-conflicting fields
 *
 * @version 1.0
 */

const ConflictResolver = (function() {

  // Configuration
  const CONFIG = {
    defaultStrategy: 'BC_WINS',
    logConflicts: true,
    notifyOnConflict: false
  };

  /**
   * Detect conflict between Sheets record and BC record
   *
   * @param {Object} sheetsRecord - Record from Sheets
   * @param {Object} newSheetsData - New data to write to Sheets
   * @param {Object} bcRecord - Record from BC
   * @returns {Object|null} Conflict object or null
   */
  function detectConflict(sheetsRecord, newSheetsData, bcRecord) {
    // Check if Sheets record has been modified since last sync
    const sheetsModified = hasBeenModified_(sheetsRecord);
    const bcModified = hasBeenModified_(bcRecord);

    if (!sheetsModified) {
      // No conflict - Sheets hasn't been modified
      return null;
    }

    // Both have been modified - conflict exists
    const conflict = {
      id: sheetsRecord.id || bcRecord.id,
      detected: new Date().toISOString(),
      sheetsRecord,
      bcRecord,
      newSheetsData,
      fieldConflicts: detectFieldConflicts_(sheetsRecord, newSheetsData, bcRecord)
    };

    if (CONFIG.logConflicts) {
      logConflict_(conflict);
    }

    return conflict;
  }

  /**
   * Resolve conflict using specified strategy
   *
   * @param {Object} conflict - Conflict object
   * @param {Object} options - Resolution options
   * @returns {Object} Resolution result
   */
  function resolve(conflict, options = {}) {
    const {
      strategy = CONFIG.defaultStrategy,
      fieldPriorities = {}
    } = options;

    Logger.log(`🔧 Resolving conflict for record ${conflict.id} using strategy: ${strategy}`);

    let resolution;

    switch (strategy) {
      case 'BC_WINS':
        resolution = resolveBCWins_(conflict);
        break;

      case 'SHEETS_WINS':
        resolution = resolveSheetsWins_(conflict);
        break;

      case 'NEWEST_WINS':
        resolution = resolveNewestWins_(conflict);
        break;

      case 'MERGE':
        resolution = resolveMerge_(conflict, fieldPriorities);
        break;

      case 'MANUAL':
        resolution = flagForManualResolution_(conflict);
        break;

      default:
        throw new Error(`Unknown resolution strategy: ${strategy}`);
    }

    // Log resolution
    if (CONFIG.logConflicts) {
      logResolution_(conflict, resolution);
    }

    return resolution;
  }

  /**
   * BC wins - use BC data
   * @private
   */
  function resolveBCWins_(conflict) {
    return {
      strategy: 'BC_WINS',
      action: 'UPDATE',
      data: conflict.newSheetsData, // This is BC data transformed to Sheets format
      message: 'BC data takes precedence'
    };
  }

  /**
   * Sheets wins - keep Sheets data
   * @private
   */
  function resolveSheetsWins_(conflict) {
    return {
      strategy: 'SHEETS_WINS',
      action: 'SKIP',
      data: conflict.sheetsRecord,
      message: 'Sheets data takes precedence'
    };
  }

  /**
   * Newest wins - compare timestamps
   * @private
   */
  function resolveNewestWins_(conflict) {
    const sheetsTimestamp = getTimestamp_(conflict.sheetsRecord);
    const bcTimestamp = getTimestamp_(conflict.bcRecord);

    if (bcTimestamp > sheetsTimestamp) {
      return {
        strategy: 'NEWEST_WINS',
        action: 'UPDATE',
        data: conflict.newSheetsData,
        message: `BC data is newer (${bcTimestamp.toISOString()})`
      };
    } else {
      return {
        strategy: 'NEWEST_WINS',
        action: 'SKIP',
        data: conflict.sheetsRecord,
        message: `Sheets data is newer (${sheetsTimestamp.toISOString()})`
      };
    }
  }

  /**
   * Merge non-conflicting fields
   * @private
   */
  function resolveMerge_(conflict, fieldPriorities) {
    const merged = { ...conflict.sheetsRecord };

    conflict.fieldConflicts.forEach(fieldConflict => {
      const field = fieldConflict.field;
      const priority = fieldPriorities[field] || 'BC';

      if (priority === 'BC') {
        merged[field] = conflict.newSheetsData[field];
      } else {
        // Keep Sheets value
        merged[field] = conflict.sheetsRecord[field];
      }
    });

    return {
      strategy: 'MERGE',
      action: 'UPDATE',
      data: merged,
      message: `Merged ${conflict.fieldConflicts.length} conflicting fields`,
      mergedFields: conflict.fieldConflicts.map(fc => fc.field)
    };
  }

  /**
   * Flag for manual resolution
   * @private
   */
  function flagForManualResolution_(conflict) {
    // Store conflict for manual review
    storeConflictForReview_(conflict);

    return {
      strategy: 'MANUAL',
      action: 'SKIP',
      data: conflict.sheetsRecord,
      message: 'Flagged for manual resolution',
      reviewRequired: true
    };
  }

  /**
   * Detect field-level conflicts
   * @private
   */
  function detectFieldConflicts_(sheetsRecord, newSheetsData, bcRecord) {
    const conflicts = [];

    // Compare each field
    for (const field in newSheetsData) {
      if (field === 'id' || field === 'created_at') continue;

      const sheetsValue = sheetsRecord[field];
      const newValue = newSheetsData[field];

      // Check if field has changed in Sheets
      if (sheetsValue !== newValue) {
        conflicts.push({
          field,
          sheetsValue,
          bcValue: newValue,
          type: typeof sheetsValue !== typeof newValue ? 'TYPE_MISMATCH' : 'VALUE_DIFF'
        });
      }
    }

    return conflicts;
  }

  /**
   * Check if record has been modified
   * @private
   */
  function hasBeenModified_(record) {
    // Check if record has lastModifiedDateTime or updated_at field
    if (record.lastModifiedDateTime) {
      const lastModified = new Date(record.lastModifiedDateTime);
      const threshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      return lastModified > threshold;
    }

    if (record.updated_at) {
      const lastModified = new Date(record.updated_at);
      const threshold = new Date(Date.now() - 5 * 60 * 1000);
      return lastModified > threshold;
    }

    // If no timestamp, assume it's been modified (safer)
    return true;
  }

  /**
   * Get timestamp from record
   * @private
   */
  function getTimestamp_(record) {
    if (record.lastModifiedDateTime) {
      return new Date(record.lastModifiedDateTime);
    }

    if (record.updated_at) {
      return new Date(record.updated_at);
    }

    // Default to epoch if no timestamp
    return new Date(0);
  }

  /**
   * Log conflict
   * @private
   */
  function logConflict_(conflict) {
    Logger.log('\n⚠️  CONFLICT DETECTED');
    Logger.log('─'.repeat(50));
    Logger.log(`Record ID: ${conflict.id}`);
    Logger.log(`Detected: ${conflict.detected}`);
    Logger.log(`Field conflicts: ${conflict.fieldConflicts.length}`);

    conflict.fieldConflicts.forEach(fc => {
      Logger.log(`  - ${fc.field}: Sheets="${fc.sheetsValue}" vs BC="${fc.bcValue}"`);
    });

    Logger.log('─'.repeat(50));
  }

  /**
   * Log resolution
   * @private
   */
  function logResolution_(conflict, resolution) {
    Logger.log(`✅ Conflict resolved: ${resolution.strategy} - ${resolution.message}`);
  }

  /**
   * Store conflict for manual review
   * @private
   */
  function storeConflictForReview_(conflict) {
    const sheet = getConflictsSheet_();

    const row = [
      conflict.id,
      conflict.detected,
      JSON.stringify(conflict.sheetsRecord),
      JSON.stringify(conflict.bcRecord),
      conflict.fieldConflicts.length,
      'PENDING'
    ];

    sheet.appendRow(row);
  }

  /**
   * Get or create conflicts sheet
   * @private
   */
  function getConflictsSheet_() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Conflicts');

    if (!sheet) {
      sheet = ss.insertSheet('Conflicts');

      // Set up headers
      const headers = [
        'ID',
        'Detected At',
        'Sheets Data',
        'BC Data',
        'Field Conflicts',
        'Status'
      ];

      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }

    return sheet;
  }

  /**
   * Get all pending conflicts
   *
   * @returns {Array} Pending conflicts
   */
  function getPendingConflicts() {
    const sheet = getConflictsSheet_();
    const data = sheet.getDataRange().getValues();

    // Skip header
    return data.slice(1)
      .filter(row => row[5] === 'PENDING')
      .map(row => ({
        id: row[0],
        detected: row[1],
        sheetsData: JSON.parse(row[2]),
        bcData: JSON.parse(row[3]),
        fieldConflicts: row[4]
      }));
  }

  /**
   * Mark conflict as resolved
   *
   * @param {string} conflictId - Conflict ID
   */
  function markAsResolved(conflictId) {
    const sheet = getConflictsSheet_();
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === conflictId) {
        sheet.getRange(i + 1, 6).setValue('RESOLVED');
        Logger.log(`✅ Conflict ${conflictId} marked as resolved`);
        return;
      }
    }

    Logger.log(`⚠️  Conflict ${conflictId} not found`);
  }

  /**
   * Clear all resolved conflicts
   */
  function clearResolved() {
    const sheet = getConflictsSheet_();
    const data = sheet.getDataRange().getValues();

    let deletedCount = 0;

    // Delete from bottom to top to avoid index issues
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][5] === 'RESOLVED') {
        sheet.deleteRow(i + 1);
        deletedCount++;
      }
    }

    Logger.log(`🗑️  Cleared ${deletedCount} resolved conflicts`);
  }

  /**
   * Configure conflict resolver
   *
   * @param {Object} options - Configuration options
   */
  function configure(options) {
    Object.assign(CONFIG, options);
    Logger.log('✅ ConflictResolver configured');
  }

  // Public API
  return {
    detectConflict,
    resolve,
    getPendingConflicts,
    markAsResolved,
    clearResolved,
    configure
  };
})();
