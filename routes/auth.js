// routes/auth.js - SECURE VERSION WITH PASSWORD VALIDATION & SECURE COOKIES
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import db from "../db.js";
import { verifyToken } from "../middleware/auth.js";
import { body, validationResult } from "express-validator";

const router = express.Router();
const JWT_EXPIRES = "1d";
const isProduction = process.env.NODE_ENV === 'production';

function createToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

// 🔒 Secure cookie configuration
const cookieConfig = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'strict' : 'lax',
  maxAge: 24 * 60 * 60 * 1000,
  path: "/"
};

// ==========================================
// EMAIL TRANSPORTER (Brevo SMTP)
// ==========================================
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS
  }
});

// ==========================================
// 🔒 Password Validation
// ==========================================
function validatePassword(password) {
  const errors = [];
  if (password.length < 8)                          errors.push("Password must be at least 8 characters");
  if (!/[A-Z]/.test(password))                      errors.push("Password must contain at least one uppercase letter");
  if (!/[a-z]/.test(password))                      errors.push("Password must contain at least one lowercase letter");
  if (!/[0-9]/.test(password))                      errors.push("Password must contain at least one number");
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))    errors.push("Password must contain at least one special character");
  return errors;
}

// ==========================================
// 🔒 Input Sanitization
// ==========================================
function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
}

// ==========================================
// SIGN UP
// ==========================================
router.post("/signup", [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('username').isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('Invalid username'),
  body('password').isLength({ min: 8 }).withMessage('Password too short'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: errors.array().map(e => e.msg) 
      });
    }

    let { email, username, password, isAgent, fullName, licenseNumber, agencyName, phoneNumber } = req.body;

    email        = sanitizeInput(email);
    username     = sanitizeInput(username);
    fullName     = sanitizeInput(fullName);
    licenseNumber = sanitizeInput(licenseNumber);
    agencyName   = sanitizeInput(agencyName);
    phoneNumber  = sanitizeInput(phoneNumber);

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ 
        message: "Password does not meet requirements",
        errors: passwordErrors
      });
    }

    if (isAgent) {
      if (!fullName || !licenseNumber || !agencyName || !phoneNumber) {
        return res.status(400).json({
          message: "Agent signup requires: fullName, licenseNumber, agencyName, phoneNumber"
        });
      }
    }

    const [existingEmail] = await db.promise().query(
      "SELECT user_id FROM users WHERE email = ?", [email]
    );
    if (existingEmail.length) {
      return res.status(400).json({ message: "Registration failed" });
    }

    const [existingUsername] = await db.promise().query(
      "SELECT user_id FROM users WHERE username = ?", [username]
    );
    if (existingUsername.length) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const hashed = bcrypt.hashSync(password, 12);
    const role = isAgent ? "agent" : "user";

    const [userResult] = await db.promise().query(
      "INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, ?)",
      [email, username, hashed, role]
    );

    const userId = userResult.insertId;

    if (isAgent) {
      await db.promise().query(
        "INSERT INTO agents (user_id, full_name, licence_number, agency_name, phone_number) VALUES (?, ?, ?, ?, ?)",
        [userId, fullName, licenseNumber, agencyName, phoneNumber]
      );
    }

    const token = createToken({ userId, email, username, role });
    res.cookie("token", token, cookieConfig);

    return res.status(201).json({
      message: "Signup successful",
      user: { userId, email, username, role },
      token,
      redirectTo: role === "agent" ? "/dashboard" : "/",
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: "An error occurred during signup" });
  }
});

// ==========================================
// LOGIN
// ==========================================
router.post("/login", [
  body('email').notEmpty().withMessage('Email/username required'),
  body('password').notEmpty().withMessage('Password required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: errors.array().map(e => e.msg) 
      });
    }

    let { email, password } = req.body;
    email = sanitizeInput(email);

    const [users] = await db.promise().query(
      "SELECT * FROM users WHERE email = ? OR username = ?", 
      [email, email]
    );
    
    if (!users.length) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];
    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    let agentDetails = null;
    if (user.role === "agent") {
      const [agents] = await db.promise().query(
        "SELECT full_name, licence_number, agency_name, phone_number FROM agents WHERE user_id = ?",
        [user.user_id]
      );
      agentDetails = agents[0] || null;
    }

    const token = createToken({
      userId: user.user_id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

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
    return res.status(500).json({ message: "An error occurred during login" });
  }
});

// ==========================================
// LOGOUT
// ==========================================
router.post("/logout", (req, res) => {
  res.clearCookie("token", cookieConfig);
  return res.status(200).json({ message: "Logged out successfully" });
});

// ==========================================
// VERIFY / GET CURRENT USER
// ==========================================
router.get("/me", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [users] = await db.promise().query(
      "SELECT user_id, email, username, role, created_at FROM users WHERE user_id = ?", 
      [userId]
    );

    if (!users.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];
    let agentDetails = null;

    if (user.role === "agent") {
      const [agents] = await db.promise().query(
        "SELECT full_name, licence_number, agency_name, phone_number FROM agents WHERE user_id = ?",
        [userId]
      );
      agentDetails = agents[0] || null;
    }

    const token = createToken({
      userId: user.user_id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    return res.status(200).json({
      isAuthenticated: true,
      token,
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

// ==========================================
// FORGOT PASSWORD
// ==========================================
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM users WHERE email = ?', [email]
    );
    const user = rows[0];

    // Always return same message (don't reveal if email exists)
    if (!user) {
      return res.json({ message: 'If this email exists, a reset link has been sent.' });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await db.promise().query(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
      [token, expiry, email]
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;

    await transporter.sendMail({
      from: `"HomeLoop" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your HomeLoop Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; 
                    background: #1a001f; color: white; padding: 30px; border-radius: 12px;">
          <h2 style="color: #ff4dd2;">HomeLoop Password Reset</h2>
          <p>You requested to reset your password. Click the button below:</p>
          <a href="${resetLink}" 
             style="display: inline-block; background: linear-gradient(135deg, #ff4dd2, #ff9900);
                    color: white; padding: 12px 24px; border-radius: 8px; 
                    text-decoration: none; font-weight: bold; margin: 20px 0;">
            Reset Password
          </a>
          <p style="color: #aaa; font-size: 0.85rem;">
            This link expires in <strong>1 hour</strong>. 
            If you didn't request this, safely ignore this email.
          </p>
          <p style="color: #666; font-size: 0.8rem;">© 2025 HomeLoop. Nairobi, Kenya.</p>
        </div>
      `
    });

    res.json({ message: 'If this email exists, a reset link has been sent.' });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ==========================================
// RESET PASSWORD
// ==========================================
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [token]
    );
    const user = rows[0];

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });
    }

    // Validate new password strength
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ 
        message: "Password does not meet requirements",
        errors: passwordErrors
      });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 12);

    await db.promise().query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE user_id = ?',
      [hashedPassword, user.user_id]
    );

    res.json({ message: 'Password reset successful! You can now log in.' });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

export default router;