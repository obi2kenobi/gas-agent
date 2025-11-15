/**
 * Service.gs - Business Logic Layer
 *
 * Implements business logic and complex operations that span multiple tables.
 *
 * Features:
 * - Order management (create order with items)
 * - Transaction-like operations
 * - Business rules and validation
 * - Computed fields
 * - Complex queries
 */

/**
 * OrderService - Handles order-related business logic
 */
const OrderService = (function() {

  const customerRepo = new CustomerRepository();
  const orderRepo = new OrderRepository();
  const orderItemRepo = new OrderItemRepository();

  /**
   * Create complete order with items (transaction-like)
   *
   * @param {Object} orderData - Order data
   * @param {Array<Object>} items - Order items
   * @returns {Object} Created order with items
   */
  function createOrder(orderData, items) {
    try {
      // Validate customer exists
      const customer = customerRepo.findById(orderData.customer_id);
      if (!customer) {
        throw new Error(`Customer not found: ${orderData.customer_id}`);
      }

      // Check customer is active
      if (customer.status !== 'active') {
        throw new Error(`Customer is not active: ${customer.status}`);
      }

      // Validate items
      if (!items || items.length === 0) {
        throw new Error('Order must have at least one item');
      }

      // Calculate line totals and order total
      let orderTotal = 0;
      const processedItems = [];

      for (const item of items) {
        if (!item.quantity || item.quantity <= 0) {
          throw new Error(`Invalid quantity for product ${item.product_code}`);
        }

        if (!item.unit_price || item.unit_price < 0) {
          throw new Error(`Invalid unit price for product ${item.product_code}`);
        }

        const lineTotal = item.quantity * item.unit_price;
        orderTotal += lineTotal;

        processedItems.push({
          ...item,
          line_total: lineTotal
        });
      }

      // Check customer credit limit
      if (customer.credit_limit > 0 && orderTotal > customer.credit_limit) {
        throw new Error(
          `Order total $${orderTotal} exceeds customer credit limit $${customer.credit_limit}`
        );
      }

      // Create order
      const order = orderRepo.create({
        ...orderData,
        total_amount: orderTotal,
        status: 'pending'
      });

      Logger.log(`✅ Created order: ${order.order_id} (${order.order_number})`);

      // Create order items
      const createdItems = [];
      for (const item of processedItems) {
        const orderItem = orderItemRepo.create({
          order_id: order.order_id,
          ...item
        });
        createdItems.push(orderItem);
        Logger.log(`   ✓ Added item: ${orderItem.product_code} x ${orderItem.quantity}`);
      }

      return {
        order,
        items: createdItems,
        summary: {
          itemCount: createdItems.length,
          totalAmount: orderTotal
        }
      };

    } catch (error) {
      Logger.log(`❌ Failed to create order: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update order status
   *
   * @param {string} orderId - Order ID
   * @param {string} newStatus - New status
   * @returns {Object} Updated order
   */
  function updateOrderStatus(orderId, newStatus) {
    const order = orderRepo.findById(orderId);

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Validate status transition
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    // Business rule: Cannot change status of cancelled orders
    if (order.status === 'cancelled') {
      throw new Error('Cannot change status of cancelled orders');
    }

    // Business rule: Cannot cancel delivered orders
    if (order.status === 'delivered' && newStatus === 'cancelled') {
      throw new Error('Cannot cancel delivered orders');
    }

    const updated = orderRepo.update(orderId, { status: newStatus });

    Logger.log(`✅ Updated order ${orderId} status: ${order.status} → ${newStatus}`);

    return updated;
  }

  /**
   * Cancel order (deletes order and items)
   *
   * @param {string} orderId - Order ID
   * @returns {boolean} True if cancelled
   */
  function cancelOrder(orderId) {
    const order = orderRepo.findById(orderId);

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Business rule: Can only cancel pending or confirmed orders
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      throw new Error(`Cannot cancel order with status: ${order.status}`);
    }

    // Update status to cancelled
    orderRepo.update(orderId, { status: 'cancelled' });

    Logger.log(`✅ Cancelled order: ${orderId}`);

    return true;
  }

  /**
   * Get order with items (full order details)
   *
   * @param {string} orderId - Order ID
   * @returns {Object} Order with items
   */
  function getOrderDetails(orderId) {
    const order = orderRepo.findById(orderId);

    if (!order) {
      return null;
    }

    const items = orderItemRepo.findByOrder(orderId);
    const customer = customerRepo.findById(order.customer_id);

    return {
      order,
      customer,
      items,
      summary: {
        itemCount: items.length,
        totalAmount: order.total_amount
      }
    };
  }

  /**
   * Get customer orders with details
   *
   * @param {string} customerId - Customer ID
   * @returns {Array<Object>} Customer orders
   */
  function getCustomerOrders(customerId) {
    const customer = customerRepo.findById(customerId);

    if (!customer) {
      throw new Error(`Customer not found: ${customerId}`);
    }

    const orders = orderRepo.findByCustomer(customerId);

    return orders.map(order => ({
      ...order,
      itemCount: orderItemRepo.findByOrder(order.order_id).length
    }));
  }

  /**
   * Recalculate order total from items
   *
   * @param {string} orderId - Order ID
   * @returns {Object} Updated order
   */
  function recalculateOrderTotal(orderId) {
    const order = orderRepo.findById(orderId);

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const calculatedTotal = orderItemRepo.calculateOrderTotal(orderId);

    if (calculatedTotal !== order.total_amount) {
      Logger.log(`⚠️  Order total mismatch: ${order.total_amount} → ${calculatedTotal}`);

      const updated = orderRepo.update(orderId, { total_amount: calculatedTotal });

      Logger.log(`✅ Recalculated order ${orderId} total: $${calculatedTotal}`);

      return updated;
    }

    Logger.log(`✓ Order ${orderId} total is correct: $${calculatedTotal}`);
    return order;
  }

  /**
   * Get order statistics
   *
   * @returns {Object} Order statistics
   */
  function getOrderStatistics() {
    const allOrders = orderRepo.findAll();

    const stats = {
      totalOrders: allOrders.length,
      byStatus: {},
      totalRevenue: 0,
      averageOrderValue: 0
    };

    // Group by status
    allOrders.forEach(order => {
      const status = order.status;
      if (!stats.byStatus[status]) {
        stats.byStatus[status] = { count: 0, revenue: 0 };
      }
      stats.byStatus[status].count++;
      stats.byStatus[status].revenue += order.total_amount || 0;

      // Calculate total revenue (exclude cancelled)
      if (status !== 'cancelled') {
        stats.totalRevenue += order.total_amount || 0;
      }
    });

    // Calculate average
    const revenueOrders = allOrders.filter(o => o.status !== 'cancelled').length;
    stats.averageOrderValue = revenueOrders > 0 ? stats.totalRevenue / revenueOrders : 0;

    return stats;
  }

  // Public API
  return {
    createOrder,
    updateOrderStatus,
    cancelOrder,
    getOrderDetails,
    getCustomerOrders,
    recalculateOrderTotal,
    getOrderStatistics
  };
})();

/**
 * CustomerService - Handles customer-related business logic
 */
const CustomerService = (function() {

  const customerRepo = new CustomerRepository();
  const orderRepo = new OrderRepository();

  /**
   * Create customer with validation
   *
   * @param {Object} customerData - Customer data
   * @returns {Object} Created customer
   */
  function createCustomer(customerData) {
    // Check for duplicate email
    const existing = customerRepo.findByEmail(customerData.email);
    if (existing) {
      throw new Error(`Customer with email ${customerData.email} already exists`);
    }

    const customer = customerRepo.create(customerData);

    Logger.log(`✅ Created customer: ${customer.name} (${customer.email})`);

    return customer;
  }

  /**
   * Get customer with order history
   *
   * @param {string} customerId - Customer ID
   * @returns {Object} Customer with orders
   */
  function getCustomerProfile(customerId) {
    const customer = customerRepo.findById(customerId);

    if (!customer) {
      return null;
    }

    const orders = orderRepo.findByCustomer(customerId);

    // Calculate customer statistics
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'delivered').length;
    const totalSpent = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    return {
      customer,
      statistics: {
        totalOrders,
        completedOrders,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        totalSpent,
        averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0
      },
      recentOrders: orders.slice(0, 5) // Last 5 orders
    };
  }

  /**
   * Update customer status
   *
   * @param {string} customerId - Customer ID
   * @param {string} newStatus - New status
   * @returns {Object} Updated customer
   */
  function updateCustomerStatus(customerId, newStatus) {
    const customer = customerRepo.findById(customerId);

    if (!customer) {
      throw new Error(`Customer not found: ${customerId}`);
    }

    // Business rule: Cannot suspend customer with pending orders
    if (newStatus === 'suspended') {
      const pendingOrders = orderRepo.findByCustomer(customerId)
        .filter(o => o.status === 'pending' || o.status === 'confirmed');

      if (pendingOrders.length > 0) {
        throw new Error(
          `Cannot suspend customer with ${pendingOrders.length} pending orders`
        );
      }
    }

    const updated = customerRepo.update(customerId, { status: newStatus });

    Logger.log(`✅ Updated customer ${customerId} status: ${customer.status} → ${newStatus}`);

    return updated;
  }

  /**
   * Get top customers by revenue
   *
   * @param {number} limit - Number of customers to return
   * @returns {Array<Object>} Top customers
   */
  function getTopCustomers(limit = 10) {
    const allCustomers = customerRepo.findAll();
    const allOrders = orderRepo.findAll();

    // Calculate revenue per customer
    const customerRevenue = {};
    allOrders.forEach(order => {
      if (order.status !== 'cancelled') {
        const customerId = order.customer_id;
        if (!customerRevenue[customerId]) {
          customerRevenue[customerId] = 0;
        }
        customerRevenue[customerId] += order.total_amount || 0;
      }
    });

    // Sort customers by revenue
    const topCustomers = allCustomers
      .map(customer => ({
        ...customer,
        totalRevenue: customerRevenue[customer.customer_id] || 0,
        orderCount: allOrders.filter(o => o.customer_id === customer.customer_id).length
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    return topCustomers;
  }

  // Public API
  return {
    createCustomer,
    getCustomerProfile,
    updateCustomerStatus,
    getTopCustomers
  };
})();

/**
 * Test function
 */
function testService() {
  Logger.log('🧪 Testing Service Layer...');
  Logger.log('');

  // Note: These tests require initialized database with sample data

  try {
    // Test 1: Create customer
    Logger.log('Test 1: Create customer');
    const customer = CustomerService.createCustomer({
      name: 'Test Customer',
      email: `test${Date.now()}@example.com`,
      phone: '+1-555-0123',
      credit_limit: 10000,
      status: 'active'
    });
    Logger.log(`  ✅ Created: ${customer.name}`);

    Logger.log('');

    // Test 2: Create order with items
    Logger.log('Test 2: Create order with items');
    const orderResult = OrderService.createOrder(
      {
        customer_id: customer.customer_id,
        order_date: new Date().toISOString().split('T')[0],
        notes: 'Test order'
      },
      [
        {
          product_code: 'PROD-001',
          product_name: 'Product 1',
          quantity: 2,
          unit_price: 99.99
        },
        {
          product_code: 'PROD-002',
          product_name: 'Product 2',
          quantity: 1,
          unit_price: 149.99
        }
      ]
    );
    Logger.log(`  ✅ Order created: ${orderResult.order.order_number}`);
    Logger.log(`     Total: $${orderResult.summary.totalAmount}`);
    Logger.log(`     Items: ${orderResult.summary.itemCount}`);

    Logger.log('');

    // Test 3: Get order details
    Logger.log('Test 3: Get order details');
    const orderDetails = OrderService.getOrderDetails(orderResult.order.order_id);
    Logger.log(`  ✅ Order: ${orderDetails.order.order_number}`);
    Logger.log(`     Customer: ${orderDetails.customer.name}`);
    Logger.log(`     Items: ${orderDetails.items.length}`);

    Logger.log('');

    // Test 4: Update order status
    Logger.log('Test 4: Update order status');
    OrderService.updateOrderStatus(orderResult.order.order_id, 'confirmed');
    Logger.log(`  ✅ Status updated to: confirmed`);

    Logger.log('');

    // Test 5: Get customer profile
    Logger.log('Test 5: Get customer profile');
    const profile = CustomerService.getCustomerProfile(customer.customer_id);
    Logger.log(`  ✅ Customer: ${profile.customer.name}`);
    Logger.log(`     Total orders: ${profile.statistics.totalOrders}`);
    Logger.log(`     Total spent: $${profile.statistics.totalSpent}`);

    Logger.log('');

    // Test 6: Get order statistics
    Logger.log('Test 6: Get order statistics');
    const stats = OrderService.getOrderStatistics();
    Logger.log(`  ✅ Total orders: ${stats.totalOrders}`);
    Logger.log(`     Total revenue: $${stats.totalRevenue.toFixed(2)}`);
    Logger.log(`     Average order: $${stats.averageOrderValue.toFixed(2)}`);

    Logger.log('');
    Logger.log('✅ Service layer tests completed!');

  } catch (error) {
    Logger.log(`❌ Test failed: ${error.message}`);
    Logger.log(error.stack);
  }
}
