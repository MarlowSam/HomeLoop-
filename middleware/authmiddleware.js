import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// ✅ Verify JWT token
export const verifyToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ✅ Restrict to agents only
export const requireAgent = (req, res, next) => {
  if (req.user.role !== "agent") {
    return res.status(403).json({ message: "Access denied — agents only" });
  }
  next();
};
