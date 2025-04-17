const InvestorDropdown = require('../models/InvestorDropdownModel');

// Get all dropdown values (optional filter by type)
exports.getAllDropdownValues = async (req, res) => {
    try {
        const { dropdownType } = req.query;
        
        let filter = {};
        if (dropdownType) {
            filter.dropdownType = dropdownType;
        }
        
        const result = await InvestorDropdown.find(filter).sort({ createdAt: -1 });
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// Get all dropdown values with pagination
exports.getAllDropdownValuesPagination = async (req, res) => {
    try {
        const { dropdownType } = req.query;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        
        let filter = {};
        if (dropdownType && dropdownType !== 'all') {
            filter.dropdownType = dropdownType;
        }
        
        const skip = (page - 1) * limit;
        
        const result = await InvestorDropdown.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
            
        const totalItems = await InvestorDropdown.countDocuments(filter);
        
        res.status(200).json({
            data: result,
            meta_data: {
                total_data: totalItems,
                current_page: page,
                data_limit: limit,
                total_pages: Math.ceil(totalItems / limit),
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// Add new dropdown value
exports.addDropdownValue = async (req, res) => {
    try {
        const {
            name,
            slug,
            dropdownType,
            isAdmin
        } = req.body;

        if (isAdmin !== true && isAdmin !== 'true') {
            return res.status(403).json({
                message: "Unauthorized User",
            });
        }

        // Check if item with same name and type already exists
        const existingItem = await InvestorDropdown.findOne({ 
            name,
            dropdownType
        });
        
        if (existingItem) {
            return res.status(409).json({
                message: "Item with this name already exists in this dropdown type"
            });
        }

        const newDropdownValue = new InvestorDropdown({
            name,
            slug,
            dropdownType,
        });

        const result = await newDropdownValue.save();
        
        res.status(201).json({
            message: 'New dropdown value has been added',
            data: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// Update dropdown value
exports.updateDropdownValue = async (req, res) => {
    try {
        const { id, name, slug, isAdmin } = req.body;

        if (isAdmin !== true && isAdmin !== 'true') {
            return res.status(403).json({
                message: "Unauthorized User",
            });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (slug) updateData.slug = slug;

        const updatedItem = await InvestorDropdown.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!updatedItem) {
            return res.status(404).json({
                message: "Dropdown value not found",
            });
        }

        res.status(200).json({
            message: "Dropdown value has been updated",
            data: updatedItem,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

// Toggle status
exports.toggleStatus = async (req, res) => {
    try {
        const { id, status, isAdmin } = req.body;

        if (isAdmin !== true && isAdmin !== 'true') {
            return res.status(403).json({
                message: "Unauthorized User",
            });
        }

        const result = await InvestorDropdown.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({
                message: "Dropdown value not found",
            });
        }

        res.status(200).json({
            message: 'Status has been updated',
            data: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// Delete dropdown value
exports.deleteDropdownValue = async (req, res) => {
    try {
        const { id, isAdmin } = req.body;

        if (isAdmin !== true && isAdmin !== 'true') {
            return res.status(403).json({
                message: "Unauthorized User",
            });
        }

        const result = await InvestorDropdown.findByIdAndDelete(id);
        
        if (!result) {
            return res.status(404).json({
                message: "Dropdown value not found",
            });
        }

        res.status(200).json({
            message: 'Dropdown value has been deleted',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}; 