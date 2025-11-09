

// routes/RegisterLogin.js
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../models/User/User.js";

dotenv.config();
const router = express.Router();

const SALT_ROUNDS = 10;
const COOKIE_NAME = "token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Helper: generate JWT
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: "15d" }
    );
};

// Helper: cookie options (secure only in production)
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // true only in prod (HTTPS)
    sameSite: process.env.NODE_ENV === "production" ? "lax" : "lax",
    maxAge: COOKIE_MAX_AGE,
};

// Helper: remove sensitive fields before sending user to client
const sanitizeUser = (userDoc) => {
    if (!userDoc) return null;
    const u = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
    delete u.password;
    // optionally delete other internal fields like __v
    delete u.__v;
    return u;
};


router.post("/register", async (req, res) => {
    try {
        const { email, name, password, picture } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields required" });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.status(409).json({ message: "Email already exists" });

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const newUser = new User({
            email,
            name,
            password: hashedPassword,
            picture: picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
        });

        const savedUser = await newUser.save();
        const token = generateToken(savedUser._id);


        res.status(201).json({
            message: "Signup successful",
            user: sanitizeUser(savedUser),
            usertoken: token
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});


// router.post("/login", async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         const user = await User.findOne({ email });
//         if (!user) return res.status(404).json({ message: "User not found" });

//         const isMatch = bcrypt.compare(password, user.password);
//         if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

//         const token = jwt.sign(
//             { id: user._id },
//             process.env.JWT_SECRET,
//             { expiresIn: "15d" }
//         );

//         res.status(200).json({
//             message: "Login successful",
//             user: sanitizeUser(user),
//             usert: token
//         });
//     } catch (err) {
//         console.error("Login error:", err);
//         res.status(500).json({ message: "Internal server error" });
//     }
// });
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Make sure the stored password exists
        if (!user.password) {
            return res.status(400).json({ message: "This account has no password. Please reset or use social login." });
        }

        // ✅ Must await bcrypt.compare
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        // Sign JWT
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "15d" }
        );

        res.status(200).json({
            message: "Login successful",
            user: sanitizeUser(user),
            usert: token,
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});


/**
 * PUT /profile/:id
 * Body can contain: picture, NickName, Gender, DOB, BIO, Interest,
 * profilevisibility, showbirthday
 *
 * This updates top-level picture and nested personalised fields.
 * It then regenerates a token (optional) and sets cookie again.
 */
router.put("/profile/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        if (!userId) return res.status(400).json({ message: "User id is required in params." });

        const {
            picture,
            NickName,
            Gender,
            DOB,
            BIO,
            Interest,
            profilevisibility,
            showbirthday,
        } = req.body;

        // Build update object
        const updateOps = {};
        if (picture) updateOps.picture = picture;

        // Prepare nested personalised updates under 'personalised' field
        const personalisedUpdates = {};
        if (NickName !== undefined) personalisedUpdates.NickName = NickName;
        if (Gender !== undefined) personalisedUpdates.Gender = Gender;
        if (DOB !== undefined) personalisedUpdates.DOB = DOB;
        if (BIO !== undefined) personalisedUpdates.BIO = BIO;
        if (Interest !== undefined) personalisedUpdates.Interest = Interest;

        // If any UserSettings fields provided, keep them under personalised.UserSettings
        const userSettingsUpdates = {};
        if (profilevisibility !== undefined)
            userSettingsUpdates["personalised.UserSettings.profilevisibility"] = profilevisibility;
        if (showbirthday !== undefined)
            userSettingsUpdates["personalised.UserSettings.showbirthday"] = showbirthday;

        // Combine updates
        const setOps = {};
        if (Object.keys(updateOps).length) setOps = { ...setOps, ...updateOps };

        // Map personalisedUpdates (flat into personalised.field)
        Object.keys(personalisedUpdates).forEach((k) => {
            setOps[`personalised.${k}`] = personalisedUpdates[k];
        });

        // Add userSettingsUpdates if any
        Object.keys(userSettingsUpdates).forEach((k) => {
            setOps[k] = userSettingsUpdates[k];
        });

        // If nothing to update
        if (Object.keys(setOps).length === 0) {
            return res.status(400).json({ message: "No valid fields provided to update." });
        }

        const updatedUser = await User.findByIdAndUpdate(userId, { $set: setOps }, { new: true, runValidators: true });

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found." });
        }

        // Generate a new token (if you want to refresh claims after profile change)
        const token = generateToken(updatedUser);
        res.status(201).json({
            message: "Profile updated successfully",
            user: sanitizeUser(updatedUser),
            tokenon: token
        })

        res
            .status(200)
            .cookie(COOKIE_NAME, token, cookieOptions)
            .json({
                message: "Profile updated successfully",
                user: sanitizeUser(updatedUser),
            });
    } catch (error) {
        console.error("Error in profile update route:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * GET /user/:username
 * Returns public user profile data (no cookie operations here).
 */
router.get("/user/:username", async (req, res) => {
    try {
        const username = req.params.username;
        if (!username) return res.status(400).json({ message: "Username is required." });

        const finduser = await User.findOne({ name: username }).select("-password -__v");
        if (!finduser) return res.status(404).json({ message: "User not found." });

        return res.status(200).json({ user: finduser });
    } catch (error) {
        console.error("Error in GET /user/:username:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
