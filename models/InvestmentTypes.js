const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const InvestmentTypesSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  status: {type: Number, default : 1},
  // categoryimage :{  type: String, required: true }
 
}, {timestamps : true});

module.exports = mongoose.model("InvestmentTypes", InvestmentTypesSchema);