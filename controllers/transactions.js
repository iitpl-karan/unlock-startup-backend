// const Payment = require("../models/transactionsModel");
const Payment = require("../models/Payment");
const registerevent = require("../models/PayForregisterevent");
const registerchallenges = require("../models/uploadchallengespayment");
const PitchDeckPurchase = require('../models/pitchDeckBooking')




// exports.getAllTransactions = async (req, res) => {
//   try {
//     const result = await Payment.find().populate('user').populate('user')
//     res.status(200).json(result);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// }




exports.getAllTransactions = async (req, res) => {

  try {

    const challenge = await registerchallenges.find().populate('userId')

    const event = await registerevent.find().populate('userId')
    const PitchDeck = await PitchDeckPurchase.find().populate('userId')

    let data = [...challenge, ...event, ...PitchDeck]

    res.status(200).json({ data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}


exports.getAllTransactionsPagination = async (req, res) => {

  try {

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const skip = (page - 1) * limit;


    const challenge = await registerchallenges.find()
      .populate('userId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })


    const event = await registerevent.find()
      .populate('userId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })


    const PitchDeck = await PitchDeckPurchase.find()
      .populate('userId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    let data = [...challenge, ...event, ...PitchDeck]

    const totalChallenges = await registerchallenges.countDocuments();
    const totalEvents = await registerevent.countDocuments();
    const totalPitchDecks = await PitchDeckPurchase.countDocuments();


    const totalData = totalChallenges + totalEvents + totalPitchDecks;
    const totalPages = Math.ceil(totalData / limit);


    res.status(200).json(


      {
        data: data,
        meta_data: {
          total_data: totalData,
          current_page: page,
          data_limit: limit,
        total_pages: Math.ceil(totalChallenges / limit),
        },
      }



    );

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}









exports.getUserTransactions = async (req, res) => {

  let { userid } = req.body


  console.log(userid);


  try {
    // const challenge = await registerchallenges.find({ userId: userid }).populate('userId')
    // const event = await registerevent.find({ userId: userid }).populate('userId')
    // const PitchDeck = await PitchDeckPurchase.find({ userId: userid }).populate('userId')


    const challenge = await registerchallenges.find({ userId: userid }).populate('userId')

    const event = await registerevent.find({ userId: userid }).populate('userId')
    const PitchDeck = await PitchDeckPurchase.find({ userId: userid }).populate('userId')

    let data = [...challenge, ...event, ...PitchDeck]

    res.status(200).json({ data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}





exports.createTransaction = async (req, res) => {
  try {
    const {
      transactionDetails,
      paymentMode,
      transactionStatus,
      transactionDate,
    } = req.body;

    const newTransaction = new Payment({
      transactionDetails,
      paymentMode,
      transactionStatus,
      transactionDate,
    });

    const savedTransaction = await newTransaction.save();

    if (savedTransaction) {
      res.status(201).json({
        message: "Transaction created successfully",
        data: savedTransaction,
      });
    } else {
      res.status(500).json({ error: "Unable to create transaction" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateTransactionStatus = async (req, res) => {
  try {
    const { id, transactionStatus } = req.body;

    // Construct the update object with the fields to be updated
    const updateData = { transactionStatus };

    // Perform the update operation
    const updatedTransaction = await Payment.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (updatedTransaction) {
      res.status(200).json({
        message: "Transaction status has been updated",
        data: updatedTransaction,
      });
    } else {
      res.status(404).json({
        message: "Transaction not found",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
