const express = require('express');
const router = express.Router();
const investorPitchController = require('../controllers/investorPitchController');
const userAuth = require('../middlewares/userAuth');

// Route to create a new pitch
router.post('/create', userAuth, investorPitchController.createPitch);

// Route to get all pitches for an investor
router.get('/investor-pitches/:investorId', userAuth, investorPitchController.getInvestorPitches);

// Route to get all pitches for the current user
router.get('/user-pitches', userAuth, investorPitchController.getUserPitches);

// Route to update pitch status
router.patch('/update-status/:pitchId', userAuth, investorPitchController.updatePitchStatus);

module.exports = router; 