const Payment = require("../models/Payment");
const PitchDeckPurchase = require('../models/pitchDeckBooking')
const PitchDecks = require("../models/pitchDeckModel");
const Users = require("../models/usersModel");
const registerchallenges = require("../models/uploadchallengespayment");
const StartupChallenges = require("../models/startupChallengesModel");
const Events = require("../models/eventsModel");
const registerevent = require("../models/PayForregisterevent");
const nodemailer = require('nodemailer');


const baseUrl = require('../services/baseUrl')


// const logo = require('../public/uploads/Logo.png')



exports.PitchDeckInvoice = async (req, res) => {
    try {



        const { userId, pitchDeckId } = req.body;

        console.log(req.body, "data")
        const invoicedata = await PitchDeckPurchase.find({ userId: userId, pitchDeckId: pitchDeckId });

        const orderid = invoicedata[0]?.order_id

        const paymentdata = await Payment.findOne({ order_id: orderid })

        const userdata = await Users.findById(userId).populate('companyDetailsId')


        const PitchDeskDetals = await PitchDecks.findById(pitchDeckId);

        const dataname = PitchDeskDetals?.pitchDeckName

        let paymentid = invoicedata?.pitchDeckName

        if (invoicedata) {
            res.status(201).json({

                invoicedata: invoicedata[0],
                // PitchDeskDetals,
                dataname,
                // orderid,
                paymentdata,
                userdata
            });
        } else {
            return res.status(500).json({ error: "Unable to save payment details" });
        }
    } catch (error) {
        console.error("Error while saving payment details:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


exports.ChallengeInvoice = async (req, res) => {
    try {



        const { userId, Challengeid } = req.body;

        console.log(req.body, "data")
        const invoicedata = await registerchallenges.find({ userId: userId, challengeid: Challengeid });

        const orderid = invoicedata[0]?.order_id

        const paymentdata = await Payment.findOne({ order_id: orderid })

        const userdata = await Users.findById(userId).populate('companyDetailsId')


        const Challengedetails = await StartupChallenges.findById(Challengeid);

        const dataname = Challengedetails?.challengeName

        let paymentid = invoicedata?.challengeName

        if (invoicedata) {
            res.status(201).json({

                invoicedata: invoicedata[0],
                // Challengedetails,
                dataname,
                // orderid,
                paymentdata,
                userdata
            });
        } else {
            return res.status(500).json({ error: "Unable to save payment details" });
        }
    } catch (error) {
        console.error("Error while saving payment details:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


exports.EventInvoice = async (req, res) => {
    try {

        const { userId, eventid } = req.body;

        console.log(req.body, "data")
        const invoicedata = await registerevent.find({ userId: userId, eventid: eventid });

        const orderid = invoicedata[0]?.order_id

        const paymentdata = await Payment.findOne({ order_id: orderid })

        const userdata = await Users.findById(userId).populate('companyDetailsId')


        const EventDetails = await Events.findById(eventid);

        const dataname = EventDetails?.eventName

        let paymentid = invoicedata?.eventName

        if (invoicedata) {
            res.status(201).json({

                invoicedata: invoicedata[0],
                // Challengedetails,
                dataname,
                // orderid,
                paymentdata,
                userdata
            });
        } else {
            return res.status(500).json({ error: "Unable to save payment details" });
        }
    } catch (error) {
        console.error("Error while saving payment details:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};




exports.TestEmail = async (req, res) => {
    try {

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
            // to: useremail,
            to: 'gauravinvoidea@gmail.com', // list of receivers
            subject: 'Congratulations! Your request has been approved.',
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">
                <h2 style="color: #333;">Welcome to Unlock Startup</h2>
                <p>Dear Sir/Madam,</p>
                <p>Congratulations! Your request has been approved. We’re excited to move forward and post your content live.</p>
                <p>To finalize, please complete the payment process via your dashboard. Once the payment is confirmed, your post will go live!</p>
                <p>If you have any questions or need assistance, feel free to reach out.</p>
                <p>Thank you for choosing us!</p>
                <p style="margin-top: 20px;">Best Regards,<br>
                Unlock Startup<br>
                Email: <a href="mailto:info@unlockstartup.com">info@unlockstartup.com</a><br>
                Mobile: +919266733959</p>
                <img src="https://unlockstartup.com/unlock/uploads/Logo.png" alt="" />

       
              </div>
            `,
        };

        const info1 = await transporter.sendMail(mailOptions);


        if (info1) {
            res.status(200).json({ message: "Email sent successfully" });
        }



        console.log(info1, "info1")

    } catch (error) {
        console.error("Error while saving payment details:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

