// import express from "express";
// import mongoose from "mongoose";
// import jwt from "jsonwebtoken";
// import User from "../models/User/User.js";
// import bcrypt from "bcrypt";
// import dotenv from "dotenv";


// dotenv.config();
// const router = express.Router();

// const SALT_ROUNDS = 10;

// // Generate JWT
// const generateToken = (user) => {
//     return jwt.sign(
//         { id: user._id, email: user.email, name: user.name },
//         process.env.JWT_SECRET,
//         { expiresIn: "15d" }
//     );
// };

// // ================= REGISTER =================
// router.post("/register", async (req, res) => {
//     try {
//         const { email, name, password, picture } = req.body;

//         // Validate input
//         if (!name || !email || !password) {
//             return res.status(400).json({ message: "All fields are required" });
//         }

//         if (password.length < 8) {
//             return res.status(400).json({ message: "Password should be at least 8 characters long" });
//         }

//         if (name.length < 3) {
//             return res.status(400).json({ message: "Username should be at least 3 characters long" });
//         }

//         // Check if email exists
//         const existingEmail = await User.findOne({ email });
//         if (existingEmail) {
//             return res.status(400).json({ message: "Email already exists" });
//         }

//         // Check if username exists
//         const existingUsername = await User.findOne({ name });
//         if (existingUsername) {
//             return res.status(400).json({ message: "Username already exists" });
//         }

//         // Hash password
//         const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

//         // Profile image (fallback if none provided)
//         const profileImage =
//             picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

//         // Create user
//         const newUser = new User({
//             email,
//             name,
//             password: hashedPassword,
//             picture: profileImage,
//         });

//         const savedUser = await newUser.save();
//         const token = generateToken(savedUser);

//         // res.status(201).json({
//         //     message: "Signup successful",
//         //     token,
//         //     user: {
//         //         id: savedUser._id,
//         //         email: savedUser.email,
//         //         name: savedUser.name,
//         //         picture: savedUser.picture,
//         //     },
//         // });

//         res
//             .status(201)
//             .cookie("token", token, {
//                 httpOnly: true,   // prevents JavaScript access
//                 secure: true,     // true if using HTTPS
//                 sameSite: "strict", // helps prevent CSRF
//                 maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
//             })
//             .json({
//                 message: "Signup successful",
//                 user: {
//                     id: savedUser._id,
//                     email: savedUser.email,
//                     name: savedUser.name,
//                     picture: savedUser.picture,
//                 },
//             });

//     } catch (error) {
//         console.error("Error in register route", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// });

// // ================= LOGIN =================
// router.post("/login", async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         // Check if user exists
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         // Compare password
//         const isPasswordValid = await bcrypt.compare(password, user.password);
//         if (!isPasswordValid) {
//             return res.status(401).json({ message: "Incorrect password" });
//         }

//         const token = generateToken(user);

//         // res.status(200).json({
//         //     message: "Login successful",
//         //     token,
//         //     user: {
//         //         id: user._id,
//         //         email: user.email,
//         //         name: user.name,
//         //         picture: user.picture,
//         //     },
//         // });
//         res
//             .status(200)
//             .cookie("token", token, {
//                 httpOnly: true,    // prevents client-side JS access
//                 secure: true,      // set true if using HTTPS
//                 sameSite: "strict", // helps mitigate CSRF
//                 maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
//             })
//             .json({
//                 message: "Login successful",
//                 user: {
//                     id: user._id,
//                     email: user.email,
//                     name: user.name,
//                     picture: user.picture,
//                 },
//             });

//     } catch (error) {
//         console.error("Error in login route", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// });


// // Update user profile
// router.put("/profile/:id", async (req, res) => {
//     try {
//         const userId = req.params.id;

//         const { picture } = req.body
//         const updatepicture = await User.findByIdAndUpdate({
//             userId,
//             $set: {
//                 picture,
//             },
//         },
//             { new: true, runValidators: true }
//         )
//         if (updatepicture) {
//             res.status(201).json({ message: "profile saved" })
//         } else {
//             res.status(401).json({ message: "profile not  saved" })
//         }

//         const {
//             NickName,
//             Gender,
//             DOB,
//             BIO,
//             Interest,
//             profilevisibility,
//             showbirthday
//         } = req.body;

//         // Update user with new profile data
//         const updatedUser = await User.personalised.findByIdAndUpdate(
//             userId,
//             {
//                 $set: {

//                     NickName,
//                     Gender,
//                     DOB,
//                     BIO,
//                     Interest,
//                     "UserSettings.profilevisibility": profilevisibility,
//                     "UserSettings.showbirthday": showbirthday,
//                 },
//             },
//             { new: true, runValidators: true }
//         );

//         if (!updatedUser) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         // res.status(200).json({
//         //     message: "Profile updated successfully",
//         //     user: {
//         //         id: updatedUser._id,
//         //         email: updatedUser.email,
//         //         name: updatedUser.name,
//         //         NickName: updatedUser.NickName,
//         //         Gender: updatedUser.Gender,
//         //         DOB: updatedUser.DOB,
//         //         BIO: updatedUser.BIO,
//         //         Interest: updatedUser.Interest,
//         //         profilevisibility: updatedUser.UserSettings?.profilevisibility,
//         //         showbirthday: updatedUser.UserSettings?.showbirthday,
//         //         profile: updatedUser.profile,
//         //     },
//         // });
//         res
//             .status(200)
//             .cookie("token", token, {
//                 httpOnly: true,     // secure against XSS
//                 secure: true,       // use true if your site runs on HTTPS
//                 sameSite: "strict", // CSRF protection
//                 maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
//             })
//             .json({
//                 message: "Profile updated successfully",
//                 user: {
//                     id: updatedUser._id,
//                     email: updatedUser.email,
//                     name: updatedUser.name,
//                     NickName: updatedUser.NickName,
//                     Gender: updatedUser.Gender,
//                     DOB: updatedUser.DOB,
//                     BIO: updatedUser.BIO,
//                     Interest: updatedUser.Interest,
//                     profilevisibility: updatedUser.UserSettings?.profilevisibility,
//                     showbirthday: updatedUser.UserSettings?.showbirthday,
//                     profile: updatedUser.profile,
//                 },
//             });

//     } catch (error) {
//         console.error("Error in profile update route", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// });



// router.get("/user/:username", async (req, res) => {
//     try {
//         const name = req.params.username
//         const finduser = await User.findOne({ name })
//         if (!finduser) {
//             res.status(404).json({ message: "user not found " });
//         }
//         // res.status(201).json({ user: finduser });
//         res
//             .status(201)
//             .cookie("token", token, {
//                 httpOnly: true,     // blocks client-side JS from reading it
//                 secure: true,       // set true if HTTPS
//                 sameSite: "strict", // prevents CSRF
//                 maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
//             })
//             .json({
//                 user: finduser,
//             });

//     } catch (error) {
//         console.error("Error in profile update route", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// })



// export default router;







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
        const token = generateToken(savedUser);

        // ✅ manually set cookie
        setCookie(res, token);

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


router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        const token = generateToken(user);

        // ✅ manually set cookie
        setCookie(res, token);

        res.status(200).json({
            message: "Login successful",
            user: sanitizeUser(user),
            usert: token
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
