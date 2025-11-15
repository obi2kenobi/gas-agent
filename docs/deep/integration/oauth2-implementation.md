# 🔐 OAuth2 Implementation

**Categoria**: Integration → OAuth2 Flows
**Righe**: ~480
**Parent**: `specialists/integration-engineer.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Implementare OAuth2 authorization code flow
- Configurare OAuth2 client credentials (service account)
- Gestire token refresh automatico
- Implementare PKCE flow per security
- Store tokens securely con PropertiesService
- Handle OAuth2 errors e fallback
- Implement state parameter per CSRF protection

---

## 🔑 OAuth2 Flow Types

### Authorization Code Flow (User Authorization)

**Use case**: Accessing user data on external service (Gmail, Google Drive, Salesforce, etc.)

**Flow diagram**:
```
1. User clicks "Connect to [Service]"
2. Redirect to authorization URL
3. User grants permission
4. Service redirects back with code
5. Exchange code for access token
6. Store token in User Properties
7. Use token for API calls
```

**Implementation**:
```javascript
// OAuth2 Service Configuration
const OAuth2Config = {
  clientId: PropertiesService.getScriptProperties().getProperty('OAUTH_CLIENT_ID'),
  clientSecret: PropertiesService.getScriptProperties().getProperty('OAUTH_CLIENT_SECRET'),
  authorizationUrl: 'https://example.com/oauth/authorize',
  tokenUrl: 'https://example.com/oauth/token',
  scopes: ['read_data', 'write_data'],
  callbackFunction: 'handleOAuthCallback'
};

// Step 1: Generate Authorization URL
function getAuthorizationUrl(state) {
  const params = {
    client_id: OAuth2Config.clientId,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    scope: OAuth2Config.scopes.join(' '),
    state: state // CSRF protection
  };

  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  return `${OAuth2Config.authorizationUrl}?${queryString}`;
}

// Get redirect URI (Apps Script Web App URL)
function getRedirectUri() {
  return ScriptApp.getService().getUrl();
}

// Step 2: Handle OAuth Callback
function doGet(e) {
  const code = e.parameter.code;
  const state = e.parameter.state;
  const error = e.parameter.error;

  // Handle errors
  if (error) {
    Logger.log(`OAuth error: ${error}`);
    return HtmlService.createHtmlOutput(`<h1>Authorization Failed</h1><p>${error}</p>`);
  }

  // Verify state (CSRF protection)
  const savedState = PropertiesService.getUserProperties().getProperty('oauth_state');
  if (state !== savedState) {
    return HtmlService.createHtmlOutput('<h1>Error</h1><p>Invalid state parameter</p>');
  }

  // Exchange code for token
  try {
    const token = exchangeCodeForToken(code);

    // Store token
    PropertiesService.getUserProperties().setProperty('oauth_access_token', token.access_token);

    if (token.refresh_token) {
      PropertiesService.getUserProperties().setProperty('oauth_refresh_token', token.refresh_token);
    }

    if (token.expires_in) {
      const expiryTime = Date.now() + (token.expires_in * 1000);
      PropertiesService.getUserProperties().setProperty('oauth_token_expiry', String(expiryTime));
    }

    return HtmlService.createHtmlOutput('<h1>Success!</h1><p>Authorization complete. You can close this window.</p>');

  } catch (error) {
    Logger.log(`Token exchange error: ${error.message}`);
    return HtmlService.createHtmlOutput(`<h1>Error</h1><p>${error.message}</p>`);
  }
}

// Step 3: Exchange Authorization Code for Token
function exchangeCodeForToken(code) {
  const payload = {
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: getRedirectUri(),
    client_id: OAuth2Config.clientId,
    client_secret: OAuth2Config.clientSecret
  };

  const options = {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: payload,
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(OAuth2Config.tokenUrl, options);
  const statusCode = response.getResponseCode();

  if (statusCode !== 200) {
    throw new Error(`Token exchange failed (${statusCode}): ${response.getContentText()}`);
  }

  return JSON.parse(response.getContentText());
}

// Generate and save state parameter (CSRF protection)
function generateOAuthState() {
  const state = Utilities.getUuid();
  PropertiesService.getUserProperties().setProperty('oauth_state', state);
  return state;
}

// Complete authorization flow
function authorizeUser() {
  const state = generateOAuthState();
  const authUrl = getAuthorizationUrl(state);

  Logger.log('Open this URL to authorize:');
  Logger.log(authUrl);

  // In a real app, show this URL to user in UI
  return authUrl;
}
```

---

### Client Credentials Flow (Service Account)

**Use case**: Server-to-server communication without user interaction (Business Central API, system integrations)

**Implementation**:
```javascript
const ServiceAccountConfig = {
  clientId: PropertiesService.getScriptProperties().getProperty('SERVICE_CLIENT_ID'),
  clientSecret: PropertiesService.getScriptProperties().getProperty('SERVICE_CLIENT_SECRET'),
  tokenUrl: 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token',
  scope: 'https://api.businesscentral.dynamics.com/.default'
};

// Get Service Account Token
function getServiceAccountToken() {
  // Check cache first
  const cache = CacheService.getScriptCache();
  const cacheKey = 'service_account_token';
  const cachedToken = cache.get(cacheKey);

  if (cachedToken) {
    Logger.log('✅ Using cached service account token');
    return cachedToken;
  }

  // Fetch new token
  Logger.log('🔄 Fetching new service account token...');

  const payload = {
    grant_type: 'client_credentials',
    client_id: ServiceAccountConfig.clientId,
    client_secret: ServiceAccountConfig.clientSecret,
    scope: ServiceAccountConfig.scope
  };

  const options = {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: payload,
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(ServiceAccountConfig.tokenUrl, options);
  const statusCode = response.getResponseCode();

  if (statusCode !== 200) {
    throw new Error(`Token fetch failed (${statusCode}): ${response.getContentText()}`);
  }

  const tokenData = JSON.parse(response.getContentText());
  const accessToken = tokenData.access_token;
  const expiresIn = tokenData.expires_in || 3600;

  // Cache token (5 min buffer before expiry)
  const cacheTime = Math.min(expiresIn - 300, 21600); // Max 6 hours
  cache.put(cacheKey, accessToken, cacheTime);

  Logger.log(`✅ Token cached for ${cacheTime}s`);

  return accessToken;
}

// Use token for API call
function callAPIWithServiceAccount(endpoint) {
  const token = getServiceAccountToken();

  const options = {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(endpoint, options);

  // Handle 401 (expired token) - clear cache and retry
  if (response.getResponseCode() === 401) {
    Logger.log('⚠️ Token expired, refreshing...');
    CacheService.getScriptCache().remove('service_account_token');

    // Retry with new token
    return callAPIWithServiceAccount(endpoint);
  }

  return JSON.parse(response.getContentText());
}
```

---

## 🔄 Token Refresh

### Automatic Token Refresh

**Refresh before expiry**:
```javascript
function getValidAccessToken() {
  const props = PropertiesService.getUserProperties();

  const accessToken = props.getProperty('oauth_access_token');
  const refreshToken = props.getProperty('oauth_refresh_token');
  const expiryTime = parseInt(props.getProperty('oauth_token_expiry') || '0');

  // Check if token exists
  if (!accessToken) {
    throw new Error('No access token found. User needs to authorize.');
  }

  // Check if token is expired or expiring soon (5 min buffer)
  const now = Date.now();
  const bufferTime = 5 * 60 * 1000; // 5 minutes

  if (now >= (expiryTime - bufferTime)) {
    // Token expired or expiring soon
    if (!refreshToken) {
      throw new Error('Access token expired and no refresh token available. Re-authorization required.');
    }

    Logger.log('🔄 Access token expired, refreshing...');
    return refreshAccessToken(refreshToken);
  }

  // Token still valid
  return accessToken;
}

// Refresh Access Token
function refreshAccessToken(refreshToken) {
  const payload = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: OAuth2Config.clientId,
    client_secret: OAuth2Config.clientSecret
  };

  const options = {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: payload,
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(OAuth2Config.tokenUrl, options);
  const statusCode = response.getResponseCode();

  if (statusCode !== 200) {
    // Refresh failed - user needs to re-authorize
    Logger.log('❌ Token refresh failed - clearing stored tokens');
    clearStoredTokens();
    throw new Error('Token refresh failed. User needs to re-authorize.');
  }

  const tokenData = JSON.parse(response.getContentText());

  // Update stored token
  const props = PropertiesService.getUserProperties();
  props.setProperty('oauth_access_token', tokenData.access_token);

  // Update refresh token if provided (some services rotate it)
  if (tokenData.refresh_token) {
    props.setProperty('oauth_refresh_token', tokenData.refresh_token);
  }

  // Update expiry
  if (tokenData.expires_in) {
    const expiryTime = Date.now() + (tokenData.expires_in * 1000);
    props.setProperty('oauth_token_expiry', String(expiryTime));
  }

  Logger.log('✅ Access token refreshed successfully');

  return tokenData.access_token;
}

// Clear all stored tokens
function clearStoredTokens() {
  const props = PropertiesService.getUserProperties();
  props.deleteProperty('oauth_access_token');
  props.deleteProperty('oauth_refresh_token');
  props.deleteProperty('oauth_token_expiry');
  props.deleteProperty('oauth_state');
}
```

---

## 🔒 PKCE Flow (Enhanced Security)

**Proof Key for Code Exchange** - recommended for public clients

**Implementation**:
```javascript
// Generate code verifier (random string)
function generateCodeVerifier() {
  const randomBytes = Utilities.getRandomString(32); // 32 random chars
  return base64URLEncode(randomBytes);
}

// Generate code challenge (SHA-256 hash of verifier)
function generateCodeChallenge(verifier) {
  const hash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    verifier,
    Utilities.Charset.UTF_8
  );
  return base64URLEncode(hash);
}

// Base64 URL encoding (without padding)
function base64URLEncode(data) {
  let base64 = '';

  if (typeof data === 'string') {
    base64 = Utilities.base64Encode(data);
  } else {
    // data is byte array from digest
    base64 = Utilities.base64Encode(data);
  }

  // Convert to URL-safe format
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Authorization URL with PKCE
function getAuthorizationUrlWithPKCE() {
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);

  // Store verifier for later use in token exchange
  PropertiesService.getUserProperties().setProperty('pkce_verifier', verifier);

  const state = generateOAuthState();

  const params = {
    client_id: OAuth2Config.clientId,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    scope: OAuth2Config.scopes.join(' '),
    state: state,
    code_challenge: challenge,
    code_challenge_method: 'S256'
  };

  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  return `${OAuth2Config.authorizationUrl}?${queryString}`;
}

// Token exchange with PKCE
function exchangeCodeForTokenWithPKCE(code) {
  const verifier = PropertiesService.getUserProperties().getProperty('pkce_verifier');

  if (!verifier) {
    throw new Error('PKCE verifier not found');
  }

  const payload = {
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: getRedirectUri(),
    client_id: OAuth2Config.clientId,
    code_verifier: verifier
  };

  const options = {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: payload,
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(OAuth2Config.tokenUrl, options);
  const statusCode = response.getResponseCode();

  if (statusCode !== 200) {
    throw new Error(`Token exchange failed (${statusCode}): ${response.getContentText()}`);
  }

  // Clean up verifier
  PropertiesService.getUserProperties().deleteProperty('pkce_verifier');

  return JSON.parse(response.getContentText());
}
```

---

## ⚠️ Error Handling

### OAuth Error Types

**Common OAuth errors**:
```javascript
function handleOAuthError(error, errorDescription) {
  const ERROR_HANDLERS = {
    'access_denied': () => {
      Logger.log('❌ User denied authorization');
      return 'User cancelled authorization. Please try again.';
    },
    'invalid_request': () => {
      Logger.log('❌ Invalid OAuth request');
      return 'Configuration error. Please contact support.';
    },
    'invalid_client': () => {
      Logger.log('❌ Invalid client credentials');
      return 'Authentication error. Please contact support.';
    },
    'invalid_grant': () => {
      Logger.log('❌ Invalid or expired authorization code');
      clearStoredTokens();
      return 'Authorization expired. Please authorize again.';
    },
    'unauthorized_client': () => {
      Logger.log('❌ Client not authorized for this grant type');
      return 'Configuration error. Please contact support.';
    },
    'unsupported_grant_type': () => {
      Logger.log('❌ Grant type not supported');
      return 'Configuration error. Please contact support.';
    },
    'invalid_scope': () => {
      Logger.log('❌ Invalid scope requested');
      return 'Permission error. Please contact support.';
    }
  };

  const handler = ERROR_HANDLERS[error] || (() => {
    Logger.log(`❌ Unknown OAuth error: ${error}`);
    return `Authorization error: ${errorDescription || error}`;
  });

  return handler();
}
```

---

## ✅ OAuth Best Practices

### Checklist

- [x] **Always use state parameter** - Prevents CSRF attacks
- [x] **Use PKCE for public clients** - Enhanced security
- [x] **Store tokens in Properties** - User Properties for user tokens, Script Properties for service accounts
- [x] **Implement token refresh** - Refresh 5 minutes before expiry
- [x] **NEVER log token values** - Security violation
- [x] **Use HTTPS only** - No insecure connections
- [x] **Minimal scopes** - Request only necessary permissions
- [x] **Handle token expiry gracefully** - Clear stored tokens, prompt re-auth
- [x] **Cache service account tokens** - Reduce token requests
- [x] **Validate redirect URI** - Prevent redirect attacks
- [x] **Test expiry scenarios** - Ensure refresh works correctly
- [x] **Provide clear error messages** - Help users understand issues

---

## 🔗 Related Files

- `security/oauth2-patterns.md` - OAuth2 security patterns for BC
- `security/properties-security.md` - Secure token storage
- `integration/http-patterns.md` - Using tokens in HTTP requests
- `platform/error-handling.md` - Retry logic for token refresh failures

---

**Versione**: 1.0
**Context Size**: ~480 righe
