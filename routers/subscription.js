const express = require("express");
const router = express.Router();
const subscriptionController = require('../controllers/subscription');

// Get all subscription plans
router.get("/plans", subscriptionController.getAllPlans);

// Create subscription order
router.post("/create-order", subscriptionController.createSubscriptionOrder);

// Verify payment and activate subscription
router.post("/verify-payment", subscriptionController.verifyPayment);

// Activate free plan
router.post("/activate-free-plan", subscriptionController.activateFreePlan);

// Get investor's subscription details
router.get("/investor/:investorId", subscriptionController.getInvestorSubscription);

// Refresh investor's subscription status and fix any issues
router.get("/refresh-status/:investorId", subscriptionController.refreshSubscriptionStatus);

// Get investor's payment history
router.get("/payment-history/:investorId", subscriptionController.getInvestorPaymentHistory);

// Admin routes
router.get("/admin/plans", subscriptionController.getAllPlans);
router.post("/admin/plans", subscriptionController.createPlan);
router.put("/admin/plans/:planId", subscriptionController.updatePlan);
router.delete("/admin/plans/:planId", subscriptionController.deletePlan);
router.get("/admin/subscriptions", subscriptionController.getAllSubscriptions);

// Public webhook for Razorpay
router.post("/razorpay-webhook", subscriptionController.RazorpayResponse);

module.exports = router; 