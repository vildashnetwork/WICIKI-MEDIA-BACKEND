import mongoose from "mongoose";
import storySchema from "./StorySchema/StorySchema.js";
import UserPostSchema from "./userpost/UserpostSchema.js";
import personalisedschema from "./personalisedschema/personalisedschema.js"

const userSchema = new mongoose.Schema({
    googleId: { type: String, unique: true },
    email: { type: String, required: true },
    number: { type: String, default: "" },
    name: String,
    avatar: String,
    picture: String,
    Story: [storySchema],
    Posts: [UserPostSchema],
    personalised: [personalisedschema],
    createdAt: { type: Date, default: Date.now }
});


const User = mongoose.model('User', userSchema);

export default User