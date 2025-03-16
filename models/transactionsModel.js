const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TransactionsSchema = new Schema({
  transactionDetails: { type: Object, required: true }, // JSON format
  paymentMode: { type: String, required: true },
  transactionStatus: { type: String, required: true },
  transactionDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now() },
});

module.exports = mongoose.model("Transaction", TransactionsSchema);