/**
 * BCSheetsSync.gs
 *
 * Main entry point for BC ↔ Sheets synchronization
 *
 * This file provides high-level functions to easily sync data
 * between Business Central and Google Sheets using the sheets-database
 * pattern and oauth2-bc-integration.
 *
 * Quick Start:
 * 1. setupBCSheetsSync() - One-time setup
 * 2. syncAll() - Sync all entities
 * 3. syncCustomers() - Sync customers
 * 4. syncOrders() - Sync orders
 *
 * @version 1.0
 */

/**
 * One-time setup for BC-Sheets sync
 * Run this first!
 */
function setupBCSheetsSync() {
  Logger.log('\n🚀 Setting up BC-Sheets Sync...\n');

  // 1. Initialize BC connection (from oauth2-bc-integration)
  Logger.log('1️⃣  Initializing BC connection...');
  if (typeof setupConfig === 'undefined') {
    throw new Error('oauth2-bc-integration not found. Please install it first.');
  }

  // Note: User should run setupConfig() separately with their credentials

  // 2. Initialize Sheets database (from sheets-database)
  Logger.log('2️⃣  Initializing Sheets database...');
  if (typeof initializeDatabase === 'undefined') {
    throw new Error('sheets-database not found. Please install it first.');
  }

  initializeDatabase();

  // 3. Create custom menu
  Logger.log('3️⃣  Creating custom menu...');
  createBCSyncMenu();

  Logger.log('\n✅ Setup complete!\n');
  Logger.log('Next steps:');
  Logger.log('1. Configure BC credentials: setupConfig()');
  Logger.log('2. Run first sync: syncAll()');
  Logger.log('3. Set up schedule: scheduleAllSyncs()');
}

/**
 * Create custom menu for BC-Sheets sync
 */
function createBCSyncMenu() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('🔄 BC Sync')
    .addItem('🔄 Sync All', 'syncAll')
    .addSeparator()
    .addItem('👥 Sync Customers', 'syncCustomers')
    .addItem('📦 Sync Orders', 'syncOrders')
    .addItem('📦 Sync Items', 'syncItems')
    .addSeparator()
    .addItem('📅 Manage Schedules', 'showScheduleManager')
    .addItem('⚙️  Configuration', 'showSyncConfiguration')
    .addItem('📊 View Stats', 'showSyncStats')
    .addSeparator()
    .addItem('🧹 Clear Change Tracking', 'clearAllChangeTracking')
    .addItem('🗑️  Clear Conflicts', 'clearResolvedConflicts')
    .addToUi();

  Logger.log('✅ Custom menu created');
}

/**
 * Add menu on spreadsheet open
 */
function onOpen() {
  createBCSyncMenu();
}

// ============================================================================
// High-Level Sync Functions
// ============================================================================

/**
 * Sync all entities (customers, orders, items)
 */
function syncAll() {
  Logger.log('\n🔄 Syncing all entities...\n');

  const results = {
    customers: syncCustomers(),
    orders: syncOrders(),
    items: syncItems()
  };

  Logger.log('\n📊 All Syncs Complete!\n');
  Logger.log(`Customers: ${results.customers.stats.created + results.customers.stats.updated} processed`);
  Logger.log(`Orders: ${results.orders.stats.created + results.orders.stats.updated} processed`);
  Logger.log(`Items: ${results.items.stats.created + results.items.stats.updated} processed`);

  return results;
}

/**
 * Sync customers from BC to Sheets
 */
function syncCustomers() {
  return SyncEngine.sync('customers', {
    direction: 'BC_TO_SHEETS',
    fullSync: false
  });
}

/**
 * Sync orders from BC to Sheets
 */
function syncOrders() {
  return SyncEngine.sync('orders', {
    direction: 'BC_TO_SHEETS',
    fullSync: false
  });
}

/**
 * Sync items from BC to Sheets
 */
function syncItems() {
  return SyncEngine.sync('items', {
    direction: 'BC_TO_SHEETS',
    fullSync: false
  });
}

/**
 * Force full sync (re-sync everything)
 */
function fullSyncAll() {
  Logger.log('\n🔄 FULL SYNC - All entities...\n');

  const results = {
    customers: SyncEngine.sync('customers', { fullSync: true }),
    orders: SyncEngine.sync('orders', { fullSync: true }),
    items: SyncEngine.sync('items', { fullSync: true })
  };

  Logger.log('\n✅ Full sync complete!\n');

  return results;
}

// ============================================================================
// Scheduling Functions
// ============================================================================

/**
 * Set up automatic syncs for all entities
 */
function scheduleAllSyncs() {
  Logger.log('\n📅 Setting up automatic syncs...\n');

  // Customers: Every hour
  Scheduler.scheduleSync('customers', 'HOURLY', {
    direction: 'BC_TO_SHEETS'
  });

  // Orders: Every 15 minutes
  Scheduler.scheduleSync('orders', 'EVERY_15_MINUTES', {
    direction: 'BC_TO_SHEETS'
  });

  // Items: Daily at 2 AM
  Scheduler.scheduleSync('items', 'DAILY', {
    hour: 2,
    direction: 'BC_TO_SHEETS'
  });

  Logger.log('✅ All syncs scheduled!\n');
  Logger.log('Schedules:');
  Logger.log('- Customers: Every hour');
  Logger.log('- Orders: Every 15 minutes');
  Logger.log('- Items: Daily at 2 AM');
}

/**
 * Remove all scheduled syncs
 */
function removeAllSchedules() {
  Logger.log('\n🗑️  Removing all scheduled syncs...\n');

  Scheduler.removeSchedule('customers');
  Scheduler.removeSchedule('orders');
  Scheduler.removeSchedule('items');

  Logger.log('✅ All schedules removed');
}

/**
 * Show schedule manager UI
 */
function showScheduleManager() {
  Scheduler.showScheduleManager();
}

// ============================================================================
// Configuration & Management
// ============================================================================

/**
 * Show sync configuration dialog
 */
function showSyncConfiguration() {
  const ui = SpreadsheetApp.getUi();

  const syncEngineConfig = SyncEngine.getConfig();

  const message = `
Current Sync Configuration:
═══════════════════════════

Direction: ${syncEngineConfig.syncDirection}
Batch Size: ${syncEngineConfig.batchSize}
Change Tracking: ${syncEngineConfig.enableChangeTracking ? 'Enabled' : 'Disabled'}
Conflict Detection: ${syncEngineConfig.enableConflictDetection ? 'Enabled' : 'Disabled'}

To change configuration, edit the code or use:
SyncEngine.configure({ ... })
  `.trim();

  ui.alert('Sync Configuration', message, ui.ButtonSet.OK);
}

/**
 * Show sync statistics
 */
function showSyncStats() {
  const ui = SpreadsheetApp.getUi();

  const customerStats = ChangeDetector.getStats('customers');
  const orderStats = ChangeDetector.getStats('orders');
  const itemStats = ChangeDetector.getStats('items');

  const message = `
Sync Statistics:
════════════════

CUSTOMERS:
  Total changes: ${customerStats.totalChanges}
  Last 24h: ${customerStats.recentChanges.last24h}
  Last sync (BC→Sheets): ${customerStats.lastSync.BC_TO_SHEETS || 'Never'}

ORDERS:
  Total changes: ${orderStats.totalChanges}
  Last 24h: ${orderStats.recentChanges.last24h}
  Last sync (BC→Sheets): ${orderStats.lastSync.BC_TO_SHEETS || 'Never'}

ITEMS:
  Total changes: ${itemStats.totalChanges}
  Last 24h: ${itemStats.recentChanges.last24h}
  Last sync (BC→Sheets): ${itemStats.lastSync.BC_TO_SHEETS || 'Never'}
  `.trim();

  ui.alert('Sync Statistics', message, ui.ButtonSet.OK);
}

// ============================================================================
// Maintenance Functions
// ============================================================================

/**
 * Clear all change tracking data
 */
function clearAllChangeTracking() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    'Clear Change Tracking',
    'This will clear all change tracking data. Next sync will be a full sync.\n\nContinue?',
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    ChangeDetector.clearTracking('customers');
    ChangeDetector.clearTracking('orders');
    ChangeDetector.clearTracking('items');

    ui.alert('✅ Change tracking cleared');
  }
}

/**
 * Clear resolved conflicts
 */
function clearResolvedConflicts() {
  ConflictResolver.clearResolved();
  SpreadsheetApp.getUi().alert('✅ Resolved conflicts cleared');
}

/**
 * Cleanup old data
 */
function cleanupOldData() {
  Logger.log('\n🧹 Cleaning up old data...\n');

  // Cleanup change tracking (keep last 30 days)
  ChangeDetector.cleanup(30);

  // Cleanup orphaned triggers
  Scheduler.cleanupOrphanedTriggers();

  // Clear resolved conflicts
  ConflictResolver.clearResolved();

  Logger.log('✅ Cleanup complete');
}

// ============================================================================
// Example: Custom Sync with Filters
// ============================================================================

/**
 * Example: Sync only active customers
 */
function syncActiveCustomersExample() {
  return SyncEngine.sync('customers', {
    direction: 'BC_TO_SHEETS',
    fullSync: false,
    filter: {
      $filter: "blocked eq false"
    }
  });
}

/**
 * Example: Sync orders from last 7 days
 */
function syncRecentOrdersExample() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return SyncEngine.sync('orders', {
    direction: 'BC_TO_SHEETS',
    fullSync: false,
    filter: {
      $filter: `orderDate gt ${sevenDaysAgo.toISOString()}`
    }
  });
}

// ============================================================================
// Repository Helpers (requires sheets-database)
// ============================================================================

/**
 * Customer Repository class
 */
class CustomerRepository extends Repository {
  constructor() {
    super('customers');
  }
}

/**
 * Order Repository class
 */
class OrderRepository extends Repository {
  constructor() {
    super('orders');
  }
}

/**
 * Item Repository class
 */
class ItemRepository extends Repository {
  constructor() {
    super('items');
  }
}
