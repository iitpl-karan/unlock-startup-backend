const express = require("express");
const router = express.Router();
const pagesController = require("../controllers/pages");
const { upload } = require('../helpers/multer')


router.get("/get-all-pages", pagesController.getAllPages);
router.post("/add-new-page", upload.single('metaimage'), pagesController.addNewPage);
router.get("/get-page-details", pagesController.getPageDetails);
router.get("/get-page-details-using-slug", pagesController.getPageDetailsBySlugName);
router.patch("/update-page", upload.single('metaimage'), pagesController.updatePageDetails);
router.patch("/toggle-status", pagesController.toggleStatusOfPage);
router.delete("/delete-page", pagesController.deletePage);


module.exports = router;
