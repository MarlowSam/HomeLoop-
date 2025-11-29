// server.js - SECURE VERSION WITH PER-USER RATE LIMITING
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
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
import chatHandler from './socket/chatHandler.js';
import { startReviewScheduler } from "./services/reviewScheduler.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

// ==========================================
// 🔒 SECURITY: HELMET - Security Headers
// ==========================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
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
// 🔒 SECURITY: PER-USER RATE LIMITERS
// ==========================================

// Global API rate limiter - PER USER (automatically uses req.ip with IPv6 support)
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests per user per minute
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  // Removed keyGenerator - uses default IP-based limiting with IPv6 support
});

// Login rate limiter - PER IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  message: { message: "Too many login attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Signup rate limiter - PER IP
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 signups per IP per hour
  message: { message: "Too many accounts created. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiter - PER USER
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per user per hour
  message: { message: "Upload limit exceeded. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// LENIENT rate limiter for READ operations (property listings)
const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 500, // 500 reads per user per minute (very lenient)
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================================
// CORS Configuration
// ==========================================
app.use(
  cors({
    origin: ["http://127.0.0.1:8000", "http://127.0.0.1:5500", "http://localhost:8000", "http://localhost:5500"],
    credentials: true,
  })
);

// ==========================================
// 🔒 SECURITY: Body Parser with Size Limits
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

// ==========================================
// 🔒 SECURITY: Apply Rate Limiters to Routes
// ==========================================

// Lenient limits for READ operations (GET requests for property listings)
app.use("/api/properties/featured", readLimiter);
app.use("/api/properties/recommended", readLimiter);
app.get("/api/properties", readLimiter);

// Specific strict limits for auth operations
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/signup", signupLimiter);

// Upload limits for property creation/editing
app.post("/api/properties", uploadLimiter);
app.put("/api/properties/:id", uploadLimiter);

// General API limit for everything else
app.use("/api/", apiLimiter);

// ==========================================
// Routes
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertiesRoutes);
app.use("/api/agents", agentsRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/chat', chatRoutes);

// ==========================================
// Home Route
// ==========================================
app.get("/", (req, res) => {
  res.send("✅ HomeLoop backend running with per-user rate limiting!");
});

// ==========================================
// 🔒 SECURITY: Global Error Handler
// ==========================================
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
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
    origin: ["http://127.0.0.1:8000", "http://127.0.0.1:5500", "http://localhost:8000", "http://localhost:5500"],
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
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Socket.io enabled for real-time chat`);
  console.log(`🔒 Per-user rate limiting enabled`);
  console.log(`🔒 Security features enabled`);

  startReviewScheduler();
});

export default app;