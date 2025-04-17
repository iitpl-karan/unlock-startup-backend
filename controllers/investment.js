const InvestmentType = require('../models/InvestmentTypes')

exports.getAllInvestorType = async (req, res) => {
    try {
        const result = await InvestmentType.find()
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

exports.newInvestorType = async (req, res) => {
    try {
        const {
            name,
            slug,
            currentDate,
            isAdmin } = req.body;

        // const categoryimage = req.files.categoryimage[0].filename;

        if (isAdmin === true || isAdmin === 'true') {
            const isCategoryExist = await InvestmentType.findOne({ slug });
            if (isCategoryExist) {
                return res.status(409).json({
                    message: "InvestmentType already exist"
                })
            }
            const newCategory = new InvestmentType({
                name,
                slug,
                // categoryimage,
                createdAt: currentDate
            })
            const result = await newCategory.save()
            res.status(200).json({
                message: 'New InvestmentType has been added',
                data: result
            })
        } else {
            res.status(403).json({
                message: "Unauthorized User",
            });
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}


exports.updateInvestorTypeDetails = async (req, res) => {
    try {
        const { id, name, slug, isAdmin } = req.body;

        if (isAdmin === true || isAdmin === 'true') {
            const updateData = {};
            if (name) updateData.name = name;
            if (slug) updateData.slug = slug;
            // if (req.files.categoryimage) updateData.categoryimage = req.files.categoryimage[0].filename;


            const updatedChallenge = await InvestmentType.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            );

            if (updatedChallenge) {
                res.status(200).json({
                    message: "InvestmentType details have been updated",
                    data: updatedChallenge,
                });
            } else {
                res.status(404).json({
                    message: "InvestmentType not found",
                });
            }
        } else {
            res.status(403).json({
                message: "Unauthorized User",
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
}

exports.toggleStatus = async (req, res) => {
    const { id, status, isAdmin } = req.body

    console.log("req.body", req.body); // Debugging log

    try {
        if (isAdmin === true || isAdmin === 'true') {
            const result = await InvestmentType.findByIdAndUpdate(
                id,
                { status },
                { new: true }
            )
            res.status(200).json({
                message: 'Status has been updated',
                data: result
            })
        } else {
            res.status(403).json({
                message: "Unauthorized User",
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

exports.deleteInvestorType = async (req, res) => {
    const { id } = req.body;
    console.log("Received ID:", id); // Debugging log

    if (!id) {
        return res.status(400).json({ success: false, message: "InvestmentType ID is required" });
    }

    try {
        const result = await InvestmentType.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({ success: false, message: "InvestmentType not found" });
        }

        res.status(200).json({
            success: true,
            message: "InvestmentType has been deleted",
            result
        });
    } catch (error) {
        console.error("Delete Error:", error); // Log the error
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};
