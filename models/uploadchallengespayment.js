const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const uploadchallengespayment = new Schema({

    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userDetails: { type: String, default: null },
    challengeid: { type: Schema.Types.ObjectId, ref: 'StartupChallenge' },
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

module.exports = mongoose.model("registerchallenges", uploadchallengespayment);