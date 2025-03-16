// models.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// City Schema
const CitySchema = new Schema({
    name: { type: String, required: true }
});

// State Schema
const StateSchema = new Schema({
    name: { type: String, required: true },
    cities: [CitySchema]
});

// Country Schema
const CountrySchema = new Schema({
    name: { type: String, required: true },
    states: [StateSchema]
});

const Country = mongoose.model('Country', CountrySchema);
const State = mongoose.model('State', StateSchema);
const City = mongoose.model('City', CitySchema);

module.exports = { Country, State, City };
