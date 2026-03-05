// routes/properties.js - FIXED VERSION WITH BETTER SIMILAR PROPERTIES LOGIC
import express from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import fs from "fs";
import { fileURLToPath } from "url";
import db from "../db.js";
import { verifyToken, requireAgent } from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// 🔒 SECURITY: File Upload Configuration
// ==========================================
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Check if it's an image
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype) && 
      ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return cb(null, true);
  }
  
  // Check if it's a video
  if (ALLOWED_VIDEO_TYPES.includes(file.mimetype) && 
      ALLOWED_VIDEO_EXTENSIONS.includes(ext)) {
    return cb(null, true);
  }
  
  return cb(new Error('Invalid file type. Only JPG, PNG, WEBP, MP4, WEBM allowed.'), false);
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Separate folders for images and videos
    if (file.mimetype.startsWith('video/')) {
      cb(null, "uploads/videos/");
    } else {
      cb(null, "uploads/");
    }
  },
  filename: function (req, file, cb) {
    const randomName = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomName}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: MAX_VIDEO_SIZE, // Use max video size as the limit
    files: 15 // Max 10 images + 2 videos per property
  },
});

// ==========================================
// 🔒 SECURITY: Image Processing Middleware
// ==========================================
async function processImages(req, res, next) {
  // When using upload.fields(), req.files is an object: { images: [...], videos: [...] }
  if (!req.files || Object.keys(req.files).length === 0) {
    return next();
  }

  try {
    // Process only the images field
    const imageFiles = req.files.images || [];
    
    for (const file of imageFiles) {
      const processedPath = file.path.replace(path.extname(file.path), '_processed.jpg');
      
      await sharp(file.path)
        .jpeg({ quality: 85 })
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .toFile(processedPath);
      
      fs.unlinkSync(file.path);
      fs.renameSync(processedPath, file.path);
    }
    
    // req.files already has the correct structure from multer
    next();
  } catch (error) {
    console.error('Image processing error:', error);
    
    // Clean up all uploaded files on error
    if (req.files) {
      // Handle both images and videos
      if (req.files.images) {
        req.files.images.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      if (req.files.videos) {
        req.files.videos.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
    }
    return res.status(400).json({ message: 'Invalid image file' });
  }
}

// ==========================================
// 🔒 SECURITY: Input Validation Functions
// ==========================================
function validatePropertyId(id) {
  const numId = parseInt(id);
  if (isNaN(numId) || numId < 1 || !/^\d+$/.test(id)) {
    throw new Error('Invalid property ID');
  }
  return numId;
}

function validateLimit(limit) {
  const numLimit = parseInt(limit);
  if (isNaN(numLimit) || numLimit < 1 || numLimit > 100) {
    return 10;
  }
  return numLimit;
}

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, 1000);
}

function validatePrice(price) {
  const numPrice = parseFloat(price);
  if (isNaN(numPrice) || numPrice < 0) {
    throw new Error('Invalid price');
  }
  return numPrice;
}

function validateNumber(num, min = 0, max = 1000) {
  const parsed = parseInt(num);
  if (isNaN(parsed) || parsed < min || parsed > max) {
    return min;
  }
  return parsed;
}

// ==========================================
// POST: Add New Property (with image & video upload)
// ==========================================
router.post("/", 
  verifyToken, 
  requireAgent, 
  upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 2 }
  ]),
  processImages,
  async (req, res) => {
  try {
    console.log("✅ Upload route hit");
    console.log("Received files:", req.files);
    console.log("Received body:", req.body);

    let { 
      title, 
      description, 
      property_type, 
      listing_type, 
      price,
      viewing_fee, 
      bedrooms, 
      bathrooms,  
      address_line1,
      city, 
      units_available, 
      is_featured,
      is_bundle,
      bundle_id
    } = req.body;

    title = sanitizeString(title);
    description = sanitizeString(description);
    address_line1 = sanitizeString(address_line1);
    city = sanitizeString(city);
    property_type = sanitizeString(property_type) || "Apartment";
    listing_type = sanitizeString(listing_type) || "rent";

    if (!title || title.length < 3) {
      return res.status(400).json({ message: "Valid title is required (min 3 characters)" });
    }

    if (!city || city.length < 2) {
      return res.status(400).json({ message: "Valid city is required" });
    }

    try {
      price = validatePrice(price);
      viewing_fee = viewing_fee ? validatePrice(viewing_fee) : 0;
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    bedrooms = validateNumber(bedrooms, 0, 50);
    bathrooms = validateNumber(bathrooms, 0, 50);
    units_available = validateNumber(units_available, 1, 1000);
    is_featured = is_featured ? 1 : 0;
    is_bundle = is_bundle ? 1 : 0;
    bundle_id = bundle_id ? parseInt(bundle_id) : null;

    const validPropertyTypes = ['Apartment', 'House', 'Condo', 'Townhouse', 'Land', 'Commercial', 'Airbnb', 'Villa', 'Studio', 'Penthouse'];
    if (!validPropertyTypes.includes(property_type)) {
      property_type = 'Apartment';
    }

    const validListingTypes = ['rent', 'sale'];
    if (!validListingTypes.includes(listing_type)) {
      listing_type = 'rent';
    }

    // Separate images and videos
    const imageFiles = req.files?.images || [];
    const videoFiles = req.files?.videos || [];

    const imagePaths = imageFiles.map(file => `/uploads/${file.filename}`);
    const videoPaths = videoFiles.map(file => `/uploads/videos/${file.filename}`);

    console.log('Image paths:', imagePaths);
    console.log('Video paths:', videoPaths);

    const [result] = await db.promise().query(
      `INSERT INTO properties  
        (title, description, price, viewing_fee, city, address_line1, property_type, listing_type, bedrooms, bathrooms, units_available, is_featured, is_bundle, bundle_id, images, videos, agent_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        title,
        description,
        price,
        viewing_fee,
        city,
        address_line1,
        property_type,
        listing_type,
        bedrooms,
        bathrooms,
        units_available,
        is_featured,
        is_bundle,
        bundle_id,
        JSON.stringify(imagePaths),
        JSON.stringify(videoPaths),
        req.user.userId,
      ]
    );

    res.status(201).json({
      message: "Property added successfully",
      propertyId: result.insertId,
      images: imagePaths,
      videos: videoPaths,
    });
  } catch (err) {
    console.error("❌ Error uploading property:", err);
    if (req.files) {
      // Clean up uploaded files on error
      if (req.files.images) {
        req.files.images.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      if (req.files.videos) {
        req.files.videos.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
    }
    res.status(500).json({ message: "An error occurred while uploading property" });
  }
});

// ==========================================
// 🎯 CRITICAL: SPECIFIC ROUTES MUST COME BEFORE GENERIC ROUTES
// ==========================================

// ==========================================
// GET: Featured Properties (is_featured = 1)
// ==========================================
router.get("/featured", async (req, res) => {
  try {
    const limit = validateLimit(req.query.limit || 10);
    
    const [rows] = await db.promise().query(
      `SELECT p.*, a.agency_name
       FROM properties p
       LEFT JOIN agents a ON p.agent_id = a.user_id
       WHERE p.is_featured = 1 AND p.status = 'active'
       ORDER BY p.created_at DESC
       LIMIT ?`,
      [limit]
    );
    
    const properties = rows.map(prop => ({
      ...prop,
      images: typeof prop.images === 'string' ? JSON.parse(prop.images) : prop.images,
      videos: typeof prop.videos === 'string' ? JSON.parse(prop.videos) : prop.videos
    }));
    
    res.json({ properties });
  } catch (err) {
    console.error("❌ Error fetching featured properties:", err);
    res.status(500).json({ message: "Error fetching featured properties" });
  }
});

// ==========================================
// GET: Recommended Properties (is_featured = 0)
// ==========================================
router.get("/recommended", async (req, res) => {
  try {
    const limit = validateLimit(req.query.limit || 10);
    
    const [rows] = await db.promise().query(
      `SELECT p.*, a.agency_name
       FROM properties p
       LEFT JOIN agents a ON p.agent_id = a.user_id
       WHERE p.is_featured = 0 AND p.status = 'active'
       ORDER BY p.created_at DESC
       LIMIT ?`,
      [limit]
    );
    
    const properties = rows.map(prop => ({
      ...prop,
      images: typeof prop.images === 'string' ? JSON.parse(prop.images) : prop.images,
      videos: typeof prop.videos === 'string' ? JSON.parse(prop.videos) : prop.videos
    }));
    
    res.json({ properties });
  } catch (err) {
    console.error("❌ Error fetching recommended properties:", err);
    res.status(500).json({ message: "Error fetching recommended properties" });
  }
});

// ==========================================
// GET: Properties by Agent ID
// 🎯 THIS MUST COME BEFORE /:id ROUTE!
// ==========================================
router.get("/agent/:agentId", verifyToken, async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId);
    
    if (isNaN(agentId) || agentId < 1) {
      return res.status(400).json({ message: "Invalid agent ID" });
    }
    
    if (req.user.userId !== agentId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }
    
    console.log(`Loading properties for agent: ${agentId}`);
    
    const [rows] = await db.promise().query(
      `SELECT p.*, a.agency_name, a.full_name as agent_name
       FROM properties p
       LEFT JOIN agents a ON p.agent_id = a.user_id
       WHERE p.agent_id = ?
       ORDER BY p.is_featured DESC, p.created_at DESC`,
      [agentId]
    );
    
    const properties = rows.map(prop => ({
      ...prop,
      images: typeof prop.images === 'string' ? JSON.parse(prop.images) : prop.images,
      videos: typeof prop.videos === 'string' ? JSON.parse(prop.videos) : prop.videos
    }));
    
    console.log(`Found ${properties.length} properties for agent ${agentId}`);
    
    res.json(properties);
  } catch (err) {
    console.error("❌ Error fetching agent properties:", err);
    res.status(500).json({ message: "Error fetching properties" });
  }
});

// ==========================================
// GET: Similar Properties - FIXED VERSION
// 🎯 THIS MUST COME BEFORE /:id ROUTE!
// ==========================================
router.get("/similar/:id", async (req, res) => {
  try {
    const id = validatePropertyId(req.params.id);
    const limit = validateLimit(req.query.limit || 6);
    
    console.log(`🔍 Finding similar properties for property ID: ${id}`);
    
    // Get current property details
    const [currentProperty] = await db.promise().query(
      `SELECT property_type, city, price, bedrooms, listing_type FROM properties WHERE property_id = ?`,
      [id]
    );
    
    if (currentProperty.length === 0) {
      return res.status(404).json({ message: "Property not found" });
    }
    
    const { property_type, city, price, bedrooms, listing_type } = currentProperty[0];
    
    console.log(`📍 Current property: ${property_type} in ${city}, Price: ${price}, Bedrooms: ${bedrooms}`);
    
    // STRATEGY 1: Try exact match (same city, same type, similar bedrooms)
    let [rows] = await db.promise().query(
      `SELECT p.*, 
              a.agency_name, 
              a.full_name as agent_name,
              a.user_id as agent_id,
              a.profile_picture as agent_photo
       FROM properties p
       LEFT JOIN agents a ON p.agent_id = a.user_id
       WHERE p.property_id != ? 
       AND p.city = ? 
       AND p.property_type = ?
       AND p.status = 'active'
       AND p.listing_type = ?
       AND ABS(p.bedrooms - ?) <= 1
       ORDER BY 
         CASE 
           WHEN ABS(p.price - ?) < ? * 0.2 THEN 1
           WHEN ABS(p.price - ?) < ? * 0.5 THEN 2
           ELSE 3
         END,
         RAND()
       LIMIT ?`,
      [id, city, property_type, listing_type, bedrooms, price, price, price, price, limit]
    );
    
    console.log(`✅ Strategy 1 (Exact match): Found ${rows.length} properties`);
    
    // STRATEGY 2: If not enough, broaden to same city and type (ignore bedrooms)
    if (rows.length < limit) {
      const remaining = limit - rows.length;
      const excludeIds = [id, ...rows.map(r => r.property_id)];
      
      console.log(`🔄 Strategy 2: Need ${remaining} more properties`);
      
      const [moreRows] = await db.promise().query(
        `SELECT p.*, 
                a.agency_name, 
                a.full_name as agent_name,
                a.user_id as agent_id,
                a.profile_picture as agent_photo
         FROM properties p
         LEFT JOIN agents a ON p.agent_id = a.user_id
         WHERE p.property_id NOT IN (?)
         AND p.city = ? 
         AND p.property_type = ?
         AND p.status = 'active'
         AND p.listing_type = ?
         ORDER BY RAND()
         LIMIT ?`,
        [excludeIds.length > 0 ? excludeIds : [0], city, property_type, listing_type, remaining]
      );
      
      rows = [...rows, ...moreRows];
      console.log(`✅ Strategy 2 (Same type): Added ${moreRows.length} properties. Total: ${rows.length}`);
    }
    
    // STRATEGY 3: If still not enough, just use same city (any type)
    if (rows.length < limit) {
      const remaining = limit - rows.length;
      const excludeIds = [id, ...rows.map(r => r.property_id)];
      
      console.log(`🔄 Strategy 3: Need ${remaining} more properties from same city`);
      
      const [cityRows] = await db.promise().query(
        `SELECT p.*, 
                a.agency_name, 
                a.full_name as agent_name,
                a.user_id as agent_id,
                a.profile_picture as agent_photo
         FROM properties p
         LEFT JOIN agents a ON p.agent_id = a.user_id
         WHERE p.property_id NOT IN (?)
         AND p.city = ?
         AND p.status = 'active'
         AND p.listing_type = ?
         ORDER BY RAND()
         LIMIT ?`,
        [excludeIds.length > 0 ? excludeIds : [0], city, listing_type, remaining]
      );
      
      rows = [...rows, ...cityRows];
      console.log(`✅ Strategy 3 (Same city): Added ${cityRows.length} properties. Total: ${rows.length}`);
    }
    
    // STRATEGY 4: Last resort - just get any active properties
    if (rows.length < limit) {
      const remaining = limit - rows.length;
      const excludeIds = [id, ...rows.map(r => r.property_id)];
      
      console.log(`🔄 Strategy 4: Need ${remaining} more properties (any location)`);
      
      const [anyRows] = await db.promise().query(
        `SELECT p.*, 
                a.agency_name, 
                a.full_name as agent_name,
                a.user_id as agent_id,
                a.profile_picture as agent_photo
         FROM properties p
         LEFT JOIN agents a ON p.agent_id = a.user_id
         WHERE p.property_id NOT IN (?)
         AND p.status = 'active'
         AND p.listing_type = ?
         ORDER BY RAND()
         LIMIT ?`,
        [excludeIds.length > 0 ? excludeIds : [0], listing_type, remaining]
      );
      
      rows = [...rows, ...anyRows];
      console.log(`✅ Strategy 4 (Any property): Added ${anyRows.length} properties. Total: ${rows.length}`);
    }
    
    // Process and include bundle information
    const properties = rows.map(prop => ({
      ...prop,
      images: typeof prop.images === 'string' ? JSON.parse(prop.images) : prop.images,
      videos: typeof prop.videos === 'string' ? JSON.parse(prop.videos) : prop.videos,
      is_bundle: prop.is_bundle === 1 || prop.bundle_id !== null
    }));
    
    console.log(`📦 Returning ${properties.length} similar properties`);
    
    res.json({ properties });
  } catch (err) {
    console.error("❌ Error fetching similar properties:", err);
    
    if (err.message === 'Invalid property ID') {
      return res.status(400).json({ message: err.message });
    }
    
    res.status(500).json({ message: "Error fetching similar properties" });
  }
});

// ==========================================
// GET: Single Property with Agent Info
// 🎯 THIS IS THE MOST GENERIC ROUTE - MUST BE LAST!
// ==========================================
router.get("/:id", async (req, res) => {
  try {
    const id = validatePropertyId(req.params.id);
    
    const [rows] = await db.promise().query(
      `SELECT p.*, 
              a.agency_name, 
              a.full_name as agent_name,
              a.phone_number as agent_phone,
              a.profile_picture as agent_photo,
              a.bio as agent_bio,
              a.rating as agent_rating,
              a.total_reviews as agent_reviews,
              u.email as agent_email,
              u.user_id as agent_user_id
       FROM properties p
       LEFT JOIN agents a ON p.agent_id = a.user_id
       LEFT JOIN users u ON p.agent_id = u.user_id
       WHERE p.property_id = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Property not found" });
    }
    
    const property = {
      ...rows[0],
      images: typeof rows[0].images === 'string' ? JSON.parse(rows[0].images) : rows[0].images,
      videos: typeof rows[0].videos === 'string' ? JSON.parse(rows[0].videos) : rows[0].videos
    };
    
    res.json({ property });
  } catch (err) {
    console.error("Error fetching property:", err);
    
    if (err.message === 'Invalid property ID') {
      return res.status(400).json({ message: err.message });
    }
    
    res.status(500).json({ message: "Error fetching property" });
  }
});
// GET: All Properties
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT * FROM properties");
    const properties = rows.map(prop => ({
      ...prop,
      images: typeof prop.images === 'string' ? JSON.parse(prop.images) : prop.images,
      videos: typeof prop.videos === 'string' ? JSON.parse(prop.videos) : prop.videos
    }));
    res.json(properties);
  } catch (err) {
    console.error(" Error fetching properties:", err);
    res.status(500).json({ message: "Error fetching properties" });
  }
});

export default router;