// routes/editbundle.js - Edit/Update a bundle and all its properties
import express from "express";
import multer from "multer";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import db from "../db.js";
import { verifyToken, requireAgent } from '../middleware/auth.js';

const router = express.Router();

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
  limits: { fileSize: MAX_VIDEO_SIZE, files: 40 }
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
// PUT: Update Bundle and all its Properties
// ==========================================
router.put("/:id",
  verifyToken,
  requireAgent,
  upload.any(),
  async (req, res) => {
    try {
      const bundleId = parseInt(req.params.id);
      if (isNaN(bundleId) || bundleId < 1) {
        return res.status(400).json({ message: "Invalid bundle ID" });
      }

      const [bundleRows] = await db.promise().query(
        `SELECT * FROM bundles WHERE bundle_id = ? AND agent_id = ?`,
        [bundleId, req.user.userId]
      );

      if (bundleRows.length === 0) {
        return res.status(404).json({ message: "Bundle not found or access denied" });
      }

      if (req.body.bundleViewingFee) {
        const viewingFee = validatePrice(req.body.bundleViewingFee);
        await db.promise().query(
          `UPDATE bundles SET viewing_fee = ?, updated_at = NOW() WHERE bundle_id = ?`,
          [viewingFee, bundleId]
        );
      }

      const [bundleProperties] = await db.promise().query(
        `SELECT * FROM properties WHERE bundle_id = ? AND agent_id = ?`,
        [bundleId, req.user.userId]
      );

      const propertiesData = JSON.parse(req.body.propertiesData || '[]');

      // ✅ Group uploaded files by property index with hero/gallery separation
      const filesByProperty = {};
      if (req.files) {
        req.files.forEach(file => {
          // Match: property_0_heroImage, property_0_galleryImages, property_0_videos
          const match = file.fieldname.match(/^property_(\d+)_(heroImage|galleryImages|videos)$/);
          if (match) {
            const propIndex = parseInt(match[1]);
            const fileType = match[2];
            if (!filesByProperty[propIndex]) {
              filesByProperty[propIndex] = { heroImage: [], galleryImages: [], videos: [] };
            }
            filesByProperty[propIndex][fileType].push(file);
          }
        });
      }

      for (let i = 0; i < bundleProperties.length; i++) {
        const currentProp = bundleProperties[i];
        const propData = propertiesData[i] || {};
        const propFiles = filesByProperty[i] || { heroImage: [], galleryImages: [], videos: [] };

        const keepImages = propData.keepImages || [];
        const keepVideos = propData.keepVideos || [];

        // ✅ Upload new hero if provided
        let newHeroUrl = null;
        if (propFiles.heroImage.length > 0) {
          const result = await uploadToCloudinary(propFiles.heroImage[0].buffer, {
            folder: 'homeloop/properties',
            resource_type: 'image',
            transformation: [{ quality: 85, width: 2000, height: 2000, crop: 'limit' }]
          });
          newHeroUrl = result.secure_url;
        }

        // ✅ Upload new gallery images
        const newGalleryUrls = await Promise.all(
          propFiles.galleryImages.map(file =>
            uploadToCloudinary(file.buffer, {
              folder: 'homeloop/properties',
              resource_type: 'image',
              transformation: [{ quality: 85, width: 2000, height: 2000, crop: 'limit' }]
            })
          )
        );

        // ✅ Upload new videos
        const newVideoUrls = await Promise.all(
          propFiles.videos.map(file =>
            uploadToCloudinary(file.buffer, {
              folder: 'homeloop/videos',
              resource_type: 'video'
            })
          )
        );

        // ✅ Build final images: hero first then gallery
        let finalImages = [...keepImages];
        if (newHeroUrl) {
          if (finalImages.length > 0) {
            finalImages[0] = newHeroUrl;
          } else {
            finalImages.unshift(newHeroUrl);
          }
        }
        finalImages = [...finalImages, ...newGalleryUrls.map(r => r.secure_url)];

        const finalVideos = [
          ...keepVideos,
          ...newVideoUrls.map(r => r.secure_url)
        ];

        const title = sanitizeString(propData.title) || currentProp.title;
        const description = sanitizeString(propData.description) || currentProp.description;
        const address_line1 = sanitizeString(propData.address_line1) || currentProp.address_line1;
        const city = sanitizeString(propData.city) || currentProp.city;
        const property_type = sanitizeString(propData.property_type) || currentProp.property_type;
        const price = propData.price ? validatePrice(propData.price) : currentProp.price;
        const bedrooms = propData.bedrooms !== undefined ? validateNumber(propData.bedrooms, 0, 50) : currentProp.bedrooms;
        const bathrooms = propData.bathrooms !== undefined ? validateNumber(propData.bathrooms, 0, 50) : currentProp.bathrooms;
        const units_available = propData.units_available !== undefined ? validateNumber(propData.units_available, 0, 1000) : currentProp.units_available;

        await db.promise().query(
          `UPDATE properties SET
            title = ?, description = ?, property_type = ?,
            price = ?, bedrooms = ?, bathrooms = ?,
            address_line1 = ?, city = ?, units_available = ?,
            images = ?, videos = ?, updated_at = NOW()
           WHERE property_id = ? AND agent_id = ?`,
          [
            title, description, property_type,
            price, bedrooms, bathrooms,
            address_line1, city, units_available,
            JSON.stringify(finalImages), JSON.stringify(finalVideos),
            currentProp.property_id, req.user.userId
          ]
        );
      }

      console.log(`✅ Bundle ${bundleId} updated successfully`);
      res.json({ message: "Bundle updated successfully", bundleId });

    } catch (err) {
      console.error("❌ Error updating bundle:", err);
      res.status(500).json({ message: "Error updating bundle" });
    }
  }
);

export default router;