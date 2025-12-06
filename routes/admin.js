import express from 'express';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import { authenticate, isAdmin, isSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication
router.use(authenticate);

// ========== MENU MANAGEMENT ==========
// All admins can manage menu items

// Create menu item
router.post('/menu', isAdmin, async (req, res) => {
  try {
    const { name, description, price, category, image, available, preparationTime } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const menuItem = new MenuItem({
      name,
      description,
      price,
      category,
      image: image || 'https://via.placeholder.com/300x200?text=Food+Item',
      available: available !== undefined ? available : true,
      preparationTime: preparationTime || 20
    });

    await menuItem.save();
    res.status(201).json(menuItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update menu item
router.put('/menu/:id', isAdmin, async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    Object.assign(menuItem, req.body);
    await menuItem.save();

    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete menu item
router.delete('/menu/:id', isAdmin, async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all menu items (admin view - includes unavailable items)
router.get('/menu', isAdmin, async (req, res) => {
  try {
    const menuItems = await MenuItem.find().sort({ createdAt: -1 });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== ORDER MANAGEMENT ==========
// All admins can manage orders

// Get all orders
router.get('/orders', isAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { orderStatus: status } : {};
    
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.menuItem')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update order status
router.put('/orders/:id/status', isAdmin, async (req, res) => {
  try {
    const { orderStatus } = req.body;

    if (!orderStatus) {
      return res.status(400).json({ message: 'Please provide order status' });
    }

    const validStatuses = ['pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Calculate estimated delivery time (30 minutes from now for active orders)
    let estimatedDeliveryTime = null;
    if (orderStatus === 'out-for-delivery') {
      estimatedDeliveryTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    } else if (orderStatus === 'delivered') {
      estimatedDeliveryTime = new Date(); // Delivered now
    }

    order.orderStatus = orderStatus;
    if (estimatedDeliveryTime) {
      order.estimatedDeliveryTime = estimatedDeliveryTime;
    }
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get order statistics
router.get('/stats', isAdmin, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
    const completedOrders = await Order.countDocuments({ orderStatus: 'delivered' });
    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    res.json({
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue: revenue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== ADMIN USER MANAGEMENT ==========
// Only super admin (admin@foodie.com) can manage admin users

// Create new admin user
router.post('/create-admin', isSuperAdmin, async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ 
        message: 'Please provide all required fields: name, email, password, and phone' 
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Please provide a valid email address' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this email' 
      });
    }

    // Create new admin user
    const adminUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone.trim(),
      address: address ? address.trim() : '',
      role: 'admin' // Set role to admin
    });

    await adminUser.save();

    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        phone: adminUser.phone,
        role: adminUser.role
      }
    });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    // Handle duplicate key error (email already exists)
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'User already exists with this email' 
      });
    }
    
    console.error('Admin creation error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to create admin user. Please try again.' 
    });
  }
});

// Get all admin users
router.get('/admins', isSuperAdmin, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== CATEGORY MANAGEMENT ==========
// Only super admin (admin@foodie.com) can manage categories

// Get all categories
router.get('/categories', isSuperAdmin, async (req, res) => {
  try {
    const categories = await Category.find().sort({ displayName: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new category
router.post('/categories', isSuperAdmin, async (req, res) => {
  try {
    const { name, displayName } = req.body;

    if (!name || !displayName) {
      return res.status(400).json({ message: 'Please provide category name and display name' });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      name: name.toLowerCase().trim() 
    });
    
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new Category({
      name: name.toLowerCase().trim(),
      displayName: displayName.trim()
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Delete category
router.delete('/categories/:id', isSuperAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if any menu items are using this category
    const itemsUsingCategory = await MenuItem.countDocuments({ 
      category: category.name 
    });

    if (itemsUsingCategory > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category. ${itemsUsingCategory} menu item(s) are using this category. Please remove or reassign those items first.` 
      });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update category
router.put('/categories/:id', isSuperAdmin, async (req, res) => {
  try {
    const { displayName } = req.body;

    if (!displayName) {
      return res.status(400).json({ message: 'Please provide display name' });
    }

    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    category.displayName = displayName.trim();
    await category.save();

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;




