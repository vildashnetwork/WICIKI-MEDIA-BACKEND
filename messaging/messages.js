// routes/messages.js
import express from "express";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
const router = express.Router();

/**
 * POST /api/messages
 * body: { conversationId, text, attachments: [{ provider, url, publicId, resourceType, mimeType, size, duration, width, height, thumbnail }] }
 * This endpoint saves the message to DB and emits socket event
 */
router.post("/", async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId, text, attachments = [] } = req.body;

        // Validate conversation exists and user is participant
        const conv = await Conversation.findById(conversationId);
        if (!conv) return res.status(404).json({ error: "Conversation not found" });
        if (!conv.participants.some(p => p.toString() === userId)) {
            return res.status(403).json({ error: "Not a participant" });
        }

        const msg = new Message({
            conversationId,
            sender: userId,
            text,
            attachments,
            status: "sent",
        });
        await msg.save();

        // update conversation lastMessage
        conv.lastMessage = msg._id;
        await conv.save();

        // emit socket event to participants (if io available)
        const io = req.app.get("io");
        if (io) {
            io.to(`conversation:${conversationId}`).emit("message:new", msg);
            // also emit a per-user notification
            conv.participants.forEach(pId => {
                io.to(`user:${pId}`).emit("notification:new", { type: "message", conversationId, message: msg });
            });
        }

        return res.json(msg);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/messages/:conversationId
 * query: ?limit=50&skip=0
 */
router.get("/:conversationId", async (req, res) => {
    try {
        const { conversationId } = req.params;
        const limit = parseInt(req.query.limit || "50", 10);
        const skip = parseInt(req.query.skip || "0", 10);
        const msgs = await Message.find({ conversationId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("sender", "name avatar")
            .lean();
        // Return in ascending order for easy rendering (old -> new)
        return res.json(msgs.reverse());
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/**
 * PATCH /api/messages/:id (edit text)
 * body: { text }
 */
router.patch("/:id", async (req, res) => {
    try {
        const msg = await Message.findById(req.params.id);
        if (!msg) return res.status(404).json({ error: "Not found" });
        if (msg.sender.toString() !== req.user.id) return res.status(403).json({ error: "Forbidden" });

        msg.text = req.body.text ?? msg.text;
        await msg.save();

        // emit edit event
        const io = req.app.get("io");
        if (io) io.to(`conversation:${msg.conversationId}`).emit("message:edited", msg);

        return res.json(msg);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /api/messages/:id
 */
router.delete("/:id", async (req, res) => {
    try {
        const msg = await Message.findById(req.params.id);
        if (!msg) return res.status(404).json({ error: "Not found" });
        if (msg.sender.toString() !== req.user.id) return res.status(403).json({ error: "Forbidden" });

        await msg.deleteOne();
        const io = req.app.get("io");
        if (io) io.to(`conversation:${msg.conversationId}`).emit("message:deleted", { id: req.params.id });

        return res.json({ ok: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/messages/:id/read
 * body: {}
 */
router.post("/:id/read", async (req, res) => {
    try {
        const msg = await Message.findById(req.params.id);
        if (!msg) return res.status(404).json({ error: "Not found" });

        if (!msg.readBy.some(u => u.toString() === req.user.id)) {
            msg.readBy.push(req.user.id);
            // optionally change status
            msg.status = "read";
            await msg.save();
        }

        // emit read receipt
        const io = req.app.get("io");
        if (io) io.to(`conversation:${msg.conversationId}`).emit("message:read", { messageId: msg._id, userId: req.user.id });

        return res.json({ ok: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/messages/:id/delivered
 * body: {}
 */
router.post("/:id/delivered", async (req, res) => {
    try {
        const msg = await Message.findById(req.params.id);
        if (!msg) return res.status(404).json({ error: "Not found" });

        if (msg.status === "sent") msg.status = "delivered";
        await msg.save();

        const io = req.app.get("io");
        if (io) io.to(`conversation:${msg.conversationId}`).emit("message:delivered", { messageId: msg._id, userId: req.user.id });

        return res.json({ ok: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;
