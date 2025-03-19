const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const generateEnquiryNo = require('../helpers/generateAlphaNumericCode')

const EnquirySchema = new Schema({
  fullName: {
    type: String,
    required: true
  },
  companyname: {
    type: String,
  },
  enquiryNo: {
    type: String,
    default: generateEnquiryNo(8)
  },
  email: {
    type: String,
    required: true
  },
  contactNo: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: true
  },
  attachment: {
    type: String,
  },
  status: {
    type: Number,
    default: 0
  },

  otherDetails: {
    type: Object
  },
  createdAt: {
    type: String,
    default: Date.now()
  },
});

module.exports = mongoose.model("Enquiry", EnquirySchema);
