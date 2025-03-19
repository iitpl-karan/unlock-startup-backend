const express = require("express");
const router = express.Router();
const eventregistartion = require('../controllers/eventRegistrartion');
const { upload } = require("../helpers/multer");




  

router.post("/create-eventregistration", upload.fields([
    { name: 'attachment', maxCount: 1 },
    
  ]), eventregistartion.EventRegistrationController);

router.get("/show-eventregistration" , eventregistartion.GetEventRegistrationController)

router.get("/show-eventregistration-pagination" , eventregistartion.GetEventRegistrationControllerUser)

router.get("/show-user-eventregistration-pagination" , eventregistartion.GetUserParticipatedEvent)


module.exports = router;
