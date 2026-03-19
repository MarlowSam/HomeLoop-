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
import { v2 as cloudinary } from "cloudinary";
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
// CLOUDINARY
// ==========================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log('✅ Cloudinary configured');

// ==========================================
// HELMET
// ==========================================
app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.socket.io"],
      scriptSrcElem: ["'self'", "'unsafe-inline'", "https://cdn.socket.io"],
      imgSrc: ["'self'", "data:", "https:", "http:", "https://res.cloudinary.com"],
      mediaSrc: ["'self'", "data:", "https:", "http:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "ws:", "wss:", "https://homelooptest-123.onrender.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  } : false,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ==========================================
// RATE LIMITERS
// ==========================================
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, max: 200,
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true, legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  message: { message: "Too many login attempts. Try again in 15 minutes." },
  standardHeaders: true, legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 3,
  message: { message: "Too many accounts created. Try again later." },
  standardHeaders: true, legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 20,
  message: { message: "Upload limit exceeded. Try again later." },
  standardHeaders: true, legacyHeaders: false,
});

// ==========================================
// CORS
// ==========================================
const allowedOrigins = isProduction
  ? [
      process.env.FRONTEND_URL || "https://homelooptest-123.onrender.com",
      "https://homelooptest-123.onrender.com"
    ]
  : ["http://127.0.0.1:8000", "http://127.0.0.1:5500", "http://localhost:8000", "http://localhost:5500", "http://localhost:5000"];

console.log('🌐 CORS allowed origins:', allowedOrigins);

app.use(cors({ origin: allowedOrigins, credentials: true }));

// ==========================================
// BODY PARSER & COOKIES
// ==========================================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// ==========================================
// STATIC FILES
// ==========================================
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, "uploads")));

// ==========================================
// API ROUTES
// ==========================================
console.log('📝 Registering API routes...');

app.use("/api/auth", authRoutes);
app.use("/api/properties", propertiesRoutes);
app.use("/api/agents", agentsRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/bundles', bundlesRoutes);

console.log('✅ All routes registered');

// ==========================================
// RATE LIMITERS ON SPECIFIC ROUTES
// ==========================================
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/signup", signupLimiter);
app.post("/api/properties", uploadLimiter);
app.put("/api/properties/:id", uploadLimiter);
app.post("/api/bundles", uploadLimiter);
app.use("/api/", apiLimiter);

// ==========================================
// ROBOTS.TXT
// ==========================================
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(
`User-agent: *
Allow: /
Allow: /house.html
Allow: /bundle.html
Allow: /agentprofile.html
Allow: /index.html

Disallow: /agentdashboard.html
Disallow: /login.html
Disallow: /signup.html
Disallow: /favourites.html
Disallow: /book-visit.html
Disallow: /api/

Sitemap: https://homelooptest-123.onrender.com/sitemap.xml`
  );
});

// ==========================================
// SITEMAP.XML
// ==========================================
app.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = 'https://homelooptest-123.onrender.com';

    const [properties] = await db.promise().query(
      `SELECT property_id, updated_at FROM properties WHERE status = 'active' ORDER BY updated_at DESC`
    );

    const [bundles] = await db.promise().query(
      `SELECT bundle_id, updated_at FROM bundles ORDER BY updated_at DESC`
    );

    const staticPages = [
      { url: '/',              priority: '1.0', changefreq: 'daily'   },
      { url: '/listings.html', priority: '0.8', changefreq: 'daily'   },
      { url: '/about.html',    priority: '0.5', changefreq: 'monthly' },
      { url: '/help.html',     priority: '0.4', changefreq: 'monthly' },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    for (const page of staticPages) {
      xml += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    }

    for (const p of properties) {
      const lastmod = new Date(p.updated_at).toISOString().split('T')[0];
      xml += `
  <url>
    <loc>${baseUrl}/house.html?id=${p.property_id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
    }

    for (const b of bundles) {
      const lastmod = new Date(b.updated_at).toISOString().split('T')[0];
      xml += `
  <url>
    <loc>${baseUrl}/bundle.html?id=${b.bundle_id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    xml += '\n</urlset>';
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error('❌ Sitemap error:', err);
    res.status(500).send('Error generating sitemap');
  }
});

// ==========================================
// HOME ROUTE
// ==========================================
app.get("/", (req, res) => {
  res.send("✅ HomeLoop backend running!");
});

// ==========================================
// CATCH-ALL
// ==========================================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  if (isProduction) {
    return res.status(err.status || 500).json({
      message: "An error occurred",
      ...(err.status === 400 && { details: err.message })
    });
  }
  res.status(err.status || 500).json({ message: err.message, stack: err.stack });
});

// ==========================================
// SOCKET.IO & HTTP SERVER
// ==========================================
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, credentials: true },
  maxHttpBufferSize: 1e6,
  pingTimeout: 60000,
  pingInterval: 25000
});

chatHandler(io);

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Cloudinary image storage enabled`);
  console.log(`🔒 Security features enabled`);
  startReviewScheduler();
});

// ==========================================
// DB KEEP-ALIVE - prevents Aiven from powering off
// ==========================================
setInterval(async () => {
  try {
    await db.promise().query('SELECT 1');
    console.log('✅ DB keep-alive ping sent');
  } catch (err) {
    console.error('❌ DB keep-alive failed:', err.message);
  }
}, 4 * 60 * 60 * 1000);

export default app;