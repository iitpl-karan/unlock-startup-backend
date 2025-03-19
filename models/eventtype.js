const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Eventsype = new Schema({

    name: { type: String, required: true, default: null },
 
}, {timestamps : true});

module.exports = mongoose.model("eventype", Eventsype);

