const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const InvestorDropdownSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  dropdownType: { 
    type: String, 
    required: true,
    enum: ['investor-type', 'investment-stage', 'funding-type', 'area-of-expertise', 'state']
  },
  status: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model("InvestorDropdown", InvestorDropdownSchema); 