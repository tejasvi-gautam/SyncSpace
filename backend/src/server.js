import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import http from "http";
import { Server } from "socket.io";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true
    }
});
io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });
});

// Health route
app.get("/", (req, res) => {
    console.log(" HEALTH ROUTE HIT");

    res.status(200).json({
        message: "SyncSpace server is running"
    });
});

// API health route
app.get("/api/health", (req, res) => {
    const healthStatus =
        mongoose.connection.readyState === 1
            ? "db_connected"
            : "db_not_connected";

    res.status(200).json({
        message: "SyncSpace API is running",
        db_status: healthStatus
    });
});

const PORT = process.env.PORT || 54321;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(` SyncSpace server running on port ${PORT}`);
    });
};

startServer();