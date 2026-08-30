import { verifyToken } from "../utils/jwt.js";

export const socketAuth = (socket, next) => {
    try {
        // Get the raw Cookie header from the Socket.io handshake
        const cookieHeader = socket.handshake.headers.cookie;

        if (!cookieHeader) {
            return next(
                new Error("Authentication error: No token provided")
            );
        }

        // Example:
        // "token=ABC123; otherCookie=hello"

        const token = cookieHeader
            .split(";")
            .find(cookie => cookie.trim().startsWith("token="))
            ?.split("=")[1];

        if (!token) {
            return next(
                new Error("Authentication error: No token provided")
            );
        }

        // Verify JWT
        const decoded = verifyToken(token);

        // Store authenticated user on socket
        socket.user = decoded;

        // Authentication successful
        next();

    } catch (err) {
        next(
            new Error("Authentication error: " + err.message)
        );
    }
};