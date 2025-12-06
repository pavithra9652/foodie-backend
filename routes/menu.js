import express from 'express';
import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';

const router = express.Router();

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ displayName: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all menu items
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = { available: true };
    
    if (category) {
      // Case-insensitive category matching
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }
    
    const menuItems = await MenuItem.find(query).sort({ createdAt: -1 });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single menu item
router.get('/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;






