const EventRegistration = require("../models/eventRegistration");
const mongoose = require("mongoose");

exports.EventRegistrationController = async (req, res) => {
  const {
    name,
    personname,
    address,
    birth,
    jobtitle,

    companyaddress,
    email,
    userId,
    eventId,
    panNumber,
    contactno,
    companyname,
    gst,
    // eventType,
    paymentAmount,
    registrationStatus,
  } = req.body;


  // Handle file uploads
  if (!req.files) {
    return res.status(400).json({ message: "File is required" });
  }

  const attachment = req.files.attachment[0].filename;




  try {
    // Check if the user has already registered for the same challenge
    const existingRegistration = await EventRegistration.findOne({
      userId,
      eventId,
    });

    if (existingRegistration) {
      return res.status(400).json({ message: "You have Already Registered For This Event" });
    }

    // Create new startup challenge registration
    const ChallengeRegistration = new EventRegistration({
      name,
      personname,
      address,
      birth,
      jobtitle,
      email,
      userId,
      attachment,
      companyaddress,
      eventId,
      panNumber,
      contactno,
      companyname,
      gst,
      // eventType,
      paymentAmount,
      registrationStatus,
    });

    // Save new startup challenge
    const savedChallenge = await ChallengeRegistration.save();

    return res.status(201).json({
      message: "You have been successfully registered for the event.",
      data: savedChallenge,
    });
  } catch (error) {
    console.error("Error registering for challenge", error);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};


exports.GetEventRegistrationController = async (req, res) => {
  try {
    const registrations = await EventRegistration.find()
      .populate('userId')
      .populate({
        path: 'eventId',
        populate: {
          path: 'category postedBy state city'
        }
      })

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



exports.GetEventRegistrationControllerUser = async (req, res) => {
  try {
    const { userid } = req.query; // Get the user ID from the request query
    const page = parseInt(req.query.page, 10) || 1; // Get the current page from the query
    const limit = parseInt(req.query.limit, 10) || 10; // Get the limit of items per page
    const skip = (page - 1) * limit; // Calculate how many items to skip

    // Fetch all registrations
    const registrations = await EventRegistration.find({})
      .populate('userId')
      .populate({
        path: 'eventId',
        populate: {
          path: 'category postedBy state city'
        }
      });

    // Filter registrations based on the postedBy user ID
    const filteredRegistrations = registrations.filter((registration) =>
      registration.eventId?.postedBy?._id.toString() === userid
    );

    // Apply pagination to filtered registrations
    const paginatedRegistrations = filteredRegistrations.slice(skip, skip + limit);

    // Check if there are any filtered results
    if (paginatedRegistrations.length === 0) {
      return res.status(404).json({ message: "No registrations found for the specified user" });
    }

    // Calculate total count for pagination
    const totalRegistrations = filteredRegistrations.length; // Count the filtered registrations
    const totalPages = Math.ceil(totalRegistrations / limit); // Calculate total pages

    return res.status(200).json({
      message: "Filtered registrations fetched successfully",
      data: paginatedRegistrations,
      meta_data: {
        total_data: totalRegistrations,
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


exports.GetUserParticipatedEvent = async (req, res) => {
  try {
    const { userid } = req.query; // Get the user ID from the request query
    const page = parseInt(req.query.page, 10) || 1; // Get the current page from the query
    const limit = parseInt(req.query.limit, 10) || 10; // Get the limit of items per page
    const skip = (page - 1) * limit; // Calculate how many items to skip

    // Fetch all registrations
    const registrations = await EventRegistration.find({})
      .populate('userId')
      .populate({
        path: 'eventId',
        populate: {
          path: 'category postedBy state city'
        }
      });

    // Filter registrations based on the postedBy user ID
    const filteredRegistrations = registrations.filter((registration) =>
      // registration.eventId?.postedBy?._id.toString() === userid

    registration.userId._id == userid
    );

    // Apply pagination to filtered registrations
    const paginatedRegistrations = filteredRegistrations.slice(skip, skip + limit);

    // Check if there are any filtered results
    if (paginatedRegistrations.length === 0) {
      return res.status(404).json({ message: "No registrations found for the specified user" });
    }

    // Calculate total count for pagination
    const totalRegistrations = filteredRegistrations.length; // Count the filtered registrations
    const totalPages = Math.ceil(totalRegistrations / limit); // Calculate total pages

    return res.status(200).json({
      message: "Filtered registrations fetched successfully",
      data: paginatedRegistrations,
      meta_data: {
        total_data: totalRegistrations,
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
