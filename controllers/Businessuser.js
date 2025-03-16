const Businessuser = require("../models/Businessuser");
const UserDetails = require("../models/usersDetailsModel");
const CompanyDetails = require("../models/companyDetailsModel");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Businesstype = require('../models/businesstype')



exports.createNewBusinessUser = async (req, res) => {
    try {
        const { companyname,  companyemail, password, since  , industerytype } = req.body;

        // Check if user with the same companyemail already exists
        const userAlreadyExist = await Businessuser.findOne({ companyemail });

        if (userAlreadyExist) {
            return res.status(400).json({ message: "Company already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user document
        const newUser = new Businessuser({
            companyname,
            companyemail,
            password: hashedPassword,
         
            since,
            industerytype

        });

        // Save the new user to the database
        const savedUser = await newUser.save();

        if (savedUser) {
            return res.status(200).json({ message: "Company has been saved successfully" });
        } else {
            return res.status(500).json({ message: "Unable to add new Company in users collection" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Some server error occurred" });
    }
};



exports.BusinessuserLogin = async (req, res) => {
    try {
        const { companyemail, password , userType} = req.body;
        const user = await Businessuser.findOne({ companyemail });

        if (!user) {
            return res.status(400).json({
                message: "Company does not exist",
            });
        }

        
        if (user.userType !== 'Business') {
            return res.status(400).json({
              message: "Incorrect user type",
            }); 
          }
    
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Incorrect password",
            });
        }
        const payload = {
            user: {
                id: user.id,
                companyemail: user.companyemail,
             
            }
        };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.status(200).json({ 
                token, 
                message: "Login Successfull" ,
                user
            });
          }
        );
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Server error occurred",
        });
    }
};


exports.BusinessgetAllUsers = async (req, res) => {
    try {
        const users = await Businessuser.find({ companyemail: { $ne: "admin@gmail.com" } });

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

exports.BusinessgetParticularUser = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Retrieve the user
        const user = await Businessuser.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check user type and retrieve corresponding details
        let userDetails;
        let companyDetails;
        if ((user.userType === "Individual" || user.userType === "Startup") && user.userDetailsId) {
            userDetails = await UserDetails.findById(user.userDetailsId);
        } else if (user.userType === "Company" && user.companyDetailsId) {
            companyDetails = await CompanyDetails.findById(user.companyDetailsId);
        }

        // Add details to user object
        if (userDetails) {
            user.userDetails = userDetails;
        } else if (companyDetails) {
            user.companyDetails = companyDetails;
        }

        res.status(200).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


exports.BusinessdeleteUser = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Find the user by ID
        const user = await Businessuser.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Check user type and delete corresponding details
        if ((user.userType === "Individual" || user.userType === "Startup") && user.userDetailsId) {
            await UserDetails.findByIdAndDelete(user.userDetailsId);
        } else if (user.userType === "Company" && user.companyDetailsId) {
            await CompanyDetails.findByIdAndDelete(user.companyDetailsId);
        }

        // Delete the user
        await Businessuser.findByIdAndDelete(userId);

        res.status(200).json({ message: 'Company and associated details deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }

};


exports.addtype = async (req, res) => {
    const { name } = req.body;

    // Validate the input
    if (!name) {
        return res.status(400).json({ error: 'Type is required' });
    }

    try {
        // Create a new instance of the Businesstype model
        const newType = new Businesstype({ name });

        // Save the instance to the database
        await newType.save();

        res.status(200).json({ message: 'Type added successfully' });
    } catch (err) {
        console.error('Error adding type:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



exports.gettypeAll = async (req, res) => {
 
    try {
       const data = await Businesstype.find({})
   

       res.status(200).json(data);
    } catch (err) {
        console.error('Error adding type:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


exports.getAllStartUpChallenges = async (req, res) => {
    try {
  
  
      const startupChallenges = await StartupChallenges.find({}).populate('category postedBy state city')
  
  
      res.status(200).json(startupChallenges);
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  




