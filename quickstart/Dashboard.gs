/**
 * Dashboard.gs - Simple Monitoring Dashboard
 *
 * Provides a visual dashboard to monitor your gas-Agent project.
 *
 * Features:
 * - System health checks
 * - Component status
 * - Recent activity
 * - Quick actions
 */

/**
 * Show dashboard sidebar
 */
function showDashboard() {
  const html = createDashboardHTML();
  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setTitle('gas-Agent Dashboard')
    .setWidth(350);

  SpreadsheetApp.getUi().showSidebar(htmlOutput);
}

/**
 * Create dashboard HTML
 */
function createDashboardHTML() {
  const stats = getDashboardStats();

  return `
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Google Sans', Arial, sans-serif;
      padding: 20px;
      background: #f8f9fa;
      color: #202124;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e0e0e0;
    }

    .header h1 {
      font-size: 24px;
      color: #1a73e8;
      margin-bottom: 5px;
    }

    .header p {
      color: #5f6368;
      font-size: 12px;
    }

    .metric-card {
      background: white;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0,0,0,0.15);
    }

    .metric-title {
      font-size: 12px;
      color: #5f6368;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .metric-value {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 5px;
    }

    .metric-subtitle {
      font-size: 13px;
      color: #5f6368;
    }

    .status-indicator {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 8px;
    }

    .status-ok {
      background: #34a853;
    }

    .status-warning {
      background: #fbbc04;
    }

    .status-error {
      background: #ea4335;
    }

    .component-list {
      list-style: none;
    }

    .component-item {
      padding: 10px;
      margin-bottom: 8px;
      background: #f8f9fa;
      border-radius: 4px;
      font-size: 13px;
    }

    .component-name {
      font-weight: 500;
    }

    .btn {
      display: block;
      width: 100%;
      padding: 12px;
      margin-top: 10px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
      text-align: center;
      text-decoration: none;
    }

    .btn-primary {
      background: #1a73e8;
      color: white;
    }

    .btn-primary:hover {
      background: #1765cc;
    }

    .btn-secondary {
      background: #f1f3f4;
      color: #202124;
    }

    .btn-secondary:hover {
      background: #e8eaed;
    }

    .activity-item {
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
      font-size: 12px;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-time {
      color: #5f6368;
      font-size: 11px;
    }

    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 11px;
      color: #5f6368;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <h1>📊 Dashboard</h1>
    <p>gas-Agent Monitoring</p>
  </div>

  <!-- System Status -->
  <div class="metric-card">
    <div class="metric-title">System Status</div>
    <div class="metric-value">
      <span class="status-indicator status-${stats.systemStatus.statusClass}"></span>
      ${stats.systemStatus.label}
    </div>
    <div class="metric-subtitle">${stats.systemStatus.message}</div>
  </div>

  <!-- Components Installed -->
  <div class="metric-card">
    <div class="metric-title">Components Installed</div>
    <div class="metric-value">${stats.componentsInstalled} / 3</div>
    <ul class="component-list">
      ${stats.components.map(c => `
        <li class="component-item">
          <span class="status-indicator status-${c.installed ? 'ok' : 'warning'}"></span>
          <span class="component-name">${c.name}</span>
        </li>
      `).join('')}
    </ul>
  </div>

  <!-- Database Stats -->
  ${stats.database ? `
  <div class="metric-card">
    <div class="metric-title">Database Records</div>
    <div class="metric-value">${stats.database.totalRecords}</div>
    <div class="metric-subtitle">
      ${stats.database.tables.map(t => `${t.name}: ${t.records}`).join(' • ')}
    </div>
  </div>
  ` : ''}

  <!-- Configuration -->
  <div class="metric-card">
    <div class="metric-title">Configuration</div>
    <div class="metric-value">${stats.configCount}</div>
    <div class="metric-subtitle">Properties stored</div>
  </div>

  <!-- Quick Actions -->
  <div class="metric-card">
    <div class="metric-title">Quick Actions</div>
    <button class="btn btn-primary" onclick="google.script.run.runHealthCheck()">
      🏥 Run Health Check
    </button>
    <button class="btn btn-secondary" onclick="google.script.run.setupNewProject()">
      🚀 Run Setup
    </button>
    <button class="btn btn-secondary" onclick="google.script.host.close()">
      ✖️ Close
    </button>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>gas-Agent v1.0</p>
    <p>Last updated: ${new Date().toLocaleTimeString()}</p>
  </div>

  <script>
    // Success callback
    google.script.run
      .withSuccessHandler(function(message) {
        alert(message || 'Operation completed');
      })
      .withFailureHandler(function(error) {
        alert('Error: ' + error.message);
      });
  </script>
</body>
</html>
  `;
}

/**
 * Get dashboard statistics
 */
function getDashboardStats() {
  const stats = {
    componentsInstalled: 0,
    components: [],
    configCount: 0,
    database: null,
    systemStatus: {
      label: 'Unknown',
      message: '',
      statusClass: 'warning'
    }
  };

  // Check components
  const components = [
    { name: 'Sheets Database', check: typeof Schema !== 'undefined' },
    { name: 'BC Integration', check: typeof BCClient !== 'undefined' },
    { name: 'Orchestrator', check: typeof orchestrateProject !== 'undefined' }
  ];

  components.forEach(c => {
    stats.components.push({ name: c.name, installed: c.check });
    if (c.check) stats.componentsInstalled++;
  });

  // Check configuration
  try {
    const props = PropertiesService.getScriptProperties();
    stats.configCount = props.getKeys().length;
  } catch (e) {
    stats.configCount = 0;
  }

  // Check database
  if (typeof getDatabaseStats !== 'undefined') {
    try {
      const dbStats = getDatabaseStats();
      const tables = [];
      let totalRecords = 0;

      for (const [name, data] of Object.entries(dbStats)) {
        if (data.recordCount !== undefined) {
          tables.push({ name, records: data.recordCount });
          totalRecords += data.recordCount;
        }
      }

      stats.database = {
        totalRecords,
        tables
      };
    } catch (e) {
      // Database not initialized
    }
  }

  // Determine system status
  if (stats.componentsInstalled === 0) {
    stats.systemStatus = {
      label: 'Not Configured',
      message: 'No components installed',
      statusClass: 'warning'
    };
  } else if (stats.componentsInstalled >= 1) {
    stats.systemStatus = {
      label: 'Operational',
      message: `${stats.componentsInstalled} component(s) running`,
      statusClass: 'ok'
    };
  }

  return stats;
}

/**
 * Modal dialog version
 */
function showDashboardDialog() {
  const html = createDashboardHTML();
  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(400)
    .setHeight(600);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'gas-Agent Dashboard');
}
