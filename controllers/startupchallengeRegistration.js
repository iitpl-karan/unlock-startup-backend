const StartupChallengeRegistration = require("../models/startupchallengeRegistrationModel");
const Payment = require("../models/Payment");

// import Payment from '../models/Payment.js';

const mongoose = require("mongoose");
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpayInstance = new Razorpay({
  key_id: 'rzp_test_LZNdRPjCpALttI', // Replace with your Razorpay Key ID
  key_secret: process.env.key_secret, // Replace with your Razorpay Secret Key
});


// const razorpayInstance = new Razorpay({
//   key_id: ({}).RAZORPAY_KEY_ID,
//   key_secret: ({}).RAZORPAY_SECRET,
// });

exports.StartupChallengeRegistrationController = async (req, res) => {


  const razorpay = new Razorpay({
    key_id: 'rzp_test_LZNdRPjCpALttI', // Replace with your Razorpay Key ID
    key_secret: process.env.key_secret, // Replace with your Razorpay Secret Key
  });


  const {

    name,
    personname,
    address,
    birth,
    jobtitle,
    companyaddress,
    email,
    userId,


    panNumber,
    contactno,
    companyname,
    gst,
    // eventType,
    paymentAmount,
    registrationStatus,



    challengeId,

  } = req.body;

  console.log(req.body);
  console.log(req.files);

  // Handle file uploads
  if (!req.files) {
    return res.status(400).json({ message: "File is required" });
  }
  const attachment = req.files.attachment[0].filename;





  try {

    // Check if the user has already registered for the same challenge
    const existingRegistration = await StartupChallengeRegistration.findOne({ userId, challengeId, });

    if (existingRegistration) {
      return res.status(400).json({ message: "You have already registered for this challenge" });
    }





    // Create new startup challenge registration
    const ChallengeRegistration = new StartupChallengeRegistration({

      name,
      personname,
      address,
      birth,
      jobtitle,
      companyaddress,
      email,
      userId,
      attachment,
      panNumber,
      contactno,
      companyname,
      gst,
      // eventType,
      paymentAmount,
      registrationStatus,
      challengeId,
    });

    // Save new startup challenge
    const savedChallenge = await ChallengeRegistration.save();

    return res.status(201).json({
      message: "You have been successfully registered for the Challenge.",
      data: savedChallenge,
    });
  } catch (error) {
    console.error("Error registering for challenge", error);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};





exports.UserChallengeRegistration = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { userid } = req.query; // Get the user ID from the request query


    const registrations = await StartupChallengeRegistration.find({})
      .populate('userId')
      .populate({
        path: 'challengeId',
        populate: {
          path: 'category postedBy state city'
        }
      });

    // Filter registrations based on postedBy._id
    const filteredRegistrations = registrations.filter((registration) =>
      registration.userId._id == userid
    );




    // Check if there are any filtered results
    const totalData = filteredRegistrations.length;
    if (totalData === 0) {
      return res.status(404).json({
        message: "No registrations found for the specified user",
      });
    }

    // Calculate total pages based on limit
    const totalPages = Math.ceil(totalData / limit);

    // Get paginated results
    const paginatedResults = filteredRegistrations.slice(skip, skip + limit);

    // Respond with paginated results
    return res.status(200).json({
      data: filteredRegistrations,
      meta_data: {
        total_data: totalPages,
        current_page: page,
        data_limit: limit,
        total_pages: totalPages,
      },
    });

  } catch (error) {
    console.error("Error fetching registrations", error);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};


exports.GetAllRegistrationsPagination = async (req, res) => {
  try {
    // Extract pagination parameters from query (default to page 1 and limit 10)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { userid } = req.query; // Get the user ID from the request query

    // const userid = '66f0e7bdb860d180abeb08e2';

    // Fetch all registrations and populate necessary fields
    const registrations = await StartupChallengeRegistration.find({})
      .populate('userId')
      .populate({
        path: 'challengeId',
        populate: {
          path: 'category postedBy state city'
        }
      });

    // Filter registrations based on postedBy._id
    const filteredRegistrations = registrations.filter((registration) =>
      registration.challengeId?.postedBy?._id.toString() === userid
    );

    // Check if there are any filtered results
    const totalData = filteredRegistrations.length;
    if (totalData === 0) {
      return res.status(404).json({
        message: "No registrations found for the specified user",
        registrations
      });
    }

    // Calculate total pages based on limit
    const totalPages = Math.ceil(totalData / limit);

    // Get paginated results
    const paginatedResults = filteredRegistrations.slice(skip, skip + limit);

    // Respond with paginated results
    return res.status(200).json({
      data: registrations,
      meta_data: {
        total_data: totalPages,
        current_page: page,
        data_limit: limit,
        total_pages: totalPages,
      },
    });

  } catch (error) {
    console.error("Error fetching registrations", error);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};



exports.GetAllRegistrationsController = async (req, res) => {

  try {
    const registrations = await StartupChallengeRegistration.find()
      .populate('userId')
      // .populate('challengeId')
      .populate({
        path: 'challengeId',
        populate: {
          path: 'category postedBy state city'
        },

      });


    if (!registrations || registrations.length === 0) {
      return res.status(404).json({ message: "No registrations found" });
    }

    return res.status(200).json({
      message: "All registrations fetched successfully",
      data: registrations,
    });
  } catch (error) {
    console.error("Error fetching registrations", error);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};


exports.Order = async (req, res) => {

  const { amount } = req.body;

  try {
    const options = {
      amount: Number(amount * 100),
      currency: "INR",
      receipt: crypto.randomBytes(10).toString("hex"),
    }

    razorpayInstance.orders.create(options, (error, order) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: "Something Went Wrong!" });
      }
      res.status(200).json({ data: order });
      console.log(order)
    });

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error!" });
    console.log(error);
  }
}


exports.Verify = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    // Create ExpectedSign
    const expectedSign = crypto.createHmac("sha256", process.env.key_secret)
      .update(sign.toString())
      .digest("hex");

    // console.log(razorpay_signature === expectedSign);

    // Create isAuthentic
    const isAuthentic = expectedSign === razorpay_signature;

    // Condition 
    if (isAuthentic) {
      const payment = new Payment({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      });

      // Save Payment 
      await payment.save();

      // Send Message 
      res.json({
        message: "Payement Successfully"
      });
    }

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error!" });
    console.log(error);
  }
}


