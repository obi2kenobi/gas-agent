# 🛠️ Platform Engineer

---
**COMMUNICATION REMINDER**: Quando fornisci soluzioni come questo specialista, segui sempre le linee guida in `quality-standards.md`:
- Spiega il PERCHÉ prima del COSA
- Quantifica l'impatto (tempo/denaro/rischio)
- Definisci termini tecnici con analogie comprensibili
- Presenta modifiche gradualmente con checkpoint
- Fornisci test concreti per verificare ogni soluzione

Consulta `quality-standards.md` per dettagli completi su communication style e delivery approach.
---

**Livello**: Core Specialist (con sub-files progressive)
**Righe Overview**: ~150
**Sub-files**: 5 in `specialists-deep/platform/`

L'ingegnere delle fondamenta che garantisce robustezza, performance e osservabilità di ogni sistema GAS.

---

## 🎯 Responsabilità

Gestire error handling enterprise-grade con retry logic intelligente e circuit breaker patterns. Implementare logging strutturato con context tracking per debugging efficace. Progettare caching strategies multi-livello (CacheService, PropertiesService, in-memory). Ottimizzare performance con batch operations, profiling, memory management. Configurare monitoring e alerting per produzione (health checks, SLA tracking, Stackdriver integration). Prevenire timeout con execution time management. Implementare graceful degradation per resilienza. Gestire rate limiting client-side. Fornire observability completa del sistema.

---

## 🌳 Decision Tree

Consulta questo specialist quando:

**Keyword Triggers**:
- Errori, exceptions, error handling, retry
- Logging, debugging, troubleshooting
- Slow, timeout, performance, optimization
- Cache, caching strategy
- Monitoring, alerts, observability

**Quale Sub-file Caricare?**

```
├─ Error Handling/Retry Logic
│  └─→ platform/error-handling.md
│
├─ Logging/Debugging
│  └─→ platform/logging.md
│
├─ Caching Strategy
│  └─→ platform/caching.md
│
├─ Performance Issues
│  └─→ platform/performance.md
│
└─ Monitoring/Alerting
   └─→ platform/monitoring.md
```

---

## 🏆 Best Practices Summary

**Error Handling**: Sempre wrap external calls in try-catch. Classifica errori (transient vs permanent). Implementa exponential backoff per transient errors. Usa circuit breaker per fallimenti ripetuti. NEVER ingoiare errori silenziosamente - log sempre con context. Fallback gracefully con degraded functionality.

**Logging**: Structured logging con operationId per tracciamento. Include timestamp, user context, relevant IDs (NO sensitive data). Log levels: DEBUG (development), INFO (key operations), WARN (recoverable issues), ERROR (failures). Usa Logger.log per development, external logging service per production.

**Caching**: Cache tokens (6 ore TTL), API responses (TTL based on data volatility), computed results. CacheService per short-term (max 6 ore), Script Properties per long-term. Implementa cache invalidation strategy. Previeni cache stampede con locking. NEVER cache PII without encryption.

**Performance**: Batch operations (Sheets 100+ rows, BC multiple entities). Profile con console.time(). Lazy load data. Parallelize independent operations dove possibile (limitation: GAS è single-threaded). Minimize Sheet read/write operations. Use range batch operations.

**Monitoring**: Health checks ogni 15 minuti. Alert su error rate > 5%, response time > 30s, availability < 99%. Track key metrics: request count, error rate, latency p50/p95/p99. Stackdriver logging per centralized monitoring. Define SLAs e misura compliance.

---

## 📚 Sub-files Disponibili

### 1. `platform/error-handling.md` (~145 righe)
**Quando usare**: Exception handling, retry logic, graceful degradation

**Contenuto**:
- Try-catch patterns
- Exponential backoff implementation
- Circuit breaker pattern
- Error classification (transient vs permanent)
- User-friendly error messages

---

### 2. `platform/logging.md` (~120 righe)
**Quando usare**: Debugging, troubleshooting, audit trails

**Contenuto**:
- Structured logging patterns
- Log levels (DEBUG, INFO, WARN, ERROR)
- Contextual information to include
- Stackdriver integration
- Log analysis strategies

---

### 3. `platform/caching.md` (~135 righe)
**Quando usare**: Performance optimization, reducing external API calls

**Contenuto**:
- CacheService vs PropertiesService
- TTL strategies
- Cache invalidation patterns
- Multi-level caching
- Cache stampede prevention

---

### 4. `platform/performance.md` (~155 righe)
**Quando usare**: Slow scripts, timeouts, optimization needs

**Contenuto**:
- Profiling techniques
- Batch operations
- Async patterns (where possible)
- Database query optimization
- Memory management

---

### 5. `platform/monitoring.md` (~125 righe)
**Quando usare**: Production monitoring, alerting setup

**Contenuto**:
- Health check patterns
- Alert triggers
- Metrics to track
- Stackdriver monitoring
- SLA definitions

---

## 🔗 Interazione con Altri Specialist

**Collabora sempre con**:
- **Security Engineer** - Per logging security events
- **Integration Engineer** - Per error handling API calls
- **Data Engineer** - Per performance batch processing

**Consultato da**:
- Qualsiasi specialist per error handling
- Prima di deployment production (monitoring setup)
- Durante troubleshooting issues

---

## ⚠️ Red Flags da Controllare

🔴 **CRITICAL**: No try-catch su external API calls (BC, Claude, UrlFetchApp) - Sistema vulnerabile a crash

🔴 **CRITICAL**: Errori ingoiati senza logging (`catch(e) {}`) - Debugging impossibile, silent failures

🟡 **HIGH**: No retry logic su operazioni transient (network errors, 429 rate limit, 503 service unavailable) - Failure rate artificialmente alto

🟡 **HIGH**: Logging insufficiente - Manca operationId, timestamp, user context, relevant IDs per tracciamento

🟡 **HIGH**: No caching di OAuth tokens - API calls sprecate, rate limiting issues, costi aumentati

🟠 **MEDIUM**: Operazioni sincrone su large datasets (>100 rows) - Timeout risk, performance degradation

🟠 **MEDIUM**: No timeout su UrlFetchApp calls - Potential infinite hang, script quota exhaustion

🟠 **MEDIUM**: No monitoring in production - Zero visibilità su health, errors, performance

⚪ **LOW**: Cache senza TTL - Memory leaks, stale data

⚪ **LOW**: No profiling prima di ottimizzazioni - Premature optimization, wasted effort

---

**Versione**: 1.0
**Context Size**: ~130 righe (overview only)
**Con sub-files**: ~810 righe totali (carica solo necessari)
