/**
 * Scheduler.gs
 *
 * Scheduled synchronization management
 *
 * Features:
 * - Create time-based triggers
 * - Multiple sync schedules
 * - Automatic cleanup of old triggers
 * - Error recovery
 * - Schedule management UI functions
 *
 * @version 1.0
 */

const Scheduler = (function() {

  // Configuration
  const CONFIG = {
    maxConcurrentTriggers: 20,
    defaultFrequency: 'HOURLY'
  };

  /**
   * Setup scheduled sync for entity
   *
   * @param {string} entityType - Entity to sync
   * @param {string} frequency - Frequency (HOURLY, DAILY, WEEKLY)
   * @param {Object} options - Sync options
   * @returns {string} Trigger ID
   */
  function scheduleSync(entityType, frequency = 'HOURLY', options = {}) {
    Logger.log(`📅 Scheduling sync for ${entityType} (${frequency})...`);

    // Check existing triggers
    const existingTriggers = getExistingTriggers_(entityType);
    if (existingTriggers.length > 0) {
      Logger.log(`⚠️  Existing triggers found. Removing them first...`);
      existingTriggers.forEach(trigger => {
        ScriptApp.deleteTrigger(trigger);
      });
    }

    // Create new trigger
    const trigger = createTrigger_(entityType, frequency, options);

    // Store trigger info
    storeTriggerInfo_(trigger.getUniqueId(), entityType, frequency, options);

    Logger.log(`✅ Scheduled sync created: ${trigger.getUniqueId()}`);

    return trigger.getUniqueId();
  }

  /**
   * Create trigger based on frequency
   * @private
   */
  function createTrigger_(entityType, frequency, options) {
    const functionName = `syncScheduled_${entityType}`;

    // Create wrapper function dynamically (stored in global scope)
    const globalThis = this;
    globalThis[functionName] = function() {
      try {
        Logger.log(`\n⏰ Scheduled sync triggered: ${entityType}`);

        const result = SyncEngine.sync(entityType, {
          direction: options.direction || 'BC_TO_SHEETS',
          fullSync: options.fullSync || false
        });

        Logger.log(`✅ Scheduled sync completed: ${entityType}`);

        // Cleanup old change tracking data
        if (result.stats.created + result.stats.updated > 0) {
          ChangeDetector.cleanup(30);
        }

      } catch (error) {
        Logger.log(`❌ Scheduled sync failed: ${error.message}`);

        // Send alert if configured
        if (options.alertEmail) {
          sendAlert_(entityType, error, options.alertEmail);
        }
      }
    };

    // Create trigger
    let triggerBuilder = ScriptApp.newTrigger(functionName).timeBased();

    switch (frequency.toUpperCase()) {
      case 'HOURLY':
        triggerBuilder = triggerBuilder.everyHours(1);
        break;

      case 'DAILY':
        const hour = options.hour || 2; // Default 2 AM
        triggerBuilder = triggerBuilder.atHour(hour).everyDays(1);
        break;

      case 'WEEKLY':
        const day = options.dayOfWeek || ScriptApp.WeekDay.MONDAY;
        const weekHour = options.hour || 2;
        triggerBuilder = triggerBuilder.onWeekDay(day).atHour(weekHour);
        break;

      case 'EVERY_6_HOURS':
        triggerBuilder = triggerBuilder.everyHours(6);
        break;

      case 'EVERY_15_MINUTES':
        triggerBuilder = triggerBuilder.everyMinutes(15);
        break;

      default:
        throw new Error(`Unsupported frequency: ${frequency}`);
    }

    return triggerBuilder.create();
  }

  /**
   * Remove scheduled sync
   *
   * @param {string} entityType - Entity type
   */
  function removeSchedule(entityType) {
    Logger.log(`🗑️  Removing scheduled sync for ${entityType}...`);

    const triggers = getExistingTriggers_(entityType);

    triggers.forEach(trigger => {
      ScriptApp.deleteTrigger(trigger);
      removeTriggerInfo_(trigger.getUniqueId());
    });

    Logger.log(`✅ Removed ${triggers.length} triggers for ${entityType}`);
  }

  /**
   * Get existing triggers for entity
   * @private
   */
  function getExistingTriggers_(entityType) {
    const allTriggers = ScriptApp.getProjectTriggers();
    const functionName = `syncScheduled_${entityType}`;

    return allTriggers.filter(trigger =>
      trigger.getHandlerFunction() === functionName
    );
  }

  /**
   * Get all scheduled syncs
   *
   * @returns {Array} Scheduled syncs
   */
  function getAllSchedules() {
    const props = PropertiesService.getScriptProperties();
    const schedulesData = props.getProperty('sync_schedules');

    if (!schedulesData) {
      return [];
    }

    try {
      const schedules = JSON.parse(schedulesData);
      return Object.values(schedules);
    } catch (error) {
      Logger.log(`⚠️  Failed to parse schedules: ${error.message}`);
      return [];
    }
  }

  /**
   * Get schedule info for entity
   *
   * @param {string} entityType - Entity type
   * @returns {Object|null} Schedule info
   */
  function getSchedule(entityType) {
    const schedules = getAllSchedules();
    return schedules.find(s => s.entityType === entityType) || null;
  }

  /**
   * Store trigger info
   * @private
   */
  function storeTriggerInfo_(triggerId, entityType, frequency, options) {
    const props = PropertiesService.getScriptProperties();
    const schedulesData = props.getProperty('sync_schedules') || '{}';

    let schedules;
    try {
      schedules = JSON.parse(schedulesData);
    } catch (error) {
      schedules = {};
    }

    schedules[triggerId] = {
      triggerId,
      entityType,
      frequency,
      options,
      created: new Date().toISOString()
    };

    props.setProperty('sync_schedules', JSON.stringify(schedules));
  }

  /**
   * Remove trigger info
   * @private
   */
  function removeTriggerInfo_(triggerId) {
    const props = PropertiesService.getScriptProperties();
    const schedulesData = props.getProperty('sync_schedules') || '{}';

    let schedules;
    try {
      schedules = JSON.parse(schedulesData);
      delete schedules[triggerId];
      props.setProperty('sync_schedules', JSON.stringify(schedules));
    } catch (error) {
      Logger.log(`⚠️  Failed to remove trigger info: ${error.message}`);
    }
  }

  /**
   * Send alert email
   * @private
   */
  function sendAlert_(entityType, error, email) {
    const subject = `⚠️  Sync Failed: ${entityType}`;
    const body = `
Scheduled sync failed for ${entityType}

Error: ${error.message}

Time: ${new Date().toISOString()}

Stack Trace:
${error.stack}

Please check the logs for more details.
    `.trim();

    try {
      MailApp.sendEmail(email, subject, body);
      Logger.log(`📧 Alert email sent to ${email}`);
    } catch (mailError) {
      Logger.log(`❌ Failed to send alert email: ${mailError.message}`);
    }
  }

  /**
   * Cleanup orphaned triggers
   * (triggers without stored info or for deleted entities)
   */
  function cleanupOrphanedTriggers() {
    Logger.log('🧹 Cleaning up orphaned triggers...');

    const allTriggers = ScriptApp.getProjectTriggers();
    const schedules = getAllSchedules();
    const validTriggerIds = schedules.map(s => s.triggerId);

    let removed = 0;

    allTriggers.forEach(trigger => {
      const triggerId = trigger.getUniqueId();
      const functionName = trigger.getHandlerFunction();

      // Check if it's a sync trigger
      if (functionName.startsWith('syncScheduled_')) {
        if (!validTriggerIds.includes(triggerId)) {
          ScriptApp.deleteTrigger(trigger);
          removed++;
          Logger.log(`   Removed orphaned trigger: ${functionName}`);
        }
      }
    });

    Logger.log(`✅ Cleanup complete. Removed ${removed} orphaned triggers.`);
  }

  /**
   * Get trigger execution history (from Apps Script quota)
   *
   * @returns {Array} Execution history
   */
  function getExecutionHistory() {
    // Note: This is limited information from ScriptApp
    // For detailed history, you'd need to track it manually

    const recentExecutions = [];
    const entities = ['customers', 'orders', 'items'];

    entities.forEach(entityType => {
      const lastSync = ChangeDetector.getLastSyncTime(entityType, 'BC_TO_SHEETS');
      if (lastSync) {
        recentExecutions.push({
          entityType,
          lastExecution: lastSync.toISOString(),
          status: 'completed' // Simplified - you'd need to track failures
        });
      }
    });

    return recentExecutions;
  }

  /**
   * Display schedule management UI (for manual trigger from menu)
   */
  function showScheduleManager() {
    const html = createScheduleManagerHTML_();
    const htmlOutput = HtmlService.createHtmlOutput(html)
      .setTitle('Sync Schedule Manager')
      .setWidth(400);

    SpreadsheetApp.getUi().showSidebar(htmlOutput);
  }

  /**
   * Create schedule manager HTML
   * @private
   */
  function createScheduleManagerHTML_() {
    const schedules = getAllSchedules();

    let schedulesHTML = '';
    if (schedules.length === 0) {
      schedulesHTML = '<p>No scheduled syncs configured.</p>';
    } else {
      schedulesHTML = '<ul>';
      schedules.forEach(schedule => {
        schedulesHTML += `
          <li>
            <strong>${schedule.entityType}</strong> - ${schedule.frequency}
            <br>
            <small>Created: ${schedule.created}</small>
          </li>
        `;
      });
      schedulesHTML += '</ul>';
    }

    return `
<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <style>
      body { font-family: Arial, sans-serif; padding: 10px; }
      h2 { color: #1a73e8; }
      button {
        background: #1a73e8;
        color: white;
        border: none;
        padding: 10px 20px;
        cursor: pointer;
        border-radius: 4px;
        margin: 5px 0;
      }
      button:hover { background: #1557b0; }
      ul { list-style: none; padding: 0; }
      li {
        background: #f5f5f5;
        padding: 10px;
        margin: 5px 0;
        border-radius: 4px;
      }
    </style>
  </head>
  <body>
    <h2>Sync Schedules</h2>
    ${schedulesHTML}

    <h3>Quick Actions</h3>
    <button onclick="runNow('customers')">Sync Customers Now</button><br>
    <button onclick="runNow('orders')">Sync Orders Now</button><br>
    <button onclick="runNow('items')">Sync Items Now</button><br>

    <script>
      function runNow(entityType) {
        google.script.run
          .withSuccessHandler(() => alert('Sync started for ' + entityType))
          .withFailureHandler((error) => alert('Error: ' + error.message))
          .syncManual(entityType);
      }
    </script>
  </body>
</html>
    `;
  }

  /**
   * Manual sync function (called from UI)
   *
   * @param {string} entityType - Entity to sync
   */
  function syncManual(entityType) {
    Logger.log(`🖱️  Manual sync triggered: ${entityType}`);

    return SyncEngine.sync(entityType, {
      direction: 'BC_TO_SHEETS',
      fullSync: false
    });
  }

  // Public API
  return {
    scheduleSync,
    removeSchedule,
    getAllSchedules,
    getSchedule,
    cleanupOrphanedTriggers,
    getExecutionHistory,
    showScheduleManager,
    syncManual
  };
})();
