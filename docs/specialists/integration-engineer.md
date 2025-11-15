# 🔌 Integration Engineer

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
**Righe Overview**: ~145
**Sub-files**: 4 in `specialists-deep/integration/`

L'architetto delle integrazioni che connette GAS con API esterne, gestisce OAuth2 flows, e implementa sync mechanisms robusti.

---

## 🎯 Responsabilità

Implementare integrazioni con external APIs usando UrlFetchApp con best practices. Gestire OAuth2 flows completi (authorization code, client credentials, token exchange, refresh). Configurare HTTP requests con headers corretti, timeout, retry logic. Parsare e validare responses (JSON/XML) con error handling. Implementare webhook endpoints con signature verification e idempotency. Progettare sync strategies (full sync, incremental, real-time). Gestire API rate limiting client-side. Implementare circuit breaker per APIs instabili. Handle transient failures con exponential backoff. Monitorare API health e response times.

---

## 🌳 Decision Tree

Consulta questo specialist quando:

**Keyword Triggers**:
- External API, REST API, HTTP
- OAuth2 flow, authentication
- Webhook, callback, sync
- API integration, third-party service
- Response parsing, JSON/XML

**Quale Sub-file Caricare?**

```
├─ OAuth2 Implementation
│  └─→ integration/oauth2-implementation.md
│
├─ HTTP Patterns/Best Practices
│  └─→ integration/http-patterns.md
│
├─ Response Parsing/Validation
│  └─→ integration/response-parsing.md
│
└─ Webhooks/Sync Mechanisms
   └─→ integration/webhooks-sync.md
```

---

## 🏆 Best Practices Summary

**HTTP Requests**: Set muteHttpExceptions: true per gestire status codes manualmente. Configure timeout (default 60s, tipicamente 30s sufficient). Include User-Agent header. Retry 429 (rate limit) e 5xx (server errors) con exponential backoff. Log request URL, method, status code (NO auth tokens in logs). Validate SSL certificates (no insecure connections).

**OAuth2**: Use state parameter per security (CSRF protection). Store tokens in User Properties (user-specific) o Script Properties (service account). Implement automatic token refresh 5 min before expiry. NEVER log token values. Handle authorization failures gracefully. Test token expiry scenarios. Use minimal scopes necessari.

**Response Parsing**: Validate HTTP status code prima di parse. Catch JSON.parse() errors. Validate response schema con expected fields. Handle missing/null values gracefully. Type coercion con validation. Error responses often have different structure - handle separately. Log parsing errors con request context.

**Webhooks**: Verify signature per security (HMAC-SHA256 tipicamente). Implement idempotency - store processed webhook IDs. Return 200 immediately, process async se possibile. Handle duplicate deliveries. Timeout protection (webhooks can retry). Log all webhook calls for audit. Test with webhook.site in development.

**Sync Strategies**: Full sync - simple ma slow, use for small datasets. Incremental sync - track lastModified, efficient. Real-time - webhooks + fallback polling. Conflict resolution strategy - last-write-wins o manual review. Batch operations quando API supports. Handle partial failures - track sync state per entity.

**Rate Limiting**: Respect API quotas - track requests count client-side. Implement client-side throttling. Exponential backoff per 429 responses. Cache aggressively per ridurre API calls. Batch operations quando possible. Monitor rate limit headers (X-RateLimit-Remaining). Alert quando approaching limits.

---

## 📚 Sub-files Disponibili

### 1. `integration/oauth2-implementation.md` (~155 righe)
**Quando usare**: Implementing OAuth2 flow for external services

**Contenuto**:
- Authorization code flow
- Client credentials flow
- Token exchange
- Refresh token handling
- State parameter security

---

### 2. `integration/http-patterns.md` (~145 righe)
**Quando usare**: Making HTTP requests, handling responses

**Contenuto**:
- UrlFetchApp best practices
- Request headers & body formatting
- Status code handling
- Timeout configuration
- Connection pooling

---

### 3. `integration/response-parsing.md` (~125 righe)
**Quando usare**: Processing API responses

**Contenuto**:
- JSON parsing & validation
- XML parsing
- Error response handling
- Schema validation
- Type coercion

---

### 4. `integration/webhooks-sync.md` (~135 righe)
**Quando usare**: Implementing webhooks, sync mechanisms

**Contenuto**:
- Webhook signature verification
- Idempotency patterns
- Sync strategies (full vs incremental)
- Conflict resolution
- Retry & dead letter queues

---

## 🔗 Interazione con Altri Specialist

**Collabora sempre con**:
- **Security Engineer** - Per OAuth2 e API security
- **Platform Engineer** - Per error handling e retry logic
- **BC Specialist** - Per Business Central API integration

**Consultato da**:
- BC Specialist per BC API calls
- Workspace Engineer per external service integration

---

## ⚠️ Red Flags da Controllare

🔴 **CRITICAL**: No error handling su API calls (missing try-catch, no status code check) - Silent failures, data corruption

🔴 **CRITICAL**: Auth tokens in URL query params - Security vulnerability (logs, browser history, proxies)

🔴 **CRITICAL**: muteHttpExceptions: false (default) - Unhandled exceptions, script crash

🟡 **HIGH**: Response non validata (no schema check, no null handling) - Runtime errors, data corruption

🟡 **HIGH**: No retry logic per transient failures (429, 5xx) - Artificially high failure rate

🟡 **HIGH**: Token non refreshed automaticamente - Service interruption quando token expires

🟡 **HIGH**: Webhook senza signature verification - Security vulnerability, spoofing attacks

🟠 **MEDIUM**: Rate limiting ignorato - API quota exhausted, service blocked

🟠 **MEDIUM**: No timeout configuration - Script hangs indefinitely, quota exhaustion

🟠 **MEDIUM**: OAuth senza state parameter - CSRF vulnerability

🟠 **MEDIUM**: No caching di API responses - Excessive API calls, cost increase, rate limits

⚪ **LOW**: Generic error messages - Difficult debugging

⚪ **LOW**: No API health monitoring - Blind to degradation

---

**Versione**: 1.0
**Context Size**: ~125 righe (overview only)
**Con sub-files**: ~685 righe totali (carica solo necessari)
