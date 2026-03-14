import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const authMiddleware = async (req, res, next) => {
  try {
    let token = null;


    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token not found. Please log in.",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token. Please log in again.",
      });
    }


    req.user = {
      id: decoded.id,
      name: decoded.name || "Unknown",
    };

    next();
  } catch (error) {
    console.error("authMiddleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};
