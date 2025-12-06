import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register
router.post('/register', async (req, res) => {
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
        message: 'User already exists with this email. Please login instead.' 
      });
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone.trim(),
      address: address ? address.trim() : ''
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
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
        message: 'User already exists with this email. Please login instead.' 
      });
    }
    
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: error.message || 'Registration failed. Please try again.' 
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt received:', {
      email: email ? email.substring(0, 10) + '...' : 'missing',
      passwordLength: password ? password.length : 0,
      hasEmail: !!email,
      hasPassword: !!password
    });

    if (!email || !password) {
      console.log('Login failed: Missing email or password');
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Normalized email:', normalizedEmail);

    // Find user by email (case-insensitive)
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log(`Login attempt failed: User not found for email: ${normalizedEmail}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('User found:', user.email, 'Role:', user.role);

    // Compare password - trim password to remove any whitespace
    const trimmedPassword = password.trim();
    const isMatch = await user.comparePassword(trimmedPassword);
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      console.log(`Login attempt failed: Incorrect password for email: ${normalizedEmail}`);
      console.log(`Expected password for ${normalizedEmail}: Check database`);
      return res.status(401).json({ 
        message: 'Invalid credentials. Please check your email and password.' 
      });
    }

    // Generate token
    const token = generateToken(user._id);

    console.log(`Login successful: ${user.email} (${user.role})`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        address: req.user.address,
        role: req.user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

