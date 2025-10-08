// backend/emailCheck.js
import dotenv from "dotenv";
import axios from "axios";
import express from "express";

dotenv.config();
const router = express.Router();

router.post("/check-email", async (req, res) => {
    const { email } = req.body;
    const url = `https://emailreputation.abstractapi.com/v1/?api_key=${process.env.ABSTRACT_API_KEY}&email=${email}`;

    try {
        const { data } = await axios.get(url);
        res.json(data);
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ message: "Error validating email" });
    }
});

export default router;
