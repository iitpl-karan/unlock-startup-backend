const express = require("express");
const router = express.Router();
const settingsController = require('../controllers/settings')
const { upload } = require('../helpers/multer')

router.patch("/update-general-settings", upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 }
]), settingsController.addorUpdateGeneralData);


router.get("/get-general-details", settingsController.getAllGeneralData)


module.exports = router;
