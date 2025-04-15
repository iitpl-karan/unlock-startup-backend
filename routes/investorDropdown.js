const express = require('express');
const router = express.Router();
const investorDropdownController = require('../controllers/investorDropdown');

// Get all dropdown values (with optional filtering by type)
router.get('/get-all', investorDropdownController.getAllDropdownValues);

// Add new dropdown value
router.post('/add', investorDropdownController.addDropdownValue);

// Update dropdown value
router.put('/update', investorDropdownController.updateDropdownValue);

// Toggle status
router.put('/toggle-status', investorDropdownController.toggleStatus);

// Delete dropdown value
router.delete('/delete', investorDropdownController.deleteDropdownValue);

module.exports = router; 