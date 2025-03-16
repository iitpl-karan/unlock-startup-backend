const express = require("express");
const router = express.Router();
const TestController = require('../controllers/TestController')
const { upload } = require('../helpers/multer')




router.post("/get-test-result", TestController.TestResult )


module.exports = router;
