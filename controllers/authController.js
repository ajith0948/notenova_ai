const User = require("../models/User");

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

        const existingEmail =
            await User.findOne({ email });

        if (existingEmail) {

            return res.status(400).json({
                message: "Email already exists"
            });

        }

        // CHECK PHONE

        const existingPhone =
            await User.findOne({ phone });

        if (existingPhone) {

            return res.status(400).json({
                message: "Phone number already exists"
            });

        }

        // PASSWORD VALIDATION

        const strongPassword =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$/;

        if (!strongPassword.test(password)) {

            return res.status(400).json({

                message:
                    "Password must contain uppercase, lowercase, number and 8+ characters"

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
const nodemailer = require("nodemailer");

// REQUEST PREMIUM (MANUAL VERIFICATION)
// REQUEST PREMIUM (MANUAL VERIFICATION)
exports.requestPremium = async (req, res) => {
    try {
        // We now expect both email and transactionId from the frontend
        const { email, transactionId } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Configure Nodemailer
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465, 
            secure: true, // Use SSL
            auth: {
                user: process.env.ADMIN_EMAIL, 
                pass: process.env.ADMIN_APP_PASSWORD 
            },
            tls: {
                // Do not fail on invalid certs (common requirement for free cloud tiers)
                rejectUnauthorized: false 
            }
        });

        const mailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: process.env.ADMIN_EMAIL,
            subject: `🚨 Premium Payment Request: ${user.name}`,
            text: `
                A user claims to have paid for NoteNova Premium via the QR Code.
                
                USER DETAILS:
                Name: ${user.name}
                Email: ${user.email}
                Phone: ${user.phone}
                MongoDB User ID: ${user._id}

                PAYMENT DETAILS:
                Transaction ID / UPI Ref: ${transactionId}

                ACTION REQUIRED:
                1. Check your bank/UPI app to confirm you received ₹500 with Transaction ID: ${transactionId}.
                2. If confirmed, go to MongoDB Atlas.
                3. Find the user and change "premium" from false to true.
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            message: "Payment reported successfully! Please allow up to 7 business days for manual verification."
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
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
