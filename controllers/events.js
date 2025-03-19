const Events = require("../models/eventsModel");
const axios = require('axios')
const mongoose = require("mongoose");
const crypto = require('crypto');

const { ObjectId } = require('bson')
const Razorpay = require('razorpay');
const Payment = require("../models/Payment");
const EventType = require("../models/eventtype");
const State = require("../models/statemodel");
const User = require("../models/usersModel");
const nodemailer = require('nodemailer')

const registerevent = require("../models/PayForregisterevent");

const razorpayInstance = new Razorpay({
  key_id: process.env.key_id, // Replace with your Razorpay Key ID
  key_secret: process.env.key_secret, // Replace with your Razorpay Secret Key
});

const generateRandomId = () => {
  // Generate a random number between 100000 and 999999 (inclusive)
  const randomNumber = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
  // Concatenate "USC" with the random number
  return `USE${randomNumber}`;
};


exports.createEvent = async (req, res) => {
  try {
    let {
      eventName,
      category,
      eventType,
      eventDate,
      eventAddress,
      isAdmin,
      registerationfee,
      state,
      city,
      address,
      pincode,
      eventDetails,
      organizernumber,
      organizername,
      time,
      charges,

      organizerwebsite,
      guidelines,
      organizeremail,
      startime,
      endtime,
      video_url1,
      video_url2,
      registrationStartDate,
      registrationEndDate,
      reference_url,
      eventMode,
      whoCanParticipate,
      slug,
      userid,
      userId,
      currentDate,
      paymentStatus,

    } = req.body;

    if (!eventName || !category || !eventType || !eventDate || !state ||
      !city || !pincode || !eventDetails || !organizernumber || !organizername ||
      !charges || !organizerwebsite || !guidelines || !organizeremail ||
      !startime || !endtime || !registrationStartDate || !registrationEndDate || !eventMode || !slug || !currentDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // const isEventExist = await Events.findOne({ slug });
    // if (isEventExist) {
    //   return res.status(409).json({f
    //     message: "Event already exist",
    //   });
    // }


    const thumbnailImage = req.files.thumbnailImage?.[0]?.filename;
    const coverImage = req.files.coverImage?.[0]?.filename;
    const document1 = req.files?.document1?.[0]?.filename;
    const document2 = req.files?.document2?.[0]?.filename;



    let postedBy;
    if (isAdmin === true || isAdmin === 'true') {
      postedBy = "admin";
    } else {
      if (!mongoose.Types.ObjectId.isValid(userid)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      postedBy = userid;
    }




    let transformedWhoCanParticipate = [];
    if (whoCanParticipate) {
      transformedWhoCanParticipate = whoCanParticipate.split(',').map(value => value.trim()); // Split and trim values
    }

    const eventId = generateRandomId();

    eventType = JSON.parse(eventType)

    const newEvent = new Events({
      eventName,
      postedBy,
      state,
      city,
      address,
      pincode,
      charges,
      slug,
      category,
      eventType,
      eventDetails,
      reference_url,
      thumbnailImage,
      startime,
      endtime,
      time,
      coverImage,
      eventDate,
      eventAddress,
      organizernumber,
      guidelines,
      organizername,
      organizerwebsite,
      registrationStartDate,
      registerationfee,
      registrationEndDate,
      video_url1,
      video_url2,
      eventId,
      organizeremail,
      eventMode,
      document1,
      document2,
      paymentStatus,
      whoCanParticipate: transformedWhoCanParticipate,
      // createdAt: currentDate
    });

    const savedEvent = await newEvent.save();


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
      to: 'info@unlockstartup.com ',
      subject: `New Event Created  By - ${usernameee} `,
      text: `One New Event has been Added By - ${usernameee} Event ID - ${eventId}.`,
    };


    const mailOptions2 = {
      from: 'info@unlockstartup.com', // sender address
      to: useremaill, // recipient's email address
      subject: 'Unlock Event Created',
      html: `
        <p>Your event <strong>${eventName}</strong> (ID: <strong>${eventId}</strong>) has been created. Please wait for confirmation. It will be confirmed within 24 hours, after which you can proceed with the payment.</p>
        <br>

          

                        <img src="https://unlockstartup.com/unlock/uploads/Logo.png" alt="" />

            <p style="margin-top: 20px;">Best Regards,<br>
            Unlock Startup<br>
            Email: <a href="contact@unlockstartup.com">contact@unlockstartup.com</a><br>
            Mobile: +919266733959</p><br>




            `,
    };


    if (savedEvent) {



      res.status(201).json({
        message: "Event created successfully",
        data: savedEvent,
      });


      const info = await transporter.sendMail(mailOptions);
      const info1 = await transporter.sendMail(mailOptions2);
    } else {
      res.status(500).json({ message: "Unable to create event" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.getAllEventsWithUsers = async (req, res) => {
  try {
    // Retrieve all events
    const events = await Events.find({ status: 1, paymentStatus: 1, isDeleted: false, expireDate: { $gt: new Date() } }).populate('category postedBy state city eventType')

    // Array to store promises for fetching user details
    // const userDetailPromises = events.map((event) => {
    //   if (event.postedBy === "admin") {
    //     return Promise.resolve({ data: "admin" });
    //   } else {
    //     return axios.get("/api/users/get-particular-user", {
    //       params: {
    //         userId: event.postedBy,
    //       },
    //     });
    //   }
    // });

    // Wait for all promises to resolve
    // const userDetailResponses = await Promise.all(userDetailPromises);

    // // Extract user data from responses
    // const userData = userDetailResponses.map((response) => response.data);

    // // Merge user data into event objects and format the date
    // const eventsWithUserDetails = events.map((event, index) => ({
    //   ...event.toObject(),
    //   postedBy: userData[index],
    //   createdAt: new Date(event.createdAt).toISOString().split('T')[0],
    //   eventDate: new Date(event.eventDate).toISOString().split('T')[0]
    // }));

    res.status(200).json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getEventwithpagination = async (req, res) => {
  try {

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const skip = (page - 1) * limit;

    const event = await Events.find({isDeletedAdmin : false})
      .populate('category postedBy state city')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })


    const totalEvent = await Events.countDocuments({isDeletedAdmin : false});

    res.status(200).json({
      data: event,
      meta_data: {
        total_data: totalEvent,
        current_page: page,
        data_limit: limit,
        total_pages: Math.ceil(totalEvent / limit),
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.getUserEventwithpagination = async (req, res) => {
  try {

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const userid = req.query.userid; // Retrieve userid from query parameters


    const skip = (page - 1) * limit;

    const events = await Events.find({ postedBy: userid , isDeleted: false })
      .populate('category postedBy state city')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })


    const totalevents = await Events.countDocuments({ postedBy: userid });

    res.status(200).json({
      data: events,
      meta_data: {
        total_data: totalevents,
        current_page: page,
        data_limit: limit,
        total_pages: Math.ceil(totalevents / limit),
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAllEventsWithFilter = async (req, res) => {
  try {
    let { whoCanParticipate, category, month, city } = req.body;

    let conditionObj = {

      paymentStatus: 1,
      status: 1,
      isDeleted: false,
      expireDate: { $gt: new Date() } // Filter for challenges that have not expired

    };

    if (whoCanParticipate && Array.isArray(whoCanParticipate) && whoCanParticipate.length > 0) {
      conditionObj.whoCanParticipate = { $in: whoCanParticipate };
    }



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
    if (category) conditionObj.category = new ObjectId(category);
    if (city) conditionObj.state = new ObjectId(city);

    const aggregationPipeline = [
      {
        $facet: {
          events: [
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
                from: "eventypes",
                localField: "eventType",
                foreignField: "_id",
                as: "eventType"
              }
            },
            // { $unwind: "$eventType" },


            {
              $lookup: {
                from: "users",
                localField: "postedBy",
                foreignField: "_id",
                as: "postedBy"
              }
            },
            { $unwind: "$postedBy" }
          ],
          // cities: [
          //   {
          //     $lookup: {
          //       from: "states",
          //       localField: "state",
          //       foreignField: "_id",
          //       as: "cityDetails"
          //     }
          //   },
          //   { $unwind: "$cityDetails" },
          //   {
          //     $group: {
          //       _id: null,
          //       cities: { $addToSet: "$cityDetails" }
          //     }
          //   },
          //   {
          //     $project: {
          //       _id: 0,
          //       cities: 1
          //     }
          //   }
          // ]
        }
      }
    ];

    // Aggregate city data
    const aggregationResult = await Events.aggregate(aggregationPipeline);
    let state = await State.find();


    let events = aggregationResult[0].events || [];
    // let cities = aggregationResult[0].cities[0]?.cities || [];


    res.status(200).json({
      events,
      cities: state
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};






exports.getEventDetails = async (req, res) => {
  try {
    const eventId = req.query.id
    const isAdmin = req.query.isAdmin



    const event = await Events.findById(eventId).populate('category state city eventType')
      .populate({
        path: 'postedBy',
        populate: {
          path: 'companyDetailsId'
        },

      });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (isAdmin === 'true' || isAdmin === true) {
      return res.status(200).json(event)
    }

    const response = await axios.get("/api/users/get-particular-user", {
      params: {
        userId: event.postedBy,
      },
    });

    if (response.status !== 200) {
      return res.status(500).json({ message: "Failed to fetch user details" });
    }

    const userData = response.data;

    const eventWithUserDetails = {
      ...event.toObject(),
      postedBy: userData,
      eventDate: new Date(event.eventDate).toISOString().split('T')[0]
    };

    res.status(200).json(eventWithUserDetails);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



exports.updateEventDetails = async (req, res) => {
  try {
    let {
      id,
      eventName,
      category,

      eventDate,
      state,
      city,
      address,
      pincode,
      eventType,
      eventDetails,
      video_url,
      reference_url,
      eventAddress,
      eventMode,
      registerationfee,
      whoCanParticipate,
      slug,
      currentDate,
      startime,
      endtime,
      isAdmin,
      charges,
      organizernumber,
      organizername,
      time,
      organizerwebsite,
      registrationStartDate,
      registrationEndDate,
      organizeremail,
      guidelines,
      video_url1,
      video_url2,
      paymentStatus
    } = req.body;



    const event = await Events.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }



    if (isAdmin === true || isAdmin === 'true' || event.postedBy.toString() === req.user._id.toString()) {
      // if (isAdmin === true || isAdmin === 'true' || event.postedBy === req._id) {

      // Construct the update object with the fields to be updated



      const updateData = {};
      if (eventName) updateData.eventName = eventName;

      if (category) updateData.category = category;

      if (eventDate) updateData.eventDate = eventDate;
      if (eventDetails) updateData.eventDetails = eventDetails;
      if (video_url) updateData.video_url = video_url;
      if (reference_url) updateData.reference_url = reference_url;
      if (time) updateData.time = time;
      if (registerationfee) updateData.registerationfee = registerationfee;
      if (guidelines) updateData.guidelines = guidelines;
      if (charges) updateData.charges = charges;


      if (eventAddress) updateData.eventAddress = eventAddress;
      if (eventMode) updateData.eventMode = eventMode;
      if (whoCanParticipate) updateData.whoCanParticipate = whoCanParticipate;
      if (currentDate) updateData.updatedAt = currentDate
      if (slug) updateData.slug = slug;

      if (state) updateData.state = state;
      if (city) updateData.city = city;
      if (address) updateData.address = address;
      if (pincode) updateData.pincode = pincode;
      if (organizernumber) updateData.organizernumber = organizernumber;
      if (organizername) updateData.organizername = organizername;
      if (organizerwebsite) updateData.organizerwebsite = organizerwebsite;
      if (organizeremail) updateData.organizeremail = organizeremail;
      if (video_url1) updateData.video_url1 = video_url1;
      if (video_url2) updateData.video_url2 = video_url2;
      if (req.files.document2) updateData.document2 = req.files.document2[0].filename;
      if (req.files.document1) updateData.document1 = req.files.document1[0].filename;
      if (req.files.thumbnailImage) updateData.thumbnailImage = req.files.thumbnailImage[0].filename;
      if (req.files.coverImage) updateData.coverImage = req.files.coverImage[0].filename;
      if (registrationStartDate) updateData.registrationStartDate = registrationStartDate;
      if (registrationEndDate) updateData.registrationEndDate = registrationEndDate;
      if (paymentStatus) updateData.paymentStatus = paymentStatus;
      if (startime) updateData.startime = startime;
      if (endtime) updateData.endtime = endtime;

      // if (eventType) updateData.eventType = eventType;


      if (eventType) {
        // Convert eventType to array if it's a comma-separated string
        updateData.eventType = Array.isArray(eventType) ? eventType : eventType.split(',');
      }

      updateData.status = 0;

      const updatedEvent = await Events.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      if (updatedEvent) {
        res.status(200).json({
          message: "Event details have been updated",
          data: updatedEvent,
        });
      } else {
        res.status(404).json({
          message: "Event not found",
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


exports.deleteEvent = async (req, res) => {
  try {
    const { id, isAdmin } = req.body;

    // Check if the user is an admin
    if (isAdmin === true || isAdmin === "true") {
      const deletedEvent = await Events.findByIdAndUpdate(
        id, { isDeleted: true }
      );
      if (!deletedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      return res.status(200).json({ message: "Event deleted successfully" });
    } else {
      // Get userId from the request
      const userId = req.user ? req.user._id : null;

      // Find the event by ID
      const event = await Events.findById(id);

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Check if the user is authorized to delete the event
      if (userId.toString() !== event.postedBy.toString()) {
        return res.status(403).json({ message: "Unauthorized User" });
      }

      // Delete the event
      const deletedEvent = await Events.findByIdAndUpdate(
        id, { isDeleted: true }
      );

      if (!deletedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      return res.status(200).json({ message: "Event deleted successfully" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.deleteEventAdmin = async (req, res) => {
  try {
    const { id, isAdmin } = req.body;

    // Check if the user is an admin
    if (isAdmin === true || isAdmin === "true") {
      const deletedEvent = await Events.findByIdAndUpdate(
        id, { isDeleted: true , isDeletedAdmin : true }
      );
      if (!deletedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      return res.status(200).json({ message: "Event deleted successfully" });
    } else {
      // Get userId from the request
      const userId = req.user ? req.user._id : null;

      // Find the event by ID
      const event = await Events.findById(id);

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Check if the user is authorized to delete the event
      if (userId.toString() !== event.postedBy.toString()) {
        return res.status(403).json({ message: "Unauthorized User" });
      }

      // Delete the event
      const deletedEvent = await Events.findByIdAndUpdate(
        id, { isDeleted: true , isDeletedAdmin : true }
      );

      if (!deletedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      return res.status(200).json({ message: "Event deleted successfully" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.updateStatusOfEvent = async (req, res) => {
  try {
    const { id, status, isAdmin } = req.body;
    const event = await Events.findById(id);

    if (isAdmin === true || isAdmin === 'true' || event.postedBy === req.user._id) {
      const result = await Events.findByIdAndUpdate(
        id,
        { status: parseInt(status) },
        { new: true }
      );

      if (result) {
        // Only send email if status is 1
        
        res.status(200).json({ message: "Status has been changed" });


        if (parseInt(status) === 1) {
          const userid = event.postedBy;
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

          // Send the email
          await transporter.sendMail(mailOptions);
        }

      } else {
        return res.status(404).json({ message: "Event not found" });
      }
    } else {
      return res.status(403).json({ message: "Unauthorized action" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}



exports.updatePaymentStatusOfEvent = async (req, res) => {
  try {
    const { id, paymentStatus, isAdmin } = req.body;

    const challenge = await Events.findById(id);

    if (isAdmin === true || isAdmin === 'true' || challenge.postedBy === req.user._id) {
      const result = await Events.findByIdAndUpdate(
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
          message: "Startup Challenge not found",
        });
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


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


exports.VerifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userDetails, months, price } = req.body;

  console.log(req.body, "req")

  try {
    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto.createHmac("sha256", process.env.key_secret)

      .update(sign.toString())
      .digest("hex");

    const isAuthentic = expectedSign === razorpay_signature;


    const { userId, challengeid } = userDetails

    if (isAuthentic) {


      userDetails.order_id = razorpay_order_id;
      userDetails.userId = userId;
      userDetails.paymentfor = 'Event';
      userDetails.eventid = challengeid;
      userDetails.price = price;





      userDetails.payment_id = razorpay_payment_id;
      const eventId = userDetails.challengeid;
      const user = new registerevent(userDetails);


      const newExpireDate = new Date();
      newExpireDate.setMonth(newExpireDate.getMonth() + parseInt(months));

      const updatepayment = await Events.findByIdAndUpdate(
        eventId,
        { paymentStatus: 1, expireDate: newExpireDate, price: price }, { new: true },

      );
      if (updatepayment) {

        res.json({
          message: "Payement Successfully"
        });

      } else {

        res.json({
          message: "Payement not Successfull"
        });


      }
      await user.save();
      // Send Message 

    }

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error!" });
    console.log(error);
  }
}


exports.AdminPay = async (req, res) => {
  const {  userDetails, months, price } = req.body;

  console.log(req.body, "req")

  try {






    const { userId, challengeid } = userDetails

    if (months) {


      userDetails.eventid = challengeid;

      const eventId = userDetails.challengeid;




      const newExpireDate = new Date();
      newExpireDate.setMonth(newExpireDate.getMonth() + parseInt(months));

      const updatepayment = await Events.findByIdAndUpdate(
        eventId,
        { paymentStatus: 1, expireDate: newExpireDate, price: price }, { new: true },

      );
      if (updatepayment) {

        res.json({
          message: "Payement Successfully"
        });

      } else {

        res.json({
          message: "Payement not Successfull"
        });


      }
      // Send Message 

    }

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error!" });
    console.log(error);
  }
}


exports.addeventype = async (req, res) => {
  const { name } = req.body;

  // Validate the input
  if (!name) {
    return res.status(400).json({ error: 'Type is required' });
  }

  try {
    // Create a new instance of the Businesstype model
    const newType = new EventType({ name });

    // Save the instance to the database
    await newType.save();

    res.status(200).json({ message: 'Type added successfully' });
  } catch (err) {
    console.error('Error adding type:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



exports.getAlleventype = async (req, res) => {

  try {
    const data = await EventType.find({})


    res.status(200).json(data);
  } catch (err) {
    console.error('Error adding type:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

