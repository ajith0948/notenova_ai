const express = require("express");
const router = express.Router();

// Import all 4 controllers
const {
    signup,
    login,
    requestPremium,
    getUser
} = require("../controllers/authController");

// --- ROUTES ---

// 1. Create a new account
router.post("/signup", signup);

// 2. Login to existing account
router.post("/login", login);

// 3. Send email to admin for manual premium verification
router.post("/request-premium", requestPremium);

// 4. Fetch live user data (checks premium status & timer)
router.get("/user/:email", getUser);

// Export the router
module.exports = router;