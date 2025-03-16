// models/ChangeLog.js
const mongoose = require('mongoose');

const ChangeLogSchema = new mongoose.Schema({
  model: String,
  recordId: mongoose.Schema.Types.ObjectId,
  changes: Object,
  timestamp: { type: Date, default: Date.now },
  userId: mongoose.Schema.Types.ObjectId
});

module.exports = mongoose.model('ChangeLog', ChangeLogSchema);
