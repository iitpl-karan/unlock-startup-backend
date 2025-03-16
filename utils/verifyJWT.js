const jwt = require('jsonwebtoken');

const verifyJWT = (token) => {
	try {
		// Verify the token using the secret key from environment variables
		return jwt.verify(token, process.env.JWT_SECRET);
	} catch (err) {
		console.error(err);
		// Return null or an error object depending on how you want to handle errors
		return null;
	}
};

module.exports = verifyJWT;
