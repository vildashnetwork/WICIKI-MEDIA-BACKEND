// models/Message.js
import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema({
    provider: { type: String },          // "cloudinary" | "s3"
    url: { type: String, required: true },
    publicId: { type: String },
    resourceType: { type: String },      // "image" | "video" | "audio" | "file"
    mimeType: { type: String },
    size: { type: Number },
    duration: { type: Number },          // audio/video duration
    width: Number,
    height: Number,
    thumbnail: String,                   // for videos & images
});

const messageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },

        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

        text: { type: String },

        attachments: [attachmentSchema],

        status: {
            type: String,
            enum: ["sent", "delivered", "read"],
            default: "sent",
        },

        readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
