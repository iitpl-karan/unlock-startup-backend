const Location = require('../../../models/location');



// Get all locations
exports.getAllLocations = async (req, res) => {

    try {
        const locations = await Location.find({})
            // .populate('country' , 'name')
            // .populate('state' , 'name')
            // .populate('city' , 'name');
        res.status(200).json({ data : locations});
    } catch (error) {
        res.status(500).send(error);
    }
};

// Get a single location by ID



exports.getLocationById = async (req, res) => {
    try {
        const location = await Location.findById(req.params.id)
            .populate('country')
            .populate('state')
            .populate('city');
        if (!location) {
            return res.status(404).send();
        }
        res.status(200).send(location);
    } catch (error) {
        res.status(500).send(error);
    }
};


