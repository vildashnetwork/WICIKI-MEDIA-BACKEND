// sockets/socketHandler.js
import jwt from "jsonwebtoken";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

export default function attachSocketHandlers(io) {
    io.use((socket, next) => {
        // Expect client to send auth token in handshake: socket.handshake.auth = { token }
        try {
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error("Unauthorized"));
            // verify token (replace with your secret or logic)
            // const payload = jwt.verify(token, process.env.JWT_SECRET);
            // socket.user = payload;
            socket.user = { id: socket.handshake.auth.userId || "demoUserId" }; // temp
            return next();
        } catch (err) {
            return next(new Error("Unauthorized"));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.user.id;
        // join personal room and conversation rooms provided by client
        socket.join(`user:${userId}`);
        // Optionally: client sends list of conversation ids to join
        socket.on("join:conversation", (conversationId) => {
            socket.join(`conversation:${conversationId}`);
        });

        // Text message via socket (alternative to REST)
        socket.on("message:send", async (payload, cb) => {
            try {
                // payload: { conversationId, text, attachments }
                const { conversationId, text, attachments = [] } = payload;
                const conv = await Conversation.findById(conversationId);
                if (!conv) return cb && cb({ ok: false, error: "Conversation not found" });
                if (!conv.participants.some(p => p.toString() === userId)) {
                    return cb && cb({ ok: false, error: "Not a participant" });
                }
                const msg = await Message.create({
                    conversationId,
                    sender: userId,
                    text,
                    attachments,
                    status: "sent",
                });
                conv.lastMessage = msg._id;
                await conv.save();

                // emit to conversation room
                io.to(`conversation:${conversationId}`).emit("message:new", msg);

                // optionally notify each user
                conv.participants.forEach(p => {
                    io.to(`user:${p}`).emit("notification:new", { type: "message", message: msg, conversationId });
                });

                cb && cb({ ok: true, data: msg });
            } catch (err) {
                cb && cb({ ok: false, error: err.message });
            }
        });

        // typing
        socket.on("typing", ({ conversationId }) => {
            io.to(`conversation:${conversationId}`).emit("typing", { userId });
        });

        // WebRTC signalling (offer/answer/ice)
        socket.on("webrtc:offer", ({ toUserId, offer }) => {
            io.to(`user:${toUserId}`).emit("webrtc:offer", { from: userId, offer });
        });
        socket.on("webrtc:answer", ({ toUserId, answer }) => {
            io.to(`user:${toUserId}`).emit("webrtc:answer", { from: userId, answer });
        });
        socket.on("webrtc:ice", ({ toUserId, candidate }) => {
            io.to(`user:${toUserId}`).emit("webrtc:ice", { from: userId, candidate });
        });

        // presence
        socket.on("presence:set", (payload) => {
            // payload: { isOnline: true/false }
            if (payload?.isOnline) {
                io.to(`user:${userId}`).emit("presence:online", { userId });
            } else {
                io.to(`user:${userId}`).emit("presence:offline", { userId, lastSeen: new Date() });
            }
        });

        socket.on("disconnect", (reason) => {
            // Optionally broadcast offline presence
            io.to(`user:${userId}`).emit("presence:offline", { userId, lastSeen: new Date() });
        });
    });
}
