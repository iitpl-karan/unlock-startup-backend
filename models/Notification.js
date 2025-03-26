const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['subscription', 'welcome', 'system', 'pitch', 'message'], 
    default: 'system' 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  action: {
    type: String,
    default: null // URL or action identifier
  },
  metadata: {
    type: Object,
    default: {} // Store additional data if needed
  },
  expiresAt: {
    type: Date,
    default: function() {
      // By default, notifications expire after 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return thirtyDaysFromNow;
    }
  }
}, { timestamps: true });

// Create index for querying unread notifications
NotificationSchema.index({ user: 1, read: 1 });
// Create index for finding expired notifications
NotificationSchema.index({ expiresAt: 1 });

module.exports = mongoose.model("Notification", NotificationSchema); 