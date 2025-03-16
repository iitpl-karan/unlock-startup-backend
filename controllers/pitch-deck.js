const Payment = require("../models/Payment");
const PitchDecks = require("../models/pitchDeckModel");
const pitchDeckBooking = require("../models/pitchDeckBooking");
const PitchDeckPurchase = require('../models/pitchDeckBooking')
const PitchDeckcatogery = require("../models/PitchDeskCatogery");
const nodemailer = require('nodemailer')
const User = require("../models/usersModel");


const crypto = require('crypto');
const Razorpay = require('razorpay');


const razorpayInstance = new Razorpay({
  key_id: process.env.key_id, // Replace with your Razorpay Key ID
  key_secret: process.env.key_secret, // Replace with your Razorpay Secret Key
});


exports.createPitchDeck = async (req, res) => {

  try {
    const {
      pitchDeckName,
      pitchDeckDetails,
      category,
      pitchDeckDate,
      currentDate,
      slug,
      price,
      whoCanParticipate
    } = req.body;




    const thumbnailImage = req.files.thumbnailImage[0].filename;
    // const coverImage = req.files.coverImage[0].filename;
    // const attachments = req.files.attachments[0].filename;

    // const document2 = req.files.document2[0].filename;

    const filesArray = req.files.attachments.map(file => file.filename);
    const CoverImageArray = req.files.coverImage.map(file => file.filename);


    const newPitchDeck = new PitchDecks({
      pitchDeckName,
      pitchDeckDetails,
      attachments: filesArray,
      thumbnailImage,
      coverImage: CoverImageArray,
      category,
      price,
      pitchDeckDate,
      slug,
      createdAt: currentDate,
      whoCanParticipate
    });

    const savedPitchDeck = await newPitchDeck.save();

    if (savedPitchDeck) {
      res.status(201).json({
        message: "Pitch deck created successfully",
        data: savedPitchDeck,
      });
    } else {
      res.status(500).json({ error: "Unable to create pitch deck" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.AddPitchDeckcatogery = async (req, res) => {

  const { name } = req.body;
  try {

    const newPitchDeckcatogery = new PitchDeckcatogery({
      name
    });

    const savedPitchDeckcatogery = await newPitchDeckcatogery.save();

    if (savedPitchDeckcatogery) {
      res.status(201).json({
        message: "Pitch deck category created successfully",
        data: savedPitchDeckcatogery,
      });
    }


  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.GetPitchDeckcatogery = async (req, res) => {
  try {
    const pitchDeckscatogery = await PitchDeckcatogery.find({})
    res.status(200).json(pitchDeckscatogery);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAllPitchDecks = async (req, res) => {
  try {
    const pitchDecks = await PitchDecks.find({ isDeleted: false, status: 1 }).populate('category');
    res.status(200).json(pitchDecks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getPitchDeckDetails = async (req, res) => {
  try {
    const pitchDeckid = req.query.id

    const pitchDeck = await PitchDecks.findById(pitchDeckid).populate('category');

    if (!pitchDeck) {
      return res.status(404).json({ message: "Startup challenge not found" });
    }
    return res.status(200).json(pitchDeck)
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getPitchDeckPagination = async (req, res) => {
  try {

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const skip = (page - 1) * limit;

    const pitchDeck = await PitchDecks.find({ isDeleted: false, })
      .populate('category')
      .skip(skip)
      .limit(limit);

    const totalpitchDeck = await PitchDecks.countDocuments({});

    res.status(200).json({
      data: pitchDeck,
      meta_data: {
        total_data: totalpitchDeck,
        current_page: page,
        data_limit: limit,
        total_pages: Math.ceil(totalpitchDeck / limit),
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
exports.updatePaymentStatusOfPitchDeck = async (req, res) => {
  try {
    const { id, paymentStatus, isAdmin } = req.body;

    const challenge = await PitchDecks.findById(id);

    if (isAdmin === true || isAdmin === 'true' || challenge.postedBy === req.user._id) {
      const result = await PitchDecks.findByIdAndUpdate(
        id,
        { paymentStatus: parseInt(paymentStatus) },
        { new: true }
      );

      if (result) {
        return res.status(200).json({
          message: "Payment Status has been changed",
        });
      } else {
        return res.status(404).json({
          message: "Pitch Deck not found",
        });
      }
    } else {
      return res.status(403).json({ message: "Unauthorized User" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


exports.updateStatusOfPitchDeck = async (req, res) => {
  try {
    const { id, status, isAdmin } = req.body;

    const challenge = await PitchDecks.findById(id);

    if (isAdmin === true || isAdmin === 'true' || challenge.postedBy === req.user._id) {
      const result = await PitchDecks.findByIdAndUpdate(
        id,
        { status: parseInt(status) },
        { new: true }
      );

      if (result) {
        return res.status(200).json({
          message: " Status has been changed",
        });
      } else {
        return res.status(404).json({
          message: "Pitch Deck not found",
        });
      }
    } else {
      return res.status(403).json({ message: "Unauthorized User" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


exports.updatePitchDeckDetails = async (req, res) => {
  try {
    const {
      id,
      slug,
      isAdmin,
      pitchDeckName,
      pitchDeckDetails,
      category,
      pitchDeckDate,
      currentDate,
      price,
      whoCanParticipate
    } = req.body;

    if (isAdmin === true || isAdmin === 'true' || challenge.postedBy === req.user._id) {
      // Construct the update object with the fields to be updated
      const updateData = {};
      if (pitchDeckName) updateData.pitchDeckName = pitchDeckName;
      if (slug) updateData.slug = slug;
      if (pitchDeckDetails) updateData.pitchDeckDetails = pitchDeckDetails;
      if (category) updateData.category = category;
      if (pitchDeckDate) updateData.pitchDeckDate = pitchDeckDate;
      if (currentDate) updateData.updatedAt = currentDate;
      if (price) updateData.price = price;
      if (whoCanParticipate) updateData.whoCanParticipate = whoCanParticipate;



      if (req.files.thumbnailImage) updateData.thumbnailImage = req.files.thumbnailImage[0].filename;
      // if (req.files.coverImage) updateData.coverImage = req.files.coverImage[0].filename;


      console.log('req.files.attachments', req.files.attachments, req.files.coverImage)



      let imageArr = []
      if (req.files.attachments) {
        for (let i = 0; i < req.files.attachments.length; i++) {
          const element = req.files.attachments[i].filename;

          imageArr.push(element)
        }
        updateData.attachments = imageArr;
      }


      let coverImagee = []
      if (req.files.coverImage) {
        for (let i = 0; i < req.files.coverImage.length; i++) {
          const element = req.files.coverImage[i].filename;

          coverImagee.push(element)
        }
        updateData.coverImage = coverImagee;
      }




      // Perform the update operation
      const updatedPitchDeck = await PitchDecks.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

      if (updatedPitchDeck) {
        res.status(200).json({
          message: "Pitch deck details have been updated",
          data: updatedPitchDeck,
        });
      } else {
        res.status(404).json({
          message: "Pitch deck not found",
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

exports.deletePitchDeck = async (req, res) => {
  try {
    const { id, isAdmin } = req.body;

    if (isAdmin === true || isAdmin === "true") {
      const deletedPitchDeck = await PitchDecks.findByIdAndUpdate(
        id, { isDeleted: true }
      );

      if (!deletedPitchDeck) {
        return res.status(404).json({ message: "Pitch Deck not found" });
      }

      res.status(200).json({ message: "Pitch Deck deleted successfully" });
    } else {
      const userId = req.user ? req.user._id : null
      const pitchDeck = PitchDecks.findById(id);

      if (
        userId.toString() !== pitchDeck.postedBy.toString()
      ) {
        return res.status(403).json({ message: "Unauthorized User" });
      }

      const deletedPitchDeck = await PitchDecks.findByIdAndUpdate(
        id, { isDeleted: true }
      );

      if (!deletedPitchDeck) {
        return res.status(404).json({ message: "Pitch Deck not found" });
      }

      res.status(200).json({ message: "Pitch Deck deleted successfully" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// exports.BuyPitchDeck = async (req, res) => {
//   const {
//     name,
//     address,
//     email,
//     userId,
//     pitchDeckId,
//     registrationStatus,
//   } = req.body;


//   // Handle file uploads
//   if (!req.files || !req.files.attachment) {
//     return res.status(400).json({ message: "File is required" });
//   }

//   const attachment = req.files.attachment[0].filename;

//   try {
//     // Check if the user has already purchased this pitch deck
//     const existingRegistration = await PitchDeckPurchase.findOne({ userId, pitchDeckId });

//     if (existingRegistration) {
//       return res.status(200).json({ message: "You have already purchased this pitch desk" });
//     }

//     // Create new pitch deck purchase record
//     const newPurchase = new PitchDeckPurchase({
//       name,
//       address,
//       email,
//       userId,
//       pitchDeckId,
//       attachment,
//       registrationStatus,
//     });

//     // Save the new purchase record
//     const savedPurchase = await newPurchase.save();

//     return res.status(201).json({
//       message: "Your purchase of the pitch desk was successful",
//       data: savedPurchase,
//     });
//   } catch (error) {
//     console.error("Error processing pitch deck purchase", error);
//     return res.status(500).json({ message: "Server error. Please try again later." });
//   }
// };



exports.BuyPitchDeck = async (req, res) => {


  const { amount, userId, pitchDeckId } = req.body;
  console.log(req.body, "data");



  try {

    const existingPurchase = await PitchDeckPurchase.findOne({ userId, pitchDeckId });

    if (existingPurchase) {
      return res.status(400).json({ message: "You have already purchased this pitch deck." });
    }

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
      // console.log(order)
    });

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error!" });
    console.log(error);
  }
};

exports.Verify = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userDetails, price } = req.body;

  try {
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto.createHmac("sha256", process.env.key_secret)
      .update(sign.toString())
      .digest("hex");

    const isAuthentic = expectedSign === razorpay_signature;
    const { userId } = userDetails;

    if (isAuthentic) {
      userDetails.payment_id = razorpay_payment_id;
      userDetails.order_id = razorpay_order_id;
      userDetails.userId = userId;
      userDetails.paymentfor = 'Pitch Deck';
      userDetails.price = price;

      const user = new PitchDeckPurchase(userDetails);
      await user.save();

      // Send success response
      res.json({ message: "Payment Successfully" });

      // Proceed to send email after sending the response
      (async () => {
        try {
          let userinfo = await User.findById(userId);
          let useremaill = userinfo?.email;

          let transporter = nodemailer.createTransport({
            host: "smtp.hostinger.com",
            port: 587,
            secure: false,
            auth: {
              user: 'info@unlockstartup.com', // Your email
              pass: 'Z2q^Hoj>K4', // Your email password
            },
          });

          const mailOptions = {
            from: 'info@unlockstartup.com', // sender address
            to: useremaill,
            subject: 'Thank You for Downloading Pitch Deck', // Subject line
            html: `
      <div>
        <p>Dear Sir/Madam,</p>
        
        <p>Thank you for downloading the pitch deck!</p>
        
        <p>The pitch deck contains key information about our mission, vision, and how we plan to create value. Should you have any questions or wish to discuss further, don’t hesitate to reach out to us at <a href="mailto:contact@unlockstartup.com">contact@unlockstartup.com</a>.</p>
        
        <p>Thank you again for your interest, and we look forward to staying in touch!</p>
         <img src="https://unlockstartup.com/unlock/uploads/Logo.png" alt="" />

        <p>Best Regards,<br />
        Unlock Startup</p>
        
        <p>
          Website: <a href="http://www.unlockstartup.com">www.unlockstartup.com</a><br />
          Email: <a href="mailto:contact@unlockstartup.com">contact@unlockstartup.com</a><br />
          Mobile: +919266733959
        </p>
      </div>
    ` // HTML body
          };

          await transporter.sendMail(mailOptions);
        } catch (emailError) {
          console.error("Error sending email:", emailError);
        }
      })(); // Immediately Invoked Function Expression (IIFE) to handle email sending
    }

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error!" });
    console.log(error);
  }
}

exports.getAllBookingPitchDesk = async (req, res) => {
  try {
    const pitchDecks = await pitchDeckBooking.find().populate('userId')
      .populate({
        path: 'pitchDeckId',
        populate: {
          path: 'category',
        }
      });
    res.status(200).json(pitchDecks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getUserBookingPitchDesk = async (req, res) => {
  let { userid } = req.query;
  try {
    // Extract pagination parameters from query (default to page 1 and limit 10)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit; // Calculate how many items to skip

    // Fetch total count of pitch decks for the specified user
    const totalPitchDecks = await pitchDeckBooking.countDocuments({ userId: userid });

    // If no pitch decks found, return 404
    if (totalPitchDecks === 0) {
      return res.status(404).json({ message: "No pitch decks found for the specified user" });
    }

    // Fetch pitch decks with pagination
    const pitchDecks = await pitchDeckBooking.find({ userId: userid })
      .populate('userId')
      .populate({
        path: 'pitchDeckId',
        populate: {
          path: 'category',
        }
      })
      .skip(skip) // Apply pagination
      .limit(limit); // Apply limit

    // Calculate total pages based on limit
    const totalPages = Math.ceil(totalPitchDecks / limit);

    // Respond with paginated results
    return res.status(200).json({
      message: "Pitch decks fetched successfully",
      data: pitchDecks,

      meta_data: {
        total_data: totalPitchDecks,
        current_page: page,
        data_limit: limit,
        total_pages: totalPages,
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};