const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PriceSchema = new Schema({

    PrimiumChallegeprize: {
        type: Number,
    },
    EventPrize: {
        type: Number,
    },
    StartupChallegeprize: {
        type: Number,
    },
    Tax: {
        type: Number,
    },
    date: {
        type: Date,
        default: Date.now
    },
});



module.exports = mongoose.model("price", PriceSchema);


