// postSchema.js
import mongoose from "mongoose";

// ===========================
//  Comment, Like & Story sub-schemas
// ===========================
const CommentSchema = new mongoose.Schema({
    user: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String },
        picture: { type: String },
    },
    message: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    replies: [
        {
            user: {
                id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                name: { type: String },
                picture: { type: String },
            },
            message: { type: String },
            createdAt: { type: Date, default: Date.now },
        },
    ],
    createdAt: { type: Date, default: Date.now },
});

const LikeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    emoji: { type: String, default: "❤️" },
    createdAt: { type: Date, default: Date.now },
});

const StorySchema = new mongoose.Schema({
    mediaUrl: { type: String, required: true },
    caption: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => Date.now() + 24 * 60 * 60 * 1000 },
    views: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

// ===========================
// Main Post Schema
// ===========================
const PostSchema = new mongoose.Schema({
    user: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String },
        picture: { type: String },
        profileLink: { type: String, default: "" },
    },
    contentType: {
        type: String,
        enum: ["text", "image", "video", "gallery", "mixed", "story"],
        default: "text",
        index: true
    },

    text: { type: String, default: "" },
    image: { type: String, default: "" },
    video: { type: String, default: "" },
    location: { type: String, default: "" },
    visibility: { type: String, enum: ["public", "friends", "private"], default: "public" },

    likes: [LikeSchema],
    comments: [CommentSchema],
    story: StorySchema,

    sharedCount: { type: Number, default: 0 },
    reposts: [
        {
            personId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            personName: { type: String },
            personPicture: { type: String },
            profileLink: { type: String },
            dateOfRepost: { type: Date, default: Date.now },
        },
    ],

    tags: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

PostSchema.index({ "user.id": 1, createdAt: -1 });
PostSchema.index({ contentType: 1, createdAt: -1 });

const Post = mongoose.model("Post", PostSchema);

export default Post;
