const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const InvestorUser = new Schema({
  investorname: { type: String, required: false, default: '' },
  investoremail: { type: String, required: true },
  password: { type: String, required: true, default: null },
  website: { type: String, default: '' },
  phoneNumber: { type: String, default: '' },
  isPhonePublic: { type: Boolean, default: false },
  isEmailPublic: { type: Boolean, default: false },
  investorType: { type: String, default: '' },
  stage: { type: String, default: '' },
  company: { type: String, default: '' },
  userType: { type: String, default: "Investor" }, // "Individual/startup", "Company", "admin"
  terms: { type: Boolean, default: false },
  netWorth: { type: String, default: '' },
  responseTime: { type: String, default: '' },
  fundingAmount: { type: String, default: '' },
  portfolio: { type: String, default: '' },
  investorImage: { type: String, default: '/assets/images/investor/Investor-item1.webp' },
  // Company Details
  companyDetails: {
    fullName: { type: String, default: '' },
    designation: { type: String, default: '' },
    email: { type: String, default: '' },
    linkedIn: { type: String, default: '' },
    companyLogo: { type: String, default: '/assets/images/company-logo-default.png' }
  },
  // Investor Details
  investorDetails: {
    name: { type: String, default: '' },
    type: { type: String, default: '' },
    stages: { type: String, default: '' },
    fundingTypes: { type: String, default: '' },
    expertise: { type: String, default: '' },
    state: { type: String, default: '' },
  },
  // About Us
  aboutUs: [{ type: String }],
  // Pitches received from startups
  pitches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InvestorPitch'
  }],
  // Reference to user in Users collection
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Subscription information
  currentSubscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InvestorSubscription',
    default: null
  },
  // Payment history reference
  paymentHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  }],
  createdAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model("InvestorUser", InvestorUser);