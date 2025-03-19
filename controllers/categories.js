const Categories = require('../models/categoriesModel')

exports.getAllCategories = async (req, res) => {
    try {
        const result = await Categories.find()
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

exports.newCategory = async (req, res) => {
    try {
        const {
            name,
            slug,
            currentDate,
            isAdmin } = req.body;


        const categoryimage = req.files.categoryimage[0].filename;



        if (isAdmin === true || isAdmin === 'true') {
            const isCategoryExist = await Categories.findOne({ slug });
            if (isCategoryExist) {
                return res.status(409).json({
                    message: "Category already exist"
                })
            }

            const newCategory = new Categories({
                name,
                slug,
                categoryimage,
                createdAt: currentDate
            })
            const result = await newCategory.save()
            res.status(200).json({
                message: 'New Category has been added',
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


exports.updateCategoryDetails = async (req, res) => {
    try {
        const { id, name, slug, isAdmin } = req.body;

        if (isAdmin === true || isAdmin === 'true') {
            const updateData = {};
            if (name) updateData.name = name;
            if (slug) updateData.slug = slug;
            if (req.files.categoryimage) updateData.categoryimage = req.files.categoryimage[0].filename;


            const updatedChallenge = await Categories.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            );

            if (updatedChallenge) {
                res.status(200).json({
                    message: "Category details have been updated",
                    data: updatedChallenge,
                });
            } else {
                res.status(404).json({
                    message: "Category not found",
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
    try {
        if (isAdmin === true || isAdmin === 'true') {
            const result = await Categories.findByIdAndUpdate(
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

exports.deleteCategory = async (req, res) => {
    const { id } = req.body;
    try {
        const result = await Categories.findByIdAndDelete(id)
        res.status(200).json({
            message: 'Category has been deleted',
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}