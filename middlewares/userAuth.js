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

		const userPayload = verifyJWT(token);
		console.log(userPayload, "userPayload from token");
		
		if (!userPayload || !userPayload.user) {
			return res.status(401).json({ message: "Invalid token or user data" });
		}

		// First try to find user by id
		let rootUser = await User.findById(userPayload.user.id);
		
		// If not found and userId exists, try to find by userId
		if (!rootUser && userPayload.user.userId) {
			rootUser = await User.findById(userPayload.user.userId);
		}

		console.log(rootUser, "root user");
		
		if (!rootUser) {
            return res.status(404).json({ message: "user does not exist" });
        }
		
		if (rootUser.is_deleted) {
			return res.status(404).json({ message: "user does not exist" });
		}

		req.user = rootUser;
		next();
	} catch (error) {
		console.error("Auth error:", error);
		next(error);
	}
}

module.exports = userAuth;

