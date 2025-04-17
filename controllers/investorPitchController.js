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

// Get all pitches for a user with pagination
exports.getUserPitchesPagination = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;
        
        // Optional filters
        const { status } = req.query;
        let query = { user: req.user._id };
        
        if (status && status !== 'all') {
            query.status = status;
        }
        
        const pitches = await InvestorPitch.find(query)
            .populate('investor', 'investorname investoremail')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const totalItems = await InvestorPitch.countDocuments(query);
        
        res.status(200).json({
            success: true,
            data: pitches,
            meta_data: {
                total_data: totalItems,
                current_page: page,
                data_limit: limit,
                total_pages: Math.ceil(totalItems / limit),
            }
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