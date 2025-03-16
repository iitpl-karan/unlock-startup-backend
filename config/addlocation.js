const fs = require('fs');
const Country = require('../models/country');
const State = require('../models/statemodel');
const City = require('../models/citymodel');

// Load the JSON file
// const data = JSON.parse(fs.readFileSync('./location/india.json', 'utf8'));
const data = JSON.parse(fs.readFileSync('./utils/india.json', 'utf8'));

async function saveData() {
  // const countries = [];
  // const states = [];
  // const cities = [];

  let country, state, city;

  // Extract and organize the data
  data.forEach(async (countryItem) => {
    const localCountry = {
      name: countryItem.name,
      id: countryItem.id,
      latitude: countryItem.latitude,
      longitude: countryItem.longitude,
    };
    // countries.push(country);
    country = await Country.create(localCountry)

    countryItem.states.forEach(async (stateItem) => {
      const localState = {
        id: stateItem.id,
        name: stateItem.name,
        country_id: country._id,
        type: stateItem.type,
        latitude: stateItem.latitude,
        longitude: stateItem.longitude,
      };
      // states.push(state);
      state = await State.create(localState);

      stateItem.cities.forEach(async (cityItem) => {
        const localCity = {
          id: cityItem.id,
          country_id: country._id,
          state_id: state._id, // Correctly set stateid from stateItem.id
          name: cityItem.name,
          latitude: cityItem.latitude,
          longitude: cityItem.longitude,
        };
        // cities.push(city);
        city = await City.create(localCity)
      });
    });
  });

  // Save the data to the database
  // await Country.insertMany(countries);
  // await State.insertMany(states);
  // await City.insertMany(cities);

  console.log('Data saved successfully');
}

// Call the function to save data
// saveData()

module.exports = saveData;
