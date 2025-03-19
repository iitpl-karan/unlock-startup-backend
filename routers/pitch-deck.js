const express = require("express");
const router = express.Router();
const pitchDeckController = require('../controllers/pitch-deck')
const { upload } = require('../helpers/multer')

router.post("/add-pitch-deck",

  // upload.array('attachments'),


  upload.fields([
    { name: 'thumbnailImage', maxCount: 1 },
    { name: 'coverImage', maxCount: 10 },
    { name: 'attachments', maxCount: 10 },

  ]),
  pitchDeckController.createPitchDeck);



  router.post("/add-pitch-catogery", pitchDeckController.AddPitchDeckcatogery);
  router.get("/get-pitch-catogery", pitchDeckController.GetPitchDeckcatogery);


router.get("/get-all-pitch-decks", pitchDeckController.getAllPitchDecks);

router.get("/get-pitch-deck-details", pitchDeckController.getPitchDeckDetails);

router.get("/get-all-pitch-decks-paginaion", pitchDeckController.getPitchDeckPagination);


router.patch("/update-pitch-deck-details", 
  
  upload.fields([
    { name: 'thumbnailImage', maxCount: 1 },
    { name: 'coverImage', maxCount: 10 },
    { name: 'attachments', maxCount: 10 },
  ]),
pitchDeckController.updatePitchDeckDetails);


router.patch("/update-status-of-pitch-deck", pitchDeckController.updateStatusOfPitchDeck);

router.patch("/update-paymentstatus-of-pitch-deck", pitchDeckController.updatePaymentStatusOfPitchDeck);
router.delete("/delete-pitch-deck", pitchDeckController.deletePitchDeck);



// router.post("/buy-pitch-deck", upload.fields([
//   { name: 'attachment', maxCount: 1 },

// ]), pitchDeckController.BuyPitchDeck);

router.post("/buy-pitch-deck", pitchDeckController.BuyPitchDeck);

router.post("/verify", pitchDeckController.Verify);


router.get("/get-all-purchase-decks", pitchDeckController.getAllBookingPitchDesk);

router.get("/get-all-purchase-decks-pagination", pitchDeckController.getUserBookingPitchDesk);




module.exports = router;
