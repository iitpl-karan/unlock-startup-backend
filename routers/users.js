const express = require("express");
const router = express.Router();
const usersController = require('../controllers/users')
const { upload } = require('../helpers/multer')

router.post("/register", usersController.createNewUser);
router.post("/update-status", usersController.updateUserStatus);
router.post("/user-login", usersController.userLogin);

router.get("/get-all-users", usersController.getAllUsers);

router.get("/get-all-users-pagination", usersController.getAllUsersPagination);
router.get("/get-investor-users-pagination", usersController.getInvestorUsersPagination);
router.get("/get-business-users-pagination", usersController.getBusinessUsersPagination);

router.get("/get-normal-users-pagination", usersController.getNormalUserPaginaion);

router.get("/get-particular-user/:userId", usersController.getParticularUser);
router.delete("/delete-user", usersController.deleteUser);
router.patch("/toggle-status", usersController.updateStatusOfUser);
router.get("/company-details", usersController.getCompanyDetails);

router.patch("/update-company", upload.fields([
    { name: 'logo', maxCount: 1 }
  ]),usersController.updateCompanyDetails);

router.put("/update-user", usersController.updateUser);

router.post("/admin-login", usersController.adminLogin);
router.get("/get-admin-details", usersController.getAdminDetails);
router.patch("/update-admin-details", upload.single('image'), usersController.updateAdminDetails);
router.post("/create-admin", usersController.createadmin);
router.post("/business-login", usersController.BusinessLogin);
router.post("/forget-password", usersController.ForgetPassword);
router.post("/verify-otp", usersController.verifyOTP);
router.post("/reset-password", usersController.ResetPassword);


router.post("/google-login", upload.fields([
  { name: 'logo', maxCount: 1 }
]), usersController.googleLogin);

router.patch("/update-user-details", upload.single('avatar'), usersController.updateUserDetails);

module.exports = router;