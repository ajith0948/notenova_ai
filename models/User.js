const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true,
        // THIS IS THE ONLY RULE NOW: Must be at least 7 characters
        minlength: [7, "Password must be more than 6 characters"] 
    },
    phone: { 
        type: String, 
        required: true 
    },
    dob: { 
        type: String, 
        required: true 
    },
    premium: { 
        type: Boolean, 
        default: false 
    },
    premiumExpiry: { 
        type: Date, 
        default: null 
    }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
