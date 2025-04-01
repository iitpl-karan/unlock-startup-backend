const mongoose = require("mongoose");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const InvestorSubscription = require("../models/InvestorSubscription");
const User = require("../models/usersModel");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const InvestorUser = require("../models/InvestorDetails");
const jwt = require("jsonwebtoken");

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
        },
        {
          name: "Test Plan",
          duration: 1/30, // 1 day (represented as a fraction of a month)
          price: 0,
          description: "Test subscription plan with 0 rupees for 1 day",
          features: [
            "Access to all investor features for testing",
            "No payment required",
            "Expires after 1 day"
          ],
          planType: "monthly"
        }
      ];
      
      await SubscriptionPlan.insertMany(defaultPlans);
      console.log("Default subscription plans created");
    } else {
      // Check if test plan exists, if not, create it
      const testPlanExists = await SubscriptionPlan.findOne({ name: "Test Plan" });
      if (!testPlanExists) {
        const testPlan = new SubscriptionPlan({
          name: "Test Plan",
          duration: 1/30, // 1 day (represented as a fraction of a month)
          price: 0,
          description: "Test subscription plan with 0 rupees for 1 day",
          features: [
            "Access to all investor features for testing",
            "No payment required",
            "Expires after 1 day"
          ],
          planType: "monthly",
          isActive: true
        });
        
        await testPlan.save();
        console.log("Test plan created");
      }
    }
  } catch (error) {
    console.error("Error initializing subscription plans:", error);
  }
};

// Add a test plan with 0 rupees for 1 day
exports.addTestPlan = async (req, res) => {
  try {
    // Check if test plan already exists
    const existingTestPlan = await SubscriptionPlan.findOne({ name: "Test Plan" });
    
    if (existingTestPlan) {
      return res.status(200).json({
        success: true,
        message: "Test plan already exists",
        plan: existingTestPlan
      });
    }
    
    // Create a new test plan
    const testPlan = new SubscriptionPlan({
      name: "Test Plan",
      duration: 1/30, // 1 day (represented as a fraction of a month)
      price: 0,
      description: "Test subscription plan with 0 rupees for 1 day",
      features: [
        "Access to all investor features for testing",
        "No payment required",
        "Expires after 1 day"
      ],
      planType: "monthly",
      isActive: true
    });
    
    await testPlan.save();
    
    return res.status(201).json({
      success: true,
      message: "Test plan created successfully",
      plan: testPlan
    });
  } catch (error) {
    console.error("Error creating test plan:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating test plan: " + (error.message || "Unknown error")
    });
  }
};

// Special endpoint for activating free subscription plans (bypassing Razorpay)
exports.activateFreePlan = async (req, res) => {
  try {
    const { planId, investorId } = req.body;
    
    console.log(`Activating free plan ${planId} for investor ${investorId}`);
    
    // Check if investor exists or is a temporary ID
    let user = null;
    let investorUser = null;
    let isTemporaryUser = false;
    
    if (!investorId.toString().startsWith('temp-')) {
      // First, check if this is a User ID
      user = await User.findById(investorId);
      
      if (user) {
        console.log(`Found user with ID ${investorId}`);
        // If the user has an investorDetailsId, fetch the investor details
        if (user.investorDetailsId) {
          investorUser = await InvestorUser.findById(user.investorDetailsId);
          console.log(`Found InvestorUser via investorDetailsId: ${investorUser ? 'Yes' : 'No'}`);
        } 
        
        // If no investor details found and we have an email, try finding by email
        if (!investorUser && user.email) {
          investorUser = await InvestorUser.findOne({ investoremail: user.email });
          console.log(`Found InvestorUser via email: ${investorUser ? 'Yes' : 'No'}`);
          
          // If we found an investor by email but it's not linked, update the user
          if (investorUser && !user.investorDetailsId) {
            user.investorDetailsId = investorUser._id;
            await user.save();
            console.log(`Updated user with investorDetailsId: ${investorUser._id}`);
          }
        }
      } else {
        // Check if this is an InvestorUser ID directly
        investorUser = await InvestorUser.findById(investorId);
        console.log(`Found InvestorUser directly with ID ${investorId}: ${investorUser ? 'Yes' : 'No'}`);
        
        // If we found an investor but no user, try to find a matching user
        if (investorUser) {
          if (investorUser.userId) {
            user = await User.findById(investorUser.userId);
            console.log(`Found user via userId: ${user ? 'Yes' : 'No'}`);
          } 
          
          // If no user found via userId, try by email
          if (!user && investorUser.investoremail) {
            user = await User.findOne({ email: investorUser.investoremail });
            console.log(`Found user via email: ${user ? 'Yes' : 'No'}`);
            
            // If we found a user by email but it's not linked, update the relationship
            if (user) {
              if (!user.investorDetailsId) {
                user.investorDetailsId = investorUser._id;
                await user.save();
                console.log(`Linked User to InvestorDetails: ${user._id} -> ${investorUser._id}`);
              }
              
              if (!investorUser.userId) {
                investorUser.userId = user._id;
                await investorUser.save();
                console.log(`Linked InvestorDetails to User: ${investorUser._id} -> ${user._id}`);
              }
            }
          }
        }
      }
      
      // If we still don't have a user, return an error
      if (!user && !investorUser) {
        return res.status(404).json({
          success: false,
          message: 'Investor not found'
        });
      }
    } else {
      // Create a temporary user object (not a Mongoose document) for free plan activation before registration
      isTemporaryUser = true;
      const tempId = new mongoose.Types.ObjectId();
      user = {
        _id: tempId,
        email: `temp-${Date.now()}@example.com`,
        userType: 'Investor',
        isTemporary: true // Flag to identify this as a temporary user
      };
      console.log('Created temporary user with ID:', tempId);
    }
    
    // Find plan
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }
    
    if (plan.price > 0) {
      return res.status(400).json({
        success: false,
        message: 'This plan is not free and requires payment'
      });
    }
    
    // Calculate end date based on plan duration
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.duration);
    
    // Determine which ID to use for the investor field (prioritize real user)
    const subscriberId = user._id;
    console.log(`Using subscriberId for subscription:`, subscriberId);
    
    // Create a new subscription
    const subscription = new InvestorSubscription({
      investor: subscriberId,
      plan: plan._id,
      startDate,
      endDate,
      isActive: true,
      status: 'active',
      paymentDetails: {
        amount: 0,
        currency: 'INR'
      }
    });
    
    const savedSubscription = await subscription.save();
    console.log(`Created subscription: ${savedSubscription._id}`);
    
    // Create payment record for free plan
    const payment = new Payment({
      amount: 0,
      status: 'success',
      order_id: `free-${Date.now()}`,
      payment_id: `free-${Date.now()}`,
      method: 'free',
      captured: true,
      description: `Free Subscription to ${plan.name}`,
      paymentType: 'Subscription',
      user: subscriberId,
      subscription: savedSubscription._id
    });
    
    const savedPayment = await payment.save();
    console.log(`Created payment record: ${savedPayment._id}`);
    
    // Update models with the new subscription
    const updatePromises = [];
    
    // Update user model if it's a real user (not a temporary object)
    if (user && !isTemporaryUser) {
      console.log(`Updating real User model with subscription:`, user._id);
      user.currentSubscription = savedSubscription._id;
      if (!user.paymentHistory) {
        user.paymentHistory = [];
      }
      user.paymentHistory.push(savedPayment._id);
      updatePromises.push(user.save());
      console.log(`Updated User model with subscription: ${savedSubscription._id}`);
    }
    
    // Update InvestorUser model if found
    if (investorUser) {
      console.log(`Updating InvestorUser model with subscription:`, investorUser._id);
      investorUser.currentSubscription = savedSubscription._id;
      if (!investorUser.paymentHistory) {
        investorUser.paymentHistory = [];
      }
      investorUser.paymentHistory.push(savedPayment._id);
      updatePromises.push(investorUser.save());
      console.log(`Updated InvestorUser model with subscription: ${savedSubscription._id}`);
    } else if (!isTemporaryUser && user && user.email) {
      // Try to find the InvestorUser by email if not found by ID
      try {
        console.log(`Looking up InvestorUser by email: ${user.email}`);
        const emailInvestorUser = await InvestorUser.findOne({ investoremail: user.email });
        if (emailInvestorUser) {
          console.log(`Found InvestorUser by email: ${emailInvestorUser._id}`);
          emailInvestorUser.currentSubscription = savedSubscription._id;
          if (!emailInvestorUser.paymentHistory) {
            emailInvestorUser.paymentHistory = [];
          }
          emailInvestorUser.paymentHistory.push(savedPayment._id);
          
          // Establish relationship if not already established
          if (!emailInvestorUser.userId && user._id) {
            console.log(`Setting userId in InvestorUser: ${user._id}`);
            emailInvestorUser.userId = user._id;
          }
          
          updatePromises.push(emailInvestorUser.save());
          console.log(`Updated InvestorUser ${emailInvestorUser._id} with subscription: ${savedSubscription._id}`);
          
          // Update the user model with investorDetailsId if not set
          if (user.investorDetailsId !== emailInvestorUser._id) {
            console.log(`Updating User ${user._id} with investorDetailsId: ${emailInvestorUser._id}`);
            user.investorDetailsId = emailInvestorUser._id;
            // We already have a promise to save user above, no need to add again
          }
        } else {
          console.log(`No InvestorUser found with email ${user.email}`);
        }
      } catch (error) {
        console.error('Error finding/updating InvestorUser by email:', error);
        // Continue as this is not a critical error
      }
    }
    
    // Wait for all update operations to complete
    if (updatePromises.length > 0) {
      try {
        await Promise.all(updatePromises);
        console.log(`Successfully applied all model updates (${updatePromises.length} items)`);
      } catch (updateError) {
        console.error('Error during model updates:', updateError);
        // Continue so we can at least return the subscription info
      }
    } else {
      console.log(`No model updates to apply (temporary user or no models found)`);
    }
    
    // Get populated subscription to return
    const populatedSubscription = await InvestorSubscription.findById(savedSubscription._id).populate('plan');
    
    // Calculate days remaining
    const now = new Date();
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    
    return res.status(200).json({
      success: true,
      message: 'Free plan activated successfully',
      subscription: populatedSubscription,
      daysRemaining: Math.max(0, daysRemaining),
      isExpired: false
    });
  } catch (error) {
    console.error('Error activating free plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Error activating free plan: ' + (error.message || 'Unknown error')
    });
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

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, investorId } = req.body;

    // Generate signature to verify payment
    const shasum = crypto.createHmac('sha256', process.env.key_secret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = shasum.digest('hex');

    // Validate signature
    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid signature'
      });
    }
    
    // Find plan
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Find investor user
    const user = await User.findById(investorId);
    if (!user) {
      return res.status(404).json({
          success: false,
        message: 'Investor not found'
      });
    }

    // Calculate end date based on plan duration
    const startDate = new Date();
    const endDate = new Date();
    // Plan duration is in months
    endDate.setMonth(endDate.getMonth() + plan.duration);
    
    // Create a new subscription
    const subscription = new InvestorSubscription({
      investor: user._id,
      plan: plan._id,
      startDate,
      endDate,
      isActive: true,
      status: 'active',
      paymentDetails: {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount: plan.price,
        currency: 'INR'
      }
    });

    const savedSubscription = await subscription.save();

    // Create payment record
    const payment = new Payment({
      amount: plan.price,
      status: 'success',
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      method: 'razorpay',
      captured: true,
      description: `Subscription to ${plan.name}`,
      paymentType: 'Subscription',
      user: user._id,
      subscription: savedSubscription._id
    });

    const savedPayment = await payment.save();

    // Update user model with subscription reference
    user.currentSubscription = savedSubscription._id;
    if (!user.paymentHistory) {
      user.paymentHistory = [];
    }
    user.paymentHistory.push(savedPayment._id);
    await user.save();

    // We now have multiple scenarios to handle for InvestorUser updates:
    
    // 1. First scenario: If user is an investor, get their investorDetailsId
    let investorUser = null;
    
    if (user.userType === 'Investor' && user.investorDetailsId) {
      try {
        console.log(`Looking up InvestorUser by investorDetailsId: ${user.investorDetailsId}`);
        investorUser = await InvestorUser.findById(user.investorDetailsId);
        
        if (investorUser) {
          console.log(`Found InvestorUser via investorDetailsId: ${investorUser._id}`);
          investorUser.currentSubscription = savedSubscription._id;
          if (!investorUser.paymentHistory) {
            investorUser.paymentHistory = [];
          }
          investorUser.paymentHistory.push(savedPayment._id);
          await investorUser.save();
          console.log(`Updated InvestorUser ${investorUser._id} with subscription ${savedSubscription._id}`);
        } else {
          console.log(`InvestorUser not found with ID ${user.investorDetailsId}`);
        }
      } catch (error) {
        console.error('Error updating InvestorUser with subscription:', error);
        // Continue as this is not a critical error
      }
    } else {
      console.log(`User ${user._id} is not an investor or has no investorDetailsId`);
    }

    // 2. Second scenario: Check for InvestorUser by email
    if (!investorUser && user.email) {
      try {
        console.log(`Looking up InvestorUser by email: ${user.email}`);
        const directInvestor = await InvestorUser.findOne({ investoremail: user.email });
        
        if (directInvestor) {
          console.log(`Found InvestorUser via email: ${directInvestor._id}`);
          
          // Update currentSubscription
          directInvestor.currentSubscription = savedSubscription._id;
          if (!directInvestor.paymentHistory) {
            directInvestor.paymentHistory = [];
          }
          directInvestor.paymentHistory.push(savedPayment._id);
          
          // If there's no userId link, set it now
          if (!directInvestor.userId) {
            directInvestor.userId = user._id;
            console.log(`Linked InvestorUser ${directInvestor._id} to User ${user._id}`);
          }
          
          await directInvestor.save();
          console.log(`Updated InvestorUser ${directInvestor._id} with subscription ${savedSubscription._id}`);
          
          // Also update the User model if it doesn't have an investorDetailsId
          if (!user.investorDetailsId) {
            user.investorDetailsId = directInvestor._id;
            await user.save();
            console.log(`Linked User ${user._id} to InvestorUser ${directInvestor._id}`);
          }
        } else {
          console.log(`No InvestorUser found with email ${user.email}`);
        }
      } catch (error) {
        console.error('Error updating InvestorUser by email with subscription:', error);
        // Continue as this is not a critical error
      }
    }

    // Generate JWT token
    const payload = {
      user: {
        id: user._id,
        email: user.email,
        subscriptionId: savedSubscription._id
      }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    return res.status(200).json({
      success: true,
      message: 'Payment verified and subscription activated successfully',
      subscription: savedSubscription,
      token
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying payment: ' + (error.message || 'Unknown error')
    });
  }
};

// Get investor's subscription
exports.getInvestorSubscription = async (req, res) => {
  try {
    const { investorId } = req.params;
    console.log(`Fetching subscription for ID: ${investorId}`);
    
    // Validate investor ID
    if (!investorId || !mongoose.Types.ObjectId.isValid(investorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid investor ID'
      });
    }
    
    // First, check if we can find the InvestorUser or User by ID
    let user = null;
    let investorUser = null;
    let directSubscriptionId = null;
    
    // Check if this is an InvestorUser ID
    investorUser = await InvestorUser.findById(investorId);
    if (investorUser) {
      console.log(`Found InvestorUser with ID ${investorId}`);
      
      // Check if the InvestorUser has a currentSubscription ID
      if (investorUser.currentSubscription) {
        directSubscriptionId = investorUser.currentSubscription;
        console.log(`InvestorUser has currentSubscription: ${directSubscriptionId}`);
      }
    }

    // Find the subscription
    let subscription = null;
    let lookupMethod = 'Direct subscription lookup';

    if (directSubscriptionId) {
      subscription = await InvestorSubscription.findById(directSubscriptionId).populate('plan');
      console.log('Found subscription by direct ID:', subscription);
    }

    // If no subscription found by direct ID, try finding the most recent active one
    if (!subscription) {
      subscription = await InvestorSubscription.findOne({
        investor: investorId,
        isActive: true
      }).populate('plan').sort({ createdAt: -1 });
      console.log('Found subscription by investor ID:', subscription);
    }

    // Calculate expiry status
    const now = new Date();
    let daysRemaining = 0;
    let isExpired = true;

    if (subscription) {
      const endDate = new Date(subscription.endDate);
      daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      isExpired = now > endDate;

      // Check if this is a free plan
      const isFreeplan = subscription.plan && subscription.plan.price === 0;
      
      // If it's a free plan and active, consider it as not expired
      if (isFreeplan && subscription.status === 'active') {
        isExpired = false;
      }

      // Update subscription status if expired
      if (isExpired && subscription.isActive) {
        subscription.isActive = false;
        subscription.status = 'expired';
        await subscription.save();
        console.log(`Updated expired subscription: ${subscription._id}`);
      }
    }

    // Return the subscription details
    return res.status(200).json({
      success: true,
      subscription,
      daysRemaining: Math.max(0, daysRemaining),
      isExpired,
      lookupMethod
    });

  } catch (error) {
    console.error('Error fetching investor subscription:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching subscription details: ' + (error.message || 'Unknown error')
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

// Update the payment history endpoint to also show plan information
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
    
    // PRIMARY APPROACH: Directly query the Payment collection where user field matches our ID
    // This is the most reliable way to find payments
    let paymentHistory = await Payment.find({
      user: investorId,
      paymentType: 'Subscription'
    }).populate('subscription').sort({ createdAt: -1 });
    
    console.log(`Found ${paymentHistory.length} payments directly with user ID: ${investorId}`);
    
    // Collect all possible related IDs for a thorough search
    const possibleIds = [investorId]; // Always include the original ID
    
    // Try to find User and InvestorUser to get all possible IDs
    const user = await User.findById(investorId);
    let investorUser = null;
    
    if (user) {
      // If user has investorDetailsId, add it
      if (user.investorDetailsId) {
        investorUser = await InvestorUser.findById(user.investorDetailsId);
        if (investorUser) {
          possibleIds.push(investorUser._id);
          console.log(`Added investorDetailsId: ${investorUser._id}`);
        }
      }
      
      // If no investorUser found by ID, try email
      if (!investorUser && user.email) {
        investorUser = await InvestorUser.findOne({ investoremail: user.email });
        if (investorUser) {
          possibleIds.push(investorUser._id);
          console.log(`Added InvestorUser found by email: ${investorUser._id}`);
        }
      }
    } else {
      // If not a User ID, check if it's an InvestorUser ID
      investorUser = await InvestorUser.findById(investorId);
      if (investorUser) {
        // If investorUser has userId, add it
        if (investorUser.userId) {
          const linkedUser = await User.findById(investorUser.userId);
          if (linkedUser) {
            possibleIds.push(linkedUser._id);
            console.log(`Added linked userId: ${linkedUser._id}`);
          }
        }
        
        // If no User found by ID, try email
        if (!investorUser.userId && investorUser.investoremail) {
          const emailUser = await User.findOne({ email: investorUser.investoremail });
          if (emailUser) {
            possibleIds.push(emailUser._id);
            console.log(`Added User found by email: ${emailUser._id}`);
          }
        }
      }
    }
    
    // If we have more than one ID to search with, find payments for all IDs
    if (possibleIds.length > 1) {
      console.log(`Searching for payments with additional IDs:`, possibleIds.slice(1));
      
      const additionalPayments = await Payment.find({
        user: { $in: possibleIds.slice(1) }, // Exclude the original ID which we already queried
        paymentType: 'Subscription'
      }).populate('subscription').sort({ createdAt: -1 });
      
      console.log(`Found ${additionalPayments.length} payments with related IDs`);
      
      // Merge payment histories, avoiding duplicates
      if (additionalPayments.length > 0) {
        const paymentIds = new Set(paymentHistory.map(p => p._id.toString()));
        for (const payment of additionalPayments) {
          if (!paymentIds.has(payment._id.toString())) {
            paymentHistory.push(payment);
            paymentIds.add(payment._id.toString());
          }
        }
      }
    }
    
    // ADDITIONAL APPROACH: Check for payments where the subscription's investor matches our ID
    // This handles cases where the payment.user field might be different from the investor ID
    
    // First get all subscriptions for our IDs
    const subscriptions = await InvestorSubscription.find({
      investor: { $in: possibleIds }
    });
    
    if (subscriptions.length > 0) {
      console.log(`Found ${subscriptions.length} subscriptions related to IDs:`, possibleIds);
      
      // Get subscription IDs
      const subscriptionIds = subscriptions.map(s => s._id);
      
      // Find payments linked to these subscriptions
      const subscriptionPayments = await Payment.find({
        subscription: { $in: subscriptionIds },
        paymentType: 'Subscription'
      }).populate('subscription').sort({ createdAt: -1 });
      
      console.log(`Found ${subscriptionPayments.length} payments via subscription references`);
      
      // Merge with payment history, avoiding duplicates
      if (subscriptionPayments.length > 0) {
        const paymentIds = new Set(paymentHistory.map(p => p._id.toString()));
        for (const payment of subscriptionPayments) {
          if (!paymentIds.has(payment._id.toString())) {
            paymentHistory.push(payment);
            paymentIds.add(payment._id.toString());
          }
        }
      }
    }
    
    // Enhance payment records with plan information
    const enhancedPayments = await Promise.all(
      paymentHistory.map(async payment => {
        let planName = 'Unknown Plan';
        let planType = 'unknown';
        let endDate = null;
        
        try {
          if (payment.subscription) {
            const subscription = payment.subscription;
            // If subscription.plan is already populated, use it, otherwise populate
            if (subscription.plan && typeof subscription.plan === 'object') {
              planName = subscription.plan.name;
              planType = subscription.plan.planType;
            } else if (subscription.plan) {
              const plan = await SubscriptionPlan.findById(subscription.plan);
              if (plan) {
                planName = plan.name;
                planType = plan.planType;
              }
            }
            
            endDate = subscription.endDate;
          }
        } catch (error) {
          console.log('Error getting plan details for payment:', error);
        }
        
        return {
          _id: payment._id,
          transactionId: payment.payment_id || payment._id,
          planName,
          planType,
          amount: payment.amount,
          status: payment.status,
          paymentMethod: payment.method,
          createdAt: payment.createdAt,
          endDate
        };
      })
    );
    
    // Sort by creation date (newest first)
    enhancedPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return res.status(200).json({
      success: true,
      payments: enhancedPayments
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching payment history: " + (error.message || "Unknown error")
    });
  }
};

// Admin: Create a new subscription plan
exports.createPlan = async (req, res) => {
  try {
    console.log('Creating subscription plan with data:', req.body);
    const { name, duration, price, description, features, planType } = req.body;
    
    if (!name || !duration || price === undefined) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: "Name, duration, and price are required"
      });
    }
    
    // Validate that duration is a positive number
    if (isNaN(parseFloat(duration)) || parseFloat(duration) <= 0) {
      console.log('Validation failed: Duration must be a positive number');
      return res.status(400).json({
        success: false,
        message: "Duration must be a positive number"
      });
    }

    // Validate that price is a non-negative number
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      console.log('Validation failed: Price must be a non-negative number');
      return res.status(400).json({
        success: false,
        message: "Price must be a non-negative number"
      });
    }
    
    const newPlan = new SubscriptionPlan({
      name,
      duration: parseFloat(duration),
      price: parseFloat(price),
      description,
      features: features || [],
      planType: planType || 'monthly',
      isActive: true
    });
    
    console.log('Saving new subscription plan');
    const savedPlan = await newPlan.save();
    console.log('Plan saved successfully:', savedPlan);
    
    return res.status(201).json({
      success: true,
      message: "Subscription plan created successfully",
      plan: savedPlan
    });
  } catch (error) {
    console.error("Error creating subscription plan:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating subscription plan: " + (error.message || "Unknown error")
    });
  }
};

// Admin: Update a subscription plan
exports.updatePlan = async (req, res) => {
  try {
    console.log('Updating subscription plan with ID:', req.params.planId);
    console.log('Update data:', req.body);
    
    const { planId } = req.params;
    const { name, duration, price, description, features, planType, isActive } = req.body;
    
    // Validate the planId
    if (!planId || !mongoose.Types.ObjectId.isValid(planId)) {
      console.log('Invalid planId:', planId);
      return res.status(400).json({
        success: false,
        message: "Invalid plan ID format"
      });
    }
    
    const plan = await SubscriptionPlan.findById(planId);
    
    if (!plan) {
      console.log('Plan not found with ID:', planId);
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found"
      });
    }
    
    // Update fields if provided
    if (name !== undefined) plan.name = name;
    
    if (duration !== undefined) {
      // Validate that duration is a positive number
      const durationValue = parseFloat(duration);
      if (isNaN(durationValue) || durationValue <= 0) {
        return res.status(400).json({
          success: false,
          message: "Duration must be a positive number"
        });
      }
      plan.duration = durationValue;
    }
    
    if (price !== undefined) {
      // Validate that price is a non-negative number
      const priceValue = parseFloat(price);
      if (isNaN(priceValue) || priceValue < 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be a non-negative number"
        });
      }
      plan.price = priceValue;
    }
    
    if (description !== undefined) plan.description = description;
    if (features !== undefined) plan.features = features;
    if (planType !== undefined) plan.planType = planType;
    if (isActive !== undefined) plan.isActive = isActive;
    
    console.log('Saving updated subscription plan');
    const updatedPlan = await plan.save();
    console.log('Plan updated successfully:', updatedPlan);
    
    return res.status(200).json({
      success: true,
      message: "Subscription plan updated successfully",
      plan: updatedPlan
    });
  } catch (error) {
    console.error("Error updating subscription plan:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating subscription plan: " + (error.message || "Unknown error")
    });
  }
};

// Admin: Delete a subscription plan
exports.deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    
    // Check if plan exists
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found"
      });
    }
    
    // Check if there are active subscriptions using this plan
    const activeSubscriptions = await InvestorSubscription.countDocuments({
      plan: planId,
      isActive: true
    });
    
    if (activeSubscriptions > 0) {
      // Instead of deleting, mark as inactive
      plan.isActive = false;
      await plan.save();
      
      return res.status(200).json({
        success: true,
        message: "Plan marked as inactive. Cannot delete plan with active subscriptions.",
        planStatus: "inactive"
      });
    }
    
    // If no active subscriptions, delete the plan
    await SubscriptionPlan.findByIdAndDelete(planId);
    
    return res.status(200).json({
      success: true,
      message: "Subscription plan deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting subscription plan:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting subscription plan: " + (error.message || "Unknown error")
    });
  }
};

// Add this new function to check and refresh subscription status
exports.refreshSubscriptionStatus = async (req, res) => {
  try {
    const { investorId } = req.params;
    console.log(`Refreshing subscription status for investor ID: ${investorId}`);
    
    // Validate investor ID
    if (!investorId || !mongoose.Types.ObjectId.isValid(investorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid investor ID'
      });
    }
    
    // Initialize diagnostic information
    const diagnostics = {
      lookupMethod: 'Direct InvestorSubscription query',
      updates: []
    };
    
    // First, check if we can find a direct reference to subscription from the User or InvestorUser
    let directSubscriptionId = null;
    let user = null;
    let investorUser = null;
    
    // Check if this is an InvestorUser ID
    investorUser = await InvestorUser.findById(investorId);
    if (investorUser) {
      diagnostics.investorDetails = {
        id: investorUser._id,
        email: investorUser.investoremail,
        userId: investorUser.userId || null,
        hasSubscriptionField: !!investorUser.currentSubscription
      };
      
      // Check if the InvestorUser has a currentSubscription ID
      if (investorUser.currentSubscription) {
        directSubscriptionId = investorUser.currentSubscription;
        console.log(`InvestorUser has currentSubscription: ${directSubscriptionId}`);
      }
    }
    
    // If we don't have a directSubscriptionId yet, check if this is a User ID
    if (!directSubscriptionId) {
      user = await User.findById(investorId);
      if (user) {
        diagnostics.user = {
          id: user._id,
          email: user.email,
          userType: user.userType,
          investorDetailsId: user.investorDetailsId || null,
          hasSubscriptionField: !!user.currentSubscription
        };
        
        // Check if the User has a currentSubscription ID
        if (user.currentSubscription) {
          directSubscriptionId = user.currentSubscription;
          console.log(`User has currentSubscription: ${directSubscriptionId}`);
        }
        
        // If user has investorDetailsId, check that InvestorUser for currentSubscription
        if (!directSubscriptionId && user.investorDetailsId && !investorUser) {
          investorUser = await InvestorUser.findById(user.investorDetailsId);
          if (investorUser) {
            diagnostics.investorDetails = {
              id: investorUser._id,
              email: investorUser.investoremail,
              userId: investorUser.userId || null,
              hasSubscriptionField: !!investorUser.currentSubscription
            };
            
            if (investorUser.currentSubscription) {
              directSubscriptionId = investorUser.currentSubscription;
              console.log(`Found subscription ID from linked InvestorUser: ${directSubscriptionId}`);
            }
          }
        }
      }
    }
    
    // If we found a direct reference, look up that subscription
    let subscription = null;
    
    if (directSubscriptionId) {
      diagnostics.directSubscriptionId = directSubscriptionId.toString();
      diagnostics.lookupMethod = 'Direct currentSubscription field lookup';
      
      subscription = await InvestorSubscription.findById(directSubscriptionId).populate('plan');
      if (subscription) {
        console.log(`Found subscription by direct ID lookup: ${subscription._id}`);
        diagnostics.directQuery = { found: true, subscriptionId: subscription._id.toString() };
      } else {
        console.log(`Subscription with ID ${directSubscriptionId} not found, will try other methods`);
        diagnostics.directQuery = { found: false, lookedForId: directSubscriptionId.toString() };
      }
    }
    
    // If no subscription found yet, try the original approach
    if (!subscription) {
      // PRIMARY APPROACH: Directly query the InvestorSubscription model
      // Find active subscription with this investor ID
      subscription = await InvestorSubscription.findOne({ 
        investor: investorId,
        isActive: true 
      }).populate('plan').sort({ createdAt: -1 });
      
      if (subscription) {
        console.log(`Found active subscription directly with investor ID: ${subscription._id}`);
        diagnostics.directQuery = { found: true, subscriptionId: subscription._id };
        diagnostics.lookupMethod = 'Direct InvestorSubscription query';
      } else {
        diagnostics.directQuery = { found: false };
      }
    }
    
    // If no subscription found with direct ID, collect all possible related IDs
    if (!subscription) {
      const possibleIds = [investorId]; // Always include the original ID
      diagnostics.lookupMethod = 'Related IDs InvestorSubscription query';
      
      // Check if this is a User ID (if we haven't checked already)
      if (!user) {
        user = await User.findById(investorId);
        if (user) {
          diagnostics.user = {
            id: user._id,
            email: user.email,
            userType: user.userType,
            investorDetailsId: user.investorDetailsId || null,
            hasSubscriptionField: !!user.currentSubscription
          };
          
          // Add investorDetailsId if it exists
          if (user.investorDetailsId) {
            if (!investorUser) {
              investorUser = await InvestorUser.findById(user.investorDetailsId);
            }
            if (investorUser) {
              possibleIds.push(user.investorDetailsId);
              diagnostics.investorDetails = {
                id: investorUser._id,
                email: investorUser.investoremail,
                userId: investorUser.userId || null,
                hasSubscriptionField: !!investorUser.currentSubscription
              };
              console.log(`Added investorDetailsId from User: ${user.investorDetailsId}`);
            }
          }
          
          // Try to find InvestorUser by email if not found by ID
          if (!investorUser && user.email) {
            investorUser = await InvestorUser.findOne({ investoremail: user.email });
            if (investorUser) {
              possibleIds.push(investorUser._id);
              console.log(`Added InvestorUser found by email: ${investorUser._id}`);
              diagnostics.investorDetails = {
                id: investorUser._id,
                email: investorUser.investoremail,
                userId: investorUser.userId || null,
                hasSubscriptionField: !!investorUser.currentSubscription,
                note: "Found by email"
              };
              
              // Link User and InvestorUser if not already linked
              if (!user.investorDetailsId) {
                user.investorDetailsId = investorUser._id;
                await user.save();
                diagnostics.updates.push(`Linked User ${user._id} to InvestorDetails ${investorUser._id}`);
              }
              
              if (!investorUser.userId) {
                investorUser.userId = user._id;
                await investorUser.save();
                diagnostics.updates.push(`Linked InvestorDetails ${investorUser._id} to User ${user._id}`);
              }
            }
          }
        } 
      }
      // If this is an InvestorUser ID (if we haven't checked already)
      else if (!investorUser) {
        investorUser = await InvestorUser.findById(investorId);
        if (investorUser) {
          diagnostics.investorDetails = {
            id: investorUser._id,
            email: investorUser.investoremail,
            userId: investorUser.userId || null,
            hasSubscriptionField: !!investorUser.currentSubscription
          };
          
          // Add userId if it exists
          if (investorUser.userId) {
            user = await User.findById(investorUser.userId);
            if (user) {
              possibleIds.push(user._id);
              diagnostics.user = {
                id: user._id,
                email: user.email,
                userType: user.userType,
                investorDetailsId: user.investorDetailsId || null,
                hasSubscriptionField: !!user.currentSubscription
              };
              console.log(`Added userId from InvestorUser: ${user._id}`);
            }
          }
          
          // Try to find User by email if not found by ID
          if (!user && investorUser.investoremail) {
            user = await User.findOne({ email: investorUser.investoremail });
            if (user) {
              possibleIds.push(user._id);
              console.log(`Added User found by email: ${user._id}`);
              diagnostics.user = {
                id: user._id,
                email: user.email,
                userType: user.userType,
                investorDetailsId: user.investorDetailsId || null,
                hasSubscriptionField: !!user.currentSubscription,
                note: "Found by email"
              };
              
              // Link User and InvestorUser if not already linked
              if (!user.investorDetailsId) {
                user.investorDetailsId = investorUser._id;
                await user.save();
                diagnostics.updates.push(`Linked User ${user._id} to InvestorDetails ${investorUser._id}`);
              }
              
              if (!investorUser.userId) {
                investorUser.userId = user._id;
                await investorUser.save();
                diagnostics.updates.push(`Linked InvestorDetails ${investorUser._id} to User ${user._id}`);
              }
            }
          }
        } else {
          return res.status(404).json({
            success: false,
            message: 'Neither User nor InvestorDetails found with this ID',
            investorId
          });
        }
      }
      
      console.log(`Searching for subscription with possible IDs:`, possibleIds);
      diagnostics.possibleIds = possibleIds;
      
      // Search with all possible IDs
      if (possibleIds.length > 0) {
        subscription = await InvestorSubscription.findOne({ 
          investor: { $in: possibleIds },
          isActive: true 
        }).populate('plan').sort({ createdAt: -1 });
        
        if (subscription) {
          console.log(`Found subscription via related ID: ${subscription.investor}`);
          diagnostics.relatedQuery = { found: true, subscriptionId: subscription._id };
        } else {
          diagnostics.relatedQuery = { found: false };
        }
      }
    }
    
    if (subscription) {
      // Calculate days remaining and check if expired
      const now = new Date();
      const endDate = new Date(subscription.endDate);
      const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      const isExpired = now > endDate;
      
      // If subscription is expired but still marked as active, update its status
      if (isExpired && subscription.isActive) {
        subscription.isActive = false;
        subscription.status = 'expired';
        await subscription.save();
        diagnostics.updates.push("Updated expired subscription status");
      }
      
      // Update User and InvestorUser models if needed
      if (user && (!user.currentSubscription || !user.currentSubscription.equals(subscription._id))) {
        user.currentSubscription = subscription._id;
        await user.save();
        diagnostics.updates.push(`Updated User ${user._id} with subscription ${subscription._id}`);
      }
      
      if (investorUser && (!investorUser.currentSubscription || !investorUser.currentSubscription.equals(subscription._id))) {
        investorUser.currentSubscription = subscription._id;
        await investorUser.save();
        diagnostics.updates.push(`Updated InvestorDetails ${investorUser._id} with subscription ${subscription._id}`);
      }
      
      // Return the subscription with days remaining and expiry status
      return res.status(200).json({
        success: true,
        message: 'Subscription status refreshed',
        diagnostics,
        subscription,
        daysRemaining: Math.max(0, daysRemaining),
        isExpired,
        updatesApplied: diagnostics.updates.length > 0
      });
    }
    
    // If no subscription found, look for recent inactive ones and fix any potential
    // data inconsistencies by clearing currentSubscription fields if they exist
    const recentInactiveSubscription = await InvestorSubscription.findOne({ 
      investor: { $in: possibleIds || [investorId] }
    }).populate('plan').sort({ createdAt: -1 });
    
    if (recentInactiveSubscription) {
      diagnostics.inactiveSubscription = {
        found: true,
        id: recentInactiveSubscription._id,
        status: recentInactiveSubscription.status,
        isActive: recentInactiveSubscription.isActive,
        endDate: recentInactiveSubscription.endDate
      };
    }
    
    // Clear any invalid currentSubscription references
    if (directSubscriptionId && (!subscription || !recentInactiveSubscription || 
        (recentInactiveSubscription && !recentInactiveSubscription._id.equals(directSubscriptionId)))) {
      // The currentSubscription IDs point to a non-existent subscription - clear them
      if (user && user.currentSubscription) {
        user.currentSubscription = null;
        await user.save();
        diagnostics.updates.push(`Cleared invalid currentSubscription reference from User ${user._id}`);
      }
      
      if (investorUser && investorUser.currentSubscription) {
        investorUser.currentSubscription = null;
        await investorUser.save();
        diagnostics.updates.push(`Cleared invalid currentSubscription reference from InvestorDetails ${investorUser._id}`);
      }
    }
    
    return res.status(200).json({
      success: false,
      message: 'No active subscription found after refresh',
      diagnostics
    });
  } catch (error) {
    console.error('Error refreshing subscription status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error refreshing subscription status: ' + (error.message || 'Unknown error')
    });
  }
};

// Link an existing subscription to an investor user
exports.linkSubscriptionToUser = async (req, res) => {
  try {
    const { subscriptionId, userId } = req.body;
    
    if (!subscriptionId || !mongoose.Types.ObjectId.isValid(subscriptionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID'
      });
    }
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    // Find the subscription
    const subscription = await InvestorSubscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Find the related payment
    const payment = await Payment.findOne({ subscription: subscriptionId });
    
    // Update user with subscription
    user.currentSubscription = subscriptionId;
    if (payment && (!user.paymentHistory || !user.paymentHistory.includes(payment._id))) {
      if (!user.paymentHistory) {
        user.paymentHistory = [];
      }
      user.paymentHistory.push(payment._id);
    }
    await user.save();
    console.log(`Updated User ${user._id} with subscription ${subscriptionId}`);
    
    // If user is an investor, update InvestorUser model
    let investorUser = null;
    if (user.investorDetailsId) {
      investorUser = await InvestorUser.findById(user.investorDetailsId);
      if (investorUser) {
        investorUser.currentSubscription = subscriptionId;
        if (payment && (!investorUser.paymentHistory || !investorUser.paymentHistory.includes(payment._id))) {
          if (!investorUser.paymentHistory) {
            investorUser.paymentHistory = [];
          }
          investorUser.paymentHistory.push(payment._id);
        }
        await investorUser.save();
        console.log(`Updated InvestorUser ${investorUser._id} with subscription ${subscriptionId}`);
      }
    }
    
    // If no InvestorUser found via ID, try by email
    if (!investorUser && user.email) {
      investorUser = await InvestorUser.findOne({ investoremail: user.email });
      if (investorUser) {
        investorUser.currentSubscription = subscriptionId;
        if (payment && (!investorUser.paymentHistory || !investorUser.paymentHistory.includes(payment._id))) {
          if (!investorUser.paymentHistory) {
            investorUser.paymentHistory = [];
          }
          investorUser.paymentHistory.push(payment._id);
        }
        
        // If there's no userId link, set it now
        if (!investorUser.userId) {
          investorUser.userId = user._id;
        }
        
        await investorUser.save();
        console.log(`Updated InvestorUser found by email ${investorUser._id} with subscription ${subscriptionId}`);
        
        // Update user with investorDetailsId if not set
        if (!user.investorDetailsId) {
          user.investorDetailsId = investorUser._id;
          await user.save();
          console.log(`Updated User ${user._id} with investorDetailsId ${investorUser._id}`);
        }
      }
    }
    
    // Update subscription investor field if it's a temporary ID
    if (subscription.investor.toString().startsWith('temp-')) {
      subscription.investor = user._id;
      await subscription.save();
      console.log(`Updated subscription ${subscriptionId} investor from temporary to ${user._id}`);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Subscription successfully linked to user',
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        currentSubscription: subscriptionId
      },
      investorUser: investorUser ? {
        _id: investorUser._id,
        email: investorUser.investoremail,
        name: investorUser.investorname,
        currentSubscription: subscriptionId
      } : null
    });
  } catch (error) {
    console.error('Error linking subscription to user:', error);
    return res.status(500).json({
      success: false,
      message: 'Error linking subscription to user: ' + (error.message || 'Unknown error')
    });
  }
}; 