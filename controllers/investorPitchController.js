const InvestorPitch = require('../models/InvestorPitch');

// Create a new pitch
exports.createPitch = async (req, res) => {
    try {
        const {
            investorId,
            startupName,
            pitchDeck,
            businessPlan,
            fundingAmount,
            equity,
            description
        } = req.body;

        const newPitch = new InvestorPitch({
            investor: investorId,
            user: req.user._id, // This will come from auth middleware
            startupName,
            pitchDeck,
            businessPlan,
            fundingAmount,
            equity,
            description
        });

        await newPitch.save();

        res.status(201).json({
            success: true,
            message: 'Pitch submitted successfully',
            data: newPitch
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error submitting pitch',
            error: error.message
        });
    }
};

// Get all pitches for an investor
exports.getInvestorPitches = async (req, res) => {
    try {
        const pitches = await InvestorPitch.find({ investor: req.params.investorId })
            .populate('user', 'name email')
            .populate('investor', 'investorname investoremail');

        res.status(200).json({
            success: true,
            data: pitches
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching pitches',
            error: error.message
        });
    }
};

// Get all pitches for a user
exports.getUserPitches = async (req, res) => {
    try {
        const pitches = await InvestorPitch.find({ user: req.user._id })
            .populate('investor', 'investorname investoremail');

        res.status(200).json({
            success: true,
            data: pitches
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching pitches',
            error: error.message
        });
    }
};

// Update pitch status
exports.updatePitchStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const pitch = await InvestorPitch.findByIdAndUpdate(
            req.params.pitchId,
            { status },
            { new: true }
        );

        if (!pitch) {
            return res.status(404).json({
                success: false,
                message: 'Pitch not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Pitch status updated successfully',
            data: pitch
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating pitch status',
            error: error.message
        });
    }
}; 