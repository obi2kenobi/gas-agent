# 🏗️ Architectural Patterns

**Categoria**: Architecture → Design Patterns
**Righe**: ~350
**Parent**: `specialists/solution-architect.md`

---

## 🎯 Quando Usare Questo File

Consulta questo file quando devi:
- Select appropriate design patterns for GAS solutions
- Implement Repository Pattern for data access
- Apply Service Layer for business logic
- Use Factory Pattern for object creation
- Implement Strategy Pattern for algorithms
- Apply Adapter Pattern for external APIs
- Design event-driven systems with Observer Pattern

---

## 🗄️ Repository Pattern

### Purpose
Centralize data access logic, abstract storage implementation

### Implementation

```javascript
// Repository interface (conceptual - GAS doesn't have interfaces)
const OrderRepository = (function() {
  function getAll() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
    const data = sheet.getDataRange().getValues();
    
    return data.slice(1).map(row => ({
      id: row[0],
      customer: row[1],
      total: row[2],
      status: row[3]
    }));
  }

  function getById(id) {
    const all = getAll();
    return all.find(order => order.id === id);
  }

  function save(order) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
    
    if (order.id) {
      // Update existing
      updateOrder(sheet, order);
    } else {
      // Insert new
      order.id = generateId();
      insertOrder(sheet, order);
    }
    
    return order;
  }

  function deleteById(id) {
    // Implementation...
  }

  // Private helpers
  function generateId() {
    return Utilities.getUuid();
  }

  function insertOrder(sheet, order) {
    sheet.appendRow([order.id, order.customer, order.total, order.status]);
  }

  function updateOrder(sheet, order) {
    // Find and update row...
  }

  return { getAll, getById, save, deleteById };
})();

// Usage
function processOrder() {
  const order = OrderRepository.getById('123');
  order.status = 'Shipped';
  OrderRepository.save(order);
}
```

**Benefits**:
- Centralized data access
- Easy to swap storage (Sheets → BC → Database)
- Testable (mock repository)

---

## ⚙️ Service Layer Pattern

### Purpose
Orchestrate business logic, coordinate between repositories

### Implementation

```javascript
const OrderService = (function() {
  function createOrder(orderData) {
    // Validation
    if (!orderData.customer || !orderData.items) {
      throw new Error('Invalid order data');
    }

    // Business logic
    const order = {
      customer: orderData.customer,
      items: orderData.items,
      total: calculateTotal(orderData.items),
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    // Save via repository
    const saved = OrderRepository.save(order);

    // Send notification
    NotificationService.sendOrderConfirmation(saved);

    return saved;
  }

  function shipOrder(orderId) {
    const order = OrderRepository.getById(orderId);

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (order.status !== 'Pending') {
      throw new Error(`Cannot ship order in status: ${order.status}`);
    }

    // Update status
    order.status = 'Shipped';
    order.shippedAt = new Date().toISOString();

    OrderRepository.save(order);

    // Notify customer
    NotificationService.sendShippingNotification(order);

    return order;
  }

  function calculateTotal(items) {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  return { createOrder, shipOrder };
})();

// Usage
function handleNewOrder() {
  const orderData = {
    customer: 'Acme Corp',
    items: [
      { sku: 'ABC', price: 50, quantity: 2 },
      { sku: 'XYZ', price: 30, quantity: 1 }
    ]
  };

  const order = OrderService.createOrder(orderData);
  Logger.log(`Order created: ${order.id}`);
}
```

**Benefits**:
- Business logic centralized
- Reusable across UI/triggers/API
- Clear separation of concerns

---

## 🏭 Factory Pattern

### Purpose
Create objects without specifying exact class

### Implementation

```javascript
// API Client Factory
const APIClientFactory = (function() {
  function create(type, config) {
    switch(type) {
      case 'BC':
        return createBCClient(config);
      case 'Claude':
        return createClaudeClient(config);
      default:
        throw new Error(`Unknown client type: ${type}`);
    }
  }

  function createBCClient(config) {
    return {
      type: 'BC',
      baseUrl: config.bcUrl,
      
      request(endpoint, options = {}) {
        const token = getBC Token();
        // BC-specific request logic...
      }
    };
  }

  function createClaudeClient(config) {
    return {
      type: 'Claude',
      baseUrl: 'https://api.anthropic.com/v1',
      
      request(endpoint, options = {}) {
        const apiKey = getClaudeAPIKey();
        // Claude-specific request logic...
      }
    };
  }

  return { create };
})();

// Usage
function example() {
  const bcClient = APIClientFactory.create('BC', { bcUrl: 'https://...' });
  const claudeClient = APIClientFactory.create('Claude', {});

  bcClient.request('/salesOrders');
  claudeClient.request('/messages');
}
```

---

## 🎯 Strategy Pattern

### Purpose
Select algorithm at runtime

### Implementation

```javascript
// Pricing strategies
const PricingStrategies = {
  standard: function(basePrice) {
    return basePrice;
  },

  discount10: function(basePrice) {
    return basePrice * 0.9;
  },

  bulkDiscount: function(basePrice, quantity) {
    if (quantity >= 100) return basePrice * 0.8;
    if (quantity >= 50) return basePrice * 0.85;
    if (quantity >= 10) return basePrice * 0.9;
    return basePrice;
  },

  seasonal: function(basePrice) {
    const month = new Date().getMonth();
    // December: 20% off
    if (month === 11) return basePrice * 0.8;
    return basePrice;
  }
};

// Context using strategy
function calculatePrice(item, strategy, quantity = 1) {
  const basePrice = item.price;
  const pricingStrategy = PricingStrategies[strategy] || PricingStrategies.standard;

  return pricingStrategy(basePrice, quantity);
}

// Usage
const item = { name: 'Widget', price: 100 };

const standard = calculatePrice(item, 'standard');        // 100
const discounted = calculatePrice(item, 'discount10');    // 90
const bulk = calculatePrice(item, 'bulkDiscount', 50);    // 85
const seasonal = calculatePrice(item, 'seasonal');        // 80 (if December)
```

---

## 🔌 Adapter Pattern

### Purpose
Wrap external API with consistent interface

### Implementation

```javascript
// BC API Adapter
const BCAdapter = (function() {
  function getOrders() {
    const response = callBCAPI('/salesOrders');
    
    // Adapt BC format to internal format
    return response.value.map(bcOrder => ({
      id: bcOrder.id,
      orderNumber: bcOrder.number,
      customer: bcOrder.customerName,
      total: bcOrder.totalAmountIncludingTax,
      date: bcOrder.orderDate
    }));
  }

  function createOrder(order) {
    // Adapt internal format to BC format
    const bcOrder = {
      customerId: order.customerId,
      orderDate: order.date,
      // ... BC-specific fields
    };

    const response = callBCAPI('/salesOrders', { method: 'POST', body: bcOrder });
    
    // Adapt response back
    return {
      id: response.id,
      orderNumber: response.number
    };
  }

  function callBCAPI(endpoint, options = {}) {
    // BC API call logic...
  }

  return { getOrders, createOrder };
})();

// Usage - same interface regardless of backend
function syncOrders() {
  const orders = BCAdapter.getOrders();
  
  orders.forEach(order => {
    Logger.log(`${order.orderNumber}: ${order.customer}`);
  });
}
```

---

## 👁️ Observer Pattern (Event-Driven)

### Purpose
Notify subscribers of events

### Implementation

```javascript
const EventEmitter = (function() {
  const listeners = {};

  function on(event, callback) {
    if (!listeners[event]) {
      listeners[event] = [];
    }
    listeners[event].push(callback);
  }

  function emit(event, data) {
    const eventListeners = listeners[event] || [];
    eventListeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        Logger.log(`Error in listener for ${event}: ${error.message}`);
      }
    });
  }

  function off(event, callback) {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter(cb => cb !== callback);
    }
  }

  return { on, emit, off };
})();

// Usage
EventEmitter.on('order.created', function(order) {
  Logger.log(`New order: ${order.id}`);
});

EventEmitter.on('order.created', function(order) {
  // Send email notification
  sendOrderConfirmation(order);
});

// Trigger event
function createOrder(orderData) {
  const order = OrderRepository.save(orderData);
  
  // Notify all listeners
  EventEmitter.emit('order.created', order);
  
  return order;
}
```

---

## 📋 Pattern Selection Guide

### When to use Repository Pattern
- ✅ Multiple data sources (Sheets, BC, Drive)
- ✅ Need to swap storage implementation
- ✅ Want testable data access

### When to use Service Layer
- ✅ Complex business logic
- ✅ Orchestration across repositories
- ✅ Reusable business operations

### When to use Factory Pattern
- ✅ Multiple implementations of same interface
- ✅ Environment-specific configuration
- ✅ Runtime object creation

### When to use Strategy Pattern
- ✅ Multiple algorithms for same task
- ✅ Algorithm selection at runtime
- ✅ Avoid if-else chains

### When to use Adapter Pattern
- ✅ Wrapping external APIs
- ✅ Normalizing different data formats
- ✅ Isolating third-party dependencies

### When to use Observer Pattern
- ✅ Event-driven architecture
- ✅ Decoupled components
- ✅ Multiple actions on same event

---

## 🔗 Related Files

- `architecture/principles.md` - SOLID principles
- `platform/error-handling.md` - Error handling patterns
- `data-engineer.md` - Data access patterns

---

**Versione**: 1.0
**Context Size**: ~350 righe
