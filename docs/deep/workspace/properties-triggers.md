# ⚙️ Properties & Triggers

**Categoria**: Workspace → State Management & Automation
**Righe**: ~400
**Parent**: `specialists/workspace-engineer.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Store configuration e state (PropertiesService)
- Implement scheduled automation (time-based triggers)
- Handle Sheet events (onEdit, onChange, onOpen)
- Manage trigger limitations (6 min, 20 triggers/user)
- Implement LockService for concurrency
- Handle trigger failures e cleanup

---

## 🗄️ PropertiesService

### Property Types

**Script Properties** - Script-level (shared across users):
```javascript
const props = PropertiesService.getScriptProperties();

// Set
props.setProperty('API_TOKEN', 'abc123');

// Get
const token = props.getProperty('API_TOKEN');

// Delete
props.deleteProperty('API_TOKEN');

// Get all
const allProps = props.getProperties();
```

**User Properties** - User-specific:
```javascript
const userProps = PropertiesService.getUserProperties();

userProps.setProperty('USER_PREF_THEME', 'dark');
const theme = userProps.getProperty('USER_PREF_THEME');
```

**Document Properties** - Document-specific:
```javascript
const docProps = PropertiesService.getDocumentProperties();

docProps.setProperty('DOC_VERSION', '1.2.0');
const version = docProps.getProperty('DOC_VERSION');
```

---

### Best Practices

```javascript
// Store complex objects as JSON
function storeConfig(config) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('CONFIG', JSON.stringify(config));
}

function getConfig() {
  const props = PropertiesService.getScriptProperties();
  const configJson = props.getProperty('CONFIG');

  return configJson ? JSON.parse(configJson) : {};
}

// Limitations
// - Max 9KB per property
// - Max 500KB total per store
```

---

## ⏰ Time-Based Triggers

### Create Trigger

```javascript
function createDailyTrigger() {
  // Delete existing triggers first
  deleteTriggers('dailySync');

  // Create new trigger
  ScriptApp.newTrigger('dailySync')
    .timeBased()
    .everyDays(1)
    .atHour(2)  // 2 AM
    .create();

  Logger.log('✅ Daily trigger created');
}

function createHourlyTrigger() {
  ScriptApp.newTrigger('hourlySync')
    .timeBased()
    .everyHours(1)
    .create();
}

// Delete triggers by function name
function deleteTriggers(functionName) {
  const triggers = ScriptApp.getProjectTriggers();

  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(trigger);
      Logger.log(`Deleted trigger for ${functionName}`);
    }
  });
}
```

---

## 📝 Event-Based Triggers

### onEdit Trigger

```javascript
function onEdit(e) {
  // e.range - edited range
  // e.value - new value
  // e.oldValue - previous value

  const range = e.range;
  const sheet = range.getSheet();

  if (sheet.getName() === 'Orders' && range.getColumn() === 4) {
    // Status column changed
    Logger.log(`Status updated to: ${e.value}`);
  }
}
```

### onChange Trigger

```javascript
function onChange(e) {
  // Triggers on: insert row/column, delete row/column, etc.
  // e.changeType: 'INSERT_ROW', 'REMOVE_ROW', 'INSERT_COLUMN', etc.

  Logger.log(`Change type: ${e.changeType}`);
}
```

### onOpen Trigger

```javascript
function onOpen(e) {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('Custom Menu')
    .addItem('Sync Data', 'syncData')
    .addSeparator()
    .addItem('Settings', 'showSettings')
    .addToUi();

  Logger.log('Spreadsheet opened');
}
```

---

## 🔒 LockService

### Prevent Concurrent Execution

```javascript
function syncWithLock() {
  const lock = LockService.getScriptLock();

  try {
    // Wait up to 30 seconds for lock
    lock.waitLock(30000);

    // Critical section - only one execution at a time
    Logger.log('Lock acquired, starting sync...');

    performSync();

    Logger.log('Sync complete');

  } catch (error) {
    Logger.log(`❌ Could not acquire lock: ${error.message}`);
  } finally {
    // Always release lock
    lock.releaseLock();
  }
}
```

---

## 📊 Trigger Management

### List All Triggers

```javascript
function listAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();

  Logger.log(`Total triggers: ${triggers.length}`);

  triggers.forEach(trigger => {
    Logger.log(`- ${trigger.getHandlerFunction()} (${trigger.getTriggerSource()})`);
  });
}
```

### Cleanup Old Triggers

```javascript
function cleanupOldTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  let deleted = 0;

  triggers.forEach(trigger => {
    // Delete if older than 30 days
    const created = new Date(trigger.getUniqueId());
    const age = Date.now() - created.getTime();

    if (age > 30 * 24 * 60 * 60 * 1000) {
      ScriptApp.deleteTrigger(trigger);
      deleted++;
    }
  });

  Logger.log(`Cleaned up ${deleted} old triggers`);
}
```

---

## ✅ Best Practices

- [x] **Cache properties** - Don't call getProperty() in loops
- [x] **JSON for complex data** - Use JSON.stringify/parse
- [x] **Delete old triggers** - Prevent quota exhaustion
- [x] **Use LockService** - Prevent race conditions
- [x] **Handle trigger failures** - Try-catch in trigger functions
- [x] **Monitor execution time** - Stay under 6-minute limit
- [x] **Test triggers thoroughly** - Use test data
