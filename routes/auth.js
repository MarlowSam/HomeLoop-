// routes/auth.js - SECURE VERSION WITH PASSWORD VALIDATION & SECURE COOKIES
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";
import { verifyToken } from "../middleware/auth.js";
import { body, validationResult } from "express-validator"; // 🔒 SECURITY: Input validation

const router = express.Router();
const JWT_EXPIRES = "1d";
const isProduction = process.env.NODE_ENV === 'production';

function createToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

// 🔒 SECURITY: Secure cookie configuration
const cookieConfig = {
  httpOnly: true,
  secure: isProduction, // 🔒 SECURITY: Only HTTPS in production
  sameSite: isProduction ? 'strict' : 'lax', // 🔒 SECURITY: Prevent CSRF
  maxAge: 24 * 60 * 60 * 1000,
  path: "/"
};

// ==========================================
// 🔒 SECURITY: Password Validation Function
// ==========================================
function validatePassword(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return errors;
}

// ==========================================
// 🔒 SECURITY: Input Sanitization
// ==========================================
function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, ''); // 🔒 SECURITY: Remove < and >
}

// ==========================================
// SIGN UP
// ==========================================
router.post("/signup", [
  // 🔒 SECURITY: Validate and sanitize inputs
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('username').isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('Invalid username'),
  body('password').isLength({ min: 8 }).withMessage('Password too short'),
], async (req, res) => {
  try {
    // 🔒 SECURITY: Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: errors.array().map(e => e.msg) 
      });
    }

    let { email, username, password, isAgent, fullName, licenseNumber, agencyName, phoneNumber } = req.body;

    // 🔒 SECURITY: Sanitize inputs
    email = sanitizeInput(email);
    username = sanitizeInput(username);
    fullName = sanitizeInput(fullName);
    licenseNumber = sanitizeInput(licenseNumber);
    agencyName = sanitizeInput(agencyName);
    phoneNumber = sanitizeInput(phoneNumber);

    // 🔒 SECURITY: Validate password strength
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ 
        message: "Password does not meet requirements",
        errors: passwordErrors
      });
    }

    // Validate agent fields
    if (isAgent) {
      if (!fullName || !licenseNumber || !agencyName || !phoneNumber) {
        return res.status(400).json({
          message: "Agent signup requires: fullName, licenseNumber, agencyName, phoneNumber"
        });
      }
    }

    // Check for existing email (using parameterized query)
    const [existingEmail] = await db
      .promise()
      .query("SELECT user_id FROM users WHERE email = ?", [email]);

    if (existingEmail.length) {
      // 🔒 SECURITY: Generic error message to prevent user enumeration
      return res.status(400).json({ message: "Registration failed" });
    }

    // Check for existing username
    const [existingUsername] = await db
      .promise()
      .query("SELECT user_id FROM users WHERE username = ?", [username]);

    if (existingUsername.length) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // 🔒 SECURITY: Hash password with higher cost factor
    const hashed = bcrypt.hashSync(password, 12); // Increased from 10 to 12
    const role = isAgent ? "agent" : "user";

    // Insert user
    const [userResult] = await db
      .promise()
      .query(
        "INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, ?)",
        [email, username, hashed, role]
      );

    const userId = userResult.insertId;

    // If agent, insert agent details
    if (isAgent) {
      await db
        .promise()
        .query(
          "INSERT INTO agents (user_id, full_name, licence_number, agency_name, phone_number) VALUES (?, ?, ?, ?, ?)",
          [userId, fullName, licenseNumber, agencyName, phoneNumber]
        );
    }

    // Create token
    const token = createToken({ userId, email, username, role });

    // 🔒 SECURITY: Set secure cookie
    res.cookie("token", token, cookieConfig);

    return res.status(201).json({
      message: "Signup successful",
      user: { userId, email, username, role },
      token,
      redirectTo: role === "agent" ? "/dashboard" : "/",
    });
  } catch (err) {
    console.error("Signup error:", err);
    // 🔒 SECURITY: Generic error message
    return res.status(500).json({ message: "An error occurred during signup" });
  }
});

// ==========================================
// LOGIN
// ==========================================
router.post("/login", [
  // 🔒 SECURITY: Validate inputs
  body('email').notEmpty().withMessage('Email/username required'),
  body('password').notEmpty().withMessage('Password required'),
], async (req, res) => {
  try {
    // 🔒 SECURITY: Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: errors.array().map(e => e.msg) 
      });
    }

    let { email, password } = req.body;

    // 🔒 SECURITY: Sanitize inputs
    email = sanitizeInput(email);

    // Allow login with email OR username (parameterized query)
    const [users] = await db.promise().query(
      "SELECT * FROM users WHERE email = ? OR username = ?", 
      [email, email]
    );
    
    if (!users.length) {
      // 🔒 SECURITY: Generic error - don't reveal if user exists
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];
    
    // 🔒 SECURITY: Compare passwords securely
    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      // 🔒 SECURITY: Same generic error
      return res.status(401).json({ message: "Invalid credentials" });
    }

    let agentDetails = null;
    if (user.role === "agent") {
      const [agents] = await db
        .promise()
        .query(
          "SELECT full_name, licence_number, agency_name, phone_number FROM agents WHERE user_id = ?",
          [user.user_id]
        );
      agentDetails = agents[0] || null;
    }

    // Create JWT token
    const token = createToken({
      userId: user.user_id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    // 🔒 SECURITY: Set secure cookie
    res.cookie("token", token, cookieConfig);

    return res.status(200).json({
      message: "Login successful",
      user: {
        userId: user.user_id,
        email: user.email,
        username: user.username,
        role: user.role,
        ...agentDetails,
      },
      token,
      redirectTo: user.role === "agent" ? "/dashboard" : "/",
    });
  } catch (err) {
    console.error("Login error:", err);
    // 🔒 SECURITY: Generic error message
    return res.status(500).json({ message: "An error occurred during login" });
  }
});

// ==========================================
// LOGOUT
// ==========================================
router.post("/logout", (req, res) => {
  // 🔒 SECURITY: Use same cookie config for clearing
  res.clearCookie("token", cookieConfig);
  return res.status(200).json({ message: "Logged out successfully" });
});

// ==========================================
// VERIFY / GET CURRENT USER
// ==========================================
router.get("/me", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [users] = await db
      .promise()
      .query("SELECT user_id, email, username, role, created_at FROM users WHERE user_id = ?", [userId]);

    if (!users.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];
    let agentDetails = null;

    if (user.role === "agent") {
      const [agents] = await db
        .promise()
        .query(
          "SELECT full_name, licence_number, agency_name, phone_number FROM agents WHERE user_id = ?",
          [userId]
        );
      agentDetails = agents[0] || null;
    }

    // Generate a fresh token to send in response
    const token = createToken({
      userId: user.user_id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    return res.status(200).json({
      isAuthenticated: true,
      token: token,
      user: {
        userId: user.user_id,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.created_at,
        ...agentDetails,
      },
    });
  } catch (err) {
    console.error("Get current user error:", err);
    return res.status(500).json({ message: "An error occurred" });
  }
});

export default router;