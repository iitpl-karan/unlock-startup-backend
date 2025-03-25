const express = require("express");
const router = express.Router();
const subscriptionController = require('../controllers/subscription');

// Get all subscription plans
router.get("/plans", subscriptionController.getAllPlans);

// Create subscription order
router.post("/create-order", subscriptionController.createSubscriptionOrder);

// Verify payment and activate subscription
router.post("/verify-payment", subscriptionController.verifySubscriptionPayment);

// Get investor's subscription
router.get("/investor/:investorId", subscriptionController.getInvestorSubscription);

// Cancel subscription
router.put("/cancel/:subscriptionId", subscriptionController.cancelSubscription);

// Admin: Get all subscriptions
router.get("/all", subscriptionController.getAllSubscriptions);

// Razorpay webhook endpoint
router.post("/razorpayresponse", subscriptionController.RazorpayResponse);

module.exports = router; 