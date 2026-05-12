const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },

    phone: {
        type: String,
        required: true,
        unique: true
    },

    dob: {
        type: String,
        required: true
    },

    password: {
        type: String,
        required: true,
        minlength: 8
    },

    premium: {
        type: Boolean,
        default: false
    },

    premiumExpiry: {
        type: Date,
        default: null
    }

});

module.exports = mongoose.model("User", userSchema);