// server.js
import express from "express";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser());

// --- Basic auth middleware placeholder (used by routes) ---
import authMiddleware from "./middlewares/auth.js";

// create http server and io
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// attach io to app locals so route modules can access it
app.set("io", io);

// mount routes
import conversationsRouter from "./routes/conversations.js";
import messagesRouter from "./routes/messages.js";
import uploadsRouter from "./routes/uploads.js";
import callsRouter from "./routes/calls.js";
import notificationsRouter from "./routes/notifications.js";
import presenceRouter from "./routes/presence.js";

app.use("/api/conversations", authMiddleware, conversationsRouter);
app.use("/api/messages", authMiddleware, messagesRouter);
app.use("/api/uploads", authMiddleware, uploadsRouter);
app.use("/api/calls", authMiddleware, callsRouter);
app.use("/api/notifications", authMiddleware, notificationsRouter);
app.use("/api/presence", authMiddleware, presenceRouter);

// Socket handlers
import attachSocketHandlers from "./sockets/socketHandler.js";
attachSocketHandlers(io);

// DB + server start
const PORT = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI).then(() => {
    server.listen(PORT, () => console.log(`Listening on ${PORT}`));
}).catch(err => console.error("Mongo failed", err));
