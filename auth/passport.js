// auth/passport.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import User from "../models/User/User.js";

dotenv.config();

// Debugging logs (only for development, remove in production)
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "Loaded ✅" : "Missing ❌");
console.log("BACKEND_URL:", process.env.BACKEND_URL);
console.log("Callback URL being used:", `${process.env.BACKEND_URL}/auth/google/callback`);

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // check if user already exists
                let user = await User.findOne({ googleId: profile.id });

                if (!user) {
                    // create new user if not found
                    user = await User.create({
                        googleId: profile.id,
                        email: profile.emails?.[0]?.value,
                        name: profile.displayName,
                        picture: profile.photos?.[0]?.value
                    });
                }

                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

// serialize user -> store only user id in session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// deserialize user -> fetch full user from DB by id
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

export default passport;
