const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PaymentSchema = new Schema({
    razorpay_order_id: {
        type: String,

    },
    razorpay_payment_id: {
        type: String,

    },
    razorpay_signature: {
        type: String,

    },
    paymentfor: {
        type: String,
        // required: true,
    },
    amount: {
        type: mongoose.Schema.Types.Decimal128,
        // type: Number // Use Decimal128 for decimal data

        // required: true,
    },
    status: {
        type: String,
        // type: Number,

        // required: true,
    },
    order_id: {
        type: String,
        // required: true,
    },
    method: {
        type: String,
        // required: true,
    },
    captured: {
        type: String,
        // required: true,
    },
    description: {
        type: String,
        // required: true,
    },
    card_id: {
        type: String,
        // required: true,
    },

    user: {
        type: mongoose.Types.ObjectId,
        // required: true, 
        ref: 'User'
    },
    date: {
        type: Date,
        default: Date.now
    },
    paymentMode: {
        type: String,
        default: 'Online'
    },
    transactionStatus: { type: String, default: 1 },

});



module.exports = mongoose.model("payment", PaymentSchema);


