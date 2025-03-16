const express = require("express");
const router = express.Router();
const { upload } = require("../helpers/multer");
const InvestmentController = require("../controllers/investment");

router.get("/investmentype", InvestmentController.getAllInvestorType);
router.patch("/toggle-status", InvestmentController.toggleStatus);
router.delete("/investmentype", InvestmentController.deleteInvestorType);

router.post("/investmentype", upload.fields([
    { name: 'categoryimage', maxCount: 1 }
]), InvestmentController.newInvestorType);

router.patch("/investmentype", upload.fields([
    { name: 'categoryimage', maxCount: 1 }
]), InvestmentController.updateInvestorTypeDetails);

module.exports = router;
