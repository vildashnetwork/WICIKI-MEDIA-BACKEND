// middlewares/auth.js
// Replace with your JWT or session middleware.
// It must set req.user = { id: '<userId>', email: '...' }

export default function authMiddleware(req, res, next) {
    // Example: read token from Authorization header "Bearer <token>"
    // Replace with your real auth logic.
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
        const token = authHeader.split(" ")[1];
        // verify token -> set req.user
        // const payload = jwt.verify(token, process.env.JWT_SECRET);
        // req.user = payload;
        // ---- demo fallback (remove in production)
        req.user = { id: "demoUserId" }; // <<-- replace
        return next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
}
