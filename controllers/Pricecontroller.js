

const Pricemodel = require("../models/Pricemodel");

exports.getAllPrice = async (req, res) => {
    try {

        const result = await Pricemodel.find();
        return res.status(200).json(result);


    } catch (err) {
        console.log(err)
        res.status(500);
    }
};

