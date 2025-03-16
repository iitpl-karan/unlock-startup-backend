const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const pitchDeckBooking = new Schema({





  pitchDeckId: { type: Schema.Types.ObjectId, ref: 'PitchDeck' }, // Reference to PitchDeck document
  userId: { type: Schema.Types.ObjectId, ref: 'User' }, // Reference to Users document
  userDetails: { type: String, default: null },


  razorpay_order_id: { type: String, },
  razorpay_payment_id: { type: String, },
  transactionId: { type: Schema.Types.ObjectId, default: null },
  paymentStatus: { type: Number, default: 1 },
  paymentfor: { type: String, default: null },
  createdAt: { type: Date, default: Date.now() },
  payment_id: { type: String, },
  order_id: { type: String, },
  price: { type: String, },




});

module.exports = mongoose.model("PitchDeckPurchase", pitchDeckBooking);