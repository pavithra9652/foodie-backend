import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  paymentId: {
    type: String,
    default: ''
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  estimatedDeliveryTime: {
    type: Date,
    default: null
  },
  razorpayOrderId: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Add status to history when order status changes
orderSchema.pre('save', function(next) {
  if (this.isModified('orderStatus')) {
    if (!this.statusHistory) {
      this.statusHistory = [];
    }
    // Add initial status if history is empty
    if (this.statusHistory.length === 0) {
      this.statusHistory.push({
        status: 'pending',
        timestamp: this.createdAt || new Date()
      });
    }
    // Add new status if it's different from the last one
    const lastStatus = this.statusHistory[this.statusHistory.length - 1];
    if (!lastStatus || lastStatus.status !== this.orderStatus) {
      this.statusHistory.push({
        status: this.orderStatus,
        timestamp: new Date()
      });
    }
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;




