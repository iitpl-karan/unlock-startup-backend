const Payment = require("../models/Payment");


exports.RazorpayResponse = async (req, res) => {
    try {
        // console.log(req.body.payload.payment.entity, "Razorpay Response");

        // const { amount, status, order_id, method, captured, description, card_id } = req.body.payload.payment.entity;
        const { amount, status, order_id, method, captured, description, card_id } = req.body ;


        // Create new startup challenge
        const payment = new Payment({
            amount,
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

