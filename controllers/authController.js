const User = require("../models/User");

const nodemailer = require("nodemailer");

// SIGNUP
exports.signup = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            dob,
            password
        } = req.body;

        // CHECK EMAIL
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                message: "Email already exists"
            });
        }

        // CHECK PHONE
        const existingPhone = await User.findOne({ phone });
        if (existingPhone) {
            return res.status(400).json({
                message: "Phone number already exists"
            });
        }

        // 🚨 NEW SIMPLE PASSWORD VALIDATION 🚨
        if (!password || password.length <= 6) {
            return res.status(400).json({
                message: "Password must be more than 6 characters long!"
            });
        }

        // CREATE USER
        const user = new User({
            name,
            email,
            phone,
            dob,
            password
        });

        await user.save();

        res.status(201).json({
            message: "Account Created Successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "User not found"
            });
        }

        if (user.password !== password) {
            return res.status(400).json({
                message: "Incorrect password"
            });
        }

        res.status(200).json({
            message: "Login Successful",
            user
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// REQUEST PREMIUM (MANUAL VERIFICATION)
exports.requestPremium = async (req, res) => {
    try {
        console.log("🚨 1. INCOMING REQUEST FOR PREMIUM...");
        
        const { email, transactionId } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            console.log("❌ User not found in DB.");
            return res.status(400).json({ message: "User not found" });
        }

        console.log("✅ 2. USER FOUND. CONFIGURING EMAIL...");

        // NEW CONFIG: Using Port 587 (Standard TLS) instead of 465
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587, 
            secure: false, // MUST be false for port 587
            auth: {
                user: process.env.ADMIN_EMAIL, 
                pass: process.env.ADMIN_APP_PASSWORD 
            },
            tls: {
                rejectUnauthorized: false 
            }
        });

        const mailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: process.env.ADMIN_EMAIL, 
            subject: `🚨 Premium Payment Request: ${user.name}`,
            text: `
                Transaction ID: ${transactionId}
                Email: ${user.email}
            ` // Keeping the text short just for testing
        };

        console.log("⏳ 3. ATTEMPTING TO SEND EMAIL TO GOOGLE...");
        
        await transporter.sendMail(mailOptions);

        console.log("🚀 4. EMAIL SENT SUCCESSFULLY!");

        res.status(200).json({ 
            message: "Payment reported successfully! Please allow up to 7 business days for manual verification." 
        });

    } catch (error) {
        console.log("🔥 ERROR CRASH:", error);
        res.status(500).json({ message: "Connection timeout or server error" });
    }
};

// GET FRESH USER DATA & CHECK EXPIRY
exports.getUser = async (req, res) => {
    try {
        const email = req.params.email;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 1. AUTO-START TIMER: If admin set premium to true, but there is no expiry yet
        if (user.premium && !user.premiumExpiry) {
            const now = new Date();
            // Add exactly 10 minutes (10 * 60000 milliseconds)
            user.premiumExpiry = new Date(now.getTime() + 10 * 60000);
            await user.save(); // Save the new 10-minute expiry to database
        }

        // 2. CHECK EXPIRY: If the timer has run out
        if (user.premium && user.premiumExpiry) {
            const now = new Date();
            if (now > user.premiumExpiry) {
                user.premium = false;
                user.premiumExpiry = null;
                await user.save(); // Automatically revert to free plan
            }
        }

        res.status(200).json(user);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
