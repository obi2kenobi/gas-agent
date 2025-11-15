# 🚀 Getting Started with GAS-Agent

**Welcome! This guide will help you start using GAS-Agent to build production-ready Google Apps Script applications.**

---

## What is GAS-Agent?

GAS-Agent is an AI-optimized documentation system that helps you build Google Apps Script (GAS) applications with:

- ✅ **12 Specialist Experts** - Security, Platform, AI Integration, and more
- ✅ **32 Deep Documentation Files** - Detailed patterns with production-ready code
- ✅ **Intelligent Orchestrator** - Automatically coordinates specialists for your project
- ✅ **Battle-Tested Patterns** - OAuth2, caching, error handling, performance optimization

**You don't need to know which specialist to use** - just describe your project and the Orchestrator handles the rest!

---

## Quick Start (5 Minutes)

### Option 1: Using the Orchestrator (Recommended)

Simply describe your project in natural language:

```
"I need to sync orders from Business Central to Google Sheets with OAuth2,
caching, and error handling"
```

The Orchestrator will:
1. Analyze your requirements
2. Select the right specialists
3. Generate an execution plan
4. Implement the complete solution
5. Validate and test everything

**That's it!** No need to know which files to load or which specialists to consult.

### Option 2: Manual Specialist Selection

If you prefer control, follow these steps:

1. **Identify your need** - What are you trying to build?
2. **Choose a specialist** - See table below
3. **Load the specialist overview** (~150 lines)
4. **Follow the decision tree** - Points to specific deep documentation
5. **Implement with examples** - Copy production-ready patterns

| Your Need | Specialist to Start With |
|-----------|--------------------------|
| Authentication, OAuth2, Security | [Security Engineer](../specialists/security-engineer.md) |
| Performance, Caching, Errors | [Platform Engineer](../specialists/platform-engineer.md) |
| Business Central Integration | [BC Specialist](../specialists/bc-specialist.md) |
| Claude AI, Document Processing | [AI Integration Specialist](../specialists/ai-integration-specialist.md) |
| Sheets as Database, ETL | [Data Engineer](../specialists/data-engineer.md) |
| System Architecture | [Solution Architect](../specialists/solution-architect.md) |

---

## Prerequisites

### Required

- **Google Account** - For Google Apps Script access
- **Basic JavaScript Knowledge** - GAS uses JavaScript (ES6 syntax)
- **Text Editor** - Any editor works (VS Code recommended)

### Recommended

- **clasp CLI** - For local development and version control
- **Node.js** - For clasp and modern tooling
- **Git** - For version control

### Optional

- **Business Central Access** - If integrating with BC
- **Claude API Key** - If using AI features
- **TypeScript** - For type safety (GAS supports it)

---

## Environment Setup

### 1. Enable Google Apps Script

1. Go to [script.google.com](https://script.google.com)
2. Create a new project: **New Project**
3. Save with a meaningful name

### 2. Install clasp (Recommended)

```bash
# Install clasp globally
npm install -g @google/clasp

# Login to Google
clasp login

# Clone existing project OR create new
clasp clone <scriptId>
# OR
clasp create --title "My GAS Project" --type standalone
```

### 3. Configure Your IDE (VS Code)

```bash
# Install recommended extensions
code --install-extension google.apps-script
code --install-extension dbaeumer.vscode-eslint
```

Create `.vscode/settings.json`:
```json
{
  "javascript.validate.enable": true,
  "eslint.enable": true,
  "files.autoSave": "onFocusChange"
}
```

### 4. Setup Project Structure

```
my-gas-project/
├── .clasp.json              # clasp configuration
├── appsscript.json          # GAS manifest
├── .eslintrc.json           # Linting rules
├── README.md                # Project documentation
└── src/
    ├── Code.gs              # Main entry point
    ├── Config.gs            # Configuration
    └── ... (other files)
```

---

## Your First Script

### Simple Example: Log Hello World

```javascript
/**
 * Simple function to demonstrate GAS basics
 */
function helloWorld() {
  Logger.log('Hello, World!');

  // Access Google Sheets
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.getRange('A1').setValue('Hello from GAS!');

  return 'Success!';
}

// Run this function from the script editor
```

**To run:**
1. Save the script (Ctrl+S / Cmd+S)
2. Select function: `helloWorld`
3. Click **Run**
4. Grant permissions when prompted
5. Check **View → Logs** for output

---

## Common First Tasks

### Task 1: Read Data from Google Sheets

```javascript
/**
 * Reads customer data from Sheets
 * Learn more: docs/specialists/workspace-engineer.md
 */
function readCustomerData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Customers');

  // Use batch operation (fast!)
  const data = sheet.getDataRange().getValues();

  // Skip header row
  const customers = data.slice(1).map(row => ({
    id: row[0],
    name: row[1],
    email: row[2]
  }));

  Logger.log(`Found ${customers.length} customers`);
  return customers;
}
```

### Task 2: Call an External API

```javascript
/**
 * Fetches data from external API
 * Learn more: docs/specialists/integration-engineer.md
 */
function callExternalAPI() {
  const url = 'https://api.example.com/data';

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN',
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    });

    const statusCode = response.getResponseCode();
    if (statusCode !== 200) {
      throw new Error(`API returned status ${statusCode}`);
    }

    const data = JSON.parse(response.getContentText());
    return data;

  } catch (error) {
    Logger.log(`Error: ${error.message}`);
    throw error;
  }
}
```

### Task 3: Store Configuration Securely

```javascript
/**
 * Secure configuration management
 * Learn more: docs/specialists/security-engineer.md
 */
function setupConfiguration() {
  const props = PropertiesService.getScriptProperties();

  // Set properties (do this once, manually)
  props.setProperties({
    'API_KEY': 'your-api-key-here',
    'API_BASE_URL': 'https://api.example.com',
    'CACHE_TTL': '3600'
  });

  Logger.log('Configuration saved securely');
}

function getConfig(key) {
  const props = PropertiesService.getScriptProperties();
  const value = props.getProperty(key);

  if (!value) {
    throw new Error(`Configuration key '${key}' not found`);
  }

  return value;
}

// Usage:
function example() {
  const apiKey = getConfig('API_KEY'); // Secure!
  // Use apiKey...
}
```

---

## Learning Paths

Choose your path based on your goals and experience level:

### 🟢 Beginner Path

**Goal**: Learn GAS basics and build simple automation

1. **Start here**: [Beginner Learning Path](learning-paths/beginner.md)
2. **Duration**: 2-4 hours
3. **You'll learn**:
   - GAS environment and editor
   - Basic Sheets operations
   - Simple API calls
   - Configuration management

**First project**: Automate data entry from a form to Sheets

### 🟡 Intermediate Path

**Goal**: Build production-ready integrations with external APIs

1. **Start here**: [Intermediate Learning Path](learning-paths/intermediate.md)
2. **Duration**: 1-2 days
3. **You'll learn**:
   - OAuth2 authentication
   - Error handling and retry logic
   - Caching strategies
   - Performance optimization

**First project**: Business Central to Sheets order sync

### 🔴 Advanced Path

**Goal**: Build complex, scalable systems with AI integration

1. **Start here**: [Advanced Learning Path](learning-paths/advanced.md)
2. **Duration**: 3-5 days
3. **You'll learn**:
   - System architecture patterns
   - AI/Claude integration
   - Advanced data pipelines
   - Monitoring and observability

**First project**: AI-powered document processing system

---

## Next Steps

### Immediate Actions

1. ✅ **Complete environment setup** (above)
2. ✅ **Run your first script** (Hello World example)
3. ✅ **Choose a learning path** (Beginner/Intermediate/Advanced)

### This Week

1. 📚 **Complete your chosen learning path**
2. 🛠️ **Build your first real project** (see examples below)
3. 🧪 **Add tests** (see [Testing Guide](../testing/README.md))

### This Month

1. 🚀 **Deploy to production** (see [Deployment Guide](../deployment/README.md))
2. 📊 **Add monitoring** (see [Platform Engineer](../specialists/platform-engineer.md))
3. 🤝 **Share with team** or community

---

## Example Projects to Try

### Project 1: Simple Form to Sheets

**Complexity**: Beginner
**Time**: 1-2 hours

Build a script that:
- Reads form submissions
- Validates data
- Writes to Sheets
- Sends confirmation email

**Specialists needed**: Workspace Engineer

### Project 2: Business Central Order Sync

**Complexity**: Intermediate
**Time**: 4-8 hours

Build a script that:
- Authenticates with BC using OAuth2
- Fetches orders via OData
- Transforms and stores in Sheets
- Implements caching
- Handles errors with retry logic

**Specialists needed**: Security Engineer, BC Specialist, Data Engineer, Platform Engineer

### Project 3: AI Document Processor

**Complexity**: Advanced
**Time**: 2-3 days

Build a system that:
- Monitors Drive for new PDFs
- Extracts text with Claude AI
- Validates and structures data
- Stores in Sheets database
- Sends notifications
- Includes monitoring dashboard

**Specialists needed**: AI Integration Specialist, Document Processing Specialist, Data Engineer, Platform Engineer, Security Engineer

---

## Common Gotchas for Beginners

### 1. Quota Limits

**Problem**: "Service invoked too many times" error

**Why**: GAS has quotas (e.g., 20,000 UrlFetchApp calls/day)

**Solution**:
- Use batch operations (not row-by-row)
- Implement caching
- Add exponential backoff

**Learn more**: [Platform Engineer - Performance](../specialists/platform-engineer.md)

### 2. Execution Timeout

**Problem**: Script stops after 6 minutes

**Why**: GAS has a 6-minute execution limit

**Solution**:
- Use checkpointing for long operations
- Break into smaller chunks
- Use time-based triggers for continuation

**Learn more**: [Platform Engineer - Performance](../deep/platform/performance.md)

### 3. Authorization Issues

**Problem**: "Authorization required" errors

**Why**: Script needs permissions to access services

**Solution**:
- Run function manually first to grant permissions
- Check OAuth scopes in appsscript.json
- Ensure user has necessary access

**Learn more**: [Security Engineer](../specialists/security-engineer.md)

### 4. Caching Confusion

**Problem**: Changes not reflected immediately

**Why**: Likely hitting cached data

**Solution**:
- Understand cache TTLs
- Add cache invalidation
- Use cache keys wisely

**Learn more**: [Platform Engineer - Caching](../deep/platform/caching.md)

---

## Getting Help

### Documentation Resources

- **Orchestrator**: [ORCHESTRATOR.md](../ORCHESTRATOR.md) - Let it handle complexity
- **All Specialists**: [../specialists/](../specialists/) - Domain experts
- **Deep Documentation**: [../deep/](../deep/) - Detailed patterns
- **Troubleshooting**: [../troubleshooting.md](../troubleshooting.md) - Common issues
- **Quality Standards**: [../quality-standards.md](../quality-standards.md) - Best practices

### External Resources

- **Official GAS Docs**: [developers.google.com/apps-script](https://developers.google.com/apps-script)
- **GAS Reference**: [developers.google.com/apps-script/reference](https://developers.google.com/apps-script/reference)
- **Stack Overflow**: Tag `google-apps-script`

### Quick Reference Commands

```bash
# clasp commands
clasp push      # Upload local files to GAS
clasp pull      # Download GAS files to local
clasp open      # Open script in browser
clasp logs      # View execution logs
clasp deploy    # Create new deployment

# Common npm scripts (if configured)
npm run lint    # Check code quality
npm test        # Run tests
npm run deploy  # Deploy to production
```

---

## What's Next?

Now that you have the basics, choose your path:

### For Beginners
👉 **Start with**: [Beginner Learning Path](learning-paths/beginner.md)

### For Intermediate Users
👉 **Start with**: [Intermediate Learning Path](learning-paths/intermediate.md)

### For Advanced Users
👉 **Start with**: [Advanced Learning Path](learning-paths/advanced.md)

### For Everyone
👉 **Try the Orchestrator**: [ORCHESTRATOR.md](../ORCHESTRATOR.md) - Describe your project and let it handle the complexity!

---

## Success Stories

**"Used GAS-Agent to build BC→Sheets sync in 4 hours instead of 2 weeks!"**
- Integrated OAuth2, caching, error handling, monitoring
- All patterns came from documentation
- Production-ready on first deploy

**"The Orchestrator saved me! Just described my needs and got complete code."**
- Built AI document processor
- Never had to figure out which specialist to use
- Everything worked together perfectly

---

**Ready to build something amazing? Pick your learning path and let's go! 🚀**

---

**Version**: 1.0
**Last Updated**: November 2025
