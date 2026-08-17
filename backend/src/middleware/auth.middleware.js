import { verifyToken } from "../utils/jwt.js";

export const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            message: "Authentication required"
        });
    }

    try {
        const decoded = verifyToken(token);

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};