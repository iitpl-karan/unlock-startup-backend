const express = require("express");
const router = express.Router();
const { upload } = require("../helpers/multer");
const InvestorController = require("../controllers/Investor");

router.get("/investortype", InvestorController.getAllInvestorType);
router.patch("/toggle-status", InvestorController.toggleStatus);
router.delete("/investortype", InvestorController.deleteInvestorType);

router.post("/investortype", upload.fields([
    { name: 'categoryimage', maxCount: 1 }
]), InvestorController.newInvestorType);

router.patch("/investortype", upload.fields([
    { name: 'categoryimage', maxCount: 1 }
]), InvestorController.updateInvestorTypeDetails);

router.post("/createInvestor", InvestorController.createNewInvestorUser);
router.post("/loginInvestor", InvestorController.InvestoruserLogin);

// Updated route for investor profile
router.post("/update-profile", upload.fields([
    { name: 'investorImage', maxCount: 1 },
    { name: 'companyLogo', maxCount: 1 }
]), InvestorController.updateInvestorProfile);

router.get("/get-investor-detail", InvestorController.getInvestorDetail);

router.get('/get-all-investors', InvestorController.getAllInvestors);

// New route to get all pitches for an investor
router.get('/get-investor-pitches/:investorId', InvestorController.getInvestorPitches);

// New route to update pitch status
router.patch('/update-pitch-status/:pitchId', InvestorController.updatePitchStatus);

// Add pitch payment routes
router.post("/create-pitch-order", InvestorController.createPitchOrder);
router.post("/verify-pitch-payment", InvestorController.verifyPitchPayment);

router.post("/submit-pitch", upload.fields([
    { name: 'pitch_deck', maxCount: 1 },
    { name: 'product_demo', maxCount: 1 },
    { name: 'supporting_documents', maxCount: 1 },
    { name: 'use_of_funds', maxCount: 1 }
]), InvestorController.submitPitch);

// New route to get investor pitch statistics
router.get('/get-investor-pitch-statistics/:investorId', InvestorController.getInvestorPitchStatistics);

module.exports = router;
