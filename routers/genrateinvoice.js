const express = require("express");
const router = express.Router();
const GenrateInvoice = require('../controllers/Invoice')
const { upload } = require('../helpers/multer')


router.post("/generate", GenrateInvoice.PitchDeckInvoice);
router.post("/challenge-invoice-generate", GenrateInvoice.ChallengeInvoice);
router.post("/event-invoice-generate", GenrateInvoice.EventInvoice);
router.post("/test-route", GenrateInvoice.TestEmail);

module.exports = router;