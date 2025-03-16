const express = require("express");
const router = express.Router();


const { upload } = require("../helpers/multer");


const categoriesController = require("../controllers/categories");

router.get("/get-all-categories", categoriesController.getAllCategories);
router.patch("/toggle-status", categoriesController.toggleStatus);
router.delete("/delete-category", categoriesController.deleteCategory);



router.post("/add-new-category", upload.fields([
    { name: 'categoryimage', maxCount: 1 }
]), categoriesController.newCategory);

router.patch("/update-category-details", upload.fields([
    { name: 'categoryimage', maxCount: 1 }
]), categoriesController.updateCategoryDetails);


module.exports = router;
