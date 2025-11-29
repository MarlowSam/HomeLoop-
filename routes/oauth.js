// routes/oauth.js - OAuth authentication routes
import express from "express";
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();
const JWT_EXPIRES = "1d";

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to create JWT token
function createToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

/* --------------------- GOOGLE LOGIN/SIGNUP --------------------- */
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name; // Full name from Google

    if (!email) {
      return res.status(400).json({ message: "Unable to retrieve email from Google" });
    }

    // Check if user exists
    const [existingUsers] = await db
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);

    let user;
    let isNewUser = false;

    if (existingUsers.length > 0) {
      // User exists - login (works even if they signed up with password)
      user = existingUsers[0];
    } else {
      // New user - create account
      const [userResult] = await db
        .promise()
        .query(
          "INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, NULL, 'user')",
          [email, name || email.split('@')[0]] // Use name from Google, fallback to email prefix
        );

      const userId = userResult.insertId;
      user = {
        user_id: userId,
        email: email,
        username: name || email.split('@')[0],
        role: 'user'
      };
      isNewUser = true;
    }

    // Create JWT token
    const token = createToken({
      userId: user.user_id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      message: isNewUser ? "Account created successfully" : "Login successful",
      user: {
        userId: user.user_id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      token,
      redirectTo: "/",
    });
  } catch (err) {
    console.error("Google login error:", err);
    return res.status(500).json({ message: "Google authentication failed" });
  }
});

/* --------------------- FACEBOOK LOGIN/SIGNUP --------------------- */
router.post("/facebook", async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: "Facebook access token is required" });
    }

    // Verify Facebook token and get user info
    const fbResponse = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`
    );

    const { email, name } = fbResponse.data;

    if (!email) {
      return res.status(400).json({ 
        message: "Unable to retrieve email from Facebook. Please ensure email permission is granted." 
      });
    }

    // Check if user exists
    const [existingUsers] = await db
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);

    let user;
    let isNewUser = false;

    if (existingUsers.length > 0) {
      // User exists - login (works even if they signed up with password)
      user = existingUsers[0];
    } else {
      // New user - create account
      const [userResult] = await db
        .promise()
        .query(
          "INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, NULL, 'user')",
          [email, name || email.split('@')[0]]
        );

      const userId = userResult.insertId;
      user = {
        user_id: userId,
        email: email,
        username: name || email.split('@')[0],
        role: 'user'
      };
      isNewUser = true;
    }

    // Create JWT token
    const token = createToken({
      userId: user.user_id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      message: isNewUser ? "Account created successfully" : "Login successful",
      user: {
        userId: user.user_id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      token,
      redirectTo: "/",
    });
  } catch (err) {
    console.error("Facebook login error:", err);
    return res.status(500).json({ message: "Facebook authentication failed" });
  }
});

export default router;