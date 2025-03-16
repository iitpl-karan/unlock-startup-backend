const express = require("express");


const router = express.Router();

const citycontroller = require("../controllers/citycontroller.js");


router.get("/by-state/:stateId" , citycontroller.getCitiesByStateId );

module.exports = router;





