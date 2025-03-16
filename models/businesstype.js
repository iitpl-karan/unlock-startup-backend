const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Businesstype = new Schema({

    name: { type: String, required: true, default: null },
 
}, {timestamps : true});

module.exports = mongoose.model("Businesstype", Businesstype);

