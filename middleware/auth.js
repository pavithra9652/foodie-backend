import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware for all admins (can manage orders and menu items)
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

// Middleware for super admin (admin@foodie.com only - can create admins, manage categories, etc.)
export const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.email === 'admin@foodie.com' && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Only admin@foodie.com has super admin access.' });
  }
};






