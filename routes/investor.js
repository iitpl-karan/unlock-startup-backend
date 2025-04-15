router.get('/get-investor-pitches/:investorId', auth, investorController.getInvestorPitches);
router.put('/move-to-history/:pitchId', auth, investorController.moveToHistory); 