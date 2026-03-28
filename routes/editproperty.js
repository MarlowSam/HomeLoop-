// routes/editproperty.js - Edit/Update a single property
import express from "express";
import multer from "multer";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import db from "../db.js";
import { verifyToken, requireAgent } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// FILE UPLOAD CONFIGURATION
// ==========================================
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm'];
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype) && ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return cb(null, true);
  }
  if (ALLOWED_VIDEO_TYPES.includes(file.mimetype) && ALLOWED_VIDEO_EXTENSIONS.includes(ext)) {
    return cb(null, true);
  }
  return cb(new Error('Invalid file type.'), false);
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_VIDEO_SIZE, files: 15 }
});

function uploadToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    Readable.from(buffer).pipe(stream);
  });
}

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, 1000);
}

function validatePrice(price) {
  const numPrice = parseFloat(price);
  if (isNaN(numPrice) || numPrice < 0) throw new Error('Invalid price');
  return numPrice;
}

function validateNumber(num, min = 0, max = 1000) {
  const parsed = parseInt(num);
  if (isNaN(parsed) || parsed < min || parsed > max) return min;
  return parsed;
}

// ==========================================
// PUT: Update Single Property
// ==========================================
router.put("/:id",
  verifyToken,
  requireAgent,
  upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 2 }
  ]),
  async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      if (isNaN(propertyId) || propertyId < 1) {
        return res.status(400).json({ message: "Invalid property ID" });
      }

      // Verify agent owns this property
      const [existing] = await db.promise().query(
        `SELECT * FROM properties WHERE property_id = ? AND agent_id = ?`,
        [propertyId, req.user.userId]
      );

      if (existing.length === 0) {
        return res.status(404).json({ message: "Property not found or access denied" });
      }

      const currentProperty = existing[0];

      // Parse existing images/videos from DB
      let existingImages = typeof currentProperty.images === 'string'
        ? JSON.parse(currentProperty.images)
        : currentProperty.images || [];

      let existingVideos = typeof currentProperty.videos === 'string'
        ? JSON.parse(currentProperty.videos)
        : currentProperty.videos || [];

      // Get images/videos to keep (sent from frontend as JSON strings)
      const keepImages = req.body.keepImages ? JSON.parse(req.body.keepImages) : existingImages;
      const keepVideos = req.body.keepVideos ? JSON.parse(req.body.keepVideos) : existingVideos;

      // Upload new images to Cloudinary
      const newImageFiles = req.files?.images || [];
      const newVideoFiles = req.files?.videos || [];

      const newImageUrls = await Promise.all(
        newImageFiles.map(file =>
          uploadToCloudinary(file.buffer, {
            folder: 'homeloop/properties',
            resource_type: 'image',
            transformation: [{ quality: 85, width: 2000, height: 2000, crop: 'limit' }]
          })
        )
      );

      const newVideoUrls = await Promise.all(
        newVideoFiles.map(file =>
          uploadToCloudinary(file.buffer, {
            folder: 'homeloop/videos',
            resource_type: 'video'
          })
        )
      );

      // Merge kept images with new uploads
      const finalImages = [
        ...keepImages,
        ...newImageUrls.map(r => r.secure_url)
      ];

      const finalVideos = [
        ...keepVideos,
        ...newVideoUrls.map(r => r.secure_url)
      ];

      // Parse updated fields
      let {
        title, description, property_type, listing_type,
        price, viewing_fee, bedrooms, bathrooms,
        address_line1, city, units_available
      } = req.body;

      title = sanitizeString(title) || currentProperty.title;
      description = sanitizeString(description);
      address_line1 = sanitizeString(address_line1) || currentProperty.address_line1;
      city = sanitizeString(city) || currentProperty.city;
      property_type = sanitizeString(property_type) || currentProperty.property_type;
      listing_type = sanitizeString(listing_type) || currentProperty.listing_type;

      try {
        price = price ? validatePrice(price) : currentProperty.price;
        viewing_fee = viewing_fee ? validatePrice(viewing_fee) : currentProperty.viewing_fee;
      } catch (err) {
        return res.status(400).json({ message: err.message });
      }

      bedrooms = bedrooms !== undefined ? validateNumber(bedrooms, 0, 50) : currentProperty.bedrooms;
      bathrooms = bathrooms !== undefined ? validateNumber(bathrooms, 0, 50) : currentProperty.bathrooms;
      units_available = units_available !== undefined ? validateNumber(units_available, 0, 1000) : currentProperty.units_available;

      await db.promise().query(
        `UPDATE properties SET
          title = ?, description = ?, property_type = ?, listing_type = ?,
          price = ?, viewing_fee = ?, bedrooms = ?, bathrooms = ?,
          address_line1 = ?, city = ?, units_available = ?,
          images = ?, videos = ?, updated_at = NOW()
         WHERE property_id = ? AND agent_id = ?`,
        [
          title, description, property_type, listing_type,
          price, viewing_fee, bedrooms, bathrooms,
          address_line1, city, units_available,
          JSON.stringify(finalImages), JSON.stringify(finalVideos),
          propertyId, req.user.userId
        ]
      );

      console.log(`✅ Property ${propertyId} updated successfully`);

      res.json({
        message: "Property updated successfully",
        propertyId,
        images: finalImages,
        videos: finalVideos
      });

    } catch (err) {
      console.error("❌ Error updating property:", err);
      res.status(500).json({ message: "Error updating property" });
    }
  }
);

export default router;