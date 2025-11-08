
// import cron from 'node-cron';
// import fetch from 'node-fetch';

// import express from "express";
// import mongoose from "mongoose";
// import session from "express-session";
// import passport from "passport";
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
// import helmet from "helmet";
// import cors from "cors";
// import morgan from "morgan";
// import cookieParser from "cookie-parser";
// import verify from "./routes/verifyemail.js"
// import sendotp from "./routes/OTPReset.js"
// import decodeuser from "./routes/FillProfile.js"
// import "./auth/passport.js";
// import auth from "./routes/RegisterLogin.js";
// import userpost from './routes/Userpost.js';

// dotenv.config();

// const app = express();

// const URL = 'https://wicikibackend.onrender.com/ping';


// function scheduleRandomPing() {
//     const minutes = Math.floor(Math.random() * 11) + 5; // 5..15
//     cron.schedule(`*/${minutes} * * * *`, async () => {
//         try { await fetch(URL); console.log('pinged'); }
//         catch (e) { console.error('ping failed', e.message); }
//     });
// }
// scheduleRandomPing();
// // Helpful flags
// const PORT = process.env.PORT || 4000;
// const FRONTEND_URL = "http://localhost:5173";
// const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;
// const isProd = process.env.NODE_ENV === "production";

// // Trust proxy when behind load balancer / reverse proxy (Render, Heroku)
// if (isProd) app.set("trust proxy", 1);

// // Basic middleware
// app.use(helmet());
// app.use(morgan(":method :url :status :response-time ms - :res[content-length]"));
// app.use(express.json()); // <-- parse JSON bodies
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());

// const allowedOrigins = [FRONTEND_URL, "https://wicikis.vercel.app"];

// app.use(cors({
//     origin: function (origin, callback) {
//         if (!origin || allowedOrigins.indexOf(origin) !== -1) {
//             callback(null, true);
//         } else {
//             callback(new Error("Not allowed by CORS"));
//         }
//     },
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     credentials: true,
// }));

// // Optionally handle OPTIONS requests automatically
// // app.options('*', cors());



// // Session (used by Passport)
// app.use(
//     session({
//         secret: process.env.SESSION_SECRET || "change-me",
//         resave: false,
//         saveUninitialized: false,
//         cookie: {
//             httpOnly: true,
//             secure: isProd, // secure cookies only in production (HTTPS)
//             sameSite: isProd ? "lax" : "none", // cross-site behavior (see notes)
//         },
//     })
// );

// // Passport init (after session)
// app.use(passport.initialize());
// app.use(passport.session());

// // Routes
// app.use("/auth-user", auth);
// app.use("/verify", verify);
// app.use("/otp", sendotp)
// app.use("/decode", decodeuser)
// app.use("/api/posts", userpost);

// app.get("/", (req, res) => {
//     setTimeout(() => {
//         res.send("Hello, World!");
//     }, 500);
// });

// const COOKIE_NAME = "token";
// const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// // app.get(
// //     "/auth/google",
// //     passport.authenticate("google", { scope: ["profile", "email"] })
// // );

// // const frontend = "http://localhost:5173/ "

// // app.get(

// //     "/auth/google/callback",
// //     passport.authenticate("google", { failureRedirect: `${frontend}/login-failed` }),
// //     (req, res) => {
// //         try {
// //             const token = jwt.sign(
// //                 { id: req.user._id, email: req.user.email },
// //                 process.env.JWT_SECRET,
// //                 { expiresIn: "7d" }
// //             );

// //             res.cookie("token", token, {
// //                 httpOnly: true,
// //                 secure: true,             // ✅ must be true (Render uses HTTPS)
// //                 sameSite: "none",         // ✅ for cross-site (frontend != backend)
// //                 maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
// //             });
// //             // ${FRONTEND_URL}
// //             return res.redirect(`${frontend}auth?${token}`);
// //         } catch (err) {
// //             console.error("Error setting JWT cookie:", err);
// //             return res.redirect(`${frontend}/login-failed`);
// //         }
// //     }
// // );
// // --- server: edits to paste into your existing server file ---
// // (keep all your other imports and middleware as-is earlier in the file)

// // Fix the frontend variable (remove trailing space)


// const FRONTEND = "http://localhost:5173";

// // Desktop redirect target (Option B)
// const DESKTOP_LOCALHOST_CALLBACK = "http://127.0.0.1:3100/auth";


// // Keep your existing start endpoint for web
// app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// // New route to start OAuth for desktop (sets state=desktop)
// app.get(
//     "/auth/google/desktop",
//     (req, res, next) => {
//         passport.authenticate("google", { scope: ["profile", "email"], state: "desktop" })(req, res, next);
//     }
// );

// // Callback route (handles both web and desktop)
// app.get(
//     "/auth/google/callback",
//     passport.authenticate("google", { failureRedirect: `${FRONTEND}/login-failed` }),
//     (req, res) => {
//         try {
//             const token = jwt.sign(
//                 { id: req.user._id, email: req.user.email },
//                 process.env.JWT_SECRET,
//                 { expiresIn: "7d" }
//             );

//             // Detect if this flow was initiated for desktop
//             const isDesktop = req.query && req.query.state === "desktop";

//             if (!isDesktop) {
//                 // Web flow: set cookie and redirect to frontend SPA
//                 res.cookie("token", token, {
//                     httpOnly: true,
//                     secure: isProd,          // must be true if using HTTPS in prod
//                     sameSite: isProd ? "none" : "lax",
//                     maxAge: COOKIE_MAX_AGE,
//                 });

//                 return res.redirect(`${FRONTEND}/auth?${encodeURIComponent(token)}`);
//             }

//             // Desktop flow (Option B): redirect to local callback server
//             // Ensure token is URL-encoded
//             return res.redirect(`${DESKTOP_LOCALHOST_CALLBACK}?token=${encodeURIComponent(token)}`);
//         } catch (err) {
//             console.error("Error setting JWT cookie:", err);
//             return res.redirect(`${FRONTEND}/login-failed`);
//         }
//     }
// );

// // Desktop OAuth callback receiver (local app callback)
// app.get("/auth/google/desktop/callback",
//     passport.authenticate("google", { failureRedirect: `${FRONTEND}/login-failed` }),
//     (req, res) => {
//         try {
//             const token = jwt.sign(
//                 { id: req.user._id, email: req.user.email },
//                 process.env.JWT_SECRET,
//                 { expiresIn: "7d" }
//             );

//             // Instead of sending to web frontend, send token to local desktop listener
//             const desktopCallback = `${DESKTOP_LOCALHOST_CALLBACK}?token=${encodeURIComponent(token)}`;
//             console.log("🔗 Redirecting desktop OAuth callback to:", desktopCallback);

//             return res.redirect(desktopCallback);
//         } catch (err) {
//             console.error("Error in desktop callback:", err);
//             return res.redirect(`${FRONTEND}/login-failed`);
//         }
//     }
// );


// app.get("/auth/logout", (req, res, next) => {
//     // Clear JWT cookie
//     res.clearCookie(COOKIE_NAME, {
//         httpOnly: true,
//         secure: isProd,
//         sameSite: isProd ? "lax" : "none",
//     });

//     // Passport logout
//     req.logout(function (err) {
//         if (err) return next(err);
//         return res.redirect(FRONTEND_URL);
//     });
// });

// // Mongo DB connect and start server
// const connectdb = async () => {
//     try {
//         await mongoose.connect(process.env.MONGODB_URI);
//         console.log("database connected");
//     } catch (error) {
//         console.error("Mongo connect error:", error);
//         process.exit(1);
//     }
// };

// connectdb().then(() => {
//     app.listen(PORT || process.env.PORT, () => {
//         console.log(`🚀 Server running on ${BACKEND_URL}`);
//     });
// });























import cron from "node-cron";
import fetch from "node-fetch";
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

import verify from "./routes/verifyemail.js";
import sendotp from "./routes/OTPReset.js";
import decodeuser from "./routes/FillProfile.js";
import "./auth/passport.js";
import auth from "./routes/RegisterLogin.js";
import userpost from "./routes/Userpost.js";

dotenv.config();
const app = express();

// --- keep Render alive ---
const URL = "https://wicikibackend.onrender.com/ping";
function scheduleRandomPing() {
    const minutes = Math.floor(Math.random() * 11) + 5; // every 5–15 mins
    cron.schedule(`*/${minutes} * * * *`, async () => {
        try {
            await fetch(URL);
            console.log("pinged");
        } catch (e) {
            console.error("ping failed", e.message);
        }
    });
}
scheduleRandomPing();

// --- core settings ---
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;
const isProd = process.env.NODE_ENV === "production";

// trust proxy for Render/Heroku
if (isProd) app.set("trust proxy", 1);

// --- middleware ---
app.use(helmet());
app.use(morgan(":method :url :status :response-time ms - :res[content-length]"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// allow localhost desktop + web frontend
const allowedOrigins = [
    FRONTEND_URL,
    "https://wicikis.vercel.app",
    "http://127.0.0.1:3100", // <-- Electron local listener
];

app.use(
    cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) callback(null, true);
            else callback(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
    })
);

// --- session + passport ---
app.use(
    session({
        secret: process.env.SESSION_SECRET || "change-me",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "lax" : "none",
        },
    })
);
app.use(passport.initialize());
app.use(passport.session());

// --- routes ---
app.use("/auth-user", auth);
app.use("/verify", verify);
app.use("/otp", sendotp);
app.use("/decode", decodeuser);
app.use("/api/posts", userpost);

app.get("/", (req, res) => res.send("Hello, World!"));

const COOKIE_NAME = "token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// ===================================================
// ✅ GOOGLE OAUTH (WEB + DESKTOP)
// ===================================================

const FRONTEND = "http://localhost:5173";
const DESKTOP_LOCALHOST_CALLBACK = "http://127.0.0.1:3100/auth";

// helper to detect desktop flow
function isDesktopFlow(req) {
    return (
        (req.query && req.query.state === "desktop") ||
        (req.session && req.session.oauthState === "desktop")
    );
}

// web OAuth start
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// desktop OAuth start (set session flag)
app.get("/auth/google/desktop", (req, res, next) => {
    if (req.session) req.session.oauthState = "desktop";
    passport.authenticate("google", {
        scope: ["profile", "email"],
        state: "desktop",
    })(req, res, next);
});

// single callback for both web + desktop
app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: `${FRONTEND}/login-failed` }),
    (req, res) => {
        try {
            if (!req.user) {
                console.error("No user found on req in callback");
                return res.redirect(`${FRONTEND}/login-failed`);
            }

            const token = jwt.sign(
                { id: req.user._id, email: req.user.email },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            const desktop = isDesktopFlow(req);

            if (!desktop) {
                // --- Web flow ---
                res.cookie(COOKIE_NAME, token, {
                    httpOnly: true,
                    secure: isProd,
                    sameSite: isProd ? "none" : "lax",
                    maxAge: COOKIE_MAX_AGE,
                });
                return res.redirect(`${FRONTEND}/auth?token=${encodeURIComponent(token)}`);
            }

            // --- Desktop flow ---
            const redirectUrl = `${DESKTOP_LOCALHOST_CALLBACK}?token=${encodeURIComponent(token)}`;
            console.log("🔗 Redirecting desktop OAuth callback to:", redirectUrl);
            return res.redirect(redirectUrl);
        } catch (err) {
            console.error("Error in google callback:", err);
            return res.redirect(`${FRONTEND}/login-failed`);
        }
    }
);

// logout
app.get("/auth/logout", (req, res, next) => {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "lax" : "none",
    });
    req.logout(err => {
        if (err) return next(err);
        return res.redirect(FRONTEND_URL);
    });
});

// ===================================================
// ✅ DATABASE + SERVER START
// ===================================================

const connectdb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Database connected");
    } catch (error) {
        console.error("❌ Mongo connect error:", error);
        process.exit(1);
    }
};

connectdb().then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on ${BACKEND_URL}`));
});
