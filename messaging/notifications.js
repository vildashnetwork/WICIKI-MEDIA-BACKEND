// routes/notifications.js
import express from "express";
import Notification from "../models/Notification.js";
const router = express.Router();

/**
 * GET /api/notifications
 */
router.get("/", async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 }).lean();
        return res.json(notifications);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/notifications/:id/read
 */
router.post("/:id/read", async (req, res) => {
    try {
        const item = await Notification.findById(req.params.id);
        if (!item) return res.status(404).json({ error: "Not found" });
        if (item.user.toString() !== req.user.id) return res.status(403).json({ error: "Forbidden" });
        item.isRead = true;
        await item.save();
        return res.json({ ok: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;
