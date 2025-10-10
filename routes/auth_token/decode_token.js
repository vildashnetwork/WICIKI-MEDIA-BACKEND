import jwt from "jsonwebtoken";

/**
 * Extract & verify JWT from an Express request.
 * Supports: req.body.token, Authorization: Bearer <token>, req.cookies.token
 *
 * Returns an object:
 *  - { ok: true, payload } when token is valid
 *  - { ok: false, status, message } on error (missing/expired/invalid)
 *
 * Usage:
 *   const result = decodeTokenFromReq(req);
 *   if (!result.ok) return res.status(result.status).json({ message: result.message });
 *   const payload = result.payload; // { id, email, name, iat, exp }
 */
export default function decodeTokenFromReq(req) {
    // Prefer token from body, then Authorization header, then cookie
    const token =
        (req.body && req.body.token) ||
        (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
            ? req.headers.authorization.split(" ")[1]
            : undefined) ||
        (req.cookies && req.cookies.token);

    if (!token) {
        return { ok: false, status: 401, message: "Token missing (provide in body, Authorization header, or cookie)" };
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        return { ok: true, payload };
    } catch (err) {
        if (err && err.name === "TokenExpiredError") {
            return { ok: false, status: 401, message: "Token expired" };
        }
        return { ok: false, status: 401, message: "Invalid token" };
    }
}
