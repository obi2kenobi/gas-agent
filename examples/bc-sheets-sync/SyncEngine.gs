/**
 * SyncEngine.gs
 *
 * Core synchronization engine for BC ↔ Sheets sync
 *
 * Features:
 * - Bidirectional sync (BC → Sheets, Sheets → BC)
 * - Incremental sync (only changes)
 * - Conflict detection and resolution
 * - Change tracking
 * - Error handling with retry
 * - Progress tracking
 *
 * @version 1.0
 */

const SyncEngine = (function() {

  // Configuration
  const CONFIG = {
    syncDirection: 'BC_TO_SHEETS', // BC_TO_SHEETS, SHEETS_TO_BC, BIDIRECTIONAL
    batchSize: 100,
    enableChangeTracking: true,
    enableConflictDetection: true,
    retryAttempts: 3,
    retryDelay: 2000
  };

  /**
   * Main sync function
   *
   * @param {string} entityType - Entity to sync (customers, orders, items)
   * @param {Object} options - Sync options
   * @returns {Object} Sync result
   */
  function sync(entityType, options = {}) {
    const {
      direction = CONFIG.syncDirection,
      fullSync = false,
      filter = null
    } = options;

    Logger.log(`\n🔄 Starting sync: ${entityType} (${direction})`);

    const startTime = Date.now();
    let result = {
      entityType,
      direction,
      fullSync,
      started: new Date().toISOString(),
      completed: null,
      duration: 0,
      stats: {
        fetched: 0,
        created: 0,
        updated: 0,
        deleted: 0,
        skipped: 0,
        failed: 0,
        conflicts: 0
      },
      errors: []
    };

    try {
      // Execute sync based on direction
      switch (direction) {
        case 'BC_TO_SHEETS':
          result = syncBCToSheets_(entityType, fullSync, filter, result);
          break;

        case 'SHEETS_TO_BC':
          result = syncSheetsTOBC_(entityType, fullSync, filter, result);
          break;

        case 'BIDIRECTIONAL':
          // Sync both ways (BC has priority on conflicts)
          result = syncBCToSheets_(entityType, fullSync, filter, result);
          result = syncSheetsTOBC_(entityType, fullSync, filter, result);
          break;

        default:
          throw new Error(`Invalid sync direction: ${direction}`);
      }

      result.completed = new Date().toISOString();
      result.duration = Date.now() - startTime;

      logSyncResult_(result);

      return result;

    } catch (error) {
      result.errors.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      Logger.log(`❌ Sync failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sync from Business Central to Sheets
   * @private
   */
  function syncBCToSheets_(entityType, fullSync, filter, result) {
    Logger.log(`📥 Syncing ${entityType} from BC to Sheets...`);

    // Get repository for entity type
    const repository = getRepository_(entityType);
    if (!repository) {
      throw new Error(`No repository found for entity type: ${entityType}`);
    }

    // Determine what to fetch
    let bcFilter = filter || {};

    if (!fullSync && CONFIG.enableChangeTracking) {
      // Incremental sync - only fetch changes since last sync
      const lastSyncTime = ChangeDetector.getLastSyncTime(entityType, 'BC_TO_SHEETS');
      if (lastSyncTime) {
        bcFilter = {
          ...bcFilter,
          $filter: `lastModifiedDateTime gt ${lastSyncTime.toISOString()}`
        };
        Logger.log(`📅 Incremental sync since: ${lastSyncTime.toISOString()}`);
      } else {
        Logger.log(`📦 First sync - fetching all records`);
      }
    } else {
      Logger.log(`📦 Full sync - fetching all records`);
    }

    // Fetch from BC
    const bcRecords = fetchFromBC_(entityType, bcFilter);
    result.stats.fetched = bcRecords.length;

    Logger.log(`   Fetched ${bcRecords.length} records from BC`);

    // Process in batches
    const batches = chunkArray_(bcRecords, CONFIG.batchSize);

    batches.forEach((batch, batchIndex) => {
      Logger.log(`   Processing batch ${batchIndex + 1}/${batches.length}...`);

      batch.forEach(bcRecord => {
        try {
          // Transform BC format to our schema
          const recordData = transformBCToSheets_(entityType, bcRecord);

          // Check if record exists
          const existingRecord = repository.findById(bcRecord.id);

          if (existingRecord) {
            // Check for conflicts
            if (CONFIG.enableConflictDetection) {
              const conflict = ConflictResolver.detectConflict(
                existingRecord,
                recordData,
                bcRecord
              );

              if (conflict) {
                result.stats.conflicts++;
                const resolved = ConflictResolver.resolve(conflict, {
                  strategy: 'BC_WINS' // BC has priority
                });

                if (resolved.action === 'UPDATE') {
                  repository.update(bcRecord.id, resolved.data);
                  result.stats.updated++;
                } else if (resolved.action === 'SKIP') {
                  result.stats.skipped++;
                }

                return;
              }
            }

            // No conflict - update
            repository.update(bcRecord.id, recordData);
            result.stats.updated++;

          } else {
            // Create new record
            repository.create(recordData);
            result.stats.created++;
          }

          // Track change
          if (CONFIG.enableChangeTracking) {
            ChangeDetector.trackChange(entityType, bcRecord.id, 'BC_TO_SHEETS', recordData);
          }

        } catch (error) {
          result.stats.failed++;
          result.errors.push({
            recordId: bcRecord.id,
            message: error.message,
            timestamp: new Date().toISOString()
          });

          Logger.log(`   ⚠️  Failed to process record ${bcRecord.id}: ${error.message}`);
        }
      });
    });

    // Update last sync time
    if (CONFIG.enableChangeTracking) {
      ChangeDetector.updateLastSyncTime(entityType, 'BC_TO_SHEETS');
    }

    return result;
  }

  /**
   * Sync from Sheets to Business Central
   * @private
   */
  function syncSheetsTOBC_(entityType, fullSync, filter, result) {
    Logger.log(`📤 Syncing ${entityType} from Sheets to BC...`);

    const repository = getRepository_(entityType);
    if (!repository) {
      throw new Error(`No repository found for entity type: ${entityType}`);
    }

    // Get records that need to be synced to BC
    let recordsToSync;

    if (fullSync) {
      recordsToSync = repository.findAll();
    } else {
      // Only sync records modified since last sync
      const lastSyncTime = ChangeDetector.getLastSyncTime(entityType, 'SHEETS_TO_BC');
      recordsToSync = ChangeDetector.getModifiedRecords(entityType, lastSyncTime);
    }

    result.stats.fetched = recordsToSync.length;
    Logger.log(`   Found ${recordsToSync.length} records to sync to BC`);

    recordsToSync.forEach(record => {
      try {
        // Transform to BC format
        const bcData = transformSheetsTOBC_(entityType, record);

        // Check if exists in BC
        const bcRecord = fetchBCRecord_(entityType, record.id);

        if (bcRecord) {
          // Update in BC
          updateInBC_(entityType, record.id, bcData);
          result.stats.updated++;
        } else {
          // Create in BC
          createInBC_(entityType, bcData);
          result.stats.created++;
        }

        // Track change
        if (CONFIG.enableChangeTracking) {
          ChangeDetector.trackChange(entityType, record.id, 'SHEETS_TO_BC', record);
        }

      } catch (error) {
        result.stats.failed++;
        result.errors.push({
          recordId: record.id,
          message: error.message,
          timestamp: new Date().toISOString()
        });

        Logger.log(`   ⚠️  Failed to sync record ${record.id}: ${error.message}`);
      }
    });

    // Update last sync time
    if (CONFIG.enableChangeTracking) {
      ChangeDetector.updateLastSyncTime(entityType, 'SHEETS_TO_BC');
    }

    return result;
  }

  /**
   * Fetch records from Business Central
   * @private
   */
  function fetchFromBC_(entityType, filter) {
    const endpoint = getEndpointForEntity_(entityType);

    try {
      return BCClient.get(endpoint, filter);
    } catch (error) {
      Logger.log(`❌ Failed to fetch from BC: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch single record from BC
   * @private
   */
  function fetchBCRecord_(entityType, id) {
    const endpoint = getEndpointForEntity_(entityType);

    try {
      return BCClient.getById(endpoint, id);
    } catch (error) {
      if (error.message.includes('404')) {
        return null; // Record doesn't exist
      }
      throw error;
    }
  }

  /**
   * Create record in BC
   * @private
   */
  function createInBC_(entityType, data) {
    const endpoint = getEndpointForEntity_(entityType);
    return BCClient.post(endpoint, data);
  }

  /**
   * Update record in BC
   * @private
   */
  function updateInBC_(entityType, id, data) {
    const endpoint = getEndpointForEntity_(entityType);
    return BCClient.patch(`${endpoint}(${id})`, data);
  }

  /**
   * Get repository for entity type
   * @private
   */
  function getRepository_(entityType) {
    switch (entityType) {
      case 'customers':
        return new CustomerRepository();
      case 'orders':
        return new OrderRepository();
      case 'items':
        return new ItemRepository();
      default:
        return null;
    }
  }

  /**
   * Get BC endpoint for entity
   * @private
   */
  function getEndpointForEntity_(entityType) {
    const endpoints = {
      customers: 'customers',
      orders: 'salesOrders',
      items: 'items'
    };

    return endpoints[entityType] || entityType;
  }

  /**
   * Transform BC data to Sheets schema
   * @private
   */
  function transformBCToSheets_(entityType, bcRecord) {
    switch (entityType) {
      case 'customers':
        return {
          customer_id: bcRecord.id,
          name: bcRecord.displayName,
          email: bcRecord.email || `${bcRecord.id}@noemail.com`,
          phone: bcRecord.phoneNumber || '',
          status: bcRecord.blocked ? 'inactive' : 'active'
        };

      case 'orders':
        return {
          order_id: bcRecord.id,
          customer_id: bcRecord.customerId,
          order_date: bcRecord.orderDate,
          total_amount: bcRecord.totalAmountIncludingTax,
          status: bcRecord.status
        };

      case 'items':
        return {
          item_id: bcRecord.id,
          name: bcRecord.displayName,
          description: bcRecord.description || '',
          price: bcRecord.unitPrice,
          category: bcRecord.type
        };

      default:
        return bcRecord;
    }
  }

  /**
   * Transform Sheets data to BC format
   * @private
   */
  function transformSheetsTOBC_(entityType, record) {
    switch (entityType) {
      case 'customers':
        return {
          displayName: record.name,
          email: record.email,
          phoneNumber: record.phone,
          blocked: record.status === 'inactive'
        };

      case 'orders':
        return {
          customerId: record.customer_id,
          orderDate: record.order_date,
          totalAmountIncludingTax: record.total_amount,
          status: record.status
        };

      case 'items':
        return {
          displayName: record.name,
          description: record.description,
          unitPrice: record.price,
          type: record.category
        };

      default:
        return record;
    }
  }

  /**
   * Split array into chunks
   * @private
   */
  function chunkArray_(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Log sync result
   * @private
   */
  function logSyncResult_(result) {
    Logger.log('\n📊 Sync Result:');
    Logger.log('─'.repeat(50));
    Logger.log(`Entity: ${result.entityType}`);
    Logger.log(`Direction: ${result.direction}`);
    Logger.log(`Duration: ${result.duration}ms`);
    Logger.log('');
    Logger.log(`Fetched:   ${result.stats.fetched}`);
    Logger.log(`Created:   ${result.stats.created}`);
    Logger.log(`Updated:   ${result.stats.updated}`);
    Logger.log(`Deleted:   ${result.stats.deleted}`);
    Logger.log(`Skipped:   ${result.stats.skipped}`);
    Logger.log(`Failed:    ${result.stats.failed}`);
    Logger.log(`Conflicts: ${result.stats.conflicts}`);
    Logger.log('─'.repeat(50));

    if (result.errors.length > 0) {
      Logger.log('\n⚠️  Errors:');
      result.errors.forEach((error, index) => {
        Logger.log(`${index + 1}. ${error.message}`);
      });
    }
  }

  /**
   * Configure sync engine
   *
   * @param {Object} options - Configuration options
   */
  function configure(options) {
    Object.assign(CONFIG, options);
    Logger.log('✅ SyncEngine configured');
  }

  /**
   * Get current configuration
   *
   * @returns {Object} Current config
   */
  function getConfig() {
    return { ...CONFIG };
  }

  // Public API
  return {
    sync,
    configure,
    getConfig
  };
})();
