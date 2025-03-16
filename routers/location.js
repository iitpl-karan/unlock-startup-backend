const express = require("express");
const router = express.Router();

const locationController = require("../controllers/location");

router.get("/get-all-locations", locationController.getAllLocations);
router.post("/add-new-location", locationController.newLocation);
router.patch("/toggle-status", locationController.toggleStatus);
router.patch("/update-location-details", locationController.updateLocationDetails);
router.delete("/delete-location", locationController.deleteLocation);

module.exports = router;
