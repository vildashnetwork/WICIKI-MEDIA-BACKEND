import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import helmet from "helmet"
import cors from "cors"
import morgan from "morgan"

import "./auth/passport.js";

import auth from "./routes/RegisterLogin.js"

dotenv.config();

const app = express();


app.use(cors())
app.use(helmet());

app.use(morgan(':method :url :status :response-time ms - :res[content-length]'));

app.use("/auth-user", auth)
app.get("/", (req, res) => {
    setTimeout(() => {
        res.send("Hello, World!");
    }, 500);
});

const connectdb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('====================================');
        console.log("database connected");
        console.log('====================================');

    } catch (error) {
        console.log('====================================');
        console.log(error);
        console.log('====================================');
    }
}



app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true }
}));


app.use(passport.initialize());
app.use(passport.session());




app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback route after Google login

app.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login-failed" }),
    (req, res) => {
        const token = jwt.sign(
            { id: req.user._id, email: req.user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
        // redirect to frontend with token
        res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
    }
);


app.get("/auth/logout", (req, res, next) => {
    req.logout(function (err) {
        if (err) return next(err);
        res.redirect(process.env.FRONTEND_URL);
    });
});

connectdb().then(() => {
    app.listen(4000 || process.env.PORT, () => console.log("🚀 Server running on http://localhost:4000"));

})
