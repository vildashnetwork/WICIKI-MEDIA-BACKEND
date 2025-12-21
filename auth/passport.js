
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import User from "../models/User/User.js";

dotenv.config();

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `https://wiciki-media-backend-ahiu.onrender.com/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Try to find user by googleId OR email (in case email already exists)
                let user = await User.findOne({ googleId: profile.id })
                    || await User.findOne({ email: profile.emails?.[0]?.value });

                if (!user) {
                    // Create new user
                    user = await User.create({
                        googleId: profile.id,
                        email: profile.emails?.[0]?.value,
                        name: profile.displayName,
                        picture: profile.photos?.[0]?.value,
                        personalised: {} // optional: initialise personalised object
                    });
                } else if (!user.googleId) {
                    // Update existing user to link googleId
                    user.googleId = profile.id;
                    await user.save();
                }

                return done(null, user);
            } catch (err) {
                console.error("Error in GoogleStrategy:", err);
                return done(err, null);
            }
        }
    )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

export default passport;
