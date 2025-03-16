const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CompanyDetailsSchema = new Schema({
  address: { type: String, default : null },
  contactNo: { type: String, default : null },
  url: { type: String, default : null },
  gst: { type: String, default : null },
  logo: { type: String, default : null },
  cin: { type: String, default : null },
  // industerytype: { type: Schema.Types.ObjectId,  ref : 'categories' , default : null} ,
  type: { type: Schema.Types.ObjectId,  ref : 'Businesstype' , default : null} ,
  // industerytype: { type: Schema.Types.ObjectId,  ref : 'categories' , default : null} ,




  category : { type: Schema.Types.ObjectId,  ref : 'categories' , default : null} ,
  companyname : { type: String, default : null },
  since : {type : Number ,  },
  attachments: { type: Array, default : null },
  createdAt: { type: Date, default: Date.now() },
  
});

module.exports = mongoose.model("CompanyDetails", CompanyDetailsSchema);