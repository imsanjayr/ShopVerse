const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();
const CARTS_FILE = path.join(__dirname, '..', 'data', 'carts.json');
const PRODUCTS_FILE = path.join(__dirname, '..', 'data', 'products.json');

// Middleware to check authentication
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
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

// Helper function to read products
async function readProducts() {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Get user's cart
router.get('/cart', requireAuth, async (req, res) => {
  try {
    const carts = await readCarts();
    const userId = req.session.userId;
    const userCart = carts[userId] || [];

    // Enrich cart items with product details
    const products = await readProducts();
    const enrichedCart = userCart.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        ...item,
        product: product || null
      };
    });

    res.json(enrichedCart);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add item to cart
router.post('/cart/add', requireAuth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'Product ID and quantity are required' });
    }

    const products = await readProducts();
    const product = products.find(p => p.id === productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const carts = await readCarts();
    const userId = req.session.userId;

    if (!carts[userId]) {
      carts[userId] = [];
    }

    // Check if item already exists in cart
    const existingItem = carts[userId].find(item => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += parseInt(quantity);
    } else {
      carts[userId].push({
        productId,
        quantity: parseInt(quantity)
      });
    }

    await writeCarts(carts);

    res.json({ message: 'Item added to cart' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update item quantity in cart
router.put('/cart/update', requireAuth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined || quantity < 1) {
      return res.status(400).json({ error: 'Product ID and valid quantity are required' });
    }

    const carts = await readCarts();
    const userId = req.session.userId;

    if (!carts[userId]) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const item = carts[userId].find(item => item.productId === productId);

    if (!item) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    item.quantity = parseInt(quantity);
    await writeCarts(carts);

    res.json({ message: 'Cart updated' });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove item from cart
router.delete('/cart/remove/:productId', requireAuth, async (req, res) => {
  try {
    const carts = await readCarts();
    const userId = req.session.userId;

    if (!carts[userId]) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    carts[userId] = carts[userId].filter(item => item.productId !== req.params.productId);
    await writeCarts(carts);

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

