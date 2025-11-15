# 🚀 Deployment & CI/CD Guide

**Deploy Google Apps Script projects with confidence**

---

## Overview

This guide covers:
- Local development setup with clasp
- Deployment strategies
- CI/CD automation with GitHub Actions
- Environment management
- Rollback procedures

---

## Prerequisites

- Node.js (v14+)
- Git
- Google Account
- Basic command line knowledge

---

## Setup clasp (Command Line Apps Script)

### Installation

```bash
# Install clasp globally
npm install -g @google/clasp

# Login to Google
clasp login

# This opens browser for OAuth authorization
```

### Initialize Project

**Option 1: New Project**
```bash
# Create new standalone project
clasp create --title "My GAS Project" --type standalone

# Or create bound to Sheets
clasp create --title "My Project" --type sheets --parentId SPREADSHEET_ID
```

**Option 2: Clone Existing**
```bash
# Get script ID from: script.google.com → Project Settings
clasp clone SCRIPT_ID

# Files downloaded to current directory
```

### Project Structure

```
my-gas-project/
├── .clasp.json          # clasp configuration
├── .claspignore         # Files to ignore
├── appsscript.json      # GAS manifest
├── package.json         # npm configuration
├── .gitignore           # Git ignore
├── README.md            # Project documentation
└── src/
    ├── Code.gs
    ├── Config.gs
    └── ... (other .gs files)
```

**`.clasp.json`**:
```json
{
  "scriptId": "YOUR_SCRIPT_ID",
  "rootDir": "./src",
  "fileExtension": "gs"
}
```

**`.claspignore`**:
```
**/**
!src/**/*.gs
!src/**/*.html
!appsscript.json
```

---

## Development Workflow

### Basic Commands

```bash
# Push local changes to GAS
clasp push

# Pull changes from GAS to local
clasp pull

# Open script in browser
clasp open

# View execution logs
clasp logs

# List deployments
clasp deployments

# Create new deployment
clasp deploy --description "v1.0.0"
```

### Development Cycle

```bash
# 1. Make code changes locally
vim src/Code.gs

# 2. Push to GAS
clasp push

# 3. Test in GAS editor or via clasp
clasp open
# Or
clasp run functionName

# 4. Check logs
clasp logs

# 5. Commit to git
git add .
git commit -m "Add feature X"
git push
```

---

## Environment Management

### Strategy: Multiple Deployments

Maintain separate deployments for different environments:

```
Development  → @HEAD (latest code)
Staging      → @1 (deployment ID)
Production   → @2 (deployment ID)
```

### Setup Environments

**1. Create Deployments**:
```bash
# Create staging deployment
clasp deploy --description "Staging" --deploymentId STAGING_ID

# Create production deployment
clasp deploy --description "Production" --deploymentId PRODUCTION_ID
```

**2. Track Deployment IDs**:

Create `deployments.json`:
```json
{
  "development": "@HEAD",
  "staging": "@1",
  "production": "@2"
}
```

**3. Environment-Specific Config**:

```javascript
// Config.gs
function getConfig() {
  const deployment = ScriptApp.getProjectId();

  const configs = {
    'STAGING_SCRIPT_ID': {
      env: 'staging',
      apiUrl: 'https://staging-api.example.com',
      debugMode: true
    },
    'PRODUCTION_SCRIPT_ID': {
      env: 'production',
      apiUrl: 'https://api.example.com',
      debugMode: false
    }
  };

  return configs[deployment] || configs['STAGING_SCRIPT_ID'];
}
```

---

## CI/CD with GitHub Actions

### Setup GitHub Actions

**`.github/workflows/deploy.yml`**:
```yaml
name: Deploy to Google Apps Script

on:
  push:
    branches:
      - main      # Deploy to production
      - staging   # Deploy to staging
  pull_request:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install clasp
        run: npm install -g @google/clasp

      - name: Create .clasprc.json
        run: |
          echo '${{ secrets.CLASPRC_JSON }}' > ~/.clasprc.json

      - name: Deploy to staging
        run: |
          clasp push
          clasp deploy --deploymentId ${{ secrets.STAGING_DEPLOYMENT_ID }} --description "Staging $(date +%Y-%m-%d)"

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install clasp
        run: npm install -g @google/clasp

      - name: Create .clasprc.json
        run: |
          echo '${{ secrets.CLASPRC_JSON }}' > ~/.clasprc.json

      - name: Deploy to production
        run: |
          clasp push
          clasp deploy --deploymentId ${{ secrets.PRODUCTION_DEPLOYMENT_ID }} --description "Release $(date +%Y-%m-%d)"

      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v${{ github.run_number }}
          release_name: Release v${{ github.run_number }}
          body: Automated release
```

### Setup GitHub Secrets

1. **Get clasp credentials**:
```bash
# Login with clasp (if not already)
clasp login

# Find credentials file
cat ~/.clasprc.json
```

2. **Add to GitHub Secrets**:
   - Go to: Repository → Settings → Secrets → Actions
   - Add secret: `CLASPRC_JSON` with content of `.clasprc.json`
   - Add secret: `STAGING_DEPLOYMENT_ID`
   - Add secret: `PRODUCTION_DEPLOYMENT_ID`
   - Add secret: `SCRIPT_ID`

---

## Deployment Strategies

### 1. Manual Deployment

```bash
# Test locally first
npm run test

# Deploy to staging
clasp push
clasp deploy --deploymentId STAGING_ID --description "Version 1.2.0"

# Test staging
# ... manual testing ...

# Deploy to production
clasp deploy --deploymentId PRODUCTION_ID --description "Version 1.2.0"
```

### 2. Blue-Green Deployment

Maintain two production deployments and switch between them:

```javascript
// Switch traffic by updating web app URL
function switchToBlueDeployment() {
  // Update config or redirect logic
  PropertiesService.getScriptProperties()
    .setProperty('ACTIVE_DEPLOYMENT', 'BLUE');
}

function switchToGreenDeployment() {
  PropertiesService.getScriptProperties()
    .setProperty('ACTIVE_DEPLOYMENT', 'GREEN');
}
```

### 3. Canary Deployment

Route small percentage of traffic to new version:

```javascript
function shouldUseCanaryVersion(userId) {
  // 10% of users get canary
  const hash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5,
    userId
  );
  return (hash[0] % 10) === 0;
}

function routeRequest(userId) {
  if (shouldUseCanaryVersion(userId)) {
    return callCanaryVersion();
  } else {
    return callStableVersion();
  }
}
```

---

## Deployment Checklist

Before deploying to production:

### Pre-Deployment

- [ ] All tests passing
- [ ] Code reviewed
- [ ] Changelog updated
- [ ] Version number bumped
- [ ] Staging tested successfully
- [ ] Database migrations prepared (if any)
- [ ] Configuration verified
- [ ] Dependencies up to date

### Deployment

- [ ] Deploy during low-traffic window
- [ ] Monitor logs for errors
- [ ] Verify key functionality
- [ ] Check health checks
- [ ] Test critical paths

### Post-Deployment

- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify data integrity
- [ ] Update documentation
- [ ] Notify stakeholders
- [ ] Tag release in Git

---

## Rollback Procedures

### Quick Rollback

**Option 1: Revert to previous deployment**
```bash
# List deployments
clasp deployments

# Use previous deployment ID
clasp deploy --deploymentId PREVIOUS_ID --description "Rollback"
```

**Option 2: Redeploy last stable code**
```bash
# Checkout last stable commit
git checkout v1.1.0

# Push and deploy
clasp push
clasp deploy --deploymentId PRODUCTION_ID --description "Rollback to v1.1.0"
```

### Emergency Rollback Script

```javascript
/**
 * Emergency rollback function
 * Run this manually if deployment fails
 */
function emergencyRollback() {
  try {
    // Disable new code path
    PropertiesService.getScriptProperties()
      .setProperty('FEATURE_FLAG_NEW_CODE', 'false');

    // Switch to backup deployment
    PropertiesService.getScriptProperties()
      .setProperty('ACTIVE_DEPLOYMENT', 'STABLE');

    // Clear cache to force reload
    CacheService.getScriptCache().removeAll();

    Logger.log('✓ Emergency rollback complete');

    // Send alert
    MailApp.sendEmail({
      to: getConfig('ALERT_EMAIL'),
      subject: '🚨 Emergency Rollback Executed',
      body: `Rollback completed at ${new Date()}`
    });

  } catch (error) {
    Logger.log(`✗ Rollback failed: ${error.message}`);
    throw error;
  }
}
```

---

## Monitoring After Deployment

### Health Check

```javascript
/**
 * Health check endpoint
 * Call after deployment to verify
 */
function healthCheck() {
  const checks = {
    timestamp: new Date(),
    version: getVersion(),
    environment: getConfig().env,
    tests: {}
  };

  // Test database connection
  try {
    SpreadsheetApp.getActiveSpreadsheet();
    checks.tests.database = 'OK';
  } catch (error) {
    checks.tests.database = 'FAIL: ' + error.message;
  }

  // Test external API
  try {
    const token = OAuth2Manager.getToken();
    checks.tests.oauth = 'OK';
  } catch (error) {
    checks.tests.oauth = 'FAIL: ' + error.message;
  }

  // Test cache
  try {
    CacheService.getScriptCache().put('health_check', 'ok', 60);
    checks.tests.cache = 'OK';
  } catch (error) {
    checks.tests.cache = 'FAIL: ' + error.message;
  }

  checks.healthy = Object.values(checks.tests)
    .every(status => status === 'OK');

  return checks;
}
```

### Automated Monitoring

```javascript
/**
 * Setup monitoring trigger after deployment
 */
function setupPostDeploymentMonitoring() {
  // Create trigger to check health every 5 minutes for first hour
  for (let i = 0; i < 12; i++) {
    ScriptApp.newTrigger('monitorHealth')
      .timeBased()
      .after(5 * 60 * 1000 * (i + 1)) // 5, 10, 15... 60 minutes
      .create();
  }
}

function monitorHealth() {
  const health = healthCheck();

  if (!health.healthy) {
    // Send alert
    MailApp.sendEmail({
      to: getConfig('ALERT_EMAIL'),
      subject: '⚠️ Post-Deployment Health Check Failed',
      body: JSON.stringify(health, null, 2)
    });
  } else {
    Logger.log('Health check passed');
  }
}
```

---

## Version Management

### Semantic Versioning

Use semantic versioning: `MAJOR.MINOR.PATCH`

```javascript
// Version.gs
const VERSION = '1.2.3';

function getVersion() {
  return {
    version: VERSION,
    major: 1,
    minor: 2,
    patch: 3,
    deployedAt: getDeploymentTimestamp()
  };
}
```

### Changelog

Maintain `CHANGELOG.md`:

```markdown
# Changelog

## [1.2.3] - 2025-11-15

### Added
- OAuth2 token refresh with 5-min buffer
- Health check endpoint

### Changed
- Improved error messages
- Updated cache TTL to 6 hours

### Fixed
- Token refresh race condition
- Memory leak in order sync

### Deprecated
- `getOrderById()` - Use `getOrders({ id: '...' })` instead
```

---

## Best Practices

### 1. Always Use Version Control

✅ Commit all code changes
✅ Use meaningful commit messages
✅ Tag releases
✅ Branch for features

### 2. Test Before Deploy

✅ Run automated tests
✅ Manual testing in staging
✅ Smoke tests in production

### 3. Deploy During Low Traffic

✅ Schedule deployments
✅ Notify users if needed
✅ Have rollback plan ready

### 4. Monitor After Deploy

✅ Watch logs for errors
✅ Check performance metrics
✅ Verify critical paths
✅ Be ready to rollback

### 5. Document Everything

✅ Keep changelog updated
✅ Document configuration changes
✅ Update README
✅ Note any manual steps

---

## Troubleshooting Deployments

### "Invalid credentials"

**Solution**: Refresh clasp login
```bash
clasp logout
clasp login
```

### "Script ID not found"

**Solution**: Check `.clasp.json` has correct scriptId

### "Push failed: Exceeded maximum script length"

**Solution**:
- Remove unused code
- Split into multiple files
- Use libraries for shared code

### "Deployment failed: Version already exists"

**Solution**: Create new deployment or update existing:
```bash
clasp deploy --deploymentId EXISTING_ID
```

---

## Related Documentation

- **Testing**: [../testing/README.md](../testing/README.md)
- **Troubleshooting**: [../troubleshooting.md](../troubleshooting.md)
- **Quality Standards**: [../quality-standards.md](../quality-standards.md)

---

**Deploy with confidence! 🚀**

**Version**: 1.0
**Last Updated**: November 2025
