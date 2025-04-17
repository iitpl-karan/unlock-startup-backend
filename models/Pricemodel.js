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
    pitchSubmissionPrice: {
        type: Number,
        default: 300, // Default price for pitch submission
    },
    pitchGST: {
        type: Number,
        default: 18, // Default GST percentage for pitch submission
    },
    investorSubscriptionPlans: [{
        type: Schema.Types.ObjectId,
        ref: 'SubscriptionPlan'
    }],
    date: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model("price", PriceSchema);


