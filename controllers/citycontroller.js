
const mongoose = require("mongoose");
const Citymodel = require("../models/citymodel");



exports.getCitiesByStateId = async (req, res) => {
  try {
      const stateId = req.params.stateId;

      if (!stateId) {
          return res.status(400).json({
              success: false,
              message: 'State ID is required'
          });
      }

      const cities = await Citymodel.find({ state_id: stateId, is_deleted: false });

      res.status(200).json({
          success: true,
          data: cities
      });
  } catch (error) {
      res.status(500).json({
          success: false,
          message: error.message
      });
  }
};
  