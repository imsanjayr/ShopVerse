const express = require('express');
const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();
const ADMINS_FILE = path.join(__dirname, '..', 'data', 'admins.json');
const PRODUCTS_FILE = path.join(__dirname, '..', 'data', 'products.json');
const ORDERS_FILE = path.join(__dirname, '..', 'data', 'orders.json');
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

// Middleware to check admin authentication
function requireAdmin(req, res, next) {
  if (!req.session.adminId) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  next();
}

// Helper function to read admins
async function readAdmins() {
  try {
    const data = await fs.readFile(ADMINS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Helper function to read users
async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Helper function to read products
async function readProducts() {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Helper function to write products
async function writeProducts(products) {
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
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

// Admin login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const admins = await readAdmins();
    const admin = admins.find(a => a.username === username);

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Set admin session
    req.session.adminId = admin.id;
    req.session.adminUsername = admin.username;

    res.json({ 
      message: 'Admin login successful',
      admin: { id: admin.id, username: admin.username }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin logout
router.post('/admin/logout', (req, res) => {
  req.session.adminId = null;
  req.session.adminUsername = null;
  res.json({ message: 'Admin logout successful' });
});

// Get admin status
router.get('/admin/status', (req, res) => {
  if (req.session.adminId) {
    res.json({
      admin: {
        id: req.session.adminId,
        username: req.session.adminUsername
      }
    });
  } else {
    res.json({ admin: null });
  }
});

// Admin stats
router.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    const [users, products, orders] = await Promise.all([
      readUsers(),
      readProducts(),
      readOrders()
    ]);

    res.json({
      users: users.length,
      products: products.length,
      orders: orders.length
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all products (admin)
router.get('/admin/products', requireAdmin, async (req, res) => {
  try {
    const products = await readProducts();
    res.json(products);
  } catch (error) {
    console.error('Get admin products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new product (admin)
router.post('/admin/products', requireAdmin, async (req, res) => {
  try {
    const { name, description, price, image, category, stock } = req.body;

    if (!name || !description || !price || !image || !category || stock === undefined) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const products = await readProducts();

    const newProduct = {
      id: Date.now().toString(),
      name,
      description,
      price: parseFloat(price),
      image,
      category,
      stock: parseInt(stock)
    };

    products.push(newProduct);
    await writeProducts(products);

    res.json({ message: 'Product created successfully', product: newProduct });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update product (admin)
router.put('/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const { name, description, price, image, category, stock } = req.body;
    const products = await readProducts();
    const productIndex = products.findIndex(p => p.id === req.params.id);

    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    products[productIndex] = {
      ...products[productIndex],
      ...(name && { name }),
      ...(description && { description }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(image && { image }),
      ...(category && { category }),
      ...(stock !== undefined && { stock: parseInt(stock) })
    };

    await writeProducts(products);

    res.json({ message: 'Product updated successfully', product: products[productIndex] });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete product (admin)
router.delete('/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const products = await readProducts();
    const filteredProducts = products.filter(p => p.id !== req.params.id);

    if (products.length === filteredProducts.length) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await writeProducts(filteredProducts);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all orders (admin)
router.get('/admin/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await readOrders();
    res.json(orders);
  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order status (admin)
router.put('/admin/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const orders = await readOrders();
    const orderIndex = orders.findIndex(o => o.id === req.params.id);

    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    orders[orderIndex].status = status;
    await writeOrders(orders);

    res.json({ message: 'Order status updated', order: orders[orderIndex] });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

