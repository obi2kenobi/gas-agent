# 📑 GAS-Agent Documentation Index

Quick reference guide for navigating the GAS-Agent documentation system.

---

## 🎯 Specialist Overview Files

Load these first to get task-specific guidance and decision trees (~150 lines each):

| Specialist | File | Focus Areas |
|------------|------|-------------|
| **Security Engineer** | `specialists/security-engineer.md` | OAuth2, RBAC, GDPR, Audit Logging |
| **Platform Engineer** | `specialists/platform-engineer.md` | Error Handling, Caching, Performance, Monitoring |
| **AI Integration Specialist** | `specialists/ai-integration-specialist.md` | Claude API, Prompts, Token Optimization |
| **Integration Engineer** | `specialists/integration-engineer.md` | HTTP, Webhooks, OAuth2, BC Integration |
| **Data Engineer** | `specialists/data-engineer.md` | Sheets as Database, ETL, Queries |
| **Solution Architect** | `specialists/solution-architect.md` | Design Patterns, SOLID, Architecture |
| **Workspace Engineer** | `specialists/workspace-engineer.md` | Sheets, Drive, Gmail Operations |
| **Business Logic Engineer** | `specialists/business-logic-engineer.md` | Business Rules, Validation |
| **UI Engineer** | `specialists/ui-engineer.md` | HTML Service, Sidebars, Dialogs |
| **Document Processing** | `specialists/document-processing-specialist.md` | PDF, DOCX, OCR, Parsing |
| **Documentation Engineer** | `specialists/documentation-engineer.md` | JSDoc, Code Documentation |
| **BC Specialist** | `specialists/bc-specialist.md` | Business Central Expert |

---

## 🔍 Deep Documentation Files

Detailed implementation patterns (400-800 lines each):

### 🔒 Security (6 files - ~3,247 lines)

| File | Topics | Lines |
|------|--------|-------|
| `deep/security/oauth2-patterns.md` | OAuth2 flows, token refresh, service accounts | ~420 |
| `deep/security/properties-security.md` | PropertiesService security, encryption | ~475 |
| `deep/security/sensitive-data.md` | PII handling, GDPR compliance | ~563 |
| `deep/security/deployment-security.md` | Web app security, CSP, CORS | ~502 |
| `deep/security/authorization.md` | RBAC, permissions, access control | ~648 |
| `deep/security/audit-compliance.md` | Audit logging, compliance | ~639 |

**Use for**: Authentication, authorization, data protection, compliance

---

### ⚙️ Platform (5 files - ~3,291 lines)

| File | Topics | Lines |
|------|--------|-------|
| `deep/platform/error-handling.md` | Try-catch, exponential backoff, circuit breaker | ~620 |
| `deep/platform/logging.md` | Structured logging, log levels | ~543 |
| `deep/platform/caching.md` | Multi-level cache, stampede prevention | ~663 |
| `deep/platform/performance.md` | Batch operations, checkpointing, optimization | ~717 |
| `deep/platform/monitoring.md` | Health checks, metrics, alerting | ~748 |

**Use for**: Reliability, performance, observability

---

### 🤖 AI Integration (7 files - ~4,700 lines)

| File | Topics | Lines |
|------|--------|-------|
| `deep/ai-integration/api-setup.md` | Claude API setup, authentication | ~544 |
| `deep/ai-integration/prompt-engineering.md` | XML prompts, few-shot, chain-of-thought | ~843 |
| `deep/ai-integration/document-processing.md` | Chunking, table parsing, extraction | ~871 |
| `deep/ai-integration/token-optimization.md` | Caching, compression, model selection | ~731 |
| `deep/ai-integration/multi-turn.md` | Session state, conversation management | ~669 |
| `deep/ai-integration/error-handling-ai.md` | AI error classification, fallbacks | ~765 |
| `deep/ai-integration/context-management.md` | 200K window optimization, summarization | ~573 |

**Use for**: Claude AI integration, document processing, intelligent automation

---

### 🔗 Integration (4 files - ~2,643 lines)

| File | Topics | Lines |
|------|--------|-------|
| `deep/integration/oauth2-implementation.md` | Authorization code flow, PKCE | ~537 |
| `deep/integration/http-patterns.md` | UrlFetchApp, retry logic, parallel requests | ~720 |
| `deep/integration/response-parsing.md` | JSON/XML parsing, validation | ~682 |
| `deep/integration/webhooks-sync.md` | Webhook handlers, HMAC verification, sync | ~704 |

**Use for**: External API integration, HTTP operations, webhooks

---

### 💼 Business Central (2 files - ~1,183 lines)

| File | Topics | Lines |
|------|--------|-------|
| `deep/bc/entities.md` | BC data model, entity relationships | ~572 |
| `deep/bc/odata-patterns.md` | OData queries, $filter, $expand | ~611 |

**Use for**: Business Central integration, OData operations

---

### 📊 Workspace (3 files - ~1,756 lines)

| File | Topics | Lines |
|------|--------|-------|
| `deep/workspace/sheets-patterns.md` | Batch operations, formulas, named ranges | ~723 |
| `deep/workspace/drive-gmail.md` | Drive operations, email automation | ~633 |
| `deep/workspace/properties-triggers.md` | PropertiesService, time-based triggers | ~400 |

**Use for**: Google Workspace automation (Sheets, Drive, Gmail)

---

### 🏗️ Architecture (2 files - ~650 lines)

| File | Topics | Lines |
|------|--------|-------|
| `deep/architecture/patterns.md` | Repository, Service Layer, Factory, Strategy | ~350 |
| `deep/architecture/principles.md` | SOLID principles in GAS context | ~300 |

**Use for**: Scalable architecture, design patterns, code organization

---

### 📁 Data Engineering (3 files - ~1,150 lines)

| File | Topics | Lines |
|------|--------|-------|
| `deep/data/sheets-database.md` | CRUD operations, PK/FK, indexes, transactions | ~400 |
| `deep/data/query-patterns.md` | QUERY function, FILTER, SORT, lookups | ~350 |
| `deep/data/etl-patterns.md` | Extract/Transform/Load, incremental sync | ~300 |

**Use for**: Treating Sheets as database, data pipelines, ETL

---

## 🎯 Quick Navigation by Task

### Task: Secure API Integration

1. Load: `specialists/security-engineer.md`
2. Then: `deep/security/oauth2-patterns.md`
3. And: `deep/integration/oauth2-implementation.md`

### Task: Performance Optimization

1. Load: `specialists/platform-engineer.md`
2. Then: `deep/platform/performance.md`
3. And: `deep/workspace/sheets-patterns.md` (if Sheets)

### Task: Claude AI Integration

1. Load: `specialists/ai-integration-specialist.md`
2. Then: `deep/ai-integration/api-setup.md`
3. Then: `deep/ai-integration/prompt-engineering.md`
4. And: `deep/ai-integration/token-optimization.md`

### Task: Business Central Sync

1. Load: `specialists/bc-specialist.md`
2. Then: `deep/bc/odata-patterns.md`
3. And: `deep/data/etl-patterns.md`
4. And: `deep/integration/webhooks-sync.md`

### Task: Database on Sheets

1. Load: `specialists/data-engineer.md`
2. Then: `deep/data/sheets-database.md`
3. And: `deep/data/query-patterns.md`
4. And: `deep/workspace/sheets-patterns.md`

---

## 📊 File Size Guide

| Size Range | File Count | Purpose |
|------------|------------|---------|
| 100-200 lines | 12 files | Specialist overviews |
| 400-600 lines | 18 files | Focused deep topics |
| 600-800 lines | 11 files | Comprehensive deep topics |
| 800+ lines | 3 files | Complex topics (AI prompts, document processing) |

---

## 🔄 Typical Loading Pattern

```
Step 1: Load Specialist Overview (~150 lines)
   ↓
Step 2: Follow Decision Tree
   ↓
Step 3: Load 1-3 Deep Files (~1,500 lines total)
   ↓
Step 4: Implement with code examples
```

**Result**: 74-85% context savings vs loading all documentation

---

## 📞 Support

For questions or issues, refer to the main README.md or open an issue on GitHub.

**Documentation Version**: 1.0
**Last Updated**: November 2025
