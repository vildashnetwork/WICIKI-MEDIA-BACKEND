// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

        type: {
            type: String,
            enum: ["message", "call", "friend_request", "system"],
            required: true,
        },

        message: { type: String },
        isRead: { type: Boolean, default: false },
        metadata: { type: Object },   // any extra info (conversationId, etc.)
    },
    { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
