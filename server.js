
import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import verify from "./routes/verifyemail.js"
import sendotp from "./routes/OTPReset.js"

import "./auth/passport.js";
import auth from "./routes/RegisterLogin.js";

dotenv.config();

const app = express();

// Helpful flags
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;
const isProd = process.env.NODE_ENV === "production";

// Trust proxy when behind load balancer / reverse proxy (Render, Heroku)
if (isProd) app.set("trust proxy", 1);

// Basic middleware
app.use(helmet());
app.use(morgan(":method :url :status :response-time ms - :res[content-length]"));
app.use(express.json()); // <-- parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [FRONTEND_URL, "https://wicikis.vercel.app"];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
}));

// Optionally handle OPTIONS requests automatically
// app.options('*', cors());



// Session (used by Passport)
app.use(
    session({
        secret: process.env.SESSION_SECRET || "change-me",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: isProd, // secure cookies only in production (HTTPS)
            sameSite: isProd ? "lax" : "none", // cross-site behavior (see notes)
        },
    })
);

// Passport init (after session)
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/auth-user", auth);
app.use("/verify", verify);
app.use("/otp", sendotp)

app.get("/", (req, res) => {
    setTimeout(() => {
        res.send("Hello, World!");
    }, 500);
});

const COOKIE_NAME = "token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

const frontend = "http://localhost:5173/"
app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: `${frontend}/login-failed` }),
    (req, res) => {
        try {
            const token = jwt.sign(
                { id: req.user._id, email: req.user.email },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            res.cookie("token", token, {
                httpOnly: true,
                secure: true,             // ✅ must be true (Render uses HTTPS)
                sameSite: "none",         // ✅ for cross-site (frontend != backend)
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });
            // ${FRONTEND_URL}
            return res.redirect(`${frontend}questions/auth?${token}`);
        } catch (err) {
            console.error("Error setting JWT cookie:", err);
            return res.redirect(`${frontend}/login-failed`);
        }
    }
);


app.get("/auth/logout", (req, res, next) => {
    // Clear JWT cookie
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "lax" : "none",
    });

    // Passport logout
    req.logout(function (err) {
        if (err) return next(err);
        return res.redirect(FRONTEND_URL);
    });
});

// Mongo DB connect and start server
const connectdb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("database connected");
    } catch (error) {
        console.error("Mongo connect error:", error);
        process.exit(1);
    }
};

connectdb().then(() => {
    app.listen(PORT || process.env.PORT, () => {
        console.log(`🚀 Server running on ${BACKEND_URL}`);
    });
});
