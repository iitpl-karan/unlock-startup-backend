const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LocationSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  status: {type: Number, default : 1},
  // createdAt: { type: Date },
},{timestamps : true});

module.exports = mongoose.model("location", LocationSchema);