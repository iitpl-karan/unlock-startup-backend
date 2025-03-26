const Notification = require("../models/Notification");
const InvestorSubscription = require("../models/InvestorSubscription");
const User = require("../models/usersModel");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

// Helper function to calculate days between two dates
const calculateDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Create a new notification
exports.createNotification = async (req, res) => {
  try {
    const { userId, type, title, message, action, metadata } = req.body;

    // Validate input
    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, title, message"
      });
    }

    // Create new notification
    const notification = new Notification({
      user: userId,
      type: type || "system",
      title,
      message,
      action,
      metadata
    });

    await notification.save();

    return res.status(201).json({
      success: true,
      notification
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating notification"
    });
  }
};

// Get notifications for a user
exports.getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, skip = 0, unreadOnly = false } = req.query;

    const query = { 
      user: userId,
      expiresAt: { $gt: new Date() }
    };
    
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      user: userId, 
      read: false,
      expiresAt: { $gt: new Date() }
    });

    return res.status(200).json({
      success: true,
      notifications,
      total,
      unreadCount
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching notifications"
    });
  }
};

// Mark notifications as read
exports.markNotificationsAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const { notificationIds } = req.body;

    let query = { user: userId };
    
    // If notification IDs are provided, only update those
    if (notificationIds && notificationIds.length > 0) {
      query._id = { $in: notificationIds };
    }

    const result = await Notification.updateMany(query, { read: true });

    return res.status(200).json({
      success: true,
      message: `Marked ${result.nModified} notifications as read`
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return res.status(500).json({
      success: false,
      message: "Error marking notifications as read"
    });
  }
};

// Delete notifications
exports.deleteNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { notificationIds } = req.body;

    let query = { user: userId };
    
    // If notification IDs are provided, only delete those
    if (notificationIds && notificationIds.length > 0) {
      query._id = { $in: notificationIds };
    }

    const result = await Notification.deleteMany(query);

    return res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} notifications`
    });
  } catch (error) {
    console.error("Error deleting notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting notifications"
    });
  }
};

// Check for subscription expirations and create notifications
exports.checkSubscriptionExpirations = async (req, res) => {
  try {
    const now = new Date();
    // Find active subscriptions that will expire in the next 5 days
    const subscriptions = await InvestorSubscription.find({
      isActive: true,
      endDate: { 
        $gt: now, 
        $lt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
      }
    }).populate('investor');

    let notificationsCreated = 0;
    
    for (const subscription of subscriptions) {
      const investor = subscription.investor;
      
      if (!investor) {
        console.log(`No investor found for subscription ${subscription._id}`);
        continue;
      }
      
      const daysRemaining = calculateDaysBetween(now, subscription.endDate);
      
      // Check if we already sent a notification for this day count
      const existingNotification = await Notification.findOne({
        user: investor._id,
        type: 'subscription',
        'metadata.subscriptionId': subscription._id.toString(),
        'metadata.daysRemaining': daysRemaining,
        expiresAt: { $gt: now }
      });
      
      if (existingNotification) {
        // Skip if we already sent a notification for this day count
        continue;
      }
      
      // Create notification for the investor
      const notification = new Notification({
        user: investor._id,
        type: 'subscription',
        title: 'Subscription Expiring Soon',
        message: `Your subscription will expire in ${daysRemaining} days. Renew now to maintain your investment access.`,
        action: '/investorpanel/settings/subscription',
        metadata: {
          subscriptionId: subscription._id,
          endDate: subscription.endDate,
          daysRemaining
        }
      });
      
      await notification.save();
      notificationsCreated++;
    }

    return res.status(200).json({
      success: true,
      message: `Created ${notificationsCreated} subscription expiration notifications`
    });
  } catch (error) {
    console.error("Error checking subscription expirations:", error);
    return res.status(500).json({
      success: false,
      message: "Error checking subscription expirations"
    });
  }
};

// Clean up expired notifications
exports.cleanupExpiredNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      expiresAt: { $lt: new Date() }
    });

    return res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} expired notifications`
    });
  } catch (error) {
    console.error("Error cleaning up expired notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Error cleaning up expired notifications"
    });
  }
}; 