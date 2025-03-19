const express = require("express");
const router = express.Router();
const Pricecontroller = require("../controllers/Pricecontroller");


router.get("/get-all-prizes", Pricecontroller.getAllPrice);




module.exports = router;
