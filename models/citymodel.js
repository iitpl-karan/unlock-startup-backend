const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
    id: {
        type: Number,
    },
    country_id: { 
        type: mongoose.Types.ObjectId, 
        ref: 'Country' 
    },
    state_id: { 
        type: mongoose.Types.ObjectId, 
        ref: 'State' 
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




const City = mongoose.model('City', citySchema);
module.exports = City;