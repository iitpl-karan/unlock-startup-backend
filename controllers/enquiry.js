const Enquiry = require("../models/enquiriesModel");
const nodemailer = require('nodemailer')
const baseUrl = require('../services/baseUrl')


exports.getAllEnquiries = async (req, res) => {
    try {
        const result = await Enquiry.find();
        return res.status(200).json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Some server error occurred",
        });
    }
};


exports.getAllEnquiriesPagination = async (req, res) => {
    try {

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;

        const skip = (page - 1) * limit;

        const result = await Enquiry.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })

        const totalEnquiry = await Enquiry.countDocuments({});

        res.status(200).json(
            {
                data: result,
                meta_data: {
                    total_data: totalEnquiry,
                    current_page: page,
                    data_limit: limit,
                    total_pages: Math.ceil(totalEnquiry / limit),
                },
            }
        );

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Some server error occurred",
        });
    }
};








exports.newEnquiry = async (req, res) => {
    try {
        const { fullName, companyname, email, contactNo, message } = req.body;


        const attachment = req.files.attachment?.[0]?.filename;



        const newEnquiry = new Enquiry({
            fullName,
            companyname,
            email,
            contactNo,
            message,
            attachment: attachment,
        });



        const result = await newEnquiry.save();

        // return res.status(201).json({
        //     message: "New enquiry added",
        // });


        if (result) {

            let transporter = nodemailer.createTransport({
                host: "smtp.hostinger.com",
                // Use 'gmail' or other services
                port: 587,
                secure: false,
                auth: {
                    user: 'info@unlockstartup.com', // Your email
                    pass: 'Z2q^Hoj>K4', // Your email passwords
                },
            });

            const mailOptions = {
                from: 'info@unlockstartup.com',
                to: 'contact@unlockstartup.com',
                subject: 'New Enquiry Received',
                // text: `Name: ${fullName}\nCompany${companyname}\nEnquiry No: ${result.enquiryNo}\nEmail: ${email}\nContact No: ${contactNo}\nMessage: ${message}\n`,
                html: `  <div>
                               Name: ${fullName}<br>Company${companyname}<br>Enquiry No: ${result.enquiryNo}<br>Email: ${email}<br>Contact No: ${contactNo}\<br>Message: ${message}\<br>
                               <a href="${baseUrl}/uploads/${attachment}">view attachment </a>          
                        </div>`
            };


            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                    return res.status(500).json({
                        message: "Error occurred while sending email",
                    });
                } else {
                    return res.status(200).json({
                        message: "New enquiry added",
                    });
                }
            });
        } else {
            return res.status(500).json({
                message: "Unable to add new enquiry in database",
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Some server error occured",
        });
    }
};

exports.toggleStatus = async (req, res) => {
    try {
        const { id, status, isAdmin } = req.body;
        const challenge = await Enquiry.findById(id);

        if (isAdmin === true || isAdmin === 'true' || challenge.postedBy === req.user._id) {
            const result = await Enquiry.findByIdAndUpdate(
                id,
                { status: parseInt(status) },
                { new: true }
            );

            if (result) {
                return res.status(200).json({
                    message: "Status has been changed",
                });
            } else {
                return res.status(404).json({
                    message: "Enquiry not found",
                });
            }
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: "Internal server error occurred",
        });
    }
}