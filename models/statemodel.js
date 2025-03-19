const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
    id: {
        type: Number,
    },
    country_id: { 
        type: mongoose.Types.ObjectId, 
        ref: 'Country' 
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




const State = mongoose.model('State', stateSchema);
module.exports = State;