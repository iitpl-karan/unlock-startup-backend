const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UsersSchema = new Schema({
  name: { type: String, required: true , default : null},
  username: { type: String, default: null  },
  email: { type: String, required: true , required: true },
  password: { type: String,  default : null},
  image: {type: String , default : null },
  otp: {type: Number , default : null},
  otpExpiry: {type : Date , default : null},
  userType: { type: String, default : "Individual" }, // "Individual/startup", "Company", "admin"
  investorDetailsId: { type: Schema.Types.ObjectId, default: null, ref: 'InvestorDetails' }, // Reference to investorDetails document
  companyDetailsId: { type: Schema.Types.ObjectId, default: null , ref : 'CompanyDetails' }, // Reference to companyDetails document, if userType is "Company"
  userDetailsId: { type: Schema.Types.ObjectId, default: null  , ref: 'UserDetails' }, // Reference to userDetails document, if userType is "Individual/startup"
  status: { type: Number, default: 1 },
  // Subscription information
  currentSubscription: {
    type: Schema.Types.ObjectId,
    ref: 'InvestorSubscription',
    default: null
  },
  // Payment history
  paymentHistory: [{
    type: Schema.Types.ObjectId,
    ref: 'Payment'
  }]
}, {timestamps : true});

module.exports = mongoose.model("User", UsersSchema); 