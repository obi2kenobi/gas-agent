# 🟢 Beginner Learning Path

**Build your foundation in Google Apps Script development**

---

## Overview

**Duration**: 2-4 hours
**Prerequisites**: Basic JavaScript knowledge
**Goal**: Build simple but functional GAS automation

By the end of this path, you'll be able to:
- ✅ Navigate the GAS environment
- ✅ Read and write Sheets data efficiently
- ✅ Call external APIs with basic error handling
- ✅ Store configuration securely
- ✅ Deploy your first automation

---

## Module 1: GAS Basics (30 minutes)

### Concepts to Learn

- GAS environment and editor
- Execution model (triggers vs. manual)
- Logging and debugging
- Permissions and authorization

### Hands-On Exercise

```javascript
/**
 * Your first GAS function
 */
function learnBasics() {
  // 1. Logging
  Logger.log('Starting script execution');

  // 2. Access current spreadsheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log(`Spreadsheet name: ${ss.getName()}`);

  // 3. Get active sheet
  const sheet = ss.getActiveSheet();
  Logger.log(`Sheet name: ${sheet.getName()}`);

  // 4. Write data
  sheet.getRange('A1').setValue('Hello GAS!');
  sheet.getRange('B1').setValue(new Date());

  Logger.log('Script completed');
}
```

**Try it:**
1. Create new GAS project
2. Paste code above
3. Run function and grant permissions
4. Check View → Logs
5. Check your spreadsheet for output

### Key Takeaways

✅ `Logger.log()` for debugging
✅ `SpreadsheetApp` to access Sheets
✅ Permission prompts on first run
✅ Changes happen in real-time

---

## Module 2: Working with Sheets (45 minutes)

### Concepts to Learn

- Batch operations vs. single-cell operations
- Reading data ranges
- Writing data efficiently
- Named ranges

### Hands-On Exercise: Customer List Manager

```javascript
/**
 * Read customer data from Sheets
 */
function readCustomers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Customers');

  // IMPORTANT: Use getValues() for batch read (fast!)
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();

  // Transform to objects
  const customers = data.map(row => ({
    id: row[0],
    name: row[1],
    email: row[2]
  }));

  Logger.log(`Read ${customers.length} customers`);
  return customers;
}

/**
 * Write new customers to Sheets
 */
function writeCustomers(customers) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Customers');

  // Convert objects to 2D array
  const values = customers.map(c => [c.id, c.name, c.email]);

  // IMPORTANT: Use setValues() for batch write (fast!)
  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, values.length, 3).setValues(values);

  Logger.log(`Wrote ${values.length} customers`);
}

/**
 * Example usage
 */
function customerExample() {
  // Read existing
  const customers = readCustomers();

  // Add new customer
  customers.push({
    id: 'C' + (customers.length + 1),
    name: 'John Doe',
    email: 'john@example.com'
  });

  // Write back
  writeCustomers([customers[customers.length - 1]]);
}
```

**Try it:**
1. Create sheet named "Customers"
2. Add headers: ID | Name | Email
3. Add a few test customers
4. Run `readCustomers()` and check logs
5. Run `customerExample()` to add new customer

### Performance Tip

```javascript
// ❌ BAD: 100 API calls for 100 rows
for (let i = 0; i < 100; i++) {
  sheet.getRange(i + 1, 1).setValue(data[i]);
}

// ✅ GOOD: 1 API call for 100 rows
sheet.getRange(1, 1, data.length, 1).setValues(data.map(d => [d]));
```

**Learn more**: [Workspace Engineer](../../specialists/workspace-engineer.md)

---

## Module 3: External API Calls (45 minutes)

### Concepts to Learn

- `UrlFetchApp.fetch()`
- HTTP methods (GET, POST)
- Headers and authentication
- Basic error handling

### Hands-On Exercise: Weather API Integration

```javascript
/**
 * Fetch weather data from API
 */
function getWeather(city) {
  const apiKey = 'demo'; // Use real API key in production
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;

  try {
    // Make API call
    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      muteHttpExceptions: true // Don't throw on HTTP errors
    });

    // Check status code
    const statusCode = response.getResponseCode();
    if (statusCode !== 200) {
      throw new Error(`API returned status ${statusCode}`);
    }

    // Parse JSON response
    const data = JSON.parse(response.getContentText());

    Logger.log(`Weather in ${city}: ${data.weather[0].description}`);
    Logger.log(`Temperature: ${data.main.temp}K`);

    return data;

  } catch (error) {
    Logger.log(`Error fetching weather: ${error.message}`);
    throw error;
  }
}

/**
 * Write weather to Sheets
 */
function weatherToSheets() {
  const cities = ['London', 'Paris', 'Tokyo'];
  const results = [];

  for (const city of cities) {
    try {
      const weather = getWeather(city);
      results.push([
        city,
        weather.weather[0].description,
        weather.main.temp,
        new Date()
      ]);
    } catch (error) {
      results.push([city, 'Error', '', new Date()]);
    }
  }

  // Write to Sheets
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Weather');
  sheet.getRange(2, 1, results.length, 4).setValues(results);

  Logger.log(`Updated weather for ${cities.length} cities`);
}
```

**Try it:**
1. Sign up for free weather API key at openweathermap.org
2. Create sheet named "Weather" with headers: City | Description | Temp | Updated
3. Update `apiKey` in code
4. Run `weatherToSheets()`

### Key Takeaways

✅ Always use `muteHttpExceptions: true`
✅ Check `response.getResponseCode()` before parsing
✅ Wrap in try-catch for error handling
✅ Parse JSON with `JSON.parse()`

**Learn more**: [Integration Engineer](../../specialists/integration-engineer.md)

---

## Module 4: Configuration Management (30 minutes)

### Concepts to Learn

- PropertiesService (secure storage)
- Script properties vs. User properties
- Never hardcode credentials
- Configuration best practices

### Hands-On Exercise: Secure Config

```javascript
/**
 * Setup configuration (run once manually)
 */
function setupConfig() {
  const props = PropertiesService.getScriptProperties();

  props.setProperties({
    'WEATHER_API_KEY': 'your-api-key-here',
    'WEATHER_API_URL': 'https://api.openweathermap.org/data/2.5',
    'DEFAULT_CITY': 'London'
  });

  Logger.log('✓ Configuration saved securely');
}

/**
 * Get configuration value
 */
function getConfig(key) {
  const props = PropertiesService.getScriptProperties();
  const value = props.getProperty(key);

  if (!value) {
    throw new Error(`Config key '${key}' not found. Run setupConfig() first.`);
  }

  return value;
}

/**
 * Improved weather function using config
 */
function getWeatherSecure(city) {
  const apiKey = getConfig('WEATHER_API_KEY'); // Secure!
  const baseUrl = getConfig('WEATHER_API_URL');
  const url = `${baseUrl}/weather?q=${city}&appid=${apiKey}`;

  // ... rest of implementation
}
```

**Try it:**
1. Run `setupConfig()` once to store API key
2. Update `getWeather()` to use `getConfig()`
3. Verify it works
4. Share script with colleague - they can't see your API key!

### Security Checklist

✅ Use PropertiesService for credentials
✅ Never commit API keys to Git
✅ Document required properties in README
✅ Validate configuration on startup

**Learn more**: [Security Engineer](../../specialists/security-engineer.md)

---

## Module 5: First Real Project (60 minutes)

### Project: Automated Daily Report

**Requirements**:
- Fetch data from external API
- Process and validate data
- Write to Sheets
- Send email summary
- Run daily at 9 AM

**Implementation**:

```javascript
/**
 * Configuration
 */
const CONFIG = {
  SHEET_NAME: 'Daily Reports',
  EMAIL_RECIPIENT: 'your-email@example.com'
};

/**
 * Main function - called by trigger
 */
function generateDailyReport() {
  try {
    Logger.log('Starting daily report generation');

    // 1. Fetch data
    const data = fetchReportData();
    Logger.log(`Fetched ${data.length} records`);

    // 2. Process data
    const processed = processData(data);

    // 3. Write to Sheets
    writeToSheet(processed);

    // 4. Send email
    sendReportEmail(processed);

    Logger.log('✓ Daily report completed');

  } catch (error) {
    Logger.log(`✗ Error in daily report: ${error.message}`);

    // Send error notification
    MailApp.sendEmail({
      to: CONFIG.EMAIL_RECIPIENT,
      subject: '❌ Daily Report Failed',
      body: `Error: ${error.message}\n\nCheck logs for details.`
    });
  }
}

/**
 * Fetch data from API
 */
function fetchReportData() {
  const url = getConfig('REPORT_API_URL');
  const apiKey = getConfig('API_KEY');

  const response = UrlFetchApp.fetch(url, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error('API request failed');
  }

  return JSON.parse(response.getContentText());
}

/**
 * Process and validate data
 */
function processData(data) {
  return data
    .filter(item => item.status === 'active') // Filter
    .map(item => [                             // Transform
      item.id,
      item.name,
      item.value,
      new Date()
    ]);
}

/**
 * Write to Sheets
 */
function writeToSheet(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(CONFIG.SHEET_NAME);

  // Add header if empty
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 4)
      .setValues([['ID', 'Name', 'Value', 'Updated']]);
  }

  // Append data
  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, data.length, 4).setValues(data);

  Logger.log(`Wrote ${data.length} rows to Sheets`);
}

/**
 * Send email summary
 */
function sendReportEmail(data) {
  const totalValue = data.reduce((sum, row) => sum + row[2], 0);

  const body = `
Daily Report Summary

Records processed: ${data.length}
Total value: ${totalValue}
Updated: ${new Date()}

View full report: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}
  `.trim();

  MailApp.sendEmail({
    to: CONFIG.EMAIL_RECIPIENT,
    subject: '📊 Daily Report - ' + Utilities.formatDate(new Date(), 'GMT', 'yyyy-MM-dd'),
    body: body
  });

  Logger.log('Email sent');
}

/**
 * Setup daily trigger (run once)
 */
function setupDailyTrigger() {
  // Delete existing triggers
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'generateDailyReport') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new trigger for 9 AM daily
  ScriptApp.newTrigger('generateDailyReport')
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .create();

  Logger.log('✓ Daily trigger created for 9 AM');
}
```

**Implementation Steps**:

1. **Setup**:
   - Create new GAS project
   - Create sheet "Daily Reports"
   - Run `setupConfig()` with your API details
   - Run `setupDailyTrigger()` to schedule

2. **Test**:
   - Run `generateDailyReport()` manually
   - Check Sheets for data
   - Check email inbox
   - Review logs for errors

3. **Monitor**:
   - Check daily execution in Triggers → Executions
   - Review logs if issues occur
   - Update configuration as needed

### Success Criteria

✅ Report runs daily at 9 AM
✅ Data appears in Sheets
✅ Email received with summary
✅ Errors handled gracefully
✅ No hardcoded credentials

---

## Final Assessment

Test your knowledge:

### Quiz

1. **What's the difference between `getValue()` and `getValues()`?**
   <details>
   <summary>Answer</summary>
   getValue() reads one cell (1 API call), getValues() reads multiple cells in batch (1 API call for entire range). Always use getValues() for better performance.
   </details>

2. **Why use `muteHttpExceptions: true` in UrlFetchApp?**
   <details>
   <summary>Answer</summary>
   Without it, UrlFetchApp throws exceptions on non-200 status codes, making error handling difficult. With it, you can check response codes and handle errors gracefully.
   </details>

3. **Where should you store API keys?**
   <details>
   <summary>Answer</summary>
   PropertiesService.getScriptProperties() - never hardcode in code or commit to version control.
   </details>

### Practical Challenge

Build a script that:
- Reads email addresses from Sheets (column A)
- Validates each email format
- Writes "Valid" or "Invalid" to column B
- Sends summary email with counts

<details>
<summary>Solution</summary>

```javascript
function validateEmails() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const emails = sheet.getRange('A2:A').getValues().flat().filter(String);

  const results = emails.map(email => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return [isValid ? 'Valid' : 'Invalid'];
  });

  sheet.getRange(2, 2, results.length, 1).setValues(results);

  const valid = results.filter(r => r[0] === 'Valid').length;
  const invalid = results.length - valid;

  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    subject: 'Email Validation Complete',
    body: `Valid: ${valid}\nInvalid: ${invalid}`
  });
}
```
</details>

---

## Congratulations! 🎉

You've completed the Beginner Learning Path!

### What You Learned

✅ GAS environment and execution model
✅ Efficient Sheets operations with batch methods
✅ External API integration with error handling
✅ Secure configuration management
✅ Building and scheduling complete automation

### Next Steps

**Ready for more?** Choose your path:

1. **Practice more**: Build 2-3 more simple projects to solidify skills
2. **Level up**: Continue to [Intermediate Learning Path](intermediate.md)
3. **Go deeper**: Explore specialists:
   - [Workspace Engineer](../../specialists/workspace-engineer.md) - Advanced Sheets
   - [Platform Engineer](../../specialists/platform-engineer.md) - Performance & errors
   - [Integration Engineer](../../specialists/integration-engineer.md) - Advanced API patterns

### Recommended Projects for Practice

- **Todo Manager**: Sheets-based todo list with email reminders
- **Stock Tracker**: Fetch stock prices daily and chart trends
- **Team Calendar**: Sync external calendar to Sheets
- **Survey Processor**: Process form responses and generate report

---

**Keep building! 🚀**
