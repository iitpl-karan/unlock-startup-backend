const StartupChallenges = require("../models/startupChallengesModel");
const City = require("../models/citymodel");

const axios = require('axios')
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ChangeLog = require('../models/ChangeLog');
const { ObjectId } = require('bson');
const { populate } = require("../models/eventsModel");
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Payment = require("../models/Payment");
const registerchallenges = require("../models/uploadchallengespayment");
const State = require("../models/statemodel");
const User = require("../models/usersModel");
const nodemailer = require('nodemailer');
const { log } = require("console");



const razorpayInstance = new Razorpay({
  key_id: process.env.key_id, // Replace with your Razorpay Key ID
  key_secret: process.env.key_secret, // Replace with your Razorpay Secret Key
});


const generateRandomId = () => {
  // Generate a random number between 100000 and 999999 (inclusive)
  const randomNumber = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
  // Concatenate "USC" with the random number
  return `USC${randomNumber}`;
};

exports.createStartupChallenge = async (req, res) => {
  try {
    const {
      challengeName,
      challengeDetails,
      address,
      guidelines,
      category,
      challengeDate,
      slugname,
      registrationStartDate,
      registrationEndDate,
      registrationlink,
      resultDate,
      charges,
      type,
      registrationFee,
      whoCanParticipate,
      isAdmin,
      userid,
      currentDate,
      organizername,
      organizernumber,
      organizeremail,
      city,
      state,
      organizerwebsite,
      pincode,
      video_url1,
      video_url2

    } = req.body;


    // Validate required fields
    if (!challengeName || !challengeDetails || !category || !slugname ||
      !registrationStartDate || !registrationEndDate || !resultDate || !type ||
      !whoCanParticipate || !currentDate || !city || !state || !address || !pincode || !organizerwebsite || !organizeremail || !organizername


    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if challenge with the same slug exists
    // const isChallengeExist = await StartupChallenges.findOne({ slug: slugname });
    // if (isChallengeExist) {
    //   return res.status(409).json({ message: "Startup Challenge already exists" });s
    // }

    // Handle file uploads
    if (!req.files || !req.files.thumbnailImage || !req.files.bannerImage
    ) {
      return res.status(400).json({ message: "Thumbnail, banner images, and two PDF documents are required" });
    }

    const thumbnailImage = req.files.thumbnailImage[0].filename;
    const bannerImage = req.files.bannerImage[0].filename;

    let filesArray;
    if (req.files?.attachments) filesArray = req.files.attachments.map(file => file.filename);


    // const document1 = req.files.document1[0].filename;
    // const document2 = req.files.document2[0].filename;

    // Determine postedBy value
    let postedBy;
    if (isAdmin === true || isAdmin === 'true') {
      postedBy = "admin";
    } else {
      if (!mongoose.Types.ObjectId.isValid(userid)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      postedBy = userid;
    }


    const challengeId = generateRandomId();

    // Transform whoCanParticipate
    let transformedWhoCanParticipate = [];
    if (whoCanParticipate) {
      transformedWhoCanParticipate = whoCanParticipate.split(',').map(value => value.trim()); // Split and trim values
    }

    // Create new startup challenge
    const newStartupChallenge = new StartupChallenges({
      challengeId,
      challengeName,
      challengeDetails,
      thumbnailImage,
      bannerImage,
      // document1,
      // document2,
      organizername,
      organizernumber,
      guidelines,
      organizeremail,
      organizerwebsite,
      address,
      category,
      attachments: filesArray,
      charges,
      city,
      state,
      challengeDate,
      postedBy,
      slug: slugname,
      registrationStartDate,
      registrationEndDate,
      registrationlink,
      resultDate,
      pincode,
      type,
      registrationFee,
      whoCanParticipate: transformedWhoCanParticipate,
      video_url1,
      video_url2
    });

    // Save new startup challenge
    const savedChallenge = await newStartupChallenge.save();

    let userinfo = await User.findById(postedBy)


    let usernameee = userinfo?.userDetailsId?.companyname || 'Company'
    let useremaill = userinfo?.email


    let transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      // Use 'gmail' or other services
      port: 587,
      secure: false,
      auth: {
        user: 'info@unlockstartup.com', // Your email
        pass: 'Z2q^Hoj>K4', // Your email password
      },
    });


    const mailOptions = {
      from: 'info@unlockstartup.com', // sender address
      to: 'info@unlockstartup.com',
      subject: `New Challenge Created By -  ${usernameee}`,
      text: `One New Challenge has been Craeted By - ${usernameee} Challenge ID - ${challengeId}.`,
    };

    const mailOptions1 = {
      from: 'info@unlockstartup.com', // sender address
      to: useremaill, // recipient's email address
      subject: 'Challenge Created Successfully',
      html: `
        <p>Your challenge <strong>${challengeName}</strong> (ID: <strong>${challengeId}</strong>) has been created. Please wait for confirmation. It will be confirmed within 24 hours, after which you can proceed with the payment.</p>
        <br>


                        <img src="https://unlockstartup.com/unlock/uploads/Logo.png" alt="" />

            <p style="margin-top: 20px;">Best Regards,<br>
            Unlock Startup<br>
            Email: <a href="contact@unlockstartup.com">contact@unlockstartup.com</a><br>
            Mobile: +919266733959</p><br>

      `,
    };
    if (savedChallenge) {

      res.status(201).json({
        message: "Startup challenge created successfully",
        data: savedChallenge,
      });

      const info1 = await transporter.sendMail(mailOptions);
      const info2 = await transporter.sendMail(mailOptions1);

    } else {
      return res.status(500).json({ error: "Unable to create startup challenge" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.uploadresult = async (req, res) => {
  try {
    const { userid, currentResultdate, id, resultdescription } = req.body;

    const startupChallenge = await StartupChallenges.findById(id);

    if (startupChallenge) {
      const updateData = {
        resultstatus: 1 // Set resultstatus to 1
      };

      if (currentResultdate) updateData.currentResultdate = currentResultdate;
      if (resultdescription) updateData.resultdescription = resultdescription;


      if (req.files && req.files.resultattachment) {
        updateData.resultattachment = req.files.resultattachment[0].filename;
      }

      const updatedChallenge = await StartupChallenges.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

      const oldChallenge = startupChallenge.toObject();

      if (updatedChallenge) {
        const newChallenge = updatedChallenge.toObject();

        const changes = {};
        Object.keys(updateData).forEach(key => {
          if (oldChallenge[key] !== newChallenge[key]) {
            changes[key] = {
              old: oldChallenge[key],
              new: newChallenge[key]
            };
          }
        });

        if (Object.keys(changes).length > 0) {
          await ChangeLog.create({
            model: 'StartupChallenges',
            recordId: id,
            changes,
          });
        }

        res.status(200).json({
          message: " Challenge Result have been updated",
          data: updatedChallenge,
        });
      } else {
        res.status(404).json({
          message: "Startup challenge not found",
        });
      }
    } else {
      res.status(403).json({
        message: "Unauthorized User",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};



// exports.uploadresult = async (req, res) => {
//   try {
//     const { userid , resultDate} = req.body;



//     const startupChallenges = await StartupChallenges.find({ postedBy: userid });




//     if (!req.files || !req.files.resultattachment) {
//       return res.status(400).json({ message: "Result attachment is required" });
//     }

//     const resultattachment = req.files.resultattachment[0].filename;

//     // let postedBy;
//     // if (req.body.isAdmin === true || req.body.isAdmin === 'true') {
//     //   postedBy = "admin";
//     // } else {
//     //   if (!mongoose.Types.ObjectId.isValid(userid)) {
//     //     return res.status(400).json({ message: "Invalid user ID" });
//     //   }
//     //   postedBy = userid;
//     // }

//     const newStartupChallenge = new StartupChallenges({
//       resultattachment: resultattachment,
//       resultDate,
//       resultstatus: 1, 
//       // postedBy: postedBy,
//     });

//     const savedChallenge = await newStartupChallenge.save();

//     if (savedChallenge) {
//       return res.status(201).json({
//         message: "Challenge Result Uploaded successfully",
//         data: savedChallenge,
//       });
//     } else {
//       return res.status(500).json({ error: "Unable to upload result successfully" });
//     }
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// };




// exports.getAllStartUpChallenges = async (req, res) => {
//   try {
//     const startupChallenges = await StartupChallenges.find({}).populate('category' );

//     const userDetailPromises = startupChallenges.map((challenge) => {
//       if (challenge.postedBy === "admin") {
//         return Promise.resolve({ data: "admin" });
//       } else {
//         return axios.get("/api/users/get-particular-user", {
//           params: {
//             userId: challenge.postedBy,
//           },
//         });
//       }
//     });

//     const userDetailResponses = await Promise.all(userDetailPromises);

//     const userData = userDetailResponses.map((response) => response.data);

//     const challengesWithUserDetails = startupChallenges.map((challenge, index) => {
//       const challengeObj = challenge.toObject();
//       return {
//         ...challengeObj,
//         postedBy: userData[index],

//       };
//     });

//     res.status(200).json(challengesWithUserDetails);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };




exports.getAllStartUpChallenges = async (req, res) => {
  try {
    const startupChallenges = await StartupChallenges.find({ status: 1, paymentStatus: 1, resultstatus: 0, isDeleted: false, expireDate: { $gt: new Date() } }).populate('category postedBy state city')
    res.status(200).json(startupChallenges);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.Postedresult = async (req, res) => {
  try {
    const startupChallenges = await StartupChallenges.find({ resultstatus: 1, isDeleted: false, isDeletedAdmin: false }).populate('category postedBy state city')
    res.status(200).json(startupChallenges);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.DetailsPostedresult = async (req, res) => {
  try {
    const startupChallenges = await StartupChallenges.find({ resultstatus: 1 }).populate('category postedBy state city')
    res.status(200).json(startupChallenges);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getUserChallengeswithpagination = async (req, res) => {
  try {

    let { page, limit } = req.query;

    page = page ? parseInt(page) : 1;
    limit = limit ? parseInt(limit) : 10;
    const userid = req.query.userid; // Retrieve userid from query parameters

    const skip = (page - 1) * limit;

    const startupChallenges = await StartupChallenges.find({ postedBy: userid, isDeleted: false })
      .populate('category postedBy state city')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    const totalChallenges = await StartupChallenges.countDocuments({ postedBy: userid });

    res.status(200).json({
      data: startupChallenges,
      meta_data: {
        total_data: totalChallenges,
        current_page: page,
        data_limit: limit,
        total_pages: Math.ceil(totalChallenges / limit),
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.getUserUploadresultwithpagination = async (req, res) => {
  try {

    let { page, limit } = req.query;

    page = page ? parseInt(page) : 1;
    limit = limit ? parseInt(limit) : 10;
    const userid = req.query.userid; // Retrieve userid from query parameters

    const skip = (page - 1) * limit;

    const startupChallenges = await StartupChallenges.find({ postedBy: userid, paymentStatus: 1, status: 1, isDeleted: false })
      .populate('category postedBy state city')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    const totalChallenges = await StartupChallenges.countDocuments({ postedBy: userid, paymentStatus: 1, status: 1, isDeleted: false });

    res.status(200).json({
      data: startupChallenges,
      meta_data: {
        total_data: totalChallenges,
        current_page: page,
        data_limit: limit,
        total_pages: Math.ceil(totalChallenges / limit),
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAdminUploadresultwithpagination = async (req, res) => {
  try {

    let { page, limit } = req.query;

    page = page ? parseInt(page) : 1;
    limit = limit ? parseInt(limit) : 10;
    const userid = req.query.userid; // Retrieve userid from query parameters

    const skip = (page - 1) * limit;

    const startupChallenges = await StartupChallenges.find({ paymentStatus: 1, status: 1,  })
      .populate('category postedBy state city')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    const totalChallenges = await StartupChallenges.countDocuments({ paymentStatus: 1, status: 1,  });

    res.status(200).json({
      data: startupChallenges,
      meta_data: {
        total_data: totalChallenges,
        current_page: page,
        data_limit: limit,
        total_pages: Math.ceil(totalChallenges / limit),
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAllChallengeswithpagination = async (req, res) => {
  try {

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const skip = (page - 1) * limit;

    const startupChallenges = await StartupChallenges.find({ isDeletedAdmin: false })
      .populate('category postedBy state city')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })


    const totalChallenges = await StartupChallenges.countDocuments({});

    res.status(200).json({
      data: startupChallenges,
      meta_data: {
        total_data: totalChallenges,
        current_page: page,
        data_limit: limit,
        total_pages: Math.ceil(totalChallenges / limit),
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAllStartUpChallengesFilter = async (req, res) => {
  try {
    let { whoCanParticipate, category, month, city } = req.body;

    let conditionObj = {

      paymentStatus: 1,
      status: 1,
      resultstatus: 0,
      isDeleted: false,
      expireDate: { $gt: new Date() }
    };

    if (whoCanParticipate && Array.isArray(whoCanParticipate) && whoCanParticipate.length > 0) {
      conditionObj.whoCanParticipate = { $in: whoCanParticipate };
    }


    if (category) conditionObj.category = new ObjectId(category);
    if (city) conditionObj.state = new ObjectId(city);


    if (month && month >= 1 && month <= 12) {
      const startOfMonth = new Date(new Date().setUTCMonth(month - 1, 1));
      startOfMonth.setUTCHours(0, 0, 0, 0); // Start of the month (UTC)

      const endOfMonth = new Date(new Date().setUTCMonth(month, 0));
      endOfMonth.setUTCHours(23, 59, 59, 999); // End of the month (UTC)

      conditionObj.createdAt = {
        $gte: startOfMonth,
        $lt: endOfMonth
      };

    }

    const aggregationPipeline = [
      {
        $facet: {
          startupChallenges: [
            {
              $match: conditionObj
            },

            {
              $lookup: {
                from: "cities",
                localField: "city",
                foreignField: "_id",
                as: "city"
              }
            },
            { $unwind: "$city" },
            {
              $lookup: {
                from: "states",
                localField: "state",
                foreignField: "_id",
                as: "state"
              }
            },
            { $unwind: "$state" },

            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "category"
              }
            },
            { $unwind: "$category" },



            {
              $lookup: {
                from: "users",
                localField: "postedBy",
                foreignField: "_id",
                as: "postedBy"
              }
            },
            { $unwind: "$postedBy" },

          ],

        }
      }
    ];

    // Aggregate city data
    const aggregationResult = await StartupChallenges.aggregate(aggregationPipeline);
    let state = await State.find();


    let startupChallenges = aggregationResult[0].startupChallenges || [];
    // let cities = aggregationResult[0].cities[0].cities || [];

    res.status(200).json(
      {
        startupChallenges,
        cities: state,
        // startupChallenges,
        // cities: filteredCities,
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.getStartupChallengeDetails = async (req, res) => {
  try {
    const challengeId = req.query.id
    const isAdmin = req.query.isAdmin


    const startupChallenge = await StartupChallenges.findById(challengeId).populate('category state city')
      .populate({
        path: 'postedBy',
        populate: {
          path: 'companyDetailsId'
        },

      });
    if (!startupChallenge) {
      return res.status(404).json({ message: "Startup challenge not found" });
    }

    if (isAdmin === 'true' || isAdmin === true) {
      return res.status(200).json(startupChallenge)
    }

    const response = await axios.get("/api/users/get-particular-user", {
      params: {
        userId: startupChallenge.postedBy,
      },
    });

    if (response.status !== 200) {
      return res.status(500).json({ message: "Failed to fetch user details" });
    }

    const userData = response.data;

    const challengeDateFormatted = startupChallenge.challengeDate instanceof Date
      ? startupChallenge.challengeDate.toISOString().split('T')[0]
      : startupChallenge.challengeDate;

    // Merge the user details into the startup challenge object
    const challengeWithUserDetails = {
      ...startupChallenge.toObject(), // Convert the startupChallenge Mongoose document to a plain JavaScript object
      postedBy: userData,
      challengeDate: challengeDateFormatted
    };

    res.status(200).json(challengeWithUserDetails);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.updateStartupChallengeDetails = async (req, res) => {
  try {
    const {
      id,
      challengeName,
      challengeDetails,
      category,
      city,
      state,
      organizername,
      organizernumber,
      organizeremail,
      organizerwebsite,
      guidelines,
      slug,
      address,
      charges,
      registrationStartDate,
      registrationEndDate,
      registrationlink,
      resultDate,
      isAdmin,
      type,
      registrationFee,
      whoCanParticipate,
      pincode,
      currentDate,
      video_url1,
      video_url2
    } = req.body;


    const challenge = await StartupChallenges.findById(id);

    if (!challenge) {
      return res.status(404).json({
        message: "Startup challenge not found",
      });
    }

    // if (isAdmin === true || isAdmin === 'true' || challenge.postedBy === req.user._id) {
    if (isAdmin === true || isAdmin === 'true' || challenge.postedBy.toString() === req.user._id.toString()) {

      // Construct the update object with the fields to be updated
      const updateData = {};
      if (challengeName) updateData.challengeName = challengeName;

      if (challengeDetails) updateData.challengeDetails = challengeDetails;
      if (req.files.thumbnailImage) updateData.thumbnailImage = req.files.thumbnailImage[0].filename;
      if (req.files.bannerImage) updateData.bannerImage = req.files.bannerImage[0].filename;
      if (category) updateData.category = category;
      if (address) updateData.address = address;


      if (slug) updateData.slug = slug;
      if (registrationStartDate) updateData.registrationStartDate = registrationStartDate;
      if (registrationEndDate) updateData.registrationEndDate = registrationEndDate;
      if (resultDate) updateData.resultDate = resultDate;

      if (pincode) updateData.pincode = pincode;
      if (video_url1) updateData.video_url1 = video_url1;
      if (video_url2) updateData.video_url2 = video_url2;
      if (registrationlink) updateData.registrationlink = registrationlink;
      if (organizername) updateData.organizername = organizername;
      if (guidelines) updateData.guidelines = guidelines;
      if (charges) updateData.charges = charges;


      if (whoCanParticipate) updateData.whoCanParticipate = whoCanParticipate.split(',').map(value => value.trim()); // Split and trim values

      if (type) updateData.type = type;
      if (registrationFee) updateData.registrationFee = registrationFee;
      // if (whoCanParticipate) updateData.whoCanParticipate = whoCanParticipate;
      if (currentDate) updateData.updatedAt = currentDate;
      if (organizernumber) updateData.organizernumber = organizernumber;
      if (organizeremail) updateData.organizeremail = organizeremail;
      if (organizerwebsite) updateData.organizerwebsite = organizerwebsite;
      if (state) updateData.state = state;
      if (city) updateData.city = city;

      // if (req.files.document2) updateData.document2 = req.files.document2[0].filename;
      // if (req.files.document1) updateData.document1 = req.files.document1[0].filename;

      // let transformedWhoCanParticipate = [];
      // if (whoCanParticipate) {
      //   updateData.whoCanParticipate.split(',').map(value => value.trim()); // Split and trim values
      // }


      let imageArr = []
      if (req.files.attachments) {
        for (let i = 0; i < req.files.attachments.length; i++) {
          const element = req.files.attachments[i].filename;

          imageArr.push(element)
        }
        updateData.attachments = imageArr;

      }

      // Get the old data before updating
      const oldChallenge = challenge.toObject();



      updateData.status = 0;


      // Perform the update operation
      const updatedChallenge = await StartupChallenges.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

      if (updatedChallenge) {
        // Capture new data
        const newChallenge = updatedChallenge.toObject();

        // Determine changes
        const changes = {};
        Object.keys(updateData).forEach(key => {
          if (oldChallenge[key] !== newChallenge[key]) {
            changes[key] = {
              old: oldChallenge[key],
              new: newChallenge[key]
            };
          }
        });

        // Save changes to the Chgg                                                                                                       angeLog model only if there are changes
        if (Object.keys(changes).length > 0) {
          await ChangeLog.create({
            model: 'StartupChallenges',
            recordId: id,
            changes,
            // userId: req.user._id
          });
        }

        res.status(200).json({
          message: "Startup challenge details have been updated",
          data: updatedChallenge,
        });
      } else {
        res.status(404).json({
          message: "Startup challenge not found",
        });
      }
    } else {
      res.status(403).json({
        message: "Unauthorized User",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};


exports.updateStatusOfStartupChallenge = async (req, res) => {
  try {
    const { id, status, isAdmin } = req.body;
    const challenge = await StartupChallenges.findById(id);

    if (isAdmin === true || isAdmin === 'true' || challenge.postedBy === req.user._id) {
      const result = await StartupChallenges.findByIdAndUpdate(
        id,
        { status: parseInt(status) },
        { new: true }
      );

      if (result) {
        // Only send email if status is 1


        res.status(200).json({
          message: "Status has been changed",
        });


        if (parseInt(status) === 1) {
          const userid = challenge.postedBy;
          const Userinfo = await User.findById(userid);
          const useremail = Userinfo?.email;

          let transporter = nodemailer.createTransport({
            host: "smtp.hostinger.com",
            port: 587,
            secure: false,
            auth: {
              user: 'info@unlockstartup.com',
              pass: 'Z2q^Hoj>K4',
            },
          });

          const mailOptions = {
            from: 'info@unlockstartup.com',
            to: useremail,
            subject: 'Congratulations! Your request has been approved.',
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">
                <h2 style="color: #333;">Welcome to Unlock Startup</h2>
                <p>Dear Sir/Madam,</p>
                <p>Congratulations! Your request has been approved. We’re excited to move forward and post your content live.</p>
                <p>To finalize, please complete the payment process via your dashboard. Once the payment is confirmed, your post will go live!</p>
                <p>If you have any questions or need assistance, feel free to reach out.</p>
                <p>Thank you for choosing us!</p>
                <img src="https://unlockstartup.com/unlock/uploads/Logo.png" alt="" />
                <p style="margin-top: 20px;">Best Regards,<br>
                Unlock Startup<br>
                Email: <a href="mailto:contact@unlockstartup.com">contact@unlockstartup.com</a><br>
                Mobile: +919266733959</p><br>
              </div>
            `,
          };

          const info1 = await transporter.sendMail(mailOptions);
        }




      } else {
        return res.status(404).json({
          message: "Startup Challenge not found",
        });
      }
    } else {
      return res.status(403).json({
        message: "Unauthorized action",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}


exports.updatePaymentStatusOfStartupChallenge = async (req, res) => {
  try {
    const { id, paymentStatus, isAdmin } = req.body;

    const challenge = await StartupChallenges.findById(id);

    if (isAdmin === true || isAdmin === 'true' || challenge.postedBy === req.user._id) {

      const result = await StartupChallenges.findByIdAndUpdate(id, { paymentStatus: parseInt(paymentStatus) }, { new: true });

      if (result) {
        return res.status(200).json({
          message: "Payment Status has been changed",
        });
      } else {
        return res.status(404).json({
          message: "Startup Challenge not found",
        });
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}



exports.deleteStartupChallenge = async (req, res) => {
  try {
    const { id, isAdmin } = req.body;

    console.log(req.body)

    if (isAdmin === true || isAdmin === "true") {
      const deletedChallenge = await StartupChallenges.findByIdAndUpdate(
        id, { isDeleted: true }
      );

      if (!deletedChallenge) {
        return res.status(404).json({ error: "Startup challenge not found" });
      }

      res.status(200).json({ message: "Startup challenge deleted successfully" });
    } else {
      // Check if the user is authorized to update the event
      const userId = req.user ? req.user._id : null

      const challenge = await StartupChallenges.findById(id);


      if (userId.toString() !== challenge.postedBy.toString()) {
        // If user is not the creator of the event and not superadmin
        return res.status(403).json({ message: "Unauthorized User" });
      }

      // Find the startup challenge by ID and delete it
      // const deletedChallenge = await StartupChallenges.findByIdAndDelete(
      //   id
      // );

      const deletedChallenge = await StartupChallenges.findByIdAndUpdate(
        id, { isDeleted: true }
      );



      if (!deletedChallenge) {
        return res.status(404).json({ message: "Startup challenge not found" });
      }

      res.status(200).json({ message: "Startup challenge deleted successfully" });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



exports.deleteChallengeByAdmin = async (req, res) => {
  try {
    const { id, isAdmin } = req.body;

    console.log(req.body)

    if (isAdmin === true || isAdmin === "true") {
      const deletedChallenge = await StartupChallenges.findByIdAndUpdate(
        id, { isDeleted: true, isDeletedAdmin: true }
      );

      if (!deletedChallenge) {
        return res.status(404).json({ error: "Startup challenge not found" });
      }

      res.status(200).json({ message: "Startup challenge deleted successfully" });
    } else {
      // Check if the user is authorized to update the event
      const userId = req.user ? req.user._id : null

      const challenge = await StartupChallenges.findById(id);


      if (userId.toString() !== challenge.postedBy.toString()) {
        // If user is not the creator of the event and not superadmin
        return res.status(403).json({ message: "Unauthorized User" });
      }

      // Find the startup challenge by ID and delete it
      // const deletedChallenge = await StartupChallenges.findByIdAndDelete(
      //   id
      // );

      const deletedChallenge = await StartupChallenges.findByIdAndUpdate(
        id, { isDeleted: true, isDeletedAdmin: true }
      );



      if (!deletedChallenge) {
        return res.status(404).json({ message: "Startup challenge not found" });
      }

      res.status(200).json({ message: "Startup challenge deleted successfully" });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



exports.deleteResultAdminChallenge = async (req, res) => {
  try {
    const { id, isAdmin } = req.body;

    console.log(req.body)

    if (isAdmin === true || isAdmin === "true") {
      const deletedChallenge = await StartupChallenges.findByIdAndUpdate(
        // id, { isDeleted: true }
        id, { resultstatus: 0 , isDeleted: true }

      );

      if (!deletedChallenge) {
        return res.status(404).json({ error: "Startup challenge not found" });
      }

      res.status(200).json({ message: "Result deleted successfully" });
    } else {
      // Check if the user is authorized to update the event
      const userId = req.user ? req.user._id : null

      const challenge = await StartupChallenges.findById(id);


      if (userId.toString() !== challenge.postedBy.toString()) {
        // If user is not the creator of the event and not superadmin
        return res.status(403).json({ message: "Unauthorized User" });
      }

      // Find the startup challenge by ID and delete it
      // const deletedChallenge = await StartupChallenges.findByIdAndDelete(
      //   id
      // );

      const deletedChallenge = await StartupChallenges.findByIdAndUpdate(
        id, { resultstatus: 0 }
      );



      if (!deletedChallenge) {
        return res.status(404).json({ message: "Startup challenge not found" });
      }

      res.status(200).json({ message: "Result deleted successfully" });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.makepaymnt = async (req, res) => {
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
    });

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error!" });
    console.log(error);
  }
};






exports.AdminPayment = async (req, res) => {


  const { userDetails, months, price } = req.body;


  console.log(req.body)


  try {


    const { userId } = userDetails

    if (months) {


      // userDetails.userId = userId;
      // userDetails.paymentfor = 'Challenge';

      const challengeId = userDetails.challengeid;


      // const user = new registerchallenges(userDetails);

      const newExpireDate = new Date();
      newExpireDate.setMonth(newExpireDate.getMonth() + parseInt(months));


      const updatepayment = await StartupChallenges.findByIdAndUpdate(challengeId,

        { paymentStatus: 1, expireDate: newExpireDate, price: price }, { new: true },

      );

      if (updatepayment) {
        res.status(200).json({ message: "Payment Successful" });

      } else {
        console.log("payment not Updated ");
      }
      // await user.save();
      // Send Message 

    } else {
      res.status(404).json({ message: "error on hex!" });
    }

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error!" });
    console.log(error);
  }
}




exports.VerifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userDetails, months, price } = req.body;



  try {
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    // Create ExpectedSign
    const expectedSign = crypto.createHmac("sha256", process.env.key_secret)
      .update(sign.toString())
      .digest("hex");


    // Create isAuthentic


    const isAuthentic = expectedSign === razorpay_signature;

    const { userId } = userDetails

    if (isAuthentic) {

      userDetails.payment_id = razorpay_payment_id;
      userDetails.order_id = razorpay_order_id;
      userDetails.userId = userId;
      userDetails.paymentfor = 'Challenge';
      userDetails.price = price;


      const challengeId = userDetails.challengeid;


      const user = new registerchallenges(userDetails);

      const newExpireDate = new Date();
      newExpireDate.setMonth(newExpireDate.getMonth() + parseInt(months));


      const updatepayment = await StartupChallenges.findByIdAndUpdate(challengeId,

        { paymentStatus: 1, expireDate: newExpireDate, price: price }, { new: true },

      );

      if (updatepayment) {
        res.status(200).json({ message: "Payment Successful" });

      } else {
        console.log("payment not Updated ");
      }
      await user.save();
      // Send Message 

    } else {
      res.status(404).json({ message: "error on hex!" });
    }

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error!" });
    console.log(error);
  }
}


exports.AdminUpdateEnddate = async (req, res) => {
  if (req.method === 'POST') {
    const { months, price, id } = req.body;
    try {
      const eventId = id;

      // Find the event by its ID
      const event = await StartupChallenges.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      // Check if expireDate exists, if not use the current date
      let currentExpireDate = event.expireDate ? new Date(event.expireDate) : new Date();

      // Add the number of months to the current expire date
      currentExpireDate.setMonth(currentExpireDate.getMonth() + parseInt(months));

      // Update the event with the new expire date and price
      await StartupChallenges.findByIdAndUpdate(eventId, {
        expireDate: currentExpireDate,
        price: price
      });

      // Respond with success
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ message: 'Error updating event' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
};




exports.RazorpayResponse = async (req, res) => {
  try {
    console.log(req.body.payload.payment.entity, "Razorpay Response");

    const { amount, status, order_id, method, captured, description, card_id } = req.body.payload.payment.entity;

    // Convert amount from paise to rupees (decimal format)





    const decimalAmount = amount / 100;

    // Create new payment object
    const payment = new Payment({
      amount: decimalAmount, // Save amount as a decimal
      status,
      order_id,
      method,
      captured,
      description,
      card_id,
    });

    // Save new payment
    const savepayment = await payment.save();

    if (savepayment) {
      res.status(201).json({
        message: "Payment Details Saved",
        data: savepayment,
      });
    } else {
      return res.status(500).json({ error: "Unable to save payment details" });
    }
  } catch (error) {
    console.error("Error while saving payment details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



exports.UserUpdateEnddate = async (req, res) => {
  if (req.method === 'POST') {

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userDetails, months, price } = req.body;
    try {

      const sign = razorpay_order_id + "|" + razorpay_payment_id;

      const expectedSign = crypto.createHmac("sha256", process.env.key_secret)
        .update(sign.toString())
        .digest("hex");

      const isAuthentic = expectedSign === razorpay_signature;


      const { userId } = userDetails


      if (isAuthentic) {

        userDetails.payment_id = razorpay_payment_id;
        userDetails.order_id = razorpay_order_id;
        userDetails.userId = userId;
        userDetails.paymentfor = 'Challenge';

        const challengeId = userDetails.challengeid;

        const user = new registerchallenges(userDetails);

        const event = await StartupChallenges.findById(challengeId);

        if (!event) {
          return res.status(404).json({ message: 'Event not found' });
        }

        let currentExpireDate = event.expireDate ? new Date(event.expireDate) : new Date();

        currentExpireDate.setMonth(currentExpireDate.getMonth() + parseInt(months));

        await StartupChallenges.findByIdAndUpdate(challengeId, {
          expireDate: currentExpireDate,
          price: price
        });

        res.status(200).json({
          message: 'Payment Successful And Upadte Your Exipire Date has been Updated'
        });


        await user.save();

      }


    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ message: 'Error updating event' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
};



