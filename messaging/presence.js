// routes/presence.js
import express from "express";
import UserPresence from "../models/UserPresence.js";
const router = express.Router();

/**
 * POST /api/presence/online
 * body: {}
 */
router.post("/online", async (req, res) => {
    try {
        const userId = req.user.id;
        let p = await UserPresence.findOne({ userId });
        if (!p) {
            p = new UserPresence({ userId, isOnline: true, lastSeen: new Date() });
        } else {
            p.isOnline = true;
            p.lastSeen = new Date();
        }
        await p.save();
        const io = req.app.get("io");
        if (io) io.to(`user:${userId}`).emit("presence:online", { userId });
        return res.json({ ok: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/presence/offline
 */
router.post("/offline", async (req, res) => {
    try {
        const userId = req.user.id;
        let p = await UserPresence.findOne({ userId });
        if (!p) p = new UserPresence({ userId });
        p.isOnline = false;
        p.lastSeen = new Date();
        await p.save();
        const io = req.app.get("io");
        if (io) io.to(`user:${userId}`).emit("presence:offline", { userId, lastSeen: p.lastSeen });
        return res.json({ ok: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/presence/typing
 * body: { conversationId }
 */
router.post("/typing", async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.body;
        const io = req.app.get("io");
        if (io) io.to(`conversation:${conversationId}`).emit("typing", { userId });
        return res.json({ ok: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;
