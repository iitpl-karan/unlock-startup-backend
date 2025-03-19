const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserDetailsSchema = new Schema({
  contactNo: { type: String, default : null },
  attachments: { type: Array , default : null },
  createdAt: { type: Date, default: Date.now() },
});

module.exports = mongoose.model("UserDetails", UserDetailsSchema);