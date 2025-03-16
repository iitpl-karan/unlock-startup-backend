const express = require("express");
const router = express.Router();


const Razorpaycontroller = require("../controllers/razorpay");




router.get("/response", Razorpaycontroller.RazorpayResponse);


module.exports = router;
