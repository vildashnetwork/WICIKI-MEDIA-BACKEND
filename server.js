// import express from "express";
// import mongoose from "mongoose";
// import session from "express-session";
// import passport from "passport";
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
// import helmet from "helmet"
// import cors from "cors"
// import morgan from "morgan"

// import "./auth/passport.js";

// import auth from "./routes/RegisterLogin.js"
// import cookieParser from "cookie-parser";

// dotenv.config();

// const app = express();
// app.use(cookieParser());


// app.use(cors({
//     origin: "http://localhost:5173", // your React app URL
//     credentials: true               // allow sending cookies
// }));

// app.use(helmet());

// app.use(morgan(':method :url :status :response-time ms - :res[content-length]'));

// app.use("/auth-user", auth)
// app.get("/", (req, res) => {
//     setTimeout(() => {
//         res.send("Hello, World!");
//     }, 500);
// });

// const connectdb = async () => {
//     try {
//         await mongoose.connect(process.env.MONGODB_URI)
//         console.log('====================================');
//         console.log("database connected");
//         console.log('====================================');

//     } catch (error) {
//         console.log('====================================');
//         console.log(error);
//         console.log('====================================');
//     }
// }



// app.use(session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     cookie: { httpOnly: true }
// }));


// app.use(passport.initialize());
// app.use(passport.session());




// app.get("/auth/google",
//     passport.authenticate("google", { scope: ["profile", "email"] })
// );

// // Callback route after Google login

// // app.get("/auth/google/callback",
// //     passport.authenticate("google", { failureRedirect: "/login-failed" }),
// //     (req, res) => {
// //         const token = jwt.sign(
// //             { id: req.user._id, email: req.user.email },
// //             process.env.JWT_SECRET,
// //             { expiresIn: "7d" }
// //         );
// //         // redirect to frontend with token
// //         res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
// //     }
// // );
// // app.get("/auth/google/callback",
// //     passport.authenticate("google", { failureRedirect: "/login-failed" }),
// //     (req, res) => {
// //         // Generate JWT
// //         const token = jwt.sign(
// //             { id: req.user._id, email: req.user.email },
// //             process.env.JWT_SECRET,
// //             { expiresIn: "7d" }
// //         );

// //         // Set JWT as cookie
// //         res.cookie("token", token, {
// //             httpOnly: true,      // JS cannot access it
// //             secure: process.env.NODE_ENV === "production", // only HTTPS in prod
// //             sameSite: "lax",     // CSRF protection
// //             maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
// //         });

// //         // Redirect user to frontend page (no token in URL)
// //         res.redirect(`${process.env.FRONTEND_URL}/auth/success`);
// //     }
// // );
// app.get(
//     "/auth/google/callback",
//     passport.authenticate("google", { failureRedirect: "/login-failed" }),
//     (req, res) => {
//         try {
//             // Generate JWT
//             const token = jwt.sign(
//                 { id: req.user._id, email: req.user.email },
//                 process.env.JWT_SECRET,
//                 { expiresIn: "7d" }
//             );

//             // Set JWT as httpOnly cookie
//             res.cookie("token", token, {
//                 httpOnly: true,
//                 secure: process.env.NODE_ENV === "production",
//                 sameSite: "lax",
//                 maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//             });

//             // Redirect user to frontend
//             res.redirect(`${process.env.FRONTEND_URL}/auth/success`);
//         } catch (err) {
//             console.error("Error setting JWT cookie:", err);
//             res.redirect(`${process.env.FRONTEND_URL}/login-failed`);
//         }
//     }
// );

// app.get("/auth/logout", (req, res, next) => {
//     req.logout(function (err) {
//         if (err) return next(err);
//         res.redirect(process.env.FRONTEND_URL);
//     });
// });

// connectdb().then(() => {
//     app.listen(4000 || process.env.PORT, () => console.log("🚀 Server running on http://localhost:4000"));

// })


// server.js (optimized)
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

const allowedOrigins = [FRONTEND_URL, "http://localhost:3000"];

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

app.get("/", (req, res) => {
    setTimeout(() => {
        res.send("Hello, World!");
    }, 500);
});

const COOKIE_NAME = "google_token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

// app.get(
//     "/auth/google/callback",
//     passport.authenticate("google", { failureRedirect: "/login-failed" }),
//     (req, res) => {
//         try {
//             // Generate JWT
//             const token = jwt.sign(
//                 { id: req.user._id, email: req.user.email },
//                 { expiresIn: "7d" }
//             );

//             // Cookie options - for OAuth flow, sameSite may need 'none' if frontend and backend are on different sites
//             const cookieOptions = {
//                 httpOnly: true,
//                 secure: isProd, // must be true for sameSite='none' (browsers require secure)
//                 sameSite: isProd ? "lax" : "none",
//                 maxAge: COOKIE_MAX_AGE,
//             };

//             res.cookie(COOKIE_NAME, token, cookieOptions);
//             res.status(201).json({ googletoken: token })

//             return res.redirect(`${FRONTEND_URL}/auth/success`);
//         } catch (err) {
//             console.error("Error setting JWT cookie:", err);
//             return res.redirect(`${FRONTEND_URL}/login-failed`);
//         }
//     }
// );

// Logout: clear cookie + passport logout

app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: `${FRONTEND_URL}/login-failed` }),
    (req, res) => {
        try {
            // Generate JWT
            const token = jwt.sign(
                { id: req.user._id, email: req.user.email },
                process.env.JWT_SECRET,   // ✅ SECRET FIXED
                { expiresIn: "7d" }
            );


            // Cookie options
            const cookieOptions = {
                httpOnly: true,
                secure: isProd, // true only in HTTPS
                sameSite: isProd ? "lax" : "none", // ✅ for cross-site (frontend/backend different domains)
                domain: "http://localhost:5173/",
                maxAge: COOKIE_MAX_AGE,
            };

            // Set cookie
            res.cookie(COOKIE_NAME, token, cookieOptions);
            // Redirect frontend (no JSON here)
            return res.redirect(`${FRONTEND_URL}/auth/success`);
        } catch (err) {
            console.error("Error setting JWT cookie:", err);
            return res.redirect(`${FRONTEND_URL}/login-failed`);
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
