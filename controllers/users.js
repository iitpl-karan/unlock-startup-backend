const Users = require("../models/usersModel");
const UserDetails = require("../models/usersDetailsModel");
const CompanyDetails = require("../models/companyDetailsModel");
const InvestorUser = require("../models/InvestorDetails")
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { log } = require("console");


exports.createadmin = async (req, res) => {
  try {
    const { name, username, email, password, userType, companyDetailsId, userDetailsId } = req.body;

    const user = await Users.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: "Admin already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword, "hashpassword")
    const newAdmin = new Users({
      name,
      username,
      email,
      password: hashedPassword,
      isAdmin: true,
      userType, 
    });

    await newAdmin.save();

    return res.status(201).json({
      message: "Admin created successfully",
    });

  } catch (err) {
    console.error("Error in creating admin:", err);

    return res.status(500).json({
      message: "Server error occurred while creating admin",
    });
  }
}

exports.adminLogin = async (req, res) => {

  try {
    const { email, password } = req.body;

    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "User does not exist",
      });
    }
    console.log(user.password)
    const isMatch = await bcrypt.compare(password, user.password);

    const payload = {
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType, // Add userType to payload if needed
      }
    };

    if (isMatch) {

      const token = jwt.sign(payload, process.env.JWT_SECRET);
      return res.status(200).json({
        message: "Login Successfull",
        token: token,
        user
      });
    } else {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Some server error occurred",
    });
  }
}

exports.getAdminDetails = async (req, res) => {
  try {
    const { isAdmin } = req.query;

    if (isAdmin === true | isAdmin === 'true') {
      const email = 'admin@gmail.com'

      const user = await Users.findOne({ userType: 'admin' });

      const details = {};
      details.name = user.name;
      details.image = user.image;

      if (user) {
        res.status(200).json(details)
      } else {
        res.status(404).json({
          message: "User not found",
        });
      }
    } else {
      res.status(403).json({
        message: "Unauthorized User",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Some server error occurred",
    });
  }
}

exports.updateAdminDetails = async (req, res) => {
  try {
    const { isAdmin, name, old, password, confirm } = req.body;
    const image = req.file;

    if (isAdmin === true | isAdmin === 'true') {
      // const email = 'admin@gmail.com'
      const user = await Users.findOne({ userType: 'admin' });

      // const isMatch = await bcrypt.compare(old, user.password);

      if (isAdmin === true | isAdmin === 'true') {
        if (password !== confirm) {
          return res.status(400).json({
            message: "Password and Confirm Password does not matched",
          });
        }

        // const hashedPassword = await bcrypt.hash(password, 10);
        const updatedData = {};
        if (name) updatedData.name = name;
        // if (password) updatedData.password = hashedPassword;
        if (image) updatedData.image = image.filename;

        const updatedUser = await Users.findOneAndUpdate({ userType: 'admin' }, updatedData, { new: true });
        if (updatedUser) {
          res.status(200).json({
            message: "Details updated Successfully",
          });
        } else {
          res.status(404).json({
            message: "User not found",
          });
        }
      } else {
        return res.status(400).json({
          message: "Old Password does not matched",
        });
      }
    } else {
      res.status(403).json({
        message: "Unauthorized User",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Some server error occurred",
    });
  }
}

exports.createNewUser = async (req, res) => {
  try {
    const { username, email, password, userType } = req.body;
    console.log(userType, "user type", req.body)
    const hashedPassword = await bcrypt.hash(password, 10);

    const userAlreadyExist = await Users.findOne({ email });
    if (userAlreadyExist) {
      return res.status(400).json({
        message: "User already exist",
      });
    }

    if (userType === "Individual") {
      const { name, contactNo, avatar, attachments } = req.body;
      const userDetails = new UserDetails({
        contactNo,
        avatar,
        attachments,
      });
      const savedUserDetails = await userDetails.save();
      if (savedUserDetails) {
        const user = new Users({
          name,
          username,
          email,
          password: hashedPassword,
          userType,
          userDetailsId: savedUserDetails._id,
        });
        const savedUser = await user.save();
        if (savedUser) {
          return res.status(200).json({
            message: "User Created successfully",
          });
        } else {
          console.log("hey")
          return res.status(500).json({
            message: "Unable to add new user in users collection",
          });
        }
      } else {
        return res.status(500).json({
          message: "Unable to save user details in userdetails collection",
        });
      }
    }

    else if (userType === "Startup") {
      const { name, address, contactNo, url, GST, attachments, industerytype, since, companyname } = req.body;
      const companyDetails = new CompanyDetails({
        address,
        contactNo,
        url,
        GST,
        attachments,
        companyname,
        industerytype,
        since,
      });
      const savedCompany = await companyDetails.save();

      if (savedCompany) {
        const user = new Users({
          name,
          username,
          email,
          password: hashedPassword,
          userType,
          companyDetailsId: savedCompany._id,
        });
        const savedUser = await user.save();
        if (savedUser) {
          return res.status(200).json({
            message: "User Created successfully",
          });
        } else {
          return res.status(500).json({
            message: "Unable to add new user in users collection",
          });
        }
      } else {
        return res.status(500).json({
          message:
            "Unable to save company details in companydetails collection",
        });
      }
    }
    else if (userType === "Investor") {
      console.log(req.body, "running 5 hgere")
      console.log(req.body, "running 5 hgere")
      const { 
        fullname, 
        website, 
        investorType, 
        stage, 
        company, 
        industerytype, 
        phone,
        fullName
      } = req.body;
      console.log(fullname, "running hgere")
      // Create Investor Details
      const investorDetails = new InvestorUser({
        website,
        investorType,
        stage,
        company,
        industerytype,
        phone,
        fullName: fullname,
        investoremail: email,
        password: hashedPassword,
        investorname: fullname,
        terms: req.body.terms || false
      });

      const savedInvestorDetails = await investorDetails.save();
      console.log("doine")

      if (savedInvestorDetails) {
        const user = new Users({
          name: fullname || "",
          username,
          email,
          password: hashedPassword,
          userType,
          investorDetailsId: savedInvestorDetails._id
        });
        const savedUser = await user.save();
        if (savedUser) {
          // Optionally, update the investor details with the user ID
          savedInvestorDetails.userId = savedUser._id;
          await savedInvestorDetails.save();
          return res.status(200).json({
            message: "Investor User Created successfully",
            user: savedUser,
            investorDetails: savedInvestorDetails
          });
        } else {
          // Rollback investor details if user creation fails
          await InvestorUser.findByIdAndDelete(savedInvestorDetails._id);
          return res.status(500).json({
            message: "Unable to add new user in users collection",
          });
        }
      } else {
        return res.status(500).json({
          message: "Unable to save investor details",
        });
      }
    }
    else if (userType === "Business") {
      const { name, address, contactNo, url, GST, attachments, industerytype, since, companyname, type } = req.body;
      const companyDetails = new CompanyDetails({
        address,
        contactNo,
        url,
        GST,
        attachments,
        industerytype,
        type,
        since,
        companyname,
      });
      const savedCompany = await companyDetails.save();

      if (savedCompany) {
        const user = new Users({
          name,
          username,
          email,
          password: hashedPassword,
          userType,
          companyDetailsId: savedCompany._id,
          companyname
        });
        const savedUser = await user.save();
        if (savedUser) {
          return res.status(200).json({
            message: "Business User Created successfully",
          });
        } else {
          return res.status(500).json({
            message: "Unable to add new user in users collection",
          });
        }
      } else {
        return res.status(500).json({
          message:
            "Unable to save company details in companydetails collection",
        });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Some server error occurred",
    });
  }
};

exports.userLogin = async (req, res) => {
  try {
    const { email, password, userType } = req.body;


    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "Password is required",
      });
    }

    // Find the user with the provided email
    const user = await Users.findOne({ email });


    if (!user) {
      return res.status(400).json({
        message: "User does not exist",
      });
    } else if (user.status === 0) {
      return res.status(400).json({
        message: "Your account has been blocked by the admin.",
      });
    }




    // Check if the userType matches
    if (user.userType !== 'Startup' && user.userType !== 'Individual') {
      return res.status(400).json({
        message: "Incorrect user type",
      });
    }

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect password",
      });
    }




    // Create a JWT payload
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType, // Add userType to payload if needed
      }
    };

    // Sign the JWT
    jwt.sign(payload, process.env.JWT_SECRET, (err, token) => {
      if (err) throw err;
      res.status(200).json({
        token,
        message: "Login Successful",
        user
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error occurred",
    });
  }
};

exports.BusinessLogin = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    // Find the user with the provided email
    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "Password is required",
      });
    }

    const user = await Users.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User does not exist",
      });
    } else if (user.status === 0) {
      return res.status(400).json({
        message: "Your account has been blocked by the admin.",
      });
    }


    // Check if the userType matches
    if (user.userType !== 'Business') {
      return res.status(400).json({
        message: "Incorrect user type",
      });
    }

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect password",
      });
    }

    // Create a JWT payload
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType, // Add userType to payload if needed
      }
    };

    // Sign the JWT
    jwt.sign(payload, process.env.JWT_SECRET, (err, token) => {
      if (err) throw err;
      res.status(200).json({
        token,
        message: "Login Successful",
        user
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error occurred",
    });
  }
};

exports.updateCompanyDetails = async (req, res) => {
  try {
    // Extract data from the request body
    const { email, isAdmin, gst, url, companyName, address, contactNo, industerytype, since, cin, type, category } = req.body;

    console.log(req.body)

    // Initialize updateData object to store updated fields
    const updateFields = {
      gst,
      url,
      since,
      companyName,
      address,
      contactNo,
      industerytype,
      category,
      type,
      cin,
      updatedAt: new Date()
    };

    // If a logo file is uploaded, add it to the updateFields
    if (req.files && req.files.logo) {
      updateFields.logo = req.files.logo[0]?.filename;
    }

    // Check if the user is an admin
    if (isAdmin === true || isAdmin === 'true') {
      // Email is required to identify the user
      if (!email) {
        return res.status(400).json({
          message: "Email is required",
        });
      }

      // Find the user by email and populate their company details
      const user = await Users.findOne({ email }).populate('companyDetailsId');

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // Get the company details ID if it exists
      const companyDetailsId = user.companyDetailsId;

      let result;
      if (!companyDetailsId) {
        // If company details don't exist, create a new document
        const newCompanyDetails = new CompanyDetails(updateFields);
        result = await newCompanyDetails.save();

        // Link the new company details to the user
        user.companyDetailsId = newCompanyDetails._id;
        await user.save();
      } else {
        // If company details exist, update the existing document
        result = await CompanyDetails.findByIdAndUpdate(companyDetailsId._id, updateFields, { new: true });
      }

      // Return a success response if the update is successful
      if (result) {
        return res.status(200).json({
          message: "Company details updated",
          data: result
        });
      } else {
        return res.status(400).json({
          message: "Failed to update company details",
        });
      }
    } else {
      return res.status(403).json({
        message: "Unauthorized User",
      });
    }
  } catch (err) {
    // Catch and log any errors, then return a 500 response
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


exports.getCompanyDetails = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({
      message: "Email query parameter is required",
    });
  }

  try {
    const result = await Users.findOne({ email }).populate('companyDetailsId').populate({
      path: 'companyDetailsId',
      populate: {
        path: 'type category',
      }

    })

    if (result) {
      return res.status(200).json(result);
    } else {
      return res.status(404).json({
        message: "User not found",
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};





exports.getAllUsersPagination = async (req, res) => {
  try {

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const skip = (page - 1) * limit;

    const users = await Users.find({ userType: { $ne: "admin" } })
      .populate('companyDetailsId userDetailsId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    const totalUser = await Users.countDocuments({});

    res.status(200).json(
      {
        data: users,
        meta_data: {
          total_data: totalUser,
          current_page: page,
          data_limit: limit,
          total_pages: Math.ceil(totalUser / limit),
        },
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getBusinessUsersPagination = async (req, res) => {
  try {

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const skip = (page - 1) * limit;

    const users = await Users.find({ userType: { $nin: ["admin", "Individual", "Startup"] } })
      .populate('companyDetailsId userDetailsId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    const totalUser = await Users.countDocuments({});

    res.status(200).json(
      {
        data: users,
        meta_data: {
          total_data: totalUser,
          current_page: page,
          data_limit: limit,
          total_pages: Math.ceil(totalUser / limit),
        },
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.getNormalUserPaginaion = async (req, res) => {
  try {

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const skip = (page - 1) * limit;

    const users = await Users.find({ userType: { $nin: ["admin", "Business"] } })
      .populate('companyDetailsId userDetailsId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    const totalUser = await Users.countDocuments({});

    res.status(200).json(

      {
        data: users,
        meta_data: {
          total_data: totalUser,
          current_page: page,
          data_limit: limit,
          total_pages: Math.ceil(totalUser / limit),
        },
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};







exports.getAllUsers = async (req, res) => {
  try {
    const users = await Users.find({ email: { $ne: "admin@gmail.com" } }).populate('companyDetailsId userDetailsId')

    const userDetailIds = [];
    const companyDetailIds = [];

    // Iterate through users to collect detail IDs
    users.forEach((user) => {
      if (
        (user.userType === "Individual" || user.userType === "Startup") &&
        user.userDetailsId
      ) {
        userDetailIds.push(user.userDetailsId);
      } else if (user.userType === "Company" && user.companyDetailsId) {
        companyDetailIds.push(user.companyDetailsId);
      }
    });

    // Retrieve user details
    const userDetails = await UserDetails.find({ _id: { $in: userDetailIds } });
    const companyDetails = await CompanyDetails.find({
      _id: { $in: companyDetailIds },
    });

    // Map user details to their respective users
    users.forEach((user) => {
      if (
        (user.userType === "Individual" || user.userType === "Startup") &&
        user.userDetailsId
      ) {
        const userDetail = userDetails.find((detail) =>
          detail._id.equals(user.userDetailsId)
        );
        user.userDetails = userDetail; // Assign user details to user object
      } else if (user.userType === "Company" && user.companyDetailsId) {
        const companyDetails = companyDetails.find((detail) =>
          detail._id.equals(user.companyDetailsId)
        );
        user.companyDetails = companyDetails; // Assign company details to user object
      }
    });

    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.getParticularUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Retrieve the user
    const user = await Users.findById(userId)

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check user type and retrieve corresponding details
    let userDetails;
    let companyDetails;

    if ((user.userType === "Individual" || user.userType === "Startup") && user.userDetailsId) {
      userDetails = await UserDetails.findById(user.userDetailsId);
    } else if (user.userType === "Business" && user.companyDetailsId) {
      companyDetails = await CompanyDetails.findById(user.companyDetailsId)
    }

    // Add details to user object


    if (userDetails) {
      user.userDetailsId = userDetails;
    } else if (companyDetails) {
      user.companyDetailsId = companyDetails;
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.deleteUser = async (req, res) => {
  try {
    const userId = req.body.id;
    // const { id, isAdmin } = req.body;

    // Find the user by ID
    const user = await Users.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check user type and delete corresponding details
    if ((user.userType === "Individual" || user.userType === "Startup") && user.userDetailsId) {
      await UserDetails.findByIdAndDelete(user.userDetailsId);
    } else if (user.userType === "Company" && user.companyDetailsId) {
      await CompanyDetails.findByIdAndDelete(user.companyDetailsId);
    }

    // Delete the user
    await Users.findByIdAndDelete(userId);

    res.status(200).json({ message: 'User and associated details deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }

};


exports.updateStatusOfUser = async (req, res) => {
  try {
    const { id, status, isAdmin } = req.body;
    const challenge = await Users.findById(id);

    if (isAdmin === true || isAdmin === 'true' || challenge.postedBy === req.user._id) {
      const result = await Users.findByIdAndUpdate(
        id,
        { status: parseInt(status) },
        { new: true }
      );

      if (result) {
        return res.status(200).json({
          message: "Users Status has been changed",
        });
      } else {
        return res.status(404).json({
          message: "Users Status has not found",
        });
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

exports.ForgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999);
    const otpExpiry = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;

    await user.save({ validateModifiedOnly: true });

    // Configure nodemailer with debug
    // const transporter = nodemailer.createTransport({
    //   service: 'gmail', // Use 'gmail' or other services
    //   auth: {
    //     user: 'gauravkumarjha335@gmail.com', // Your email
    //     pass: 'vdoz kgtd gzpp obtn', // Your email password
    //   },
    // });


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


    // const transporter = nodemailer.createTransport({
    //   service: 'smtp.hostinger.com', // Use 'gmail' or other services
    //   auth: {
    //     user: 'info@unlockstartup.com', // Your email
    //     pass: 'Z2q^Hoj>K4', // Your email password
    //   },
    // });

    // Send OTP email
    const mailOptions = {
      from: 'info@unlockstartup.com',
      to: user.email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is ${otp}. It will expire in 10 minutes.`,
    };


    const info = await transporter.sendMail(mailOptions);

    console.log('Message sent: %s', info.messageId);
    // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

    console.log("Your OTp is ", `${otp}`);

    res.status(200).json({ message: 'Password reset OTP sent to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


// verifyOTP
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;


  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    // Find the user by email
    const user = await Users.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the OTP matches


    if (user.otp.toString() !== otp.toString()) {
      return res.status(400).json({ message: 'OTP Invalid' });
    }

    if (user.otp.toString() == otp.toString()) {
      return res.status(200).json({ message: 'OTP verified successfully' });
    }


  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.ResetPassword = async (req, res) => {

  const { email, otp, newPassword } = req.body;

  console.log(req.body);

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  if (!newPassword) {
    return res.status(400).json({ message: 'newPassword is required' });
  }

  try {
    // Find the user by email
    const user = await Users.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }


    console.log(otp, "otp");
    console.log(user.otp, "user.otp");
    console.log(user, "userdata")

    if (user.otp.toString() !== otp.toString()) {

      // if (user.otp !== otp) {s

      return res.status(400).json({ message: 'OTP Invalid' });
    }

    // If OTP is valid
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log(newPassword, "Password");
    console.log(hashedPassword, "hashedPassword");


    user.password = hashedPassword;
    user.otp = undefined;
    await user.save();

    res.status(200).json({ message: 'NewPassword updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};



exports.googleLogin = async (req, res, next) => {
  // console.log("googleLogin --------------", req.body);

  try {
    const { name, email, userType } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Email and name are required' });
    }



    const user = await Users.findOne({ email });
    if (!user) user = await Users.create({ name, email, userType });

    // const token = signJWT(user._id);
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType, // Add userType to payload if needed
      }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET);

    return res.status(201).json({
      status: true,
      message: "login successful",
      data: { user, token }
    });

  } catch (error) {
    next(error);
  }
}







