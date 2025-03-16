
// const { ApiError } = require("../errorHandler/apiErrorHandler");
const User = require("../models/usersModel");
const verifyJWT = require("../utils/verifyJWT");

const userAuth = async (req, res, next) => {
	try {
		const header = req.header('Authorization');
		if (!header) {
            return res.status(400).json({ message: "header is required" });
        }
		const token = header.split(" ")[1];
		if (!token) {
            return res.status(400).json({ message: "token is required" });
        }

		const user = verifyJWT(token);

		// const rootUser = await User.findById(user.userId);

		const rootUser = await User.findById(user.user.id);

		if (!rootUser) {
            return res.status(404).json({ message: "user does not exist" });
        }
		if (rootUser.is_deleted) throw new ApiError('user doest not exist', 404);

		req.user = rootUser;
		next();
	} catch (error) {	
		next(error);
	}
}

module.exports = userAuth;

