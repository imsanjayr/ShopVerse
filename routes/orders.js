const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();
const ORDERS_FILE = path.join(__dirname, '..', 'data', 'orders.json');
const CARTS_FILE = path.join(__dirname, '..', 'data', 'carts.json');

// Middleware to check authentication
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Helper function to read orders
async function readOrders() {
  try {
    const data = await fs.readFile(ORDERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Helper function to write orders
async function writeOrders(orders) {
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

// Helper function to read carts
async function readCarts() {
  try {
    const data = await fs.readFile(CARTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

// Helper function to write carts
async function writeCarts(carts) {
  await fs.writeFile(CARTS_FILE, JSON.stringify(carts, null, 2));
}

// Create new order
router.post('/orders', requireAuth, async (req, res) => {
  try {
    const { name, address, phone } = req.body;

    if (!name || !address || !phone) {
      return res.status(400).json({ error: 'All shipping fields are required' });
    }

    const carts = await readCarts();
    const userId = req.session.userId;
    const userCart = carts[userId] || [];

    if (userCart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate total
    const productsData = await fs.readFile(path.join(__dirname, '..', 'data', 'products.json'), 'utf8');
    const products = JSON.parse(productsData);

    let subtotal = 0;
    const orderItems = userCart.map(item => {
      const product = products.find(p => p.id === item.productId);
      const itemTotal = product ? product.price * item.quantity : 0;
      subtotal += itemTotal;
      return {
        productId: item.productId,
        productName: product ? product.name : 'Unknown',
        quantity: item.quantity,
        price: product ? product.price : 0,
        subtotal: itemTotal
      };
    });

    // Calculate tax and shipping
    const tax = subtotal * 0.1; // 10% tax
    const shipping = 10.00;
    const total = subtotal + tax + shipping;

    // Create order
    const order = {
      id: Date.now().toString(),
      userId,
      items: orderItems,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      shipping: shipping.toFixed(2),
      total: total.toFixed(2),
      shippingInfo: {
        name,
        address,
        phone
      },
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const orders = await readOrders();
    orders.push(order);
    await writeOrders(orders);

    // Clear user's cart
    carts[userId] = [];
    await writeCarts(carts);

    res.json({ message: 'Order created successfully', order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's orders
router.get('/orders', requireAuth, async (req, res) => {
  try {
    const orders = await readOrders();
    const userId = req.session.userId;
    const userOrders = orders.filter(o => o.userId === userId);
    res.json(userOrders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

