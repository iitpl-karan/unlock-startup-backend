// isAdmin.js (create a new file for middleware)
module.exports = function(req, res, next) {
    // Assuming you have a way to identify if a user is an admin, e.g., checking a user role or a flag in the user object
    if (req.user && req.user.isAdmin) {
        next(); // Continue to the next middleware
    } else {
        res.status(403).send('Forbidden'); // User is not authorized
    }
};
