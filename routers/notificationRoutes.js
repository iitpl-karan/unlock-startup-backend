const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification");
const userAuth = require("../middlewares/userAuth");

// Create a new notification (admin/system only)
router.post("/", userAuth, notificationController.createNotification);

// Get notifications for a user
router.get("/user/:userId", userAuth, notificationController.getUserNotifications);

// Mark notifications as read
router.patch("/user/:userId/read", userAuth, notificationController.markNotificationsAsRead);

// Delete notifications
router.delete("/user/:userId", userAuth, notificationController.deleteNotifications);

// Check for subscription expirations (can be called by cron job)
router.post("/check-subscriptions", notificationController.checkSubscriptionExpirations);

// Clean up expired notifications (can be called by cron job)
router.post("/cleanup", notificationController.cleanupExpiredNotifications);

module.exports = router; 