# 📊 Workspace Engineer

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
**Sub-files**: 3 in `specialists-deep/workspace/`

L'esperto di Google Workspace che automatizza Sheets, Drive, Gmail, Calendar con performance ottimali e trigger management.

---

## 🎯 Responsabilità

Implementare Sheets automation con batch operations (getValues/setValues, no loops). Gestire Google Drive file operations (upload, download, permissions, folder structure). Automatizzare Gmail (send, templates, attachments, filters). Integrare Calendar (events, notifications, availability). Configurare triggers (time-based, onEdit, onChange, onOpen, onFormSubmit) con limitations awareness. Gestire PropertiesService (User/Script/Document properties) per state management. Ottimizzare performance (minimize read/write, batch operations, caching). Implementare LockService per concurrency. Handle Workspace quotas e limitations. Named ranges e data validation. Formula injection dynamic.

---

## 🌳 Decision Tree

Consulta questo specialist quando:

**Keyword Triggers**:
- Sheets, spreadsheet, range, formulas
- Drive, folder, file upload/download
- Gmail, email, send mail
- Calendar, events
- Triggers, time-based execution, onEdit, onChange
- Properties, user properties, script properties

**Quale Sub-file Caricare?**

```
├─ Sheets Automation Patterns
│  └─→ workspace/sheets-patterns.md
│
├─ Drive/Gmail Operations
│  └─→ workspace/drive-gmail.md
│
└─ Properties/Triggers
   └─→ workspace/properties-triggers.md
```

---

## 🏆 Best Practices Summary

**Sheets Performance**: SEMPRE batch operations - getValues/setValues per ranges (100x faster che loops). Cache range objects fuori loops. Separate data updates da formatting updates. Use getDataRange() per dimensioni dynamic. Named ranges per maintainability. Minimize getRange/getValue calls. Clear content vs clear formatting - separate operations. Use setFormulas per formula injection batch.

**Sheets Best Practices**: Data validation per input control. Protect ranges per prevent user edits. Named ranges per readability. Sheet-level vs range-level formatting. Use built-in functions dove possibile (QUERY, FILTER, ARRAYFORMULA). Avoid volatile functions (NOW, RAND, TODAY) in formulas. Cell limits: 10M cells per spreadsheet.

**Drive Operations**: getFolderById/getFileById - cache IDs in properties. Permission management - Editor/Viewer/Commenter. Folder hierarchy - maintain logical structure. File search - use searchFiles con query string. Mime types per file type. Handle file not found gracefully. Large file uploads - chunking may be needed (>50MB).

**Gmail Automation**: Template-based emails per consistency. HTML emails con inline CSS. Attachment handling - Drive files as links (no 25MB limit). Batch send con delays per quota (100/giorno per user, 1500/giorno per account). Thread handling per conversations. Draft creation per review. Label management per organization.

**Triggers**: Time-based triggers - max frequency 1 hour (tipicamente). onEdit/onChange - max 6 min execution time. Installable triggers require authorization. Delete old triggers programmatically. Trigger quota: 20 installable triggers per user. Error in trigger - GAS sends email after multiple failures. Test triggers thoroughly.

**Properties Service**: User Properties - user-specific (auth tokens). Script Properties - script-level (config, secrets). Document Properties - document-specific (state). Max size: 9KB per property, 500KB total per store. JSON.stringify per complex objects. Cache frequently accessed properties. Handle property not found.

**LockService**: Use per concurrent access control. Script lock vs User lock vs Document lock. Try-finally per ensure release. Timeout configuration (default 30s). Deadlock prevention. Use minimally - performance impact.

---

## 📚 Sub-files Disponibili

### 1. `workspace/sheets-patterns.md` (~175 righe)
**Quando usare**: Sheets automation, batch operations, formulas

**Contenuto**:
- Batch read/write operations
- Range manipulation best practices
- Formula injection
- Data validation
- Formatting strategies
- Performance optimization

---

### 2. `workspace/drive-gmail.md` (~145 righe)
**Quando usare**: Drive file operations, Gmail automation

**Contenuto**:
- File upload/download patterns
- Folder structure management
- Permission handling
- Email sending best practices
- Template-based emails
- Attachment handling

---

### 3. `workspace/properties-triggers.md` (~135 righe)
**Quando usare**: State management, scheduled execution

**Contenuto**:
- User vs Script properties
- Trigger types (time-based, onEdit, onChange, onOpen)
- Trigger limitations & workarounds
- State persistence patterns
- Lock service for concurrency

---

## 🔗 Interazione con Altri Specialist

**Collabora sempre con**:
- **Platform Engineer** - Per error handling e performance
- **Security Engineer** - Per permissions e data access
- **Data Engineer** - Per data transformation prima di write

**Consultato da**:
- BC Specialist per BC to Sheets sync
- Business Logic Engineer per business rules on Sheets data

---

## ⚠️ Red Flags da Controllare

🔴 **CRITICAL**: setValue() in loop - Performance catastrophe (100x slower), timeout guaranteed for >50 rows

🔴 **CRITICAL**: getRange() o getValue() in loop - Excessive API calls, timeout risk, performance 100x worse

🔴 **CRITICAL**: No error handling in trigger functions - Script crashes, user gets error email, reputation damage

🟡 **HIGH**: Trigger function >6 min execution - Hard GAS limit, script terminates, data loss risk

🟡 **HIGH**: Concurrent operations without LockService - Race conditions, data corruption, duplicate operations

🟡 **HIGH**: Properties service usato come database - Size limits (500KB), performance poor, not designed for this

🟡 **HIGH**: Hardcoded sheet names/ranges (es. "Sheet1", "A1:B10") - Breaks when sheets renamed, not maintainable

🟠 **MEDIUM**: Mixed data and formatting updates - Performance penalty, separate updates 2-3x faster

🟠 **MEDIUM**: No named ranges - A1 notation fragile, difficult maintenance, error-prone

🟠 **MEDIUM**: Gmail quota exceed (100 emails/day per user) - Service disruption, no alerts sent

🟠 **MEDIUM**: Large email attachments (>25MB) - Send fails, use Drive links instead

⚪ **LOW**: No trigger cleanup - Accumulation of old triggers, quota exhaustion (max 20)

⚪ **LOW**: Volatile functions in formulas - Continuous recalculation, performance impact

---

**Versione**: 1.0
**Context Size**: ~125 righe (overview only)
**Con sub-files**: ~580 righe totali (carica solo necessari)
