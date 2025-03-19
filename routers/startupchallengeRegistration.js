const express = require("express");
const router = express.Router();
const startupchallengeRegistration = require('../controllers/startupchallengeRegistration');
const { upload } = require("../helpers/multer");


// router.post("/challengeregistration", upload.fields([
//   { name: 'file', maxCount: 1 },
 
// ]), startupchallengeRegistration.startupchallengeRegistration);



router.post("/challengeregistration", upload.fields([
    { name: 'attachment', maxCount: 1 },
    
  ]), startupchallengeRegistration.StartupChallengeRegistrationController);

router.get("/showregistration" , startupchallengeRegistration.GetAllRegistrationsController)


router.get("/showregistration-pagination" , startupchallengeRegistration.GetAllRegistrationsPagination)

router.get("/show-participated-pagination" , startupchallengeRegistration.UserChallengeRegistration)


router.post("/order" , startupchallengeRegistration.Order)



router.post("/verify" , startupchallengeRegistration.Verify)


// router.post('/api/verify-payment',startupchallengeRegistration.VeryfiyPayment)


module.exports = router;
