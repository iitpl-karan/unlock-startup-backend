const NormalUsers = require("../models/normaluser");
const UserDetails = require("../models/usersDetailsModel");
const CompanyDetails = require("../models/companyDetailsModel");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.createNewUser = async (req, res) => {
    try {
        const { username, email, password, userType } = req.body;

        // Check if user with the same email already exists
        const userAlreadyExist = await NormalUsers.findOne({ email });

        if (userAlreadyExist) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user document
        const newUser = new Users({
            username,
            email,
            password: hashedPassword,
            userType
        });

        // Save the new user to the database
        const savedUser = await NormalUsers.save();

        if (savedUser) {
            return res.status(200).json({ message: "User has been saved successfully" });
        } else {
            return res.status(500).json({ message: "Unable to add new user in users collection" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Some server error occurred" });
    }
};



exports.userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await NormalUsers.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "User does not exist",
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
                email: user.email,
            }
        };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.status(200).json({ token, message: "Login Successfull" });
        }
        );
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Server error occurred",
        });
    }
};


exports.getAllUsers = async (req, res) => {
    try {
        const users = await NormalUsers.find({ email: { $ne: "admin@gmail.com" } });

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
        const user = await NormalUsers.findById(userId);

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

exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Find the user by ID
        const user = await NormalUsers.findById(userId);

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
        await NormalUsers.findByIdAndDelete(userId);

        res.status(200).json({ message: 'User and associated details deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }

};
