# 🔐 OAuth2 Patterns for Google Apps Script

**Part of**: Security Engineer specialist
**Riferimento**: `.gas-agent/specialists/security-engineer.md`

---

## 🎯 Overview

OAuth2 implementation patterns specifici per GAS, coprendo service account authentication, user authorization flows, token management, e scope configuration.

---

## 📚 OAuth2 Flow Types

### Service Account (Server-to-Server)

**Quando usare**: Accesso a risorse di sistema, operazioni batch, integrazioni backend (es. Business Central API, Claude API).

**Pattern**:
```javascript
// Service Account OAuth2 for BC
function getServiceAccountToken() {
  const clientId = PropertiesService.getScriptProperties().getProperty('BC_CLIENT_ID');
  const clientSecret = PropertiesService.getScriptProperties().getProperty('BC_CLIENT_SECRET');
  const tenantId = PropertiesService.getScriptProperties().getProperty('BC_TENANT_ID');

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const payload = {
    'client_id': clientId,
    'client_secret': clientSecret,
    'scope': 'https://api.businesscentral.dynamics.com/.default',
    'grant_type': 'client_credentials'
  };

  try {
    const response = UrlFetchApp.fetch(tokenUrl, {
      method: 'post',
      contentType: 'application/x-www-form-urlencoded',
      payload: payload,
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      throw new Error(`Token fetch failed: ${response.getContentText()}`);
    }

    const tokenData = JSON.parse(response.getContentText());

    // Cache token (expires in 3600s, cache for 3300s = 55 min)
    const cacheKey = 'bc_service_token';
    const cache = CacheService.getScriptCache();
    cache.put(cacheKey, tokenData.access_token, 3300);

    return tokenData.access_token;
  } catch (e) {
    Logger.log(`Service account token error: ${e.message}`);
    throw new Error('Failed to obtain service account token');
  }
}

// Usage with caching
function getBCAccessToken() {
  const cache = CacheService.getScriptCache();
  let token = cache.get('bc_service_token');

  if (!token) {
    token = getServiceAccountToken();
  }

  return token;
}
```

**Best Practices**:
- ✅ Store credentials in Script Properties (NEVER hardcode)
- ✅ Cache tokens (reduce token endpoint calls)
- ✅ Set cache TTL < token expiry (buffer 5-10 min)
- ✅ Use client_credentials grant for service accounts
- ❌ NEVER log token values
- ❌ NEVER commit credentials to git

---

### User Authorization (3-Legged OAuth)

**Quando usare**: Accesso a dati user-specific (Gmail, Drive, Calendar), operazioni per conto utente.

**Pattern**:
```javascript
// User OAuth2 with OAuth2 library (recommended)
// Add OAuth2 library: 1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF

function getGmailService() {
  return OAuth2.createService('gmail')
    .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
    .setTokenUrl('https://accounts.google.com/o/oauth2/token')
    .setClientId(PropertiesService.getScriptProperties().getProperty('GMAIL_CLIENT_ID'))
    .setClientSecret(PropertiesService.getScriptProperties().getProperty('GMAIL_CLIENT_SECRET'))
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setScope('https://www.googleapis.com/auth/gmail.send')
    .setParam('access_type', 'offline')
    .setParam('prompt', 'consent');
}

function authCallback(request) {
  const service = getGmailService();
  const authorized = service.handleCallback(request);

  if (authorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Authorization denied. Please try again.');
  }
}

function showAuthorizationUrl() {
  const service = getGmailService();

  if (!service.hasAccess()) {
    const authUrl = service.getAuthorizationUrl();
    Logger.log('Open this URL to authorize: ' + authUrl);
    return authUrl;
  } else {
    Logger.log('Already authorized');
  }
}

// Usage
function sendEmailWithUserAuth(to, subject, body) {
  const service = getGmailService();

  if (!service.hasAccess()) {
    throw new Error('User not authorized. Run showAuthorizationUrl() first.');
  }

  const token = service.getAccessToken();

  // Use token with Gmail API
  // ... implementation
}
```

**Best Practices**:
- ✅ Use OAuth2 library (1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF)
- ✅ Store user tokens in User Properties (user-specific)
- ✅ Request minimal scopes (principle of least privilege)
- ✅ Use `access_type: offline` for refresh tokens
- ✅ Implement token refresh automatically
- ❌ NEVER store user tokens in Script Properties (shared!)

---

## 🔑 Token Management

### Automatic Token Refresh

```javascript
function getAccessTokenWithRefresh() {
  const userProps = PropertiesService.getUserProperties();
  let accessToken = userProps.getProperty('ACCESS_TOKEN');
  const refreshToken = userProps.getProperty('REFRESH_TOKEN');
  const expiryTime = parseInt(userProps.getProperty('TOKEN_EXPIRY') || '0');

  const now = Date.now();
  const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

  // Refresh if expired or about to expire
  if (!accessToken || now >= (expiryTime - bufferTime)) {
    if (!refreshToken) {
      throw new Error('No refresh token available. Re-authorization required.');
    }

    const tokenData = refreshAccessToken(refreshToken);

    // Update stored tokens
    userProps.setProperty('ACCESS_TOKEN', tokenData.access_token);
    userProps.setProperty('TOKEN_EXPIRY', String(now + (tokenData.expires_in * 1000)));

    // Refresh token might be rotated
    if (tokenData.refresh_token) {
      userProps.setProperty('REFRESH_TOKEN', tokenData.refresh_token);
    }

    accessToken = tokenData.access_token;
  }

  return accessToken;
}

function refreshAccessToken(refreshToken) {
  const clientId = PropertiesService.getScriptProperties().getProperty('CLIENT_ID');
  const clientSecret = PropertiesService.getScriptProperties().getProperty('CLIENT_SECRET');

  const payload = {
    'client_id': clientId,
    'client_secret': clientSecret,
    'refresh_token': refreshToken,
    'grant_type': 'refresh_token'
  };

  const response = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: payload,
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error('Token refresh failed');
  }

  return JSON.parse(response.getContentText());
}
```

---

## 🎯 Scope Management

### Minimal Scopes Principle

```javascript
// BAD: Requesting too many scopes
const SCOPES_BAD = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar'
];

// GOOD: Request only what you need
const SCOPES_GOOD = [
  'https://www.googleapis.com/auth/drive.file',  // Only files created by app
  'https://www.googleapis.com/auth/gmail.send'   // Only send, not read
];

// Document WHY each scope is needed
const SCOPE_JUSTIFICATION = {
  'https://www.googleapis.com/auth/drive.file': 'Create invoice PDFs in Drive',
  'https://www.googleapis.com/auth/gmail.send': 'Send notification emails'
};
```

### Common GAS Scopes

```javascript
const GAS_SCOPES = {
  // Spreadsheets
  SHEETS_READONLY: 'https://www.googleapis.com/auth/spreadsheets.readonly',
  SHEETS: 'https://www.googleapis.com/auth/spreadsheets',

  // Drive
  DRIVE_FILE: 'https://www.googleapis.com/auth/drive.file',  // Recommended
  DRIVE: 'https://www.googleapis.com/auth/drive',            // Full access (avoid)

  // Gmail
  GMAIL_SEND: 'https://www.googleapis.com/auth/gmail.send',
  GMAIL_READONLY: 'https://www.googleapis.com/auth/gmail.readonly',

  // Calendar
  CALENDAR_READONLY: 'https://www.googleapis.com/auth/calendar.readonly',
  CALENDAR_EVENTS: 'https://www.googleapis.com/auth/calendar.events'
};
```

---

## 🔒 Security Best Practices

### CSRF Protection with State Parameter

```javascript
function initiateOAuth() {
  // Generate random state
  const state = Utilities.getUuid();

  // Store state (expires in 10 minutes)
  const cache = CacheService.getUserCache();
  cache.put('oauth_state', state, 600);

  const authUrl = `https://auth.example.com/authorize?` +
    `client_id=${clientId}&` +
    `redirect_uri=${redirectUri}&` +
    `state=${state}&` +
    `response_type=code`;

  return authUrl;
}

function handleCallback(request) {
  const receivedState = request.parameter.state;
  const cache = CacheService.getUserCache();
  const storedState = cache.get('oauth_state');

  // Validate state parameter (CSRF protection)
  if (!storedState || receivedState !== storedState) {
    throw new Error('Invalid state parameter - possible CSRF attack');
  }

  // Clear used state
  cache.remove('oauth_state');

  // Continue with authorization code exchange
  // ...
}
```

### Credential Rotation

```javascript
function checkCredentialAge() {
  const props = PropertiesService.getScriptProperties();
  const lastRotation = props.getProperty('CREDENTIALS_LAST_ROTATION');

  if (!lastRotation) {
    Logger.log('WARNING: Credential rotation date not set');
    return;
  }

  const rotationDate = new Date(lastRotation);
  const now = new Date();
  const daysSinceRotation = (now - rotationDate) / (1000 * 60 * 60 * 24);

  const ROTATION_THRESHOLD = 90; // 90 days

  if (daysSinceRotation > ROTATION_THRESHOLD) {
    // Send alert
    MailApp.sendEmail({
      to: 'admin@example.com',
      subject: 'URGENT: OAuth Credentials Need Rotation',
      body: `Credentials are ${Math.floor(daysSinceRotation)} days old. ` +
            `Rotate them immediately at https://console.cloud.google.com/apis/credentials`
    });
  }
}

// Run this weekly via trigger
function weeklyCredentialAudit() {
  checkCredentialAge();
}
```

---

## 📊 Token Storage Patterns

### User vs Script Properties

```javascript
// USER-SPECIFIC tokens → User Properties
function storeUserToken(userId, token) {
  const userProps = PropertiesService.getUserProperties();
  userProps.setProperty(`user_token_${userId}`, token);
}

// SERVICE/SYSTEM tokens → Script Properties
function storeServiceToken(token) {
  const scriptProps = PropertiesService.getScriptProperties();
  scriptProps.setProperty('service_token', token);
}

// NEVER mix them!
// ❌ BAD: User token in Script Properties (security risk!)
// ❌ BAD: Service credentials in User Properties (won't work for other users!)
```

---

## ⚠️ Common Pitfalls

🔴 **CRITICAL**:
- Hardcoded client secrets in code
- Tokens logged in Logger.log()
- User tokens in Script Properties
- No token refresh implementation

🟡 **HIGH**:
- Requesting excessive scopes
- No CSRF protection (missing state parameter)
- Token expiry not monitored
- No credential rotation policy

---

## 🧪 Testing OAuth Flows

```javascript
function testServiceAccountAuth() {
  try {
    const token = getServiceAccountToken();
    Logger.log('✅ Service account authentication successful');
    Logger.log(`Token length: ${token.length} chars`);
    return true;
  } catch (e) {
    Logger.log(`❌ Service account authentication failed: ${e.message}`);
    return false;
  }
}

function testUserAuth() {
  const service = getGmailService();

  if (service.hasAccess()) {
    Logger.log('✅ User has authorized access');
    const token = service.getAccessToken();
    Logger.log(`Token length: ${token.length} chars`);
  } else {
    Logger.log('❌ User not authorized');
    Logger.log('Authorization URL: ' + service.getAuthorizationUrl());
  }
}
```

---

**Version**: 1.0
**Last Updated**: 2024
**Context Size**: ~195 lines
