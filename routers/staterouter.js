const express = require("express");


const router = express.Router();

const statecontroller = require("../controllers/statecontroller.js");


router.get("/get-all-state",statecontroller.getAllStates );

module.exports = router;





