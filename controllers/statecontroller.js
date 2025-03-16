
const mongoose = require("mongoose");
const Statemodel = require("../models/statemodel");



exports.getAllStates = async (req, res) => {
    try {
      const states = await Statemodel.find().populate('country_id');
      res.status(200).json({
        success: true,
        data: states
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
  