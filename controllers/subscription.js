const mongoose = require("mongoose");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const InvestorSubscription = require("../models/InvestorSubscription");
const User = require("../models/usersModel");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payment");

// Create Razorpay instance - use the same credentials that work in the challenge upload
const razorpayInstance = new Razorpay({
  key_id: "rzp_live_g1FdyUyG50U2Rq", // Live key that's working in challenge upload
  key_secret: process.env.key_secret, // Secret key from environment variables
});

// Initialize plans if not exist (to be called on server start)
exports.initializeDefaultPlans = async () => {
  try {
    const plansCount = await SubscriptionPlan.countDocuments();
    
    if (plansCount === 0) {
      // Create default plans if none exist
      const defaultPlans = [
        {
          name: "Monthly Investor Plan",
          duration: 1,
          price: 5000,
          description: "Access to all investor features for one month",
          features: [
            "Access to all startup profiles",
            "Unlimited startup searches",
            "Direct messaging with startups",
            "Exclusive investor events"
          ],
          planType: "monthly"
        },
        {
          name: "Annual Investor Plan",
          duration: 12,
          price: 40000,
          description: "Access to all investor features for one year with 33% savings",
          features: [
            "Access to all startup profiles",
            "Unlimited startup searches",
            "Direct messaging with startups",
            "Exclusive investor events",
            "Priority support",
            "Investment analytics dashboard"
          ],
          planType: "yearly"
        }
      ];
      
      await SubscriptionPlan.insertMany(defaultPlans);
      console.log("Default subscription plans created");
    }
  } catch (error) {
    console.error("Error initializing subscription plans:", error);
  }
};

// Get all subscription plans
exports.getAllPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true });
    
    return res.status(200).json({
      success: true,
      plans
    });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching subscription plans"
    });
  }
};

// Create Razorpay order for subscription - updated to match the working implementation
exports.createSubscriptionOrder = async (req, res) => {
  try {
    const { planId, investorId } = req.body;
    
    // Validate plan and investor
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive plan selected"
      });
    }
    
    // Only validate investor if it's not a temporary ID (during registration process)
    let investor = null;
    
    if (!investorId.toString().startsWith('temp-')) {
      investor = await User.findById(investorId);
      if (!investor || investor.userType !== "Investor") {
        return res.status(400).json({
          success: false,
          message: "Invalid investor"
        });
      }
    }
    
    // Create order - using the same approach as in startup-challenges
    const options = {
      amount: Number(plan.price * 100), // amount in smallest currency unit (paise)
      currency: "INR",
      receipt: crypto.randomBytes(10).toString("hex"),
      notes: {
        planId: plan._id.toString(),
        investorId: investorId,
        planName: plan.name,
        planDuration: plan.duration,
        isNewRegistration: investorId.toString().startsWith('temp-') // Flag for new registrations
      }
    };
    
    // Use callback pattern like in startup-challenges controller
    razorpayInstance.orders.create(options, (error, order) => {
      if (error) {
        console.error("Error creating order:", error);
        return res.status(500).json({ 
          success: false,
          message: "Something went wrong while creating the order!" 
        });
      }
      res.status(200).json({ 
        success: true,
        order 
      });
    });
  } catch (error) {
    console.error("Error creating subscription order:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating subscription order: " + (error.message || "Unknown error")
    });
  }
};

// Verify payment and activate subscription
exports.verifySubscriptionPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      planId,
      investorId,
      token
    } = req.body;
    
    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.key_secret)
      .update(sign.toString())
      .digest("hex");
    
    // Create isAuthentic flag like in the working implementation
    const isAuthentic = expectedSign === razorpay_signature;
    
    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature"
      });
    }
    
    // Get plan details
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Plan not found"
      });
    }
    
    // Validate investor ID now - it should be a valid ID at this point
    try {
      const investor = await User.findById(investorId);
      if (!investor || investor.userType !== "Investor") {
        return res.status(400).json({
          success: false,
          message: "Invalid investor ID. Please ensure the user is registered properly."
        });
      }
    } catch (error) {
      console.error("Error validating investor ID:", error);
      return res.status(400).json({
        success: false,
        message: "Invalid investor ID format or investor not found"
      });
    }
    
    // Calculate subscription end date
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.duration);
    
    // Check if investor already has an active subscription
    const existingSubscription = await InvestorSubscription.findOne({
      investor: investorId,
      isActive: true,
      status: 'active'
    });
    
    if (existingSubscription) {
      // Update existing subscription
      existingSubscription.plan = planId;
      existingSubscription.startDate = startDate;
      existingSubscription.endDate = endDate;
      existingSubscription.renewalCount += 1;
      existingSubscription.paymentDetails = {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount: plan.price,
      };
      
      await existingSubscription.save();
      
      return res.status(200).json({
        success: true,
        message: "Subscription renewed successfully",
        subscription: existingSubscription,
        token: token // Pass back any token sent in the request
      });
    }
    
    // Create new subscription
    const subscription = new InvestorSubscription({
      investor: investorId,
      plan: planId,
      startDate,
      endDate,
      isActive: true,
      status: 'active',
      paymentDetails: {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount: plan.price,
      }
    });
    
    await subscription.save();
    
    return res.status(200).json({
      success: true,
      message: "Subscription activated successfully",
      subscription,
      token: token // Pass back any token sent in the request
    });
  } catch (error) {
    console.error("Error verifying subscription payment:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying subscription payment: " + (error.message || "Unknown error")
    });
  }
};

// Get investor's subscription details
exports.getInvestorSubscription = async (req, res) => {
  try {
    const { investorId } = req.params;
    
    const subscription = await InvestorSubscription.findOne({
      investor: investorId,
      isActive: true
    }).populate('plan');
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found"
      });
    }
    
    // Calculate days remaining
    const currentDate = new Date();
    const endDate = new Date(subscription.endDate);
    const daysRemaining = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));
    
    // Check if subscription is expired
    if (daysRemaining <= 0) {
      subscription.isActive = false;
      subscription.status = 'expired';
      await subscription.save();
      
      return res.status(200).json({
        success: true,
        message: "Subscription has expired",
        subscription,
        daysRemaining: 0,
        isExpired: true
      });
    }
    
    return res.status(200).json({
      success: true,
      subscription,
      daysRemaining,
      isExpired: false
    });
  } catch (error) {
    console.error("Error fetching investor subscription:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching investor subscription"
    });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    const subscription = await InvestorSubscription.findById(subscriptionId);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found"
      });
    }
    
    subscription.isActive = false;
    subscription.status = 'canceled';
    subscription.canceledAt = new Date();
    
    await subscription.save();
    
    return res.status(200).json({
      success: true,
      message: "Subscription canceled successfully"
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return res.status(500).json({
      success: false,
      message: "Error canceling subscription"
    });
  }
};

// Admin: Get all subscriptions (with pagination)
exports.getAllSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = {};
    if (status) query.status = status;
    
    const subscriptions = await InvestorSubscription.find(query)
      .populate('investor', 'name email')
      .populate('plan')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const count = await InvestorSubscription.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      subscriptions,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("Error fetching all subscriptions:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching all subscriptions"
    });
  }
};

// Add Razorpay webhook handler
exports.RazorpayResponse = async (req, res) => {
  try {
    console.log(req.body.payload?.payment?.entity, "Razorpay Response for Subscription");

    // Handle both webhook format and direct call format
    const paymentEntity = req.body.payload?.payment?.entity || req.body;
    const { amount, status, order_id, method, captured, description, card_id } = paymentEntity;

    // Convert amount from paise to rupees (decimal format)
    const decimalAmount = amount / 100;

    // Create new payment object
    const payment = new Payment({
      amount: decimalAmount, // Save amount as a decimal
      status,
      order_id,
      method,
      captured,
      description,
      card_id,
      paymentType: 'Subscription', // Mark this as a subscription payment
    });

    // Save new payment
    const savepayment = await payment.save();

    if (savepayment) {
      res.status(201).json({
        message: "Subscription Payment Details Saved",
        data: savepayment,
      });
    } else {
      return res.status(500).json({ error: "Unable to save subscription payment details" });
    }
  } catch (error) {
    console.error("Error while saving subscription payment details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get payment history for an investor
exports.getInvestorPaymentHistory = async (req, res) => {
  try {
    const { investorId } = req.params;
    console.log(`Fetching payment history for investor ID: ${investorId}`);
    
    // Check if investorId is valid
    if (!investorId || investorId === 'undefined' || investorId === 'null') {
      console.log('Invalid or missing investorId:', investorId);
      return res.status(400).json({
        success: false,
        message: "Valid investor ID is required"
      });
    }
    
    // Check if investorId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(investorId)) {
      console.log('Invalid ObjectId format for investorId:', investorId);
      return res.status(400).json({
        success: false,
        message: "Invalid investor ID format"
      });
    }
    
    // Validate investor
    try {
      const investor = await User.findById(investorId);
      console.log('Investor lookup result:', investor ? 'Found' : 'Not found');
      
      if (!investor) {
        console.log(`Investor not found with ID: ${investorId}`);
        // Instead of error, return empty payment array for better UX
        return res.status(200).json({
          success: true,
          message: "No payment history available",
          payments: []
        });
      }
      
      console.log(`Investor found:`, {
        id: investor._id,
        name: investor.name || investor.email,
        userType: investor.userType
      });
      
      // Removed userType check since user roles might vary
    } catch (error) {
      console.error('Error finding investor:', error);
      return res.status(500).json({
        success: false,
        message: "Error validating investor"
      });
    }
    
    // Get all subscriptions for this investor
    try {
      console.log(`Looking up subscriptions for investor: ${investorId}`);
      const subscriptions = await InvestorSubscription.find({
        investor: investorId
      }).populate('plan').sort({ createdAt: -1 });
      
      console.log(`Found ${subscriptions.length} subscriptions`);
      
      // Return empty array if no subscriptions
      if (!subscriptions || subscriptions.length === 0) {
        console.log('No subscriptions found, returning empty payment history');
        return res.status(200).json({
          success: true,
          message: "No subscription payments found",
          payments: []
        });
      }
      
      // Format the data for frontend
      const payments = subscriptions.map(subscription => {
        console.log(`Processing subscription: ${subscription._id}`);
        try {
          return {
            _id: subscription._id,
            transactionId: subscription.paymentDetails?.razorpay_payment_id || 'N/A',
            planName: subscription.plan?.name || 'Unknown Plan',
            planType: subscription.plan?.planType || 'unknown',
            amount: subscription.paymentDetails?.amount || 0,
            status: subscription.status === 'active' ? 'success' : 
                    subscription.status === 'pending' ? 'pending' : 
                    subscription.status === 'canceled' ? 'failed' : 'failed',
            paymentMethod: 'razorpay', // Default method since Razorpay is used
            createdAt: subscription.startDate || subscription.createdAt,
            endDate: subscription.endDate
          };
        } catch (error) {
          console.error('Error formatting subscription:', error);
          return null;
        }
      }).filter(payment => payment !== null);
      
      console.log(`Returning ${payments.length} formatted payments`);
      
      return res.status(200).json({
        success: true,
        payments
      });
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return res.status(500).json({
        success: false,
        message: "Error fetching subscriptions"
      });
    }
  } catch (error) {
    console.error("Error in getInvestorPaymentHistory:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching payment history: " + (error.message || "Unknown error")
    });
  }
}; 