const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
    id: {
        type: Number,
    },
    name: {
        type: String
    },

    latitude: {
        type: String
    },
    longitude: {
        type: String
    },
    status: { 
        type: String, 
        default: 'active', enum: ['active', 'inactive'] 
    },
    is_deleted: { 
        type: Boolean, 
        default: false 
    },
}, { timestamps: true });




const Country = mongoose.model('Country', countrySchema);
module.exports = Country;