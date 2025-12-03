// routes/properties.js - SECURE VERSION WITH FILE UPLOAD VALIDATION
import express from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto"; // 🔒 SECURITY: For random filenames
import sharp from "sharp"; // 🔒 SECURITY: Image processingz
import fs from "fs"; // 🔒 SECURITY: File operations
import { fileURLToPath } from "url";
import db from "../db.js";
import { verifyToken, requireAgent } from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// 🔒 SECURITY: File Upload Configuration
// ==========================================
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// 🔒 SECURITY: File filter to validate uploads
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Check both MIME type and extension
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype) || 
      !ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error('Invalid file type. Only JPG, PNG, WEBP allowed.'), false);
  }
  cb(null, true);
};

// 🔒 SECURITY: Secure storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // 🔒 SECURITY: Generate cryptographically random filename
    const randomName = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomName}${ext}`);
  },
});

// 🔒 SECURITY: Initialize Multer with validation
const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: MAX_FILE_SIZE,
    files: 10
  },
});

// ==========================================
// 🔒 SECURITY: Image Processing Middleware
// ==========================================
async function processImages(req, res, next) {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  try {
    const processedFiles = [];
    
    for (const file of req.files) {
      const processedPath = file.path.replace(path.extname(file.path), '_processed.jpg');
      
      // 🔒 SECURITY: Re-encode image to strip EXIF data and malicious content
      await sharp(file.path)
        .jpeg({ quality: 85 })
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .toFile(processedPath);
      
      // Delete original, keep processed
      fs.unlinkSync(file.path);
      fs.renameSync(processedPath, file.path);
      
      processedFiles.push(file);
    }
    
    req.files = processedFiles;
    next();
  } catch (error) {
    console.error('Image processing error:', error);
    // 🔒 SECURITY: Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
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
    return 10; // Default
  }
  return numLimit;
}

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, 1000); // 🔒 SECURITY: Limit length
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
    return min; // Default to minimum
  }
  return parsed;
}

// ==========================================
// POST: Add New Property (with image upload)
// ==========================================
router.post("/", 
  verifyToken, 
  requireAgent, 
  upload.array("images", 10),
  processImages, // 🔒 SECURITY: Process images
  async (req, res) => {
  try {
    console.log("✅ Upload route hit");
    console.log("Received files:", req.files);
    console.log("Received body:", req.body);

    // 🔒 SECURITY: Extract and validate data
    let { 
      title, 
      description, 
      property_type, 
      listing_type, 
      price, 
      bedrooms, 
      bathrooms,  
      address_line1,
      city, 
      units_available, 
      is_featured 
    } = req.body;

    // 🔒 SECURITY: Sanitize and validate inputs
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

    // 🔒 SECURITY: Validate numeric inputs
    try {
      price = validatePrice(price);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    bedrooms = validateNumber(bedrooms, 0, 50);
    bathrooms = validateNumber(bathrooms, 0, 50);
    units_available = validateNumber(units_available, 1, 1000);
    is_featured = is_featured ? 1 : 0;

    // 🔒 SECURITY: Validate property type
    const validPropertyTypes = ['Apartment', 'House', 'Condo', 'Townhouse', 'Land', 'Commercial'];
    if (!validPropertyTypes.includes(property_type)) {
      property_type = 'Apartment';
    }

    // 🔒 SECURITY: Validate listing type
    const validListingTypes = ['rent', 'sale'];
    if (!validListingTypes.includes(listing_type)) {
      listing_type = 'rent';
    }

    // 🔒 SECURITY: Save image paths (already validated by multer)
    const imagePaths = req.files.map(file => `/uploads/${file.filename}`);

    // Insert property into database (parameterized query)
    const [result] = await db.promise().query(
      `INSERT INTO properties  
        (title, description, price, city, address_line1, property_type, listing_type, bedrooms, bathrooms, units_available, is_featured, images, agent_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        title,
        description,
        price,
        city,
        address_line1,
        property_type,
        listing_type,
        bedrooms,
        bathrooms,
        units_available,
        is_featured,
        JSON.stringify(imagePaths),
        req.user.userId,
      ]
    );

    res.status(201).json({
      message: "Property added successfully",
      propertyId: result.insertId,
      images: imagePaths,
    });
  } catch (err) {
    console.error("❌ Error uploading property:", err);
    // 🔒 SECURITY: Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({ message: "An error occurred while uploading property" });
  }
});

// ==========================================
// GET: Featured Properties (is_featured = 1)
// ==========================================
router.get("/featured", async (req, res) => {
  try {
    // 🔒 SECURITY: Validate limit parameter
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
    
    // Parse images JSON for each property
    const properties = rows.map(prop => ({
      ...prop,
      images: typeof prop.images === 'string' ? JSON.parse(prop.images) : prop.images
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
    // 🔒 SECURITY: Validate limit parameter
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
      images: typeof prop.images === 'string' ? JSON.parse(prop.images) : prop.images
    }));
    
    res.json({ properties });
  } catch (err) {
    console.error("❌ Error fetching recommended properties:", err);
    res.status(500).json({ message: "Error fetching recommended properties" });
  }
});

// ==========================================
// GET: Similar Properties
// ==========================================
router.get("/similar/:id", async (req, res) => {
  try {
    // 🔒 SECURITY: Validate property ID
    const id = validatePropertyId(req.params.id);
    
    // First get the current property details
    const [currentProperty] = await db.promise().query(
      `SELECT property_type, city, price FROM properties WHERE property_id = ?`,
      [id]
    );
    
    if (currentProperty.length === 0) {
      return res.status(404).json({ message: "Property not found" });
    }
    
    const { property_type, city, price } = currentProperty[0];
    
    // Calculate price range (±30%)
    const minPrice = price * 0.7;
    const maxPrice = price * 1.3;
    
    // Find similar properties
    const [rows] = await db.promise().query(
      `SELECT p.*, a.agency_name, a.full_name as agent_name
       FROM properties p
       LEFT JOIN agents a ON p.agent_id = a.user_id
       WHERE p.property_id != ? 
       AND p.city = ? 
       AND p.property_type = ?
       AND p.price BETWEEN ? AND ?
       AND p.status = 'active'
       ORDER BY RAND()
       LIMIT 20`,
      [id, city, property_type, minPrice, maxPrice]
    );
    
    const properties = rows.map(prop => ({
      ...prop,
      images: typeof prop.images === 'string' ? JSON.parse(prop.images) : prop.images
    }));
    
    res.json({ properties });
  } catch (err) {
    console.error("❌ Error fetching similar properties:", err);
    
    // 🔒 SECURITY: Handle validation errors
    if (err.message === 'Invalid property ID') {
      return res.status(400).json({ message: err.message });
    }
    
    res.status(500).json({ message: "Error fetching similar properties" });
  }
});

// ==========================================
// GET: Single Property with Agent Info
// ==========================================
router.get("/:id", async (req, res) => {
  try {
    // 🔒 SECURITY: Validate property ID
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
      images: typeof rows[0].images === 'string' ? JSON.parse(rows[0].images) : rows[0].images
    };
    
    res.json({ property });
  } catch (err) {
    console.error("❌ Error fetching property:", err);
    
    // 🔒 SECURITY: Handle validation errors
    if (err.message === 'Invalid property ID') {
      return res.status(400).json({ message: err.message });
    }
    
    res.status(500).json({ message: "Error fetching property" });
  }
});

// ==========================================
// GET: All Properties
// ==========================================
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT * FROM properties");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching properties:", err);
    res.status(500).json({ message: "Error fetching properties" });
  }
});

export default router;