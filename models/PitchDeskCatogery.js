const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PitchDeskSchema = new Schema({
  name: { type: String, required: true },
  
  
}, {timestamps : true});

module.exports = mongoose.model("pitchcategories", PitchDeskSchema);