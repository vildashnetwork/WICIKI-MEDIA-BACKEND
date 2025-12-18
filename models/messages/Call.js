// models/Call.js
import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
    {
        participants: [
            { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        ],

        type: { type: String, enum: ["audio", "video"], required: true },

        status: {
            type: String,
            enum: ["ringing", "ongoing", "ended", "missed"],
            default: "ringing",
        },

        startedAt: { type: Date },
        endedAt: { type: Date },

        // store WebRTC offer/answer for backup
        offer: { type: Object },
        answer: { type: Object },
        iceCandidates: [{ type: Object }],
    },
    { timestamps: true }
);

export default mongoose.model("Call", callSchema);
