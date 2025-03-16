const express = require("express");
const router = express.Router();
const normaluser = require('../controllers/users')
const { upload } = require('../helpers/multer')

router.post("/register", normaluser.createNewUser);
router.post("/user-login", normaluser.userLogin);

router.get("/get-all-users", normaluser.getAllUsers);
router.get("/get-particular-user", normaluser.getParticularUser);
router.delete("/delete-user", normaluser.deleteUser);



module.exports = router;