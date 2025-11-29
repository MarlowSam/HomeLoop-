// routes/smsAuth.js
import express from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import twilio from "twilio";
import db from "../db.js";

dotenv.config();
const router = express.Router();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const otpStore = new Map(); // temporary in-memory OTP storage

function createToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });
}

/**
 * Request OTP
 */
router.post("/request-otp", async (req, res) => {
  const { phone_number } = req.body;

  if (!phone_number) return res.status(400).json({ message: "Phone number is required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone_number, otp);

  try {
    await client.messages.create({
      body: `Your HomeLoop login code is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone_number,
    });
    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

/**
 * Verify OTP
 */
router.post("/verify-otp", async (req, res) => {
  const { phone_number, otp } = req.body;
  const storedOtp = otpStore.get(phone_number);

  if (!storedOtp || storedOtp !== otp)
    return res.status(400).json({ message: "Invalid or expired OTP" });

  otpStore.delete(phone_number);

  // Create user if not exist
  let [user] = await db.promise().query("SELECT * FROM agents WHERE phone_number = ?", [phone_number]);
  if (user.length === 0) {
    const [authResult] = await db.promise().query(
      "INSERT INTO auths (email, role) VALUES (?, 'agent')",
      [`${phone_number}@smslogin.com`]
    );
    await db.promise().query("INSERT INTO agents (auth_id, phone_number) VALUES (?, ?)", [
      authResult.insertId,
      phone_number,
    ]);
  }

  const token = createToken({ phone_number });
  res.json({ message: "SMS login successful", token });
});

export default router;
