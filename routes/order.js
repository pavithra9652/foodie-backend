import express from 'express';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Initialize Razorpay (lazy initialization)
const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file');
  }
  
  // Check if placeholder values are being used
  if (keyId.includes('your_razorpay') || keySecret.includes('your_razorpay') ||
      keyId === 'your_razorpay_key_id' || keySecret === 'your_razorpay_key_secret') {
    throw new Error('Razorpay credentials are using placeholder values. Please replace with your actual Razorpay API keys from https://dashboard.razorpay.com/');
  }
  
  // Validate key format (Razorpay keys start with rzp_test_ or rzp_live_)
  if (!keyId.startsWith('rzp_test_') && !keyId.startsWith('rzp_live_')) {
    throw new Error('Invalid Razorpay Key ID format. Keys should start with "rzp_test_" (for test mode) or "rzp_live_" (for live mode)');
  }
  
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
};

// Create order
router.post('/create', authenticate, async (req, res) => {
  try {
    const { deliveryAddress, phone } = req.body;

    if (!deliveryAddress || !phone) {
      return res.status(400).json({ message: 'Please provide delivery address and phone' });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.menuItem');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Create order items
    const orderItems = cart.items.map(item => ({
      menuItem: item.menuItem._id,
      name: item.menuItem.name,
      quantity: item.quantity,
      price: item.price
    }));

    // Calculate total amount (cart total + delivery fee)
    const deliveryFee = 50;
    const totalAmount = cart.totalAmount + deliveryFee;

    // Validate minimum amount (Razorpay requires minimum ₹1 = 100 paise)
    if (totalAmount < 1) {
      return res.status(400).json({ 
        message: 'Order amount must be at least ₹1. Please add items to your cart.' 
      });
    }

    // Create Razorpay order
    const razorpay = getRazorpayInstance();
    const amountInPaise = Math.round(totalAmount * 100); // Convert to paise and round
    
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`
      });
    } catch (razorpayError) {
      console.error('Razorpay order creation error:', {
        error: razorpayError,
        errorCode: razorpayError.error?.code,
        errorDescription: razorpayError.error?.description,
        statusCode: razorpayError.error?.statusCode,
        amount: amountInPaise,
        totalAmount: totalAmount
      });
      
      // Handle authentication errors specifically
      if (razorpayError.error?.statusCode === 401 || 
          razorpayError.error?.description?.toLowerCase().includes('authentication')) {
        return res.status(401).json({ 
          message: 'Razorpay authentication failed. Please check your API keys in the .env file. Make sure you are using valid keys from https://dashboard.razorpay.com/',
          errorCode: 'AUTHENTICATION_FAILED',
          hint: 'Get your API keys from: Settings > API Keys in Razorpay Dashboard'
        });
      }
      
      // Extract error message from Razorpay error object
      let errorMessage = 'Failed to create payment order. Please try again.';
      if (razorpayError.error) {
        errorMessage = razorpayError.error.description || 
                      `Payment error: ${razorpayError.error.code || 'Unknown error'}`;
      } else if (razorpayError.message) {
        errorMessage = razorpayError.message;
      }
      
      return res.status(400).json({ 
        message: errorMessage,
        errorCode: razorpayError.error?.code
      });
    }

    // Create order in database
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totalAmount: cart.totalAmount, // Store cart total (delivery fee added separately in frontend)
      deliveryAddress,
      phone,
      razorpayOrderId: razorpayOrder.id,
      paymentStatus: 'pending',
      orderStatus: 'pending'
    });

    await order.save();

    res.json({
      order,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Order creation error:', error);
    
    // Handle Razorpay credential errors
    if (error.message.includes('Razorpay credentials not configured')) {
      return res.status(500).json({ 
        message: 'Payment gateway not configured. Please contact support.' 
      });
    }
    
    // Handle other errors
    const errorMessage = error.response?.data?.error?.description || 
                        error.error?.description || 
                        error.message || 
                        'Failed to create order. Please try again.';
    
    res.status(500).json({ message: errorMessage });
  }
});

// Create order with payment completed directly (without Razorpay)
router.post('/create-direct', authenticate, async (req, res) => {
  try {
    const { deliveryAddress, phone } = req.body;

    if (!deliveryAddress || !phone) {
      return res.status(400).json({ message: 'Please provide delivery address and phone' });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.menuItem');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Create order items
    const orderItems = cart.items.map(item => ({
      menuItem: item.menuItem._id,
      name: item.menuItem.name,
      quantity: item.quantity,
      price: item.price
    }));

    // Calculate total amount (cart total + delivery fee)
    const deliveryFee = 50;
    const totalAmount = cart.totalAmount + deliveryFee;

    // Validate minimum amount
    if (totalAmount < 1) {
      return res.status(400).json({ 
        message: 'Order amount must be at least ₹1. Please add items to your cart.' 
      });
    }

    // Create order in database with payment completed
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totalAmount: cart.totalAmount, // Store cart total (delivery fee added separately in frontend)
      deliveryAddress,
      phone,
      paymentId: `direct_${Date.now()}`, // Generate a payment ID
      paymentStatus: 'completed',
      orderStatus: 'confirmed' // Auto-confirm the order
    });

    await order.save();

    // Clear cart
    const cartToClear = await Cart.findOne({ user: req.user._id });
    if (cartToClear) {
      cartToClear.items = [];
      cartToClear.totalAmount = 0;
      await cartToClear.save();
    }

    res.json({
      message: 'Order placed successfully! Payment completed.',
      order
    });
  } catch (error) {
    console.error('Direct order creation error:', error);
    res.status(500).json({ message: error.message || 'Failed to create order. Please try again.' });
  }
});

// Verify payment
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Verify signature
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Update order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentId = razorpayPaymentId;
    order.paymentStatus = 'completed';
    order.orderStatus = 'confirmed';
    await order.save();

    // Clear cart
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.json({
      message: 'Payment verified successfully',
      order
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user orders
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.menuItem')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single order
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.menuItem');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns the order or is admin
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

