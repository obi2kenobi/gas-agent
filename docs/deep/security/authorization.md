# 🔐 Authorization & Access Control

**Categoria**: Security → RBAC & Permissions
**Righe**: ~250
**Parent**: `specialists/security-engineer.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Implementare Role-Based Access Control (RBAC)
- Gestire permissions utente
- Verificare user identity
- Controllare accesso a risorse
- Implementare authorization checks
- Audit user permissions
- Implement least privilege principle

---

## 🔑 Authentication vs Authorization

### Differenza Critica

**Authentication** (Autenticazione): **"Chi sei?"**
- Verifica l'identità dell'utente
- Login, password, OAuth, SSO
- Risponde: "Sei davvero Mario Rossi?"

**Authorization** (Autorizzazione): **"Cosa puoi fare?"**
- Verifica i permessi dell'utente
- Roles, permissions, access control
- Risponde: "Mario Rossi può eliminare questo ordine?"

**Entrambi sono NECESSARI** per sicurezza completa:
```javascript
function deleteOrder(orderId) {
  // 1. AUTHENTICATION: Chi sei?
  const user = Session.getActiveUser().getEmail();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // 2. AUTHORIZATION: Cosa puoi fare?
  if (!hasPermission(user, 'DELETE_ORDER')) {
    throw new Error('Not authorized');
  }

  // Proceed with operation
  performDeleteOrder(orderId);
}
```

---

## 👥 RBAC Implementation

### Role Definition

**Define System Roles**:
```javascript
const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER',
  READONLY: 'READONLY'
};

const PERMISSIONS = {
  // Order permissions
  VIEW_ORDERS: 'VIEW_ORDERS',
  CREATE_ORDER: 'CREATE_ORDER',
  EDIT_ORDER: 'EDIT_ORDER',
  DELETE_ORDER: 'DELETE_ORDER',
  APPROVE_ORDER: 'APPROVE_ORDER',

  // System permissions
  MANAGE_USERS: 'MANAGE_USERS',
  VIEW_LOGS: 'VIEW_LOGS',
  SYNC_BC: 'SYNC_BC',
  CONFIGURE_SYSTEM: 'CONFIGURE_SYSTEM'
};
```

---

### Permission Mapping

**Role → Permissions Mapping**:
```javascript
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // All permissions
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.EDIT_ORDER,
    PERMISSIONS.DELETE_ORDER,
    PERMISSIONS.APPROVE_ORDER,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_LOGS,
    PERMISSIONS.SYNC_BC,
    PERMISSIONS.CONFIGURE_SYSTEM
  ],

  [ROLES.MANAGER]: [
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.EDIT_ORDER,
    PERMISSIONS.APPROVE_ORDER,
    PERMISSIONS.VIEW_LOGS
  ],

  [ROLES.USER]: [
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.EDIT_ORDER
  ],

  [ROLES.READONLY]: [
    PERMISSIONS.VIEW_ORDERS
  ]
};

function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || [];
}
```

---

### User Role Assignment

**Store User Roles in Sheets**:
```javascript
/**
 * Users Sheet structure:
 * Column A: Email
 * Column B: Role
 * Column C: Assigned Date
 * Column D: Assigned By
 */

function assignUserRole(email, role) {
  // Validate role
  if (!Object.values(ROLES).includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const data = sheet.getDataRange().getValues();

  // Check if user exists
  const userRow = data.findIndex(row => row[0] === email);

  const assignedBy = Session.getActiveUser().getEmail();
  const timestamp = new Date();

  if (userRow > 0) {
    // Update existing user
    sheet.getRange(userRow + 1, 2, 1, 3).setValues([[role, timestamp, assignedBy]]);
  } else {
    // Add new user
    sheet.appendRow([email, role, timestamp, assignedBy]);
  }

  // Log the change
  logSecurityEvent('ROLE_ASSIGNED', {
    email,
    role,
    assignedBy
  });
}

function getUserRole(email) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const data = sheet.getDataRange().getValues();

  const userRow = data.find(row => row[0] === email);
  return userRow ? userRow[1] : ROLES.READONLY; // Default to READONLY
}
```

---

## 🔒 Permission Checking Patterns

### Function-Level Authorization

**Authorization Decorator Pattern**:
```javascript
/**
 * Require permission to execute function
 */
function requirePermission(permission) {
  return function(targetFunction) {
    return function(...args) {
      const user = Session.getActiveUser().getEmail();

      if (!hasPermission(user, permission)) {
        throw new Error(`Unauthorized: Missing permission ${permission}`);
      }

      return targetFunction.apply(this, args);
    };
  };
}

// Manual authorization check
function deleteOrder(orderId) {
  const user = Session.getActiveUser().getEmail();

  // Check permission
  if (!hasPermission(user, PERMISSIONS.DELETE_ORDER)) {
    throw new Error('Unauthorized: Cannot delete orders');
  }

  // Execute operation
  return performDelete(orderId);
}

function hasPermission(email, permission) {
  const role = getUserRole(email);
  const permissions = getPermissionsForRole(role);

  return permissions.includes(permission);
}
```

---

### Resource-Level Authorization

**Check Permission on Specific Resource**:
```javascript
/**
 * Check if user can access specific order
 * (e.g., users can only edit their own orders, managers can edit all)
 */
function canEditOrder(userEmail, orderId) {
  const role = getUserRole(userEmail);

  // Admins and managers can edit any order
  if (role === ROLES.ADMIN || role === ROLES.MANAGER) {
    return true;
  }

  // Regular users can only edit their own orders
  const order = getOrderById(orderId);
  return order.createdBy === userEmail;
}

// Usage
function editOrder(orderId, updates) {
  const user = Session.getActiveUser().getEmail();

  // Resource-level check
  if (!canEditOrder(user, orderId)) {
    throw new Error('Unauthorized: Cannot edit this order');
  }

  // Permission check
  if (!hasPermission(user, PERMISSIONS.EDIT_ORDER)) {
    throw new Error('Unauthorized: Missing EDIT_ORDER permission');
  }

  // Proceed with update
  return updateOrder(orderId, updates);
}
```

---

### Multi-Level Authorization

**Combined Permission + Resource + Condition Checks**:
```javascript
function approveOrder(orderId) {
  const user = Session.getActiveUser().getEmail();
  const order = getOrderById(orderId);

  // 1. Permission check
  if (!hasPermission(user, PERMISSIONS.APPROVE_ORDER)) {
    throw new Error('Unauthorized: Missing APPROVE_ORDER permission');
  }

  // 2. Resource ownership check
  if (order.createdBy === user) {
    throw new Error('Forbidden: Cannot approve your own order');
  }

  // 3. Business logic check
  if (order.status !== 'PENDING_APPROVAL') {
    throw new Error('Invalid: Order not in pending approval state');
  }

  // 4. Amount threshold check
  const role = getUserRole(user);
  if (role === ROLES.MANAGER && order.amount > 10000) {
    throw new Error('Forbidden: Orders >€10,000 require ADMIN approval');
  }

  // All checks passed
  return performApproval(orderId, user);
}
```

---

## 🔍 User Identity Verification

### Getting Current User

**Session.getActiveUser() Patterns**:
```javascript
function getCurrentUserEmail() {
  const user = Session.getActiveUser().getEmail();

  if (!user) {
    throw new Error('No active user session');
  }

  return user;
}

function getCurrentUserInfo() {
  const email = getCurrentUserEmail();
  const role = getUserRole(email);
  const permissions = getPermissionsForRole(role);

  return {
    email,
    role,
    permissions,
    isAdmin: role === ROLES.ADMIN,
    isManager: role === ROLES.MANAGER || role === ROLES.ADMIN
  };
}

// Usage
function showAdminPanel() {
  const userInfo = getCurrentUserInfo();

  if (!userInfo.isAdmin) {
    throw new Error('Admin access required');
  }

  // Show admin UI
}
```

---

### Verifying User Email Domain

**Domain Whitelist Pattern**:
```javascript
function isAuthorizedDomain(email) {
  const ALLOWED_DOMAINS = [
    'yourcompany.com',
    'yourcompany.it',
    'partner-company.com'
  ];

  return ALLOWED_DOMAINS.some(domain => email.endsWith(`@${domain}`));
}

function verifyAuthorizedUser() {
  const email = Session.getActiveUser().getEmail();

  if (!email) {
    throw new Error('No active user');
  }

  if (!isAuthorizedDomain(email)) {
    throw new Error(`Unauthorized domain: ${email.split('@')[1]}`);
  }

  return email;
}

// Usage in doGet
function doGet(e) {
  try {
    verifyAuthorizedUser();
  } catch (error) {
    return HtmlService.createHtmlOutput('Access Denied: ' + error.message);
  }

  return HtmlService.createHtmlOutputFromFile('Index');
}
```

---

### User Email Masking (Privacy)

**Mask Emails in Logs**:
```javascript
function maskEmail(email) {
  const [local, domain] = email.split('@');
  const maskedLocal = local[0] + '*'.repeat(local.length - 2) + local[local.length - 1];
  return `${maskedLocal}@${domain}`;
}

// Usage
function logUserAction(action) {
  const email = Session.getActiveUser().getEmail();
  Logger.log(`User ${maskEmail(email)} performed ${action}`);
  // Logs: "User j***e@example.com performed DELETE_ORDER"
}
```

---

## 📁 Shared Drive Security

### Managing Shared Access

**Check File Permissions**:
```javascript
function verifyFileAccess(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    const user = Session.getActiveUser().getEmail();

    // Check if user has access
    const editors = file.getEditors().map(e => e.getEmail());
    const viewers = file.getViewers().map(v => v.getEmail());

    const hasAccess = editors.includes(user) || viewers.includes(user);

    if (!hasAccess) {
      throw new Error('User does not have access to this file');
    }

    return true;
  } catch (e) {
    Logger.log(`File access verification failed: ${e.message}`);
    return false;
  }
}

function processFile(fileId) {
  if (!verifyFileAccess(fileId)) {
    throw new Error('Unauthorized: No access to file');
  }

  // Process file
}
```

---

### Permission Auditing

**Audit Who Has Access**:
```javascript
function auditFilePermissions(fileId) {
  const file = DriveApp.getFileById(fileId);

  const audit = {
    fileName: file.getName(),
    owner: file.getOwner().getEmail(),
    editors: file.getEditors().map(e => e.getEmail()),
    viewers: file.getViewers().map(v => v.getEmail()),
    sharingAccess: file.getSharingAccess(),
    sharingPermission: file.getSharingPermission(),
    lastUpdated: file.getLastUpdated()
  };

  return audit;
}

function auditAllSharedFiles() {
  const folder = DriveApp.getFolderById('FOLDER_ID');
  const files = folder.getFiles();

  const audits = [];
  while (files.hasNext()) {
    const file = files.next();
    audits.push(auditFilePermissions(file.getId()));
  }

  // Write to audit log
  logSecurityEvent('FILE_PERMISSIONS_AUDIT', { audits });

  return audits;
}
```

---

## 🛡️ Authorization Best Practices

### Security Principles

**1. Deny by Default (Whitelist Approach)**:
```javascript
// ❌ BAD: Allow by default
function hasAccess(user, resource) {
  if (isBlacklisted(user)) {
    return false; // Blacklist approach - dangerous
  }
  return true; // Default allow
}

// ✅ GOOD: Deny by default
function hasAccess(user, resource) {
  // Explicit allow only
  return isAuthorized(user, resource); // Default deny
}
```

---

**2. Least Privilege Principle**:
```javascript
// ✅ Grant minimum permissions needed
function setupNewUser(email) {
  // Start with READONLY (minimum privilege)
  assignUserRole(email, ROLES.READONLY);

  // Permissions escalated only when needed
}

// ❌ Don't grant broad permissions by default
function setupNewUserBad(email) {
  assignUserRole(email, ROLES.ADMIN); // Too much power!
}
```

---

**3. Check Authorization on EVERY Request**:
```javascript
function processRequest(operation, data) {
  // ALWAYS check, even if client claims user is authorized
  const user = Session.getActiveUser().getEmail();

  if (!hasPermission(user, operation)) {
    throw new Error('Unauthorized');
  }

  // Perform operation
}

// ❌ NEVER trust client-side authorization
// Client JavaScript can be modified - ALWAYS verify server-side
```

---

**4. Log Authorization Failures**:
```javascript
function checkAuthorization(user, permission) {
  const authorized = hasPermission(user, permission);

  if (!authorized) {
    // Log failed authorization attempt
    logSecurityEvent('AUTHORIZATION_FAILED', {
      user,
      permission,
      timestamp: new Date().toISOString(),
      userAgent: Session.getTemporaryActiveUserKey()
    });

    // Alert if suspicious activity
    checkForSuspiciousActivity(user);
  }

  return authorized;
}

function checkForSuspiciousActivity(user) {
  const recentFailures = getRecentAuthFailures(user);

  if (recentFailures.length > 10) {
    sendSecurityAlert(`Suspicious activity: ${user} has ${recentFailures.length} failed auth attempts`);
  }
}
```

---

**5. Regular Permission Audits**:
```javascript
function weeklyPermissionAudit() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const users = sheet.getDataRange().getValues();

  const report = {
    totalUsers: users.length - 1, // Exclude header
    adminCount: 0,
    managerCount: 0,
    userCount: 0,
    readonlyCount: 0,
    staleAccounts: [] // Not used in >90 days
  };

  users.slice(1).forEach(([email, role, assignedDate]) => {
    // Count roles
    if (role === ROLES.ADMIN) report.adminCount++;
    else if (role === ROLES.MANAGER) report.managerCount++;
    else if (role === ROLES.USER) report.userCount++;
    else if (role === ROLES.READONLY) report.readonlyCount++;

    // Check for stale accounts
    const daysSinceAssigned = (Date.now() - new Date(assignedDate)) / (1000 * 60 * 60 * 24);
    if (daysSinceAssigned > 90) {
      report.staleAccounts.push(email);
    }
  });

  // Send report to admins
  sendAuditReport(report);
}
```

---

**6. Separate Admin from User Roles**:
```javascript
// ✅ GOOD: Separate concerns
const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',    // System config
  ADMIN: 'ADMIN',                // User management
  MANAGER: 'MANAGER',            // Business operations
  USER: 'USER'                   // Standard operations
};

// Principle: Even admins should use least-privilege accounts for daily work
// Use admin account only when needed
```

---

## 🔗 Related Files

- `security/audit-compliance.md` - Logging authorization events
- `security/deployment-security.md` - Access control deployment
- `platform/error-handling.md` - Handling authorization errors
- `security/sensitive-data.md` - PII access control

---

**Versione**: 1.0
**Context Size**: ~250 righe
