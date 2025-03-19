const Pages = require("../models/pagesModel");
const StartupChallenges = require("../models/startupChallengesModel");
const nodemailer = require('nodemailer');

exports.TestResult = async (req, res) => {
    try {
        // Configure the email transport using the SMTP transport
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
            to: 'gauravkumarjha335@gmail.com', // recipient address
            subject: 'New Challenge Created',
            text: 'One New Challenge has been Created By', // Fixed typo in "Created"
        };

        // Send mail with defined transport object
        const info = await transporter.sendMail(mailOptions);

        // Check if the email was sent successfully
        if (info.accepted.length > 0) {
            return res.status(200).json({
                message: "Email sent successfully!",
                info: info // Optional: you can include additional info if needed
            });
        } else {
            return res.status(400).json({
                message: "Email not sent.",
            });
        }
    } catch (err) {
        console.error("Error sending email:", err);
        res.status(500).json({
            message: "Some server error occurred",
            error: err.message // Optional: include error message for debugging
        });
    }
};
