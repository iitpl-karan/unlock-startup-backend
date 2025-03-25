const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SubscriptionPlanSchema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  duration: { 
    type: Number, 
    required: true // Duration in months
  },
  price: { 
    type: Number, 
    required: true // Price in INR
  },
  description: { 
    type: String,
    default: "" 
  },
  features: [{ 
    type: String 
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  planType: { 
    type: String, 
    enum: ['monthly', 'yearly'], 
    default: 'monthly' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

module.exports = mongoose.model("SubscriptionPlan", SubscriptionPlanSchema); 