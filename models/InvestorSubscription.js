const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const InvestorSubscriptionSchema = new Schema({
  investor: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  plan: { 
    type: Schema.Types.ObjectId, 
    ref: 'SubscriptionPlan', 
    required: true 
  },
  startDate: { 
    type: Date, 
    default: Date.now 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  paymentDetails: {
    razorpay_order_id: { type: String },
    razorpay_payment_id: { type: String },
    razorpay_signature: { type: String },
    amount: { type: Number },
    currency: { type: String, default: 'INR' }
  },
  renewalCount: { 
    type: Number, 
    default: 0 
  },
  autoRenew: { 
    type: Boolean, 
    default: false 
  },
  canceledAt: { 
    type: Date,
    default: null 
  },
  status: { 
    type: String, 
    enum: ['active', 'canceled', 'expired', 'pending'], 
    default: 'pending' 
  }
}, { timestamps: true });

module.exports = mongoose.model("InvestorSubscription", InvestorSubscriptionSchema); 