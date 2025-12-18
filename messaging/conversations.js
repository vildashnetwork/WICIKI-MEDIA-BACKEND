// routes/conversations.js
import express from "express";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
const router = express.Router();

/**
 * POST /api/conversations
 * body: { participants: [userId,...], isGroup?:bool, groupName?: string }
 */
router.post("/", async (req, res) => {
    try {
        const { participants = [], isGroup = false, groupName, groupAvatar } = req.body;
        const userId = req.user.id;
        if (!participants.includes(userId)) participants.push(userId);

        const conv = new Conversation({
            participants,
            isGroup,
            groupName: isGroup ? groupName : undefined,
            groupAvatar: isGroup ? groupAvatar : undefined,
        });
        await conv.save();
        return res.json(conv);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/conversations
 * query: ?limit=20&skip=0
 */
router.get("/", async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit || "50", 10);
        const skip = parseInt(req.query.skip || "0", 10);

        const convs = await Conversation.find({ participants: userId })
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("lastMessage")
            .lean();

        return res.json(convs);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/conversations/:id
 */
router.get("/:id", async (req, res) => {
    try {
        const conv = await Conversation.findById(req.params.id).populate("participants", "-passwordHash");
        if (!conv) return res.status(404).json({ error: "Not found" });
        // ensure user is participant
        if (!conv.participants.some(p => p._id.toString() === req.user.id)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        return res.json(conv);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/**
 * PATCH /api/conversations/:id
 * update meta: { groupName, groupAvatar }
 */
router.patch("/:id", async (req, res) => {
    try {
        const updates = {};
        if (req.body.groupName) updates.groupName = req.body.groupName;
        if (req.body.groupAvatar) updates.groupAvatar = req.body.groupAvatar;

        const conv = await Conversation.findByIdAndUpdate(req.params.id, updates, { new: true });
        return res.json(conv);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/conversations/:id/add
 * body: { userId }
 */
router.post("/:id/add", async (req, res) => {
    try {
        const conv = await Conversation.findById(req.params.id);
        if (!conv) return res.status(404).json({ error: "Not found" });
        if (!conv.isGroup) return res.status(400).json({ error: "Not a group" });

        if (!conv.participants.includes(req.body.userId)) {
            conv.participants.push(req.body.userId);
            await conv.save();
        }
        return res.json(conv);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/conversations/:id/remove
 * body: { userId }
 */
router.post("/:id/remove", async (req, res) => {
    try {
        const conv = await Conversation.findById(req.params.id);
        if (!conv) return res.status(404).json({ error: "Not found" });
        conv.participants = conv.participants.filter(p => p.toString() !== req.body.userId);
        await conv.save();
        return res.json(conv);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/conversations/:id/leave
 */
router.post("/:id/leave", async (req, res) => {
    try {
        const conv = await Conversation.findById(req.params.id);
        conv.participants = conv.participants.filter(p => p.toString() !== req.user.id);
        await conv.save();
        return res.json({ ok: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;
