// routes/uploads.js
import express from "express";
import cloudinary from "cloudinary";
const router = express.Router();

cloudinary.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

/**
 * GET /api/uploads/cloudinary-signature
 * Returns timestamp + signature + api_key + cloud_name
 */
router.get("/cloudinary-signature", (req, res) => {
    try {
        const timestamp = Math.round(Date.now() / 1000);
        // If you want more restrictions you can sign more params as needed
        const signature = cloudinary.v2.utils.api_sign_request({ timestamp }, process.env.CLOUD_API_SECRET);
        return res.json({
            timestamp,
            signature,
            apiKey: process.env.CLOUD_API_KEY,
            cloudName: process.env.CLOUD_NAME,
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /api/uploads/cloudinary
 * body: { publicId, resourceType } - server-side delete
 */
router.delete("/cloudinary", async (req, res) => {
    try {
        const { publicId, resourceType = "image" } = req.body;
        if (!publicId) return res.status(400).json({ error: "publicId required" });
        const result = await cloudinary.v2.uploader.destroy(publicId, { resource_type: resourceType });
        return res.json(result);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;
