// middleware/auth.js
import jwt from "jsonwebtoken";

/* --------------------- VERIFY TOKEN MIDDLEWARE --------------------- */
export function verifyToken(req, res, next) {
  try {
    // 1️⃣ Get token from cookie
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ 
        message: "Access denied. No token provided.",
        isAuthenticated: false 
      });
    }

    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3️⃣ Attach user info to request
    req.user = decoded; // { userId, email, role }

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ 
        message: "Token expired. Please login again.",
        isAuthenticated: false 
      });
    }
    return res.status(401).json({ 
      message: "Invalid token.",
      isAuthenticated: false 
    });
  }
}

/* --------------------- REQUIRE AGENT ROLE --------------------- */
export function requireAgent(req, res, next) {
  // This middleware should come AFTER verifyToken
  if (!req.user) {
    return res.status(401).json({ 
      message: "Authentication required" 
    });
  }

  if (req.user.role !== "agent") {
    return res.status(403).json({ 
      message: "Access denied. Agents only.",
      requiredRole: "agent",
      userRole: req.user.role
    });
  }

  next();
}

/* --------------------- REQUIRE USER ROLE --------------------- */
export function requireUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      message: "Authentication required" 
    });
  }

  if (req.user.role !== "user") {
    return res.status(403).json({ 
      message: "Access denied. Regular users only.",
      requiredRole: "user",
      userRole: req.user.role
    });
  }

  next();
}

/* --------------------- OPTIONAL AUTH (doesn't fail if no token) --------------------- */
export function optionalAuth(req, res, next) {
  try {
    const token = req.cookies.token;
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
  } catch (err) {
    // Token invalid/expired, but we don't fail - just continue without user
    req.user = null;
  }
  
  next();
}