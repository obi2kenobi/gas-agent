# 🛠️ CI/CD Scripts

Utility scripts for the gas-Agent CI/CD pipeline.

---

## 📦 Available Scripts

### Deployment

#### `deploy.sh`
Main deployment script for all environments.

**Usage:**
```bash
./deploy.sh [environment]
```

**Environments:**
- `dev` - Development environment
- `staging` - Staging environment
- `production` - Production environment

**Features:**
- Pre-deployment validation
- Automated push to Google Apps Script
- Version creation
- Post-deployment verification
- Deployment logging

**Example:**
```bash
# Deploy to development
./deploy.sh dev

# Deploy to production
./deploy.sh production
```

---

### Quality Checks

#### `lint-gas.sh`
Code quality checks for Google Apps Script files.

**Checks:**
- Documentation coverage
- Naming conventions
- Code complexity
- Function length

**Usage:**
```bash
./lint-gas.sh
```

#### `pre-deploy-check.sh`
Pre-deployment validation checks.

**Checks:**
- No hardcoded secrets
- Valid .clasp.json
- No console.log usage
- Required files exist
- Git status

**Usage:**
```bash
./pre-deploy-check.sh
```

#### `security-scan.sh`
Security scanning for production deployments.

**Checks:**
- Hardcoded credentials
- API keys in code
- Dangerous functions (eval)
- Secure credential storage

**Usage:**
```bash
./security-scan.sh
```

---

### Backup & Recovery

#### `backup-prod.sh`
Create backup of production environment.

**Usage:**
```bash
./backup-prod.sh
```

**Output:**
- Creates `backups/prod_backup_TIMESTAMP.tar.gz`

#### `rollback.sh`
Rollback to previous production version.

**Usage:**
```bash
# Rollback to specific commit
./rollback.sh <commit-sha>

# Rollback to last backup
./rollback.sh
```

---

### Verification

#### `verify-deploy.sh`
Verify deployment was successful.

**Usage:**
```bash
./verify-deploy.sh [environment]
```

**Example:**
```bash
./verify-deploy.sh production
```

---

## 🔧 Setup

### Make Scripts Executable

```bash
chmod +x .github/scripts/*.sh
```

### Requirements

- **clasp CLI**: `npm install -g @google/clasp`
- **Git**: For version control
- **tar**: For backups (usually pre-installed)
- **grep**: For security scanning (usually pre-installed)

---

## 🚀 GitHub Actions Integration

These scripts are called by GitHub Actions workflows:

### test.yml
- Uses: `lint-gas.sh`
- Trigger: Push to any branch, PRs to main

### deploy-dev.yml
- Uses: `deploy.sh`, `pre-deploy-check.sh`
- Trigger: Push to `claude/**` branches

### deploy-prod.yml
- Uses: `deploy.sh`, `security-scan.sh`, `backup-prod.sh`, `verify-deploy.sh`, `rollback.sh`
- Trigger: Push to `main`, manual dispatch

### quality-check.yml
- Uses: Various checks inline
- Trigger: PRs, pushes to main and claude branches

---

## 📊 Workflow Diagram

```
┌─────────────────────┐
│   Code Changes      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Quality Checks     │◄── lint-gas.sh
│  security-scan.sh   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Pre-Deploy Checks   │◄── pre-deploy-check.sh
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Backup (Prod)      │◄── backup-prod.sh
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    Deployment       │◄── deploy.sh
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    Verification     │◄── verify-deploy.sh
└──────────┬──────────┘
           │
           ├─── SUCCESS ✅
           │
           └─── FAILURE ❌
                   │
                   ▼
           ┌─────────────────────┐
           │     Rollback        │◄── rollback.sh
           └─────────────────────┘
```

---

## 🔐 Security Features

### Secret Detection
All scripts check for:
- Hardcoded passwords
- API keys
- Tokens
- Credentials

### Safe Defaults
- Scripts exit on error (`set -e`)
- Validation before destructive operations
- Confirmation required for production

### Backup Strategy
- Automatic backups before production deployments
- Timestamped backup archives
- Quick rollback capability

---

## 🎯 Best Practices

### 1. Always Test First
```bash
# Test in dev first
./deploy.sh dev

# Then staging
./deploy.sh staging

# Finally production
./deploy.sh production
```

### 2. Review Security Scans
```bash
# Run security scan manually
./security-scan.sh

# Fix any issues before deploying
```

### 3. Keep Backups
```bash
# Backups are automatic, but you can create manual ones
./backup-prod.sh
```

### 4. Use Version Tags
```bash
# Tag important releases
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
```

---

## 🐛 Troubleshooting

### "clasp not found"
```bash
npm install -g @google/clasp
```

### "Permission denied"
```bash
chmod +x .github/scripts/*.sh
```

### ".clasp.json not found"
```bash
# Create .clasp.json with your script ID
echo '{"scriptId": "YOUR_SCRIPT_ID"}' > .clasp.json
```

### "Deployment failed"
```bash
# Check logs
cat deployment-*.log

# Try rollback
./rollback.sh
```

---

## 📚 Related Documentation

- **GitHub Actions**: [../.github/workflows/](../workflows/)
- **Deployment Guide**: [../../docs/deployment/](../../docs/deployment/)
- **Quality Standards**: [../../docs/quality-standards.md](../../docs/quality-standards.md)

---

## ✨ Contributing

When adding new scripts:

1. **Make executable**: `chmod +x script.sh`
2. **Add header**: Include purpose and usage
3. **Add error handling**: Use `set -e`
4. **Document here**: Update this README
5. **Test thoroughly**: Test in dev first

---

**Last Updated:** November 2024
**Maintained by:** gas-Agent Team
