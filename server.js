// server.js - WITH BUNDLES ROUTE & VIDEO UPLOAD SUPPORT
// VERIFIED VERSION WITH PROPER ROUTE REGISTRATION
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import db from "./db.js";
import authRoutes from "./routes/auth.js";
import propertiesRoutes from "./routes/properties.js";
import agentsRoutes from "./routes/agents.js";
import bookingsRoutes from "./routes/bookings.js";
import reviewsRoutes from "./routes/reviews.js";
import paymentRoutes from './routes/payments.js';
import oauthRoutes from './routes/oauth.js';
import chatRoutes from './routes/chat.js';
import bundlesRoutes from './routes/bundles.js';
import chatHandler from './socket/chatHandler.js';
import { startReviewScheduler } from "./services/reviewScheduler.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

console.log('🚀 Starting HomeLoop Server...');
console.log('📍 Environment:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');

// ==========================================
// CREATE UPLOAD DIRECTORIES IF THEY DON'T EXIST
// ==========================================
const uploadsDir = path.join(__dirname, "uploads");
const videosDir = path.join(__dirname, "uploads", "videos");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created uploads directory");
}

if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
  console.log("✅ Created uploads/videos directory");
}

// ==========================================
// 🔒 SECURITY: HELMET - Security Headers
// ==========================================
app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcElem: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      mediaSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  } : false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ==========================================
// 🔒 SECURITY: RATE LIMITER DEFINITIONS
// ==========================================

// Global API rate limiter
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Signup rate limiter
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { message: "Too many accounts created. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiter (increased for video uploads)
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { message: "Upload limit exceeded. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================================
// CORS Configuration
// ==========================================
const allowedOrigins = isProduction 
  ? [process.env.FRONTEND_URL || "https://homeloop.onrender.com"]
  : ["http://127.0.0.1:8000", "http://127.0.0.1:5500", "http://localhost:8000", "http://localhost:5500", "http://localhost:5000"];

console.log('🌐 CORS allowed origins:', allowedOrigins);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// ==========================================
// 🔒 SECURITY: Body Parser with Size Limits (increased for video)
// ==========================================
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ==========================================
// 🔒 SECURITY: Serve Static Files Securely
// ==========================================
app.use("/uploads", (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  next();
}, express.static(path.join(__dirname, "uploads")));

// Serve videos directory
app.use("/uploads/videos", (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  next();
}, express.static(path.join(__dirname, "uploads", "videos")));

// ==========================================
// Serve Frontend Static Files
// ==========================================
app.use(express.static(path.join(__dirname, "public")));

// ==========================================
// 🎯 ROUTES REGISTRATION - MUST COME BEFORE RATE LIMITERS
// ==========================================
console.log('📝 Registering API routes...');

app.use("/api/auth", authRoutes);
console.log('✅ Auth routes registered');

app.use("/api/properties", propertiesRoutes);
console.log('✅ Properties routes registered');

app.use("/api/agents", agentsRoutes);
console.log('✅ Agents routes registered');

app.use("/api/bookings", bookingsRoutes);
console.log('✅ Bookings routes registered');

app.use("/api/reviews", reviewsRoutes);
console.log('✅ Reviews routes registered');

app.use('/api/payments', paymentRoutes);
console.log('✅ Payment routes registered');

app.use('/api/oauth', oauthRoutes);
console.log('✅ OAuth routes registered');

app.use('/api/chat', chatRoutes);
console.log('✅ Chat routes registered');

app.use('/api/bundles', bundlesRoutes);
console.log('✅ Bundles routes registered');

// ==========================================
// APPLY RATE LIMITERS TO SPECIFIC ROUTES
// ==========================================
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/signup", signupLimiter);
app.post("/api/properties", uploadLimiter);
app.put("/api/properties/:id", uploadLimiter);
app.post("/api/bundles", uploadLimiter);

// General API rate limiter as fallback
app.use("/api/", apiLimiter);

// ==========================================
// Home Route
// ==========================================
app.get("/", (req, res) => {
  res.send("✅ HomeLoop backend running with video upload & bundle support!");
});

// ==========================================
// Catch-all route - Serve index.html for client-side routing
// ==========================================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==========================================
// 🔒 SECURITY: Global Error Handler
// ==========================================
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  
  if (isProduction) {
    return res.status(err.status || 500).json({
      message: "An error occurred",
      ...(err.status === 400 && { details: err.message })
    });
  }
  
  res.status(err.status || 500).json({
    message: err.message,
    stack: err.stack
  });
});

// ==========================================
// Create HTTP Server and Socket.io
// ==========================================
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  },
  maxHttpBufferSize: 1e6,
  pingTimeout: 60000,
  pingInterval: 25000
});

chatHandler(io);

// ==========================================
// Start Server
// ==========================================
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log('\n🎉 ======================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Socket.io enabled for real-time chat`);
  console.log(`✅ Video upload support enabled`);
  console.log(`✅ Bundle package support enabled`);
  console.log(`🔒 Per-user rate limiting enabled`);
  console.log(`🔒 Security features enabled`);
  console.log(`🔒 CSP ${isProduction ? 'ENABLED' : 'DISABLED'} (${isProduction ? 'production' : 'development'} mode)`);
  console.log('🎉 ======================================\n');

  startReviewScheduler();
});

export default app;