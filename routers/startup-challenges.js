const express = require("express");
const router = express.Router();
const startupChallengeController = require('../controllers/startup-challenges');
const { upload } = require("../helpers/multer");
const userAuth = require("../middlewares/userAuth");


router.post('/add-challenge', upload.fields([
  { name: 'thumbnailImage', maxCount: 1 },
  { name: 'bannerImage', maxCount: 1 },
  { name: 'attachments', maxCount: 10 },
]), startupChallengeController.createStartupChallenge);

router.patch('/upload-result', upload.fields([
  { name: 'resultattachment', maxCount: 1 },
]), startupChallengeController.uploadresult);

router.get("/get-all-result", startupChallengeController.Postedresult);

router.get("/get-result-details", startupChallengeController.DetailsPostedresult);

router.get("/get-all-challenges", startupChallengeController.getAllStartUpChallenges);

router.get("/get-all-challenges-pagination", startupChallengeController.getAllChallengeswithpagination);

router.get("/get-user-challenges-pagination", startupChallengeController.getUserChallengeswithpagination);

router.get("/get-user-uploadresult-pagination", startupChallengeController.getUserUploadresultwithpagination);

router.get("/get-admin-uploadresult-pagination", startupChallengeController.getAdminUploadresultwithpagination);


router.get("/get-challenge-details", startupChallengeController.getStartupChallengeDetails);

router.delete("/delete-challenge", userAuth ,  startupChallengeController.deleteStartupChallenge);

router.delete("/delete-challenge-admin", userAuth ,  startupChallengeController.deleteChallengeByAdmin);

router.delete("/delete-challenge-result", userAuth ,  startupChallengeController.deleteResultAdminChallenge);

router.patch("/update-challenge-details", upload.fields([
  { name: 'thumbnailImage', maxCount: 1 },
  { name: 'bannerImage', maxCount: 1 },
  { name: 'attachments', maxCount: 10 },
  
]), userAuth , startupChallengeController.updateStartupChallengeDetails);

router.post("/get-all-challenges-filter", startupChallengeController.getAllStartUpChallengesFilter);

router.patch("/update-status-of-challenge", startupChallengeController.updateStatusOfStartupChallenge);

router.patch("/update-payment-status-of-challenge", startupChallengeController.updatePaymentStatusOfStartupChallenge);

router.post("/add-challenge-payment", startupChallengeController.makepaymnt);

router.post("/admin-verify-add-challenge-payment", startupChallengeController.AdminPayment);

router.post("/verify-add-challenge-payment", startupChallengeController.VerifyPayment);

router.post("/admin-update-enddate", startupChallengeController.AdminUpdateEnddate);

router.post("/update-end-date", startupChallengeController.UserUpdateEnddate);

router.post("/razorpayresponse", startupChallengeController.RazorpayResponse);



module.exports = router;
