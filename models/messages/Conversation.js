// models/Conversation.js
import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
    {
        isGroup: { type: Boolean, default: false },

        participants: [
            { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
        ],

        groupName: { type: String },
        groupAvatar: { type: String },

        lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    },
    { timestamps: true }
);

export default mongoose.model("Conversation", conversationSchema);
