# 🎯 SOLID Principles

**Categoria**: Architecture → Software Principles  
**Righe**: ~300
**Parent**: `specialists/solution-architect.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Apply SOLID principles in GAS
- Refactor code for maintainability
- Design scalable solutions
- Review code architecture
- Improve testability

---

## 1️⃣ Single Responsibility Principle (SRP)

### Definition
A class/module should have one and only one reason to change

### ❌ Violation Example

```javascript
// BAD: Multiple responsibilities
function processOrder(orderData) {
  // Validation
  if (!orderData.customer) throw new Error('Invalid');
  
  // Save to Sheets
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
  sheet.appendRow([orderData.id, orderData.customer, orderData.total]);
  
  // Send email
  GmailApp.sendEmail(orderData.email, 'Order Confirmation', 'Thank you');
  
  // Call BC API
  UrlFetchApp.fetch('https://bc.com/api/orders', {
    method: 'post',
    payload: JSON.stringify(orderData)
  });
}
```

### ✅ Correct Application

```javascript
// GOOD: Separate responsibilities
const OrderValidator = {
  validate(orderData) {
    if (!orderData.customer) throw new Error('Customer required');
    if (!orderData.total || orderData.total <= 0) throw new Error('Invalid total');
    return true;
  }
};

const OrderRepository = {
  save(order) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
    sheet.appendRow([order.id, order.customer, order.total]);
    return order;
  }
};

const OrderNotifier = {
  sendConfirmation(order) {
    GmailApp.sendEmail(order.email, 'Order Confirmation', 'Thank you');
  }
};

const BCIntegration = {
  syncOrder(order) {
    UrlFetchApp.fetch('https://bc.com/api/orders', {
      method: 'post',
      payload: JSON.stringify(order)
    });
  }
};

// Orchestrate with Service
function processOrder(orderData) {
  OrderValidator.validate(orderData);
  const order = OrderRepository.save(orderData);
  OrderNotifier.sendConfirmation(order);
  BCIntegration.syncOrder(order);
  return order;
}
```

---

## 2️⃣ Open/Closed Principle (OCP)

### Definition
Open for extension, closed for modification

### ❌ Violation Example

```javascript
// BAD: Requires modification for new discount types
function calculateDiscount(order) {
  if (order.type === 'VIP') {
    return order.total * 0.2;
  } else if (order.type === 'SEASONAL') {
    return order.total * 0.1;
  } else if (order.type === 'BULK') {
    return order.total * 0.15;
  }
  return 0;
}
```

### ✅ Correct Application

```javascript
// GOOD: Extend without modifying
const DiscountStrategies = {
  VIP: (order) => order.total * 0.2,
  SEASONAL: (order) => order.total * 0.1,
  BULK: (order) => order.total * 0.15,
  STANDARD: (order) => 0
};

function calculateDiscount(order) {
  const strategy = DiscountStrategies[order.type] || DiscountStrategies.STANDARD;
  return strategy(order);
}

// Add new discount type WITHOUT modifying calculateDiscount()
DiscountStrategies.STUDENT = (order) => order.total * 0.25;
```

---

## 3️⃣ Liskov Substitution Principle (LSP)

### Definition
Subtypes must be substitutable for their base types

### ❌ Violation Example

```javascript
// BAD: Subtype changes behavior unexpectedly
function BaseRepository() {}
BaseRepository.prototype.save = function(entity) {
  // Save and return entity
  return entity;
};

function ReadOnlyRepository() {}
ReadOnlyRepository.prototype = Object.create(BaseRepository.prototype);
ReadOnlyRepository.prototype.save = function(entity) {
  throw new Error('Cannot save in read-only mode'); // Violates LSP!
};
```

### ✅ Correct Application

```javascript
// GOOD: Consistent behavior
const Repository = {
  save(entity) {
    if (this.readOnly) {
      Logger.log('Read-only mode: save ignored');
      return entity;  // Consistent return
    }
    // Actual save logic
    return entity;
  }
};
```

---

## 4️⃣ Interface Segregation Principle (ISP)

### Definition
Clients should not depend on interfaces they don't use

### ❌ Violation Example

```javascript
// BAD: Monolithic interface
const DataSource = {
  read() { /* ... */ },
  write() { /* ... */ },
  delete() { /* ... */ },
  backup() { /* ... */ },
  restore() { /* ... */ },
  migrate() { /* ... */ }
};

// Client only needs read, but must import entire interface
```

### ✅ Correct Application

```javascript
// GOOD: Focused interfaces
const ReadableDataSource = {
  read() { /* ... */ }
};

const WritableDataSource = {
  write() { /* ... */ }
};

const BackupDataSource = {
  backup() { /* ... */ },
  restore() { /* ... */ }
};

// Clients use only what they need
function readData() {
  return ReadableDataSource.read();
}

function saveData(data) {
  return WritableDataSource.write(data);
}
```

---

## 5️⃣ Dependency Inversion Principle (DIP)

### Definition
Depend on abstractions, not concretions

### ❌ Violation Example

```javascript
// BAD: Direct dependency on concrete implementation
function OrderService() {
  this.repository = new SheetsRepository(); // Concrete!
}

OrderService.prototype.getOrders = function() {
  return this.repository.getAll();
};
```

### ✅ Correct Application

```javascript
// GOOD: Depend on abstraction (injected dependency)
function OrderService(repository) {
  this.repository = repository;  // Injected abstraction
}

OrderService.prototype.getOrders = function() {
  return this.repository.getAll();
};

// Usage - inject any implementation
const sheetsRepo = new SheetsRepository();
const orderService = new OrderService(sheetsRepo);

// Easy to swap implementations
const bcRepo = new BCRepository();
const orderService2 = new OrderService(bcRepo);
```

---

## 🎯 SOLID in GAS Context

### Applying SOLID Despite Language Limitations

**GAS Limitations**:
- No native interfaces
- Limited class support (ES5-like)
- No strong typing

**Solutions**:
```javascript
// Use module pattern for encapsulation
const MyModule = (function() {
  // Private
  function privateHelper() {}
  
  // Public interface
  return {
    publicMethod() {}
  };
})();

// Dependency injection via parameters
function Service(dependencies) {
  this.repo = dependencies.repository;
  this.logger = dependencies.logger;
}

// Strategy pattern for OCP
const Strategies = {};
Strategies.add = function(name, fn) {
  Strategies[name] = fn;
};
```

---

## ✅ Best Practices Checklist

- [x] **SRP**: Each module has single responsibility
- [x] **OCP**: Extend with new code, don't modify existing
- [x] **LSP**: Substitutable implementations
- [x] **ISP**: Small, focused interfaces
- [x] **DIP**: Inject dependencies, don't hard-code

---

## 🔗 Related Files

- `architecture/patterns.md` - Design patterns
- `platform/error-handling.md` - Error handling patterns

---

**Versione**: 1.0
**Context Size**: ~300 righe
