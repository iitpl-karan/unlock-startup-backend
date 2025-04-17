const express = require("express");
const router = express.Router();
const subscriptionController = require('../controllers/subscription');
const userAuth = require('../middlewares/userAuth');

// Get all subscription plans
router.get("/plans", subscriptionController.getAllPlans);

// Admin routes for managing subscription plans
router.post("/create-plan", subscriptionController.createPlan);
router.patch("/update-plan/:planId", subscriptionController.updatePlan);
router.delete("/delete-plan/:planId", subscriptionController.deletePlan);

// Create subscription order
router.post("/create-order", subscriptionController.createSubscriptionOrder);

// Verify payment and activate subscription
router.post("/verify-payment", subscriptionController.verifyPayment);

// Activate free plan
router.post("/activate-free-plan", subscriptionController.activateFreePlan);

// Link an existing subscription to a user
router.post("/link-subscription", subscriptionController.linkSubscriptionToUser);

// Get investor's subscription details
router.get("/investor/:investorId", subscriptionController.getInvestorSubscription);

// Refresh investor's subscription status and fix any issues
router.get("/refresh-status/:investorId", subscriptionController.refreshSubscriptionStatus);

// Get investor's payment history
router.get("/payment-history/:investorId", subscriptionController.getInvestorPaymentHistory);

// Admin routes - these are additional admin-specific endpoints
router.get("/admin/subscriptions", userAuth, subscriptionController.getAllSubscriptions);
router.get("/admin/payments", userAuth, subscriptionController.getAllPayments);
router.get("/admin/payments-pagination", userAuth, subscriptionController.getAllPaymentsPagination);

// Public webhook for Razorpay
router.post("/razorpay-webhook", subscriptionController.RazorpayResponse);

module.exports = router; 