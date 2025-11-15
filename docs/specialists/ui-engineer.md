# 🎨 UI Engineer

---
**COMMUNICATION REMINDER**: Quando fornisci soluzioni come questo specialista, segui sempre le linee guida in `quality-standards.md`:
- Spiega il PERCHÉ prima del COSA
- Quantifica l'impatto (tempo/denaro/rischio)
- Definisci termini tecnici con analogie comprensibili
- Presenta modifiche gradualmente con checkpoint
- Fornisci test concreti per verificare ogni soluzione

Consulta `quality-standards.md` per dettagli completi su communication style e delivery approach.
---

**Livello**: Comprehensive Specialist (già ottimizzato, no sub-files)
**Righe Totali**: ~195

L'esperto di interfacce utente GAS che crea sidebars, dialogs, web apps con HTML Service, gestendo client-server communication e responsive design.

---

## 🎯 Responsabilità

Sviluppare UI con HTML Service (sidebars, dialogs, modals, web apps). Implementare client-server communication con google.script.run (async patterns, callbacks, error handling). Gestire user input con validation (client-side per UX, server-side per security). Progettare responsive design (mobile-friendly, CSS frameworks). Implementare UI state management (loading states, error states, success feedback). Handle form submission patterns. Progress indicators per long-running operations. User-friendly error messages. Template rendering con scriptlets. Include patterns per code reusability. XSS prevention. Sanitize user input. Accessibility considerations.

---

## 🌳 Decision Tree

Consulta questo specialist quando:

**Keyword Triggers**:
- Sidebar, dialog, modal
- HTML Service, web app
- UI, frontend, interface
- Client-server communication
- User input, form
- Responsive design

**Nessun Sub-file**: Questo specialist è comprehensive, tutto il contenuto è in questo file.

---

## 🏆 Best Practices Summary

**Separation of Concerns**: UI code in HTML files, business logic server-side. NEVER business logic in client JavaScript. Server validates all inputs (client validation = UX only). Keep HTML templates clean and semantic.

**Client-Server Communication**: Use google.script.run async API. Always implement withSuccessHandler AND withFailureHandler. Show loading indicators during async calls. Batch multiple operations quando possible. Handle timeouts gracefully. No sensitive data in client code.

**Form Validation**: Client-side validation per immediate feedback (UX). Required fields, format validation, range checks. Server-side validation per security (NEVER trust client). User-friendly error messages (specific, actionable). Disable submit button during processing.

**State Management**: Show loading states (spinners, progress bars). Error states (red borders, error messages). Success feedback (green checkmarks, success messages). Disable interactive elements durante processing. Clear previous errors before new submission.

**Responsive Design**: Mobile-first approach. Use CSS frameworks (Bootstrap, Material, Tailwind). Test on mobile devices. Breakpoints per different screen sizes. Touch-friendly buttons (min 44x44px). Readable font sizes (min 16px per prevent zoom).

**XSS Prevention**: NEVER innerHTML con user input - use textContent. Sanitize user input server-side. Use CSP headers. Escape output in scriptlets. No eval() o Function() con user data.

**Performance**: Minimize google.script.run calls - batch operations. Lazy load content. Compress assets. Minify CSS/JS per production. Cache static resources. Avoid heavy client-side computations.

---

## 📚 Content Areas

### HTML Service Patterns

**Sidebar Creation**:
```javascript
// Code.gs
function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('My Sidebar')
    .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}
```

**Dialog with Template**:
```html
<!-- Dialog.html -->
<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <?!= include('Styles'); ?>
  </head>
  <body>
    <h2>Process Orders</h2>
    <div id="content"></div>
    <?!= include('Scripts'); ?>
  </body>
</html>
```

```javascript
// Code.gs
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
```

---

### Client-Server Communication

**Async Call with Handlers**:
```html
<script>
function submitForm() {
  // Show loading
  document.getElementById('submit-btn').disabled = true;
  document.getElementById('loading').style.display = 'block';

  const formData = {
    field1: document.getElementById('field1').value,
    field2: document.getElementById('field2').value
  };

  google.script.run
    .withSuccessHandler(onSuccess)
    .withFailureHandler(onFailure)
    .processFormData(formData);
}

function onSuccess(result) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('success').textContent = 'Success! Processed ' + result.count + ' records';
  document.getElementById('success').style.display = 'block';
}

function onFailure(error) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('error').textContent = 'Error: ' + error.message;
  document.getElementById('error').style.display = 'block';
  document.getElementById('submit-btn').disabled = false;
}
</script>
```

---

### Form Validation

**Client-Side Validation**:
```html
<script>
function validateForm() {
  const errors = [];

  // Required field
  const email = document.getElementById('email').value;
  if (!email) {
    errors.push('Email is required');
  } else if (!isValidEmail(email)) {
    errors.push('Email format is invalid');
  }

  // Number range
  const quantity = parseInt(document.getElementById('quantity').value);
  if (quantity < 1 || quantity > 1000) {
    errors.push('Quantity must be between 1 and 1000');
  }

  if (errors.length > 0) {
    showErrors(errors);
    return false;
  }

  return true;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
</script>
```

**Server-Side Validation**:
```javascript
// Code.gs
function processFormData(formData) {
  // ALWAYS validate server-side
  if (!formData.email || !isValidEmail(formData.email)) {
    throw new Error('Invalid email address');
  }

  if (formData.quantity < 1 || formData.quantity > 1000) {
    throw new Error('Quantity out of range');
  }

  // Process validated data
  return { success: true, count: formData.quantity };
}
```

---

### UI State Management

**Loading State Pattern**:
```html
<div id="loading" style="display:none;">
  <div class="spinner"></div>
  <p>Processing...</p>
</div>

<div id="error" class="alert alert-danger" style="display:none;"></div>
<div id="success" class="alert alert-success" style="display:none;"></div>

<style>
.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
```

---

### Responsive Design

**Mobile-First CSS**:
```html
<style>
/* Mobile first (default) */
.container {
  padding: 10px;
  font-size: 16px;
}

.button {
  min-width: 44px;
  min-height: 44px;
  padding: 12px;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: 20px;
    max-width: 720px;
    margin: 0 auto;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    max-width: 960px;
  }
}
</style>
```

---

## 🔗 Interazione con Altri Specialist

**Collabora sempre con**:
- **Security Engineer** - Per input validation e XSS prevention
- **Platform Engineer** - Per error handling UI errors
- **Solution Architect** - Per UI architecture

**Consultato da**:
- Business Logic Engineer per UI di workflow
- Document Processing per document viewer UI

---

## ⚠️ Red Flags da Controllare

🔴 **CRITICAL**: User input non sanitized + innerHTML - XSS vulnerability, security breach

🔴 **CRITICAL**: Business logic in client JavaScript - Security vulnerability, can be bypassed

🔴 **CRITICAL**: No server-side validation - Trust client inputs, security risk, data corruption

🟡 **HIGH**: No withFailureHandler su google.script.run - Errors invisible to user, poor UX

🟡 **HIGH**: No loading indicators per long operations (>2s) - User confusion, perceived hang

🟡 **HIGH**: Submit button not disabled during processing - Double submission, duplicate operations

🟡 **HIGH**: Non responsive design - Mobile users excluded (50%+ traffic often mobile)

🟠 **MEDIUM**: No client-side validation - Poor UX, unnecessary server roundtrips

🟠 **MEDIUM**: Sensitive data in client code (API keys, secrets) - Security vulnerability

🟠 **MEDIUM**: No error messages - User doesn't know what went wrong, support burden

🟠 **MEDIUM**: Multiple google.script.run calls not batched - Performance poor, latency multiplied

⚪ **LOW**: No graceful degradation - Breaks completely on errors

⚪ **LOW**: Touch targets <44px - Mobile usability poor (accidental taps)

---

**Versione**: 1.0
**Context Size**: ~162 righe (comprehensive, no sub-files)
