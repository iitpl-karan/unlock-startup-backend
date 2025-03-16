const express = require("express");
const router = express.Router();
const { upload } = require("../helpers/multer");


const enquiryController = require("../controllers/enquiry");

router.get("/get-all-enquiries", enquiryController.getAllEnquiries);

router.get("/get-all-enquiries-pagination", enquiryController.getAllEnquiriesPagination);




router.post("/send-enquiry",
    upload.fields([
        { name: 'attachment', maxCount: 1 },
      ]),
    
    enquiryController.newEnquiry);
router.patch("/update-status", enquiryController.toggleStatus);

module.exports = router;
