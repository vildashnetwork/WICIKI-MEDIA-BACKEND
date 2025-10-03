import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../models/User/User.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const SALT_ROUNDS = 10;

// Generate JWT
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: "15d" }
    );
};

// ================= REGISTER =================
router.post("/register", async (req, res) => {
    try {
        const { email, name, password, picture } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: "Password should be at least 8 characters long" });
        }

        if (name.length < 3) {
            return res.status(400).json({ message: "Username should be at least 3 characters long" });
        }

        // Check if email exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Check if username exists
        const existingUsername = await User.findOne({ name });
        if (existingUsername) {
            return res.status(400).json({ message: "Username already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Profile image (fallback if none provided)
        const profileImage =
            picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

        // Create user
        const newUser = new User({
            email,
            name,
            password: hashedPassword,
            picture: profileImage,
        });

        const savedUser = await newUser.save();
        const token = generateToken(savedUser);

        res.status(201).json({
            message: "Signup successful",
            token,
            user: {
                id: savedUser._id,
                email: savedUser.email,
                name: savedUser.name,
                picture: savedUser.picture,
            },
        });
    } catch (error) {
        console.error("Error in register route", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        const token = generateToken(user);

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                picture: user.picture,
            },
        });
    } catch (error) {
        console.error("Error in login route", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// Update user profile
router.put("/profile/:id", async (req, res) => {
    try {
        const userId = req.params.id;

        const { picture } = req.body
        const updatepicture = await User.findByIdAndUpdate({
            userId,
            $set: {
                picture,
            },
        },
            { new: true, runValidators: true }
        )
        if (updatepicture) {
            res.status(201).json({ message: "profile saved" })
        } else {
            res.status(401).json({ message: "profile not  saved" })
        }

        const {
            NickName,
            Gender,
            DOB,
            BIO,
            Interest,
            profilevisibility,
            showbirthday
        } = req.body;

        // Update user with new profile data
        const updatedUser = await User.personalised.findByIdAndUpdate(
            userId,
            {
                $set: {

                    NickName,
                    Gender,
                    DOB,
                    BIO,
                    Interest,
                    "UserSettings.profilevisibility": profilevisibility,
                    "UserSettings.showbirthday": showbirthday,
                },
            },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                id: updatedUser._id,
                email: updatedUser.email,
                name: updatedUser.name,
                NickName: updatedUser.NickName,
                Gender: updatedUser.Gender,
                DOB: updatedUser.DOB,
                BIO: updatedUser.BIO,
                Interest: updatedUser.Interest,
                profilevisibility: updatedUser.UserSettings?.profilevisibility,
                showbirthday: updatedUser.UserSettings?.showbirthday,
                profile: updatedUser.profile,
            },
        });
    } catch (error) {
        console.error("Error in profile update route", error);
        res.status(500).json({ message: "Internal server error" });
    }
});



router.get("/user/:username", async (req, res) => {
    try {
        const name = req.params.username
        const finduser = await User.findOne({ name })
        if (!finduser) {
            res.status(404).json({ message: "user not found " });
        }
        res.status(201).json({ user: finduser });

    } catch (error) {
        console.error("Error in profile update route", error);
        res.status(500).json({ message: "Internal server error" });
    }
})



export default router;
