// models/UserPresence.js
import mongoose from "mongoose";

const presenceSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        isOnline: { type: Boolean, default: false },
        lastSeen: { type: Date, default: Date.now },
        typingIn: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
    },
    { timestamps: true }
);

export default mongoose.model("UserPresence", presenceSchema);
