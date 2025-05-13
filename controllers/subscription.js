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
  key_id: "rzp_test_LHVztjvE6284Fc", // Live key that's working in challenge upload
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
        // If not found in User model, try to find in InvestorUser model
        investorUser = await InvestorUser.findById(investorId);
        if (investorUser) {
          console.log(`Found InvestorUser with ID ${investorId}`);
          // Create a user object from InvestorUser for subscription creation
          user = {
            _id: investorUser._id,
            email: investorUser.investoremail,
            userType: 'Investor',
            investorDetailsId: investorUser._id
          };
        }
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
    
    // Check if we have a valid user object
    if (!user) {
      console.log(`No user or investor found with ID: ${investorId}`);
      return res.status(404).json({
        success: false,
        message: 'Investor not found. Please check the investor ID and try again.'
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
    
    if (plan.price > 0) {
      return res.status(400).json({
        success: false,
        message: 'This plan is not free and requires payment'
      });
    }
    
    // Calculate end date based on plan duration
    const startDate = new Date();
    const endDate = new Date();
    
    // Handle different plan durations correctly
    if (plan.planType === 'weekly') {
      // For weekly plans, convert duration to days (duration is in months, so multiply by 7/30)
      const daysToAdd = Math.ceil(plan.duration * 7);
      endDate.setDate(endDate.getDate() + daysToAdd);
    } else if (plan.planType === 'monthly') {
      // For monthly plans, use the standard month calculation
      endDate.setMonth(endDate.getMonth() + plan.duration);
    } else if (plan.planType === 'yearly') {
      // For yearly plans, multiply duration by 12 months
      endDate.setMonth(endDate.getMonth() + (plan.duration * 12));
    } else {
      // Default case - if duration is less than 1, treat as days
      if (plan.duration < 1) {
        const daysToAdd = Math.ceil(plan.duration * 30); // Convert fraction of month to days
        endDate.setDate(endDate.getDate() + daysToAdd);
      } else {
        // Otherwise use standard month calculation
        endDate.setMonth(endDate.getMonth() + plan.duration);
      }
    }
    
    console.log(`Plan duration: ${plan.duration}, Plan type: ${plan.planType}`);
    console.log(`Start date: ${startDate}, End date: ${endDate}`);
    
    // Determine which ID to use for the investor field (prioritize real user)
    console.log(user, "user id")
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
    
    // Create a payment record for the free plan
    const payment = new Payment({
      user: subscriberId,
      amount: mongoose.Types.Decimal128.fromString('0'),
      status: 'success',
      paymentMode: 'Free',
      transactionStatus: 'success',
      subscription: savedSubscription._id,
      paymentType: 'Subscription',
      payment_id: `free-${Date.now()}`,
      description: `Free subscription activation for ${plan.name}`
    });
    
    const savedPayment = await payment.save();
    console.log(`Created payment record: ${savedPayment._id}`);
    
    // Update user models with subscription
    const updatePromises = [];
    
    // Update User model if found
    if (user && !isTemporaryUser) {
      console.log(`Updating User model with subscription:`, user._id);
      
      // Check if user is a Mongoose document (has save method) or a plain object
      if (typeof user.save === 'function') {
        // User is a Mongoose document, update it directly
        user.currentSubscription = savedSubscription._id;
        if (!user.paymentHistory) {
          user.paymentHistory = [];
        }
        user.paymentHistory.push(savedPayment._id);
        updatePromises.push(user.save());
        console.log(`Updated User model with subscription: ${savedSubscription._id}`);
      } else {
        // User is a plain object (created from InvestorUser), update the actual User document
        console.log(`User object is not a Mongoose document, updating User in database`);
        try {
          // Check if there's a User document with this ID
          const userDocument = await User.findById(user._id);
          if (userDocument) {
            userDocument.currentSubscription = savedSubscription._id;
            if (!userDocument.paymentHistory) {
              userDocument.paymentHistory = [];
            }
            userDocument.paymentHistory.push(savedPayment._id);
            updatePromises.push(userDocument.save());
            console.log(`Updated User document with subscription: ${savedSubscription._id}`);
          } else {
            // If no User document exists with this ID, it might be an InvestorUser ID
            // Try to find a User with matching email
            if (user.email) {
              const userByEmail = await User.findOne({ email: user.email });
              if (userByEmail) {
                userByEmail.currentSubscription = savedSubscription._id;
                if (!userByEmail.paymentHistory) {
                  userByEmail.paymentHistory = [];
                }
                userByEmail.paymentHistory.push(savedPayment._id);
                userByEmail.investorDetailsId = user._id; // Link to InvestorUser
                updatePromises.push(userByEmail.save());
                console.log(`Updated User found by email with subscription: ${savedSubscription._id}`);
              } else {
                console.log(`No User document found for ID ${user._id} or email ${user.email}`);
              }
            }
          }
        } catch (error) {
          console.error('Error updating User document:', error);
          // Continue as this is not a critical error
        }
      }
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
          updatePromises.push(emailInvestorUser.save());
          console.log(`Updated InvestorUser found by email with subscription: ${savedSubscription._id}`);
          
          // If user is a Mongoose document and doesn't have investorDetailsId set, update it
          if (user && typeof user.save === 'function' && !user.investorDetailsId) {
            user.investorDetailsId = emailInvestorUser._id;
            updatePromises.push(user.save());
            console.log(`Updated user with investorDetailsId: ${emailInvestorUser._id}`);
          } else if (user && !user.investorDetailsId) {
            // If user is a plain object, update the actual User document
            try {
              const userDocument = await User.findById(user._id);
              if (userDocument && !userDocument.investorDetailsId) {
                userDocument.investorDetailsId = emailInvestorUser._id;
                updatePromises.push(userDocument.save());
                console.log(`Updated User document with investorDetailsId: ${emailInvestorUser._id}`);
              }
            } catch (error) {
              console.error('Error updating User document with investorDetailsId:', error);
              // Continue as this is not a critical error
            }
          }
        }
      } catch (error) {
        console.error('Error looking up InvestorUser by email:', error);
        // Continue as this is not a critical error
      }
    }
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    // Populate the plan details for the response
    const populatedSubscription = await InvestorSubscription.findById(savedSubscription._id).populate('plan');
    
    // Calculate days remaining for the response
    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysRemaining = Math.max(0, Math.ceil((endDate - now) / msPerDay));
    
    return res.status(200).json({
      success: true,
      message: 'Free plan activated successfully',
      subscription: populatedSubscription,
      daysRemaining,
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
    // Check if the request is from admin panel
    const isAdminRequest = req.query.isAdmin === 'true';
    
    // For admin panel, return all plans (active and inactive)
    // For frontend users, return only active plans
    const plans = isAdminRequest 
      ? await SubscriptionPlan.find() 
      : await SubscriptionPlan.find({ isActive: true });
    
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
    let isValidInvestor = false;
    
    if (!investorId.toString().startsWith('temp-')) {
      // First check if this is a User ID
      const User = require('../models/usersModel');
      investor = await User.findById(investorId);
      
      if (investor) {
        isValidInvestor = true;
      } else {
        // If not found in User model, check InvestorUser model
        const InvestorUser = require('../models/InvestorDetails');
        const investorUser = await InvestorUser.findById(investorId);
        
        if (investorUser) {
          isValidInvestor = true;
          investor = investorUser;
        }
      }
      
      if (!isValidInvestor) {
        return res.status(400).json({
          success: false,
          message: "Invalid investor"
        });
      }
    } else {
      // For temporary IDs during registration, we don't need validation
      isValidInvestor = true;
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

    // UPDATED INVESTOR LOOKUP: First check in InvestorUser collection
    let user = null;
    let investorUser = null;
    let actualUserId = null;
    
    // Step 1: First check if this is an InvestorUser ID
    investorUser = await InvestorUser.findById(investorId);
    
    if (investorUser) {
      console.log(`Found InvestorUser with ID ${investorId}`);
      
      // Step 2: If InvestorUser has userId, use that to find the actual User
      if (investorUser.userId) {
        console.log(`InvestorUser has userId: ${investorUser.userId}, looking up User`);
        user = await User.findById(investorUser.userId);
        
        if (user) {
          console.log(`Found User via InvestorUser.userId: ${user._id}`);
          actualUserId = user._id;
        } else {
          console.log(`User with ID ${investorUser.userId} not found`);
        }
      }
      
      // Step 3: If no user found by userId, try matching by email
      if (!user && investorUser.investoremail) {
        console.log(`Looking up User by email: ${investorUser.investoremail}`);
        user = await User.findOne({ email: investorUser.investoremail });
        
        if (user) {
          console.log(`Found User via email: ${user._id}`);
          actualUserId = user._id;
          
          // Update the relations if they're not set
          if (!user.investorDetailsId) {
            user.investorDetailsId = investorUser._id;
            await user.save();
            console.log(`Updated User with investorDetailsId: ${investorUser._id}`);
          }
          
          if (!investorUser.userId) {
            investorUser.userId = user._id;
            await investorUser.save();
            console.log(`Updated InvestorUser with userId: ${user._id}`);
          }
        }
      }
    }
    
    // Step 4: If no user found yet, check directly in User collection
    if (!user) {
      console.log(`No user found via InvestorUser lookup, checking directly with ID: ${investorId}`);
      user = await User.findById(investorId);
      
      if (user) {
        console.log(`Found User directly with ID: ${user._id}`);
        actualUserId = user._id;
        
        // If the user doesn't have an investorDetailsId but we found an investorUser, link them
        if (investorUser && !user.investorDetailsId) {
          user.investorDetailsId = investorUser._id;
          await user.save();
          console.log(`Updated User with investorDetailsId: ${investorUser._id}`);
        }
      } else {
        console.log(`User with ID ${investorId} not found`);
        return res.status(404).json({
          success: false,
          message: 'Investor not found. Please check the investor ID.'
        });
      }
    }
    
    // Ensure we have a valid user at this point
    if (!user) {
      console.log(`No valid user found with investorId: ${investorId}`);
      return res.status(404).json({
        success: false,
        message: 'Investor not found. No matching User record.'
      });
    }

    // Use the actual user ID we found
    console.log(`Using actualUserId for subscription: ${actualUserId}`);

    // Calculate end date based on plan duration
    const startDate = new Date();
    const endDate = new Date();
    
    // Handle different plan durations correctly
    if (plan.planType === 'weekly') {
      // For weekly plans, convert duration to days (duration is in months, so multiply by 7/30)
      const daysToAdd = Math.ceil(plan.duration * 7);
      endDate.setDate(endDate.getDate() + daysToAdd);
    } else if (plan.planType === 'monthly') {
      // For monthly plans, use the standard month calculation
      endDate.setMonth(endDate.getMonth() + plan.duration);
    } else if (plan.planType === 'yearly') {
      // For yearly plans, multiply duration by 12 months
      endDate.setMonth(endDate.getMonth() + (plan.duration * 12));
    } else {
      // Default case - if duration is less than 1, treat as days
      if (plan.duration < 1) {
        const daysToAdd = Math.ceil(plan.duration * 30); // Convert fraction of month to days
        endDate.setDate(endDate.getDate() + daysToAdd);
      } else {
        // Otherwise use standard month calculation
        endDate.setMonth(endDate.getMonth() + plan.duration);
      }
    }
    
    console.log(`Plan duration: ${plan.duration}, Plan type: ${plan.planType}`);
    console.log(`Start date: ${startDate}, End date: ${endDate}`);
    
    // Create a new subscription using the actual user ID
    const subscription = new InvestorSubscription({
      investor: user._id,  // Using the actual user ID now
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
      user: user._id,  // Using the actual user ID here too
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

    // Update InvestorUser if we found one
    if (investorUser) {
      investorUser.currentSubscription = savedSubscription._id;
      if (!investorUser.paymentHistory) {
        investorUser.paymentHistory = [];
      }
      investorUser.paymentHistory.push(savedPayment._id);
      await investorUser.save();
      console.log(`Updated InvestorUser ${investorUser._id} with subscription ${savedSubscription._id}`);
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
    
    // If not found by direct ID, check if this is a User ID
    if (!subscription) {
      lookupMethod = 'User ID lookup';
      user = await User.findById(investorId);
      if (user) {
        console.log(`Found User with ID ${investorId}`);
        
        // Check if the User has a currentSubscription ID
        if (user.currentSubscription) {
          subscription = await InvestorSubscription.findById(user.currentSubscription).populate('plan');
          console.log(`Found subscription via User.currentSubscription: ${user.currentSubscription}`);
        }
        
        // If not found and user has investorDetailsId, check that InvestorUser
        if (!subscription && user.investorDetailsId) {
          investorUser = await InvestorUser.findById(user.investorDetailsId);
          if (investorUser && investorUser.currentSubscription) {
            subscription = await InvestorSubscription.findById(investorUser.currentSubscription).populate('plan');
            console.log(`Found subscription via User.investorDetailsId.currentSubscription: ${investorUser.currentSubscription}`);
          }
        }
      }
    }
    
    // If still not found, look up by investor field in InvestorSubscription
    if (!subscription) {
      lookupMethod = 'InvestorSubscription.investor lookup';
      subscription = await InvestorSubscription.findOne({ 
        investor: investorId, 
        isActive: true,
        status: { $ne: 'expired' }
      }).sort({ createdAt: -1 }).populate('plan');
      
      console.log(`Looked up subscription via InvestorSubscription.investor: ${subscription ? 'Found' : 'Not found'}`);
    }
    
    // If no subscription found, return error
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found for this investor'
      });
    }
    
    // Calculate days remaining
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    
    // Calculate days remaining more precisely
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysRemaining = Math.max(0, Math.ceil((endDate - now) / msPerDay));
    
    // Check if subscription is expired
    const isExpired = now > endDate || subscription.status === 'expired';
    
    // If expired but status is not set to expired, update it
    if (isExpired && subscription.status !== 'expired') {
      subscription.status = 'expired';
      subscription.isActive = false;
      await subscription.save();
      console.log(`Updated subscription ${subscription._id} to expired status`);
    }
    
    // Return subscription with additional metadata
    return res.status(200).json({
      success: true,
      subscription,
      daysRemaining,
      isExpired,
      lookupMethod
    });
  } catch (error) {
    console.error('Error fetching investor subscription:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching investor subscription: ' + (error.message || 'Unknown error')
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

// Get investor's payment history
exports.getInvestorPaymentHistory = async (req, res) => {
  try {
    const { investorId } = req.params;
    console.log(`Fetching payment history for investor ID: ${investorId}`);
    
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
    let userIds = [investorId]; // Start with the provided ID
    
    // Check if this is an InvestorUser ID
    investorUser = await InvestorUser.findById(investorId);
    if (investorUser) {
      console.log(`Found InvestorUser with ID ${investorId}`);
      
      // If InvestorUser has userId, add it to the list of IDs to search
      if (investorUser.userId) {
        userIds.push(investorUser.userId);
      }
    }
    
    // If not found as InvestorUser, check if this is a User ID
    if (!investorUser) {
      user = await User.findById(investorId);
      if (user) {
        console.log(`Found User with ID ${investorId}`);
        
        // If User has investorDetailsId, add it to the list of IDs to search
        if (user.investorDetailsId) {
          userIds.push(user.investorDetailsId);
          
          // Also fetch the InvestorUser for additional details
          investorUser = await InvestorUser.findById(user.investorDetailsId);
        }
      }
    }
    
    // If we found InvestorUser but no User, try to find the User
    if (investorUser && !user && investorUser.userId) {
      user = await User.findById(investorUser.userId);
      if (user) {
        userIds.push(user._id);
      }
    }
    
    // If we still don't have a user or investor, return an error
    if (!user && !investorUser) {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }
    
    console.log(`Searching for payments with user IDs: ${userIds.join(', ')}`);
    
    // Find all payments for this investor
    const payments = await Payment.find({
      user: { $in: userIds },
      paymentType: 'Subscription'
    })
    .sort({ createdAt: -1 })
    .populate({
      path: 'subscription',
      populate: {
        path: 'plan',
        model: 'SubscriptionPlan'
      }
    });
    
    // Process payments to include additional information
    const processedPayments = payments.map(payment => {
      const paymentObj = payment.toObject();
      
      // Add formatted date
      const paymentDate = new Date(payment.createdAt);
      paymentObj.formattedDate = paymentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Add formatted amount
      if (payment.amount) {
        // Handle Decimal128 conversion
        const amountValue = typeof payment.amount === 'object' && payment.amount.toString 
          ? payment.amount.toString() 
          : payment.amount;
        
        paymentObj.formattedAmount = `₹${parseFloat(amountValue).toFixed(2)}`;
      } else {
        paymentObj.formattedAmount = '₹0.00';
      }
      
      // Add plan name if available
      if (payment.subscription && payment.subscription.plan) {
        paymentObj.planName = payment.subscription.plan.name;
        paymentObj.planDuration = payment.subscription.plan.duration;
        paymentObj.planType = payment.subscription.plan.planType;
      }
      
      return paymentObj;
    });
    
    return res.status(200).json({
      success: true,
      payments: processedPayments,
      count: processedPayments.length
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching payment history: ' + (error.message || 'Unknown error')
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
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysRemaining = Math.max(0, Math.ceil((endDate - now) / msPerDay));
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

// Get all payments for admin panel
exports.getAllPayments = async (req, res) => {
  try {
    // Fetch all payments and populate user information
    const payments = await Payment.find()
      .populate('user', 'name email')
      .populate('subscription', 'plan endDate')
      .sort({ createdAt: -1 });

    // Enhance payment records with additional information
    const enhancedPayments = await Promise.all(
      payments.map(async payment => {
        let planName = 'N/A';
        let planType = 'N/A';
        let endDate = null;

        try {
          if (payment.subscription) {
            const subscription = payment.subscription;
            if (subscription.plan && typeof subscription.plan === 'object') {
              planName = subscription.plan.name;
              planType = subscription.plan.planType;
            }
            endDate = subscription.endDate;
          }
        } catch (error) {
          console.log('Error getting plan details for payment:', error);
        }

        return {
          _id: payment._id,
          payment_id: payment.payment_id || payment.razorpay_payment_id,
          order_id: payment.order_id || payment.razorpay_order_id,
          user: payment.user,
          amount: payment.amount,
          status: payment.status,
          paymentType: payment.paymentType,
          method: payment.method,
          description: payment.description,
          planName,
          planType,
          endDate,
          createdAt: payment.createdAt
        };
      })
    );

    return res.status(200).json({
      success: true,
      payments: enhancedPayments
    });
  } catch (error) {
    console.error("Error fetching all payments:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching payments: " + (error.message || "Unknown error")
    });
  }
};

// Get all payments for admin panel with pagination
exports.getAllPaymentsPagination = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Optional filters
    const { paymentStatus, paymentType, search } = req.query;
    let query = {};
    
    if (paymentStatus && paymentStatus !== 'all') {
      query.status = paymentStatus;
    }
    
    if (paymentType && paymentType !== 'all') {
      query.paymentType = paymentType;
    }
    
    if (search) {
      query.$or = [
        { payment_id: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Fetch paginated payments and populate user information
    const payments = await Payment.find(query)
      .populate('user', 'name email')
      .populate('subscription', 'plan endDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalItems = await Payment.countDocuments(query);
    
    // Enhance payment records with additional information
    const enhancedPayments = await Promise.all(
      payments.map(async payment => {
        let planName = 'N/A';
        let planType = 'N/A';
        let endDate = null;

        try {
          if (payment.subscription) {
            const subscription = payment.subscription;
            if (subscription.plan && typeof subscription.plan === 'object') {
              planName = subscription.plan.name;
              planType = subscription.plan.planType;
            }
            endDate = subscription.endDate;
          }
        } catch (error) {
          console.log('Error getting plan details for payment:', error);
        }

        return {
          _id: payment._id,
          payment_id: payment.payment_id || payment.razorpay_payment_id,
          order_id: payment.order_id || payment.razorpay_order_id,
          user: payment.user,
          amount: payment.amount,
          status: payment.status,
          paymentType: payment.paymentType,
          method: payment.method,
          description: payment.description,
          planName,
          planType,
          endDate,
          createdAt: payment.createdAt
        };
      })
    );

    return res.status(200).json({
      data: enhancedPayments,
      meta_data: {
        total_data: totalItems,
        current_page: page,
        data_limit: limit,
        total_pages: Math.ceil(totalItems / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching paginated payments:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching payments: " + (error.message || "Unknown error")
    });
  }
}; 