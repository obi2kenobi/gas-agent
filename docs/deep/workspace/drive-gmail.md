# 📁 Drive & Gmail Automation

**Categoria**: Workspace → Drive/Gmail Operations
**Righe**: ~450
**Parent**: `specialists/workspace-engineer.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Gestire file operations su Google Drive (upload, download, delete)
- Implementare folder management e hierarchy
- Inviare email automatiche con Gmail
- Gestire attachments e Drive file links
- Implementare template-based emails per consistency
- Handle Drive permissions (Editor, Viewer, Commenter)
- Manage email sending quotas (100/day per user)

---

## 📂 Google Drive Operations

### File Upload

```javascript
function uploadFileToDrive(content, filename, folderId) {
  const folder = DriveApp.getFolderById(folderId);

  // Create file
  const file = folder.createFile(filename, content);

  Logger.log(`✅ File created: ${file.getId()}`);
  return file;
}

// Upload with specific MIME type
function uploadPDF(base64Content, filename, folderId) {
  const blob = Utilities.newBlob(
    Utilities.base64Decode(base64Content),
    'application/pdf',
    filename
  );

  const folder = DriveApp.getFolderById(folderId);
  const file = folder.createFile(blob);

  return file;
}
```

---

### Get File Operations

```javascript
// Get file by ID
function getFileById(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    return file;
  } catch (error) {
    Logger.log(`❌ File not found: ${fileId}`);
    return null;
  }
}

// Search files by name
function getFilesByName(filename) {
  const files = DriveApp.getFilesByName(filename);
  const results = [];

  while (files.hasNext()) {
    results.push(files.next());
  }

  Logger.log(`Found ${results.length} files named "${filename}"`);
  return results;
}

// Search in specific folder
function searchFilesInFolder(folderId, searchTerm) {
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.searchFiles(`title contains "${searchTerm}"`);

  const results = [];
  while (files.hasNext()) {
    results.push(files.next());
  }

  return results;
}
```

---

### Read File Content

```javascript
function readTextFile(fileId) {
  const file = DriveApp.getFileById(fileId);
  const content = file.getBlob().getDataAsString();

  return content;
}

function readCsvFile(fileId) {
  const file = DriveApp.getFileById(fileId);
  const content = file.getBlob().getDataAsString();

  // Parse CSV
  const rows = content.split('\n').map(row => row.split(','));

  return rows;
}

function downloadFileAsBase64(fileId) {
  const file = DriveApp.getFileById(fileId);
  const blob = file.getBlob();
  const base64 = Utilities.base64Encode(blob.getBytes());

  return base64;
}
```

---

### Delete & Move Files

```javascript
function deleteFile(fileId) {
  const file = DriveApp.getFileById(fileId);
  file.setTrashed(true); // Move to trash

  Logger.log(`✅ File moved to trash: ${file.getName()}`);
}

function permanentlyDeleteFile(fileId) {
  const file = DriveApp.getFileById(fileId);
  Drive.Files.remove(fileId); // Requires Drive API advanced service

  Logger.log(`✅ File permanently deleted`);
}

function moveFileToFolder(fileId, targetFolderId) {
  const file = DriveApp.getFileById(fileId);
  const targetFolder = DriveApp.getFolderById(targetFolderId);

  // Remove from all current parents
  const parents = file.getParents();
  while (parents.hasNext()) {
    const parent = parents.next();
    parent.removeFile(file);
  }

  // Add to new folder
  targetFolder.addFile(file);

  Logger.log(`✅ File moved to ${targetFolder.getName()}`);
}
```

---

## 📁 Folder Management

### Create & Navigate Folders

```javascript
function createFolder(folderName, parentFolderId) {
  const parentFolder = DriveApp.getFolderById(parentFolderId);
  const newFolder = parentFolder.createFolder(folderName);

  Logger.log(`✅ Folder created: ${newFolder.getId()}`);
  return newFolder;
}

// Create nested folder structure
function createFolderHierarchy(path, rootFolderId) {
  // path: 'Projects/2024/January'
  const folders = path.split('/');

  let currentFolder = DriveApp.getFolderById(rootFolderId);

  folders.forEach(folderName => {
    // Check if folder exists
    const subFolders = currentFolder.getFoldersByName(folderName);

    if (subFolders.hasNext()) {
      currentFolder = subFolders.next();
      Logger.log(`Folder exists: ${folderName}`);
    } else {
      currentFolder = currentFolder.createFolder(folderName);
      Logger.log(`✅ Folder created: ${folderName}`);
    }
  });

  return currentFolder;
}
```

---

### List Folder Contents

```javascript
function listFolderContents(folderId) {
  const folder = DriveApp.getFolderById(folderId);

  // List files
  const files = folder.getFiles();
  Logger.log(`Files in ${folder.getName()}:`);

  while (files.hasNext()) {
    const file = files.next();
    Logger.log(`  - ${file.getName()} (${file.getId()})`);
  }

  // List subfolders
  const folders = folder.getFolders();
  Logger.log(`Subfolders:`);

  while (folders.hasNext()) {
    const subfolder = folders.next();
    Logger.log(`  - ${subfolder.getName()} (${subfolder.getId()})`);
  }
}
```

---

## 🔐 Drive Permissions

### Share File/Folder

```javascript
function shareFileWithUser(fileId, email, permission) {
  const file = DriveApp.getFileById(fileId);

  // Permission types: 'OWNER', 'WRITER', 'COMMENTER', 'READER'
  file.addEditor(email);    // WRITER
  // OR
  file.addViewer(email);    // READER
  // OR
  file.addCommenter(email); // COMMENTER

  Logger.log(`✅ Shared with ${email} as ${permission}`);
}

// Remove access
function removeFileAccess(fileId, email) {
  const file = DriveApp.getFileById(fileId);
  file.removeEditor(email);
  file.removeViewer(email);

  Logger.log(`✅ Access removed for ${email}`);
}
```

---

### Domain-Wide Sharing

```javascript
function shareWithDomain(fileId) {
  const file = DriveApp.getFileById(fileId);

  // Share with anyone in domain (requires G Suite)
  file.setSharing(DriveApp.Access.DOMAIN, DriveApp.Permission.VIEW);

  Logger.log(`✅ Shared with domain`);
}

function makeFilePublic(fileId) {
  const file = DriveApp.getFileById(fileId);

  // Make publicly accessible (anyone with link)
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const url = file.getUrl();
  Logger.log(`✅ File public: ${url}`);

  return url;
}
```

---

## 📧 Gmail Operations

### Send Basic Email

```javascript
function sendBasicEmail(recipient, subject, body) {
  GmailApp.sendEmail(recipient, subject, body);

  Logger.log(`✅ Email sent to ${recipient}`);
}

// With options
function sendEmailWithOptions(recipient, subject, body) {
  const options = {
    cc: 'manager@example.com',
    bcc: 'archive@example.com',
    name: 'Order System',
    replyTo: 'noreply@example.com'
  };

  GmailApp.sendEmail(recipient, subject, body, options);
}
```

---

### Send HTML Email

```javascript
function sendHtmlEmail(recipient, subject, htmlBody) {
  const options = {
    htmlBody: htmlBody,
    name: 'GAS Automation'
  };

  GmailApp.sendEmail(recipient, subject, '', options); // Empty plain text

  Logger.log(`✅ HTML email sent to ${recipient}`);
}

// Example HTML template
function sendOrderConfirmationEmail(order) {
  const htmlBody = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .header { background-color: #4CAF50; color: white; padding: 10px; }
          .content { padding: 20px; }
          .footer { font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Order Confirmation</h2>
        </div>
        <div class="content">
          <p>Dear ${order.customerName},</p>
          <p>Your order <strong>${order.orderNumber}</strong> has been confirmed.</p>
          <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
          <p>Thank you for your business!</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply.</p>
        </div>
      </body>
    </html>
  `;

  sendHtmlEmail(order.email, `Order Confirmation - ${order.orderNumber}`, htmlBody);
}
```

---

### Email with Attachments

```javascript
function sendEmailWithAttachments(recipient, subject, body, fileIds) {
  const attachments = fileIds.map(fileId => {
    const file = DriveApp.getFileById(fileId);
    return file.getBlob();
  });

  const options = {
    attachments: attachments
  };

  GmailApp.sendEmail(recipient, subject, body, options);

  Logger.log(`✅ Email sent with ${attachments.length} attachments`);
}

// Alternative: Share Drive links (no 25MB limit!)
function sendEmailWithDriveLinks(recipient, subject, body, fileIds) {
  let bodyWithLinks = body + '\n\nAttached files:\n';

  fileIds.forEach(fileId => {
    const file = DriveApp.getFileById(fileId);
    // Make accessible
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const url = file.getUrl();
    bodyWithLinks += `\n- ${file.getName()}: ${url}`;
  });

  GmailApp.sendEmail(recipient, subject, bodyWithLinks);

  Logger.log(`✅ Email sent with Drive links`);
}
```

---

## 📝 Template-Based Emails

### Email Template Engine

```javascript
const EmailTemplates = {
  orderConfirmation: `
Hi {{customerName}},

Your order #{{orderNumber}} has been successfully placed.

Order Details:
- Date: {{orderDate}}
- Total: ${{total}}

We'll notify you once it ships.

Best regards,
{{companyName}}
  `,

  invoiceReminder: `
Dear {{customerName}},

This is a reminder that invoice #{{invoiceNumber}} is due on {{dueDate}}.

Amount Due: ${{amount}}

Please process payment at your earliest convenience.

Thank you,
{{companyName}}
  `
};

function fillTemplate(template, data) {
  let filled = template;

  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`;
    filled = filled.replace(new RegExp(placeholder, 'g'), value);
  }

  return filled;
}

// Usage
function sendOrderConfirmation(order) {
  const data = {
    customerName: order.customerName,
    orderNumber: order.number,
    orderDate: order.date,
    total: order.total.toFixed(2),
    companyName: 'Acme Corp'
  };

  const body = fillTemplate(EmailTemplates.orderConfirmation, data);
  const subject = `Order Confirmation - ${order.number}`;

  GmailApp.sendEmail(order.email, subject, body);
}
```

---

## 📥 Reading Emails

### Search & Read Emails

```javascript
function searchEmails(query, maxResults = 50) {
  // Gmail search syntax: 'subject:invoice is:unread after:2024/01/01'
  const threads = GmailApp.search(query, 0, maxResults);

  Logger.log(`Found ${threads.length} threads`);

  const messages = [];
  threads.forEach(thread => {
    const threadMessages = thread.getMessages();
    threadMessages.forEach(msg => {
      messages.push({
        subject: msg.getSubject(),
        from: msg.getFrom(),
        date: msg.getDate(),
        body: msg.getPlainBody(),
        isUnread: msg.isUnread()
      });
    });
  });

  return messages;
}

// Process unread emails
function processUnreadEmails() {
  const threads = GmailApp.getInboxThreads(0, 50);

  threads.forEach(thread => {
    if (thread.isUnread()) {
      const messages = thread.getMessages();
      const lastMessage = messages[messages.length - 1];

      Logger.log(`Processing: ${lastMessage.getSubject()}`);

      // Process message...

      // Mark as read
      thread.markRead();
    }
  });
}
```

---

### Extract Attachments

```javascript
function extractAttachmentsFromEmail(messageId) {
  const message = GmailApp.getMessageById(messageId);
  const attachments = message.getAttachments();

  Logger.log(`Found ${attachments.length} attachments`);

  attachments.forEach(attachment => {
    // Save to Drive
    const folderId = 'YOUR_FOLDER_ID';
    const folder = DriveApp.getFolderById(folderId);

    const file = folder.createFile(attachment);

    Logger.log(`✅ Saved: ${file.getName()} (${file.getId()})`);
  });
}
```

---

## ✅ Email Validation

```javascript
function isValidEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

function validateEmailList(emails) {
  const valid = [];
  const invalid = [];

  emails.forEach(email => {
    if (isValidEmail(email.trim())) {
      valid.push(email.trim());
    } else {
      invalid.push(email.trim());
    }
  });

  return { valid, invalid };
}
```

---

## 📊 Email Sending Quotas

### Quota Limits

- **Per User**: 100 emails/day (free Gmail)
- **G Suite**: 1,500 emails/day
- **Recipient Limit**: 500 recipients per email (to + cc + bcc)

### Batch Sending with Delay

```javascript
function sendBatchEmails(recipients, subject, body) {
  const BATCH_SIZE = 50;
  const DELAY_MS = 1000; // 1 second between batches

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);

    batch.forEach(recipient => {
      try {
        GmailApp.sendEmail(recipient, subject, body);
        Logger.log(`✅ Sent to ${recipient}`);
      } catch (error) {
        Logger.log(`❌ Failed to send to ${recipient}: ${error.message}`);
      }
    });

    // Delay between batches
    if (i + BATCH_SIZE < recipients.length) {
      Utilities.sleep(DELAY_MS);
    }
  }

  Logger.log(`Batch sending complete: ${recipients.length} emails`);
}
```

---

## ✅ Drive/Gmail Best Practices

### Checklist

- [x] **Handle file not found** - Try-catch on `getFileById()`
- [x] **Check permissions** - Verify access before operations
- [x] **Validate email addresses** - Use regex validation
- [x] **Use templates** - Consistent email formatting
- [x] **Sanitize HTML** - Prevent XSS in email content
- [x] **Monitor email quota** - Track daily sending limit
- [x] **Log operations** - Track file/email operations
- [x] **Use Drive links for large files** - Avoid 25MB attachment limit
- [x] **Cache folder/file IDs** - Store in Properties for reuse
- [x] **Test with real data** - Verify operations in production-like environment

---

## 🔗 Related Files

- `platform/error-handling.md` - Error handling patterns
- `security/authorization.md` - Drive permissions management
- `workspace/sheets-patterns.md` - Sheets integration with Drive
- `workspace/properties-triggers.md` - Trigger-based automation

---

**Versione**: 1.0
**Context Size**: ~450 righe
