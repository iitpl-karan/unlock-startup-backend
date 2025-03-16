const Locations = require('../models/locationModel')

exports.getAllLocations = async (req, res) => {
    try {
        const result = await Locations.find()
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}



exports.newLocation = async (req, res) => {
    try {
        const { name, slug , isAdmin } = req.body;

        if (isAdmin === true || isAdmin === 'true') {
            const isLocationExist = await Locations.findOne({ slug });
            if (isLocationExist) {
                return res.status(409).json({
                    message: "Location already exist"
                })
            }

            const newLocation = new Locations({
                name,
                slug,
                // createdAt: currentDate
            })
            const result = await newLocation.save()
            return res.status(200).json({
                message: 'New Location has been added',
                data: result
            })
        } else {
       
           return res.status(403).json({
                message: "Unauthorized User",
             
            });
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}


exports.updateLocationDetails = async (req, res) => {
    try {
        const { id, name, slug, isAdmin } = req.body;

        if (isAdmin === true || isAdmin === 'true') {
            const updateData = {};
            if (name) updateData.name = name;
            if (slug) updateData.slug = slug;

            const updatedChallenge = await Locations.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            );

            if (updatedChallenge) {
                res.status(200).json({
                    message: "Location details have been updated",
                    data: updatedChallenge,
                });
            } else {
                res.status(404).json({
                    message: "Location not found",
                });
            }
        } else {
            res.status(403).json({
                message: "Unauthorized User",
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
}

exports.toggleStatus = async (req, res) => {
    const { id, status, isAdmin } = req.body
    try {
        if (isAdmin === true || isAdmin === 'true') {
            const result = await Locations.findByIdAndUpdate(
                id,
                { status },
                { new: true }
            )
            res.status(200).json({
                message: 'Status has been updated',
                data: result
            })
        } else {
            res.status(403).json({
                message: "Unauthorized User",
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

exports.deleteLocation = async (req, res) => {
    const { id, isAdmin } = req.body
    try {
        if (isAdmin === true || isAdmin === 'true') {
            const result = await Locations.findByIdAndDelete(id)
            res.status(200).json({
                message: 'Location has been deleted',
            })
        } else {
            res.status(403).json({
                message: "Unauthorized User",
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}