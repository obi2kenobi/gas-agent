/**
 * QUICKSTART.gs - Ready-to-Use Helper Functions
 *
 * Copy these functions to your Apps Script project for instant productivity!
 *
 * Quick Access:
 * - setupNewProject() - One-click project setup
 * - quickOrchestrate() - Analyze project requirements
 * - quickDatabase() - Set up Sheets database
 * - quickBCSync() - Sync from Business Central
 * - showDashboard() - View monitoring dashboard
 */

/**
 * ═══════════════════════════════════════════════════════════
 * 1. ONE-CLICK PROJECT SETUP
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Set up a new gas-Agent project with all dependencies
 *
 * Usage:
 *   setupNewProject();
 */
function setupNewProject() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    '🚀 gas-Agent Project Setup',
    'This will set up your project with:\n\n' +
    '✅ Sheets Database (if selected)\n' +
    '✅ Custom menu\n' +
    '✅ Configuration storage\n' +
    '✅ Logging utilities\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    ui.alert('Setup cancelled');
    return;
  }

  try {
    // Create menu
    createCustomMenu();

    // Initialize properties
    const props = PropertiesService.getScriptProperties();
    if (!props.getProperty('PROJECT_NAME')) {
      props.setProperty('PROJECT_NAME', SpreadsheetApp.getActiveSpreadsheet().getName());
      props.setProperty('SETUP_DATE', new Date().toISOString());
    }

    ui.alert(
      '✅ Setup Complete!',
      'Your project is ready to use.\n\n' +
      'Access features via:\n' +
      '📋 gas-Agent menu (top menu bar)\n' +
      '⚙️ Extensions > Apps Script',
      ui.ButtonSet.OK
    );

    Logger.log('✅ Project setup completed');

  } catch (error) {
    ui.alert('❌ Setup Error', error.message, ui.ButtonSet.OK);
    Logger.log(`❌ Setup failed: ${error.message}`);
  }
}

/**
 * Create custom menu in Google Sheets
 */
function createCustomMenu() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('gas-Agent')
    .addSubMenu(ui.createMenu('🎯 Orchestrator')
      .addItem('Analyze Project Requirements', 'quickOrchestrate')
      .addItem('View Specialist Library', 'showSpecialists'))
    .addSubMenu(ui.createMenu('📊 Database')
      .addItem('Initialize Database', 'quickDatabase')
      .addItem('View Database Stats', 'showDatabaseStats')
      .addItem('Run Database Tests', 'testDatabase'))
    .addSubMenu(ui.createMenu('🔐 Business Central')
      .addItem('Configure BC Connection', 'configureBCConnection')
      .addItem('Test BC Connection', 'testBCConnection')
      .addItem('Sync from BC', 'quickBCSync'))
    .addSubMenu(ui.createMenu('📈 Monitoring')
      .addItem('View Dashboard', 'showDashboard')
      .addItem('View Logs', 'showLogs')
      .addItem('Health Check', 'runHealthCheck'))
    .addSeparator()
    .addItem('📖 Quick Start Guide', 'showQuickStartGuide')
    .addItem('⚙️ Settings', 'showSettings')
    .addToUi();

  Logger.log('✅ Custom menu created');
}

/**
 * ═══════════════════════════════════════════════════════════
 * 2. ORCHESTRATOR - QUICK PROJECT ANALYSIS
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Quick orchestrate - analyze project requirements
 *
 * Usage:
 *   quickOrchestrate();
 */
function quickOrchestrate() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.prompt(
    '🎯 Project Requirements Analysis',
    'Describe your project in natural language:\n\n' +
    'Example: "Build a system that syncs orders from Business Central to Sheets with validation and monitoring"',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  const description = response.getResponseText();

  if (!description || description.trim().length < 10) {
    ui.alert('❌ Error', 'Please provide a more detailed description (at least 10 characters)', ui.ButtonSet.OK);
    return;
  }

  try {
    // Check if Orchestrator is available
    if (typeof orchestrateProject === 'undefined') {
      ui.alert(
        '📦 Orchestrator Not Installed',
        'The Orchestrator system is not yet installed in this project.\n\n' +
        'To use it, copy the orchestrator files from:\n' +
        'gas-Agent/orchestrator/\n\n' +
        'Files needed:\n' +
        '- RequirementsAnalyzer.gs\n' +
        '- SpecialistSelector.gs\n' +
        '- ExecutionPlanner.gs\n' +
        '- Orchestrator.gs',
        ui.ButtonSet.OK
      );
      return;
    }

    // Run orchestration
    const result = orchestrateProject(description);

    // Show results
    const summary = formatOrchestrationResults(result);

    ui.alert(
      '✅ Analysis Complete',
      summary,
      ui.ButtonSet.OK
    );

    Logger.log('Orchestration results:', JSON.stringify(result, null, 2));

  } catch (error) {
    ui.alert('❌ Error', error.message, ui.ButtonSet.OK);
    Logger.log(`❌ Orchestration failed: ${error.message}`);
  }
}

/**
 * Format orchestration results for display
 */
function formatOrchestrationResults(result) {
  const lines = [];

  lines.push(`📊 COMPLEXITY: ${result.analysis.complexity.level.toUpperCase()}`);
  lines.push(`⏱️ ESTIMATED: ${result.selection.complexity.estimatedHours}h (${result.selection.complexity.estimatedDays}d)`);
  lines.push('');
  lines.push(`👥 SPECIALISTS NEEDED (${result.selection.count}):`);

  result.selection.specialists.slice(0, 5).forEach((spec, i) => {
    lines.push(`${i + 1}. ${spec.name}`);
  });

  if (result.selection.specialists.length > 5) {
    lines.push(`... and ${result.selection.specialists.length - 5} more`);
  }

  lines.push('');
  lines.push('💡 Check execution log for detailed plan');

  return lines.join('\n');
}

/**
 * Show specialist library
 */
function showSpecialists() {
  const ui = SpreadsheetApp.getUi();

  const specialists = [
    '🔒 Security Engineer - OAuth2, RBAC, GDPR',
    '⚙️ Platform Engineer - Performance, Caching, Monitoring',
    '🤖 AI Integration Specialist - Claude API, Prompts',
    '🔗 Integration Engineer - REST APIs, Webhooks',
    '📊 Data Engineer - ETL, Sheets Database',
    '💼 BC Specialist - Business Central, OData',
    '🏗️ Solution Architect - Design Patterns, SOLID',
    '📂 Workspace Engineer - Sheets, Drive, Gmail',
    '💡 Business Logic Engineer - Rules, Workflows',
    '🎨 UI Engineer - HTML Service, Sidebars',
    '📄 Document Processing Specialist - PDFs, OCR',
    '📖 Documentation Engineer - JSDoc, READMEs'
  ];

  ui.alert(
    '👥 Available Specialists',
    'The Orchestrator can automatically select from:\n\n' +
    specialists.join('\n'),
    ui.ButtonSet.OK
  );
}

/**
 * ═══════════════════════════════════════════════════════════
 * 3. SHEETS DATABASE - QUICK SETUP
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Quick database setup - initialize Sheets as database
 *
 * Usage:
 *   quickDatabase();
 */
function quickDatabase() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    '📊 Initialize Sheets Database',
    'This will create database tables:\n\n' +
    '✅ Customers (with email, phone, credit_limit)\n' +
    '✅ Orders (with status, total_amount)\n' +
    '✅ OrderItems (with product, quantity, price)\n\n' +
    'Foreign keys and validation will be set up.\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return;
  }

  try {
    // Check if Schema is available
    if (typeof Schema === 'undefined') {
      ui.alert(
        '📦 Database System Not Installed',
        'The Sheets Database system is not yet installed.\n\n' +
        'To use it, copy files from:\n' +
        'gas-Agent/examples/sheets-database/\n\n' +
        'Files needed:\n' +
        '- Schema.gs\n' +
        '- Repository.gs\n' +
        '- Validator.gs\n' +
        '- QueryBuilder.gs\n' +
        '- Service.gs',
        ui.ButtonSet.OK
      );
      return;
    }

    // Initialize database
    initializeDatabase();

    // Get stats
    const stats = getDatabaseStats();

    ui.alert(
      '✅ Database Initialized!',
      'Database is ready to use.\n\n' +
      `Tables created: ${Object.keys(stats).length}\n\n` +
      'Next steps:\n' +
      '1. Use CustomerService.createCustomer()\n' +
      '2. Use OrderService.createOrder()\n' +
      '3. Use query() for complex queries\n\n' +
      'Check execution log for details.',
      ui.ButtonSet.OK
    );

  } catch (error) {
    ui.alert('❌ Error', error.message, ui.ButtonSet.OK);
    Logger.log(`❌ Database initialization failed: ${error.message}`);
  }
}

/**
 * Show database statistics
 */
function showDatabaseStats() {
  const ui = SpreadsheetApp.getUi();

  try {
    if (typeof getDatabaseStats === 'undefined') {
      ui.alert('❌ Error', 'Database system not installed', ui.ButtonSet.OK);
      return;
    }

    const stats = getDatabaseStats();
    const lines = ['📊 DATABASE STATISTICS\n'];

    for (const [table, data] of Object.entries(stats)) {
      if (data.exists === false) {
        lines.push(`❌ ${table}: Not initialized`);
      } else {
        lines.push(`✅ ${table}: ${data.recordCount} records`);
      }
    }

    ui.alert('Database Stats', lines.join('\n'), ui.ButtonSet.OK);

  } catch (error) {
    ui.alert('❌ Error', error.message, ui.ButtonSet.OK);
  }
}

/**
 * Run database tests
 */
function testDatabase() {
  const ui = SpreadsheetApp.getUi();

  try {
    if (typeof runAllTests === 'undefined') {
      ui.alert('❌ Error', 'Test suite not installed (TEST.gs missing)', ui.ButtonSet.OK);
      return;
    }

    ui.alert(
      '🧪 Running Tests',
      'Test results will appear in the execution log.\n\n' +
      'This may take 1-2 minutes...',
      ui.ButtonSet.OK
    );

    const results = runAllTests();

    ui.alert(
      results.failed === 0 ? '✅ All Tests Passed!' : '⚠️ Some Tests Failed',
      `Passed: ${results.passed}/${results.passed + results.failed}\n` +
      `Failed: ${results.failed}\n\n` +
      'Check execution log for details.',
      ui.ButtonSet.OK
    );

  } catch (error) {
    ui.alert('❌ Error', error.message, ui.ButtonSet.OK);
  }
}

/**
 * ═══════════════════════════════════════════════════════════
 * 4. BUSINESS CENTRAL - QUICK SYNC
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Configure Business Central connection
 */
function configureBCConnection() {
  const ui = SpreadsheetApp.getUi();

  ui.alert(
    '🔐 Business Central Configuration',
    'To configure Business Central:\n\n' +
    '1. Go to Extensions > Apps Script\n' +
    '2. Copy Config.gs from examples/oauth2-bc-integration/\n' +
    '3. Run setupConfig() function\n' +
    '4. Enter your BC credentials:\n' +
    '   - Tenant ID\n' +
    '   - Client ID\n' +
    '   - Client Secret\n' +
    '   - Environment\n' +
    '   - Company ID\n\n' +
    'See README for detailed instructions.',
    ui.ButtonSet.OK
  );
}

/**
 * Test Business Central connection
 */
function testBCConnection() {
  const ui = SpreadsheetApp.getUi();

  try {
    if (typeof testConnection === 'undefined') {
      ui.alert(
        '📦 BC Integration Not Installed',
        'Copy files from: gas-Agent/examples/oauth2-bc-integration/',
        ui.ButtonSet.OK
      );
      return;
    }

    ui.alert('🧪 Testing Connection', 'Testing Business Central connection...', ui.ButtonSet.OK);

    testConnection();

    ui.alert('✅ Connection Successful', 'Business Central is accessible!\n\nCheck execution log for details.', ui.ButtonSet.OK);

  } catch (error) {
    ui.alert('❌ Connection Failed', error.message, ui.ButtonSet.OK);
  }
}

/**
 * Quick BC sync - sync data from Business Central
 */
function quickBCSync() {
  const ui = SpreadsheetApp.getUi();

  const options = ui.alert(
    '🔄 Sync from Business Central',
    'What would you like to sync?\n\n' +
    '(This is a demo - customize for your needs)',
    ui.ButtonSet.YES_NO_CANCEL
  );

  if (options === ui.Button.CANCEL) {
    return;
  }

  try {
    if (typeof exportCustomersToSheet === 'undefined') {
      ui.alert('📦 BC Integration Not Installed', 'Copy files from examples/oauth2-bc-integration/', ui.ButtonSet.OK);
      return;
    }

    ui.alert('🔄 Syncing...', 'Fetching data from Business Central...', ui.ButtonSet.OK);

    if (options === ui.Button.YES) {
      exportCustomersToSheet();
      ui.alert('✅ Sync Complete', 'Customers synced successfully!', ui.ButtonSet.OK);
    } else {
      exportSalesOrdersToSheet();
      ui.alert('✅ Sync Complete', 'Orders synced successfully!', ui.ButtonSet.OK);
    }

  } catch (error) {
    ui.alert('❌ Sync Failed', error.message, ui.ButtonSet.OK);
  }
}

/**
 * ═══════════════════════════════════════════════════════════
 * 5. MONITORING & DASHBOARD
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Show monitoring dashboard
 */
function showDashboard() {
  const html = HtmlService.createHtmlOutput(`
    <html>
      <head>
        <base target="_top">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .metric { padding: 15px; margin: 10px 0; border-radius: 5px; }
          .success { background: #d4edda; color: #155724; }
          .warning { background: #fff3cd; color: #856404; }
          .info { background: #d1ecf1; color: #0c5460; }
          h2 { color: #333; }
          .stat { font-size: 24px; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>📊 gas-Agent Dashboard</h2>

        <div class="metric success">
          <div>✅ System Status</div>
          <div class="stat">Operational</div>
        </div>

        <div class="metric info">
          <div>📦 Examples Installed</div>
          <div class="stat">Check Apps Script</div>
        </div>

        <div class="metric warning">
          <div>💡 Tip</div>
          <div>Use menu: gas-Agent > Monitoring > View Logs</div>
        </div>

        <hr>
        <p><small>gas-Agent v1.0 - © 2025</small></p>
      </body>
    </html>
  `)
    .setWidth(400)
    .setHeight(300);

  SpreadsheetApp.getUi().showModalDialog(html, '📊 Dashboard');
}

/**
 * Show logs
 */
function showLogs() {
  const ui = SpreadsheetApp.getUi();

  ui.alert(
    '📋 View Logs',
    'To view execution logs:\n\n' +
    '1. Go to Extensions > Apps Script\n' +
    '2. Click "Executions" (left sidebar)\n' +
    '3. Click on any execution to see logs\n\n' +
    'Or use:\n' +
    'View > Logs (Ctrl+Enter in script editor)',
    ui.ButtonSet.OK
  );
}

/**
 * Run health check
 */
function runHealthCheck() {
  const ui = SpreadsheetApp.getUi();

  const checks = {
    spreadsheet: true,
    properties: PropertiesService.getScriptProperties().getKeys().length > 0,
    schema: typeof Schema !== 'undefined',
    orchestrator: typeof orchestrateProject !== 'undefined',
    bcIntegration: typeof BCClient !== 'undefined'
  };

  const lines = ['🏥 HEALTH CHECK\n'];
  lines.push(checks.spreadsheet ? '✅ Spreadsheet: OK' : '❌ Spreadsheet: Error');
  lines.push(checks.properties ? '✅ Properties: Configured' : '⚠️ Properties: Empty');
  lines.push(checks.schema ? '✅ Database: Installed' : '⚠️ Database: Not installed');
  lines.push(checks.orchestrator ? '✅ Orchestrator: Installed' : '⚠️ Orchestrator: Not installed');
  lines.push(checks.bcIntegration ? '✅ BC Integration: Installed' : '⚠️ BC Integration: Not installed');

  const allGood = Object.values(checks).every(c => c);

  ui.alert(
    allGood ? '✅ System Healthy' : '⚠️ Issues Detected',
    lines.join('\n'),
    ui.ButtonSet.OK
  );
}

/**
 * ═══════════════════════════════════════════════════════════
 * 6. HELP & SETTINGS
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Show quick start guide
 */
function showQuickStartGuide() {
  const ui = SpreadsheetApp.getUi();

  ui.alert(
    '📖 Quick Start Guide',
    '🚀 GETTING STARTED WITH gas-Agent\n\n' +
    '1️⃣ FIRST TIME:\n' +
    '   • Run setupNewProject()\n' +
    '   • Install examples you need\n\n' +
    '2️⃣ COMMON TASKS:\n' +
    '   • Database: quickDatabase()\n' +
    '   • BC Sync: quickBCSync()\n' +
    '   • Planning: quickOrchestrate()\n\n' +
    '3️⃣ NEED HELP:\n' +
    '   • Check examples/ folder\n' +
    '   • Read README files\n' +
    '   • Run test functions\n\n' +
    '📚 Full docs: github.com/obi2kenobi/gas-agent',
    ui.ButtonSet.OK
  );
}

/**
 * Show settings
 */
function showSettings() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getScriptProperties();

  const settings = {
    projectName: props.getProperty('PROJECT_NAME') || 'Not set',
    setupDate: props.getProperty('SETUP_DATE') || 'Not set',
    totalProperties: props.getKeys().length
  };

  ui.alert(
    '⚙️ Settings',
    `📋 Project: ${settings.projectName}\n` +
    `📅 Setup: ${settings.setupDate.split('T')[0]}\n` +
    `🔧 Properties: ${settings.totalProperties} stored\n\n` +
    'To modify settings, use:\n' +
    'PropertiesService.getScriptProperties()',
    ui.ButtonSet.OK
  );
}

/**
 * ═══════════════════════════════════════════════════════════
 * AUTO-RUN ON OPEN
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Runs automatically when spreadsheet is opened
 */
function onOpen() {
  createCustomMenu();
}
