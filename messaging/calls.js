// routes/calls.js
import express from "express";
import Call from "../models/Call.js";
import Conversation from "../models/Conversation.js";
const router = express.Router();

/**
 * POST /api/calls/start
 * body: { conversationId, type: "audio"|"video", offer? }
 * Creates call record and emits socket event to participants
 */
router.post("/start", async (req, res) => {
    try {
        const { conversationId, type = "video", offer } = req.body;
        const userId = req.user.id;
        const conv = await Conversation.findById(conversationId);
        if (!conv) return res.status(404).json({ error: "Conversation not found" });

        const call = new Call({
            participants: conv.participants,
            type,
            status: "ringing",
            startedAt: new Date(),
            offer,
        });
        await call.save();

        const io = req.app.get("io");
        if (io) {
            // notify participants
            conv.participants.forEach(p => {
                io.to(`user:${p}`).emit("call:ring", { callId: call._id, from: userId, conversationId, type });
            });
        }
        return res.json(call);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/calls/:id/answer
 * body: { answer }
 */
router.post("/:id/answer", async (req, res) => {
    try {
        const call = await Call.findById(req.params.id);
        if (!call) return res.status(404).json({ error: "Not found" });
        call.status = "ongoing";
        call.answer = req.body.answer;
        await call.save();

        const io = req.app.get("io");
        if (io) io.to(`call:${call._id}`).emit("call:answered", { callId: call._id });

        return res.json(call);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/calls/:id/end
 * body: { reason }
 */
router.post("/:id/end", async (req, res) => {
    try {
        const call = await Call.findById(req.params.id);
        if (!call) return res.status(404).json({ error: "Not found" });
        call.status = "ended";
        call.endedAt = new Date();
        await call.save();

        const io = req.app.get("io");
        if (io) io.to(`call:${call._id}`).emit("call:ended", { callId: call._id, reason: req.body.reason || "hangup" });

        return res.json(call);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/calls/history?limit=20&skip=0
 */
router.get("/history", async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit || "50", 10);
        const skip = parseInt(req.query.skip || "0", 10);
        // calls where user was a participant
        const calls = await Call.find({ participants: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
        return res.json(calls);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;
