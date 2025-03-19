const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Businessuser = new Schema({
  companyname: { type: String, required: true, default: null },

  companyemail: { type: String, required: true },
  password: { type: String, required: true, default: null },
  since : {type : String , required : true },
  industerytype: { type: Schema.Types.ObjectId, required: true , ref : 'categories'},
  userType: { type: String, default: "Business" }, // "Individual/startup", "Company", "admin"
  // username: { type: String, default: null },
   // companyDetailsId: { type: Schema.Types.ObjectId, default: null }, // Reference to companyDetails document, if userType is "Company"
  // userDetailsId: { type: Schema.Types.ObjectId, default: null }, // Reference to userDetails document, if userType is "Individual/startup"
  createdAt: { type: Date, default : null},
}, {timestamps : true});

module.exports = mongoose.model("Businessuser", Businessuser);

