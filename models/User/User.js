// userSchema.js
import mongoose from "mongoose";
import storySchema from "./StorySchema/StorySchema.js";
import UserPostSchema from "./userpost/UserpostSchema.js";
import personalisedschema from "./personalisedschema/personalisedschema.js";

const userSchema = new mongoose.Schema({
  googleId: { type: String, sparse: true },
  email: { type: String, required: true },
  number: { type: String, default: "" },
  password: { type: String },
  name: String,
  avatar: String,
  picture: String,
  Story: [storySchema],
  Posts: [UserPostSchema],
  personalised: personalisedschema,
  createdAt: { type: Date, default: Date.now },

  proffession: { type: String },
  Education: { type: String },
  ProjectsCompleted: { type: String },
  YearsOfExperience: { type: String },
  SpokenLanguages: { type: [String], default: [] },
  ProgrammingLanguages: { type: [String], default: [] },
  website: { type: String, default: "" }
});

const User = mongoose.model('User', userSchema);
export default User;
