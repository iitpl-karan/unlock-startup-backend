const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UsersSchema = new Schema({
  name: { type: String, required: true , default : null},
  username: { type: String, default: null },
  email: { type: String, required: true },
  password: { type: String, required: true , default : null},
  image: {type: String , default : null },
  userType: { type: String, enum: ['Individual', 'Startup'], require : true }, 
//   companyDetailsId: { type: Schema.Types.ObjectId, default: null }, // Reference to companyDetails document, if userType is "Company"
//   userDetailsId: { type: Schema.Types.ObjectId, default: null }, // Reference to userDetails document, if userType is "Individual/startup"
  createdAt: { type: Date, default : null},
});

module.exports = mongoose.model("Normaluser", UsersSchema);



// if (userType === "" || userType === "") {