const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GeneralSettingsSchema = new Schema({
    sitetitle: {
        type: String,
    },
    slogan: {
        type: String,
    },
    logo: {
        type: String,
    },
    favicon: {
        type: String,
    },
    adminemail: {
        type: String,
    },
    admincontactno: {
        type: Number,
    },
    timezone: {
        type: String,
    },
    whatsappno: {
        type: Number,
    },
    facebookurl: {
        type: String,
        required: true
    },
    instagramurl: {
        type: String,
    },
    twitterurl: {
        type: String,
    },
    linkedinurl: {
        type: String,
    },
    address: {
        type: String,
    },
    cin: {
        type: String,
    },

    gst: {
        type: String,
    },


    pin: {
        type: Number,
    },


    priceId: {
        type: String,

        ref: 'price'
    },
    currency: {
        type: String,
    }
}, { timestamps: true });

module.exports = mongoose.model("GeneralSetting", GeneralSettingsSchema);


