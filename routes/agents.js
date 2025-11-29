import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import db from "../db.js";
import { verifyToken, requireAgent } from "../middleware/authMiddleware.js";

const router = express.Router();

// Fix for __dirname with ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for profile pictures
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/profiles/");
  },
  filename: function (req, file, cb) {
    cb(null, `agent_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images allowed'));
    }
    cb(null, true);
  }
});

// 📝 PUT: Update agent profile WITH PHOTO
router.put("/profile", verifyToken, requireAgent, profileUpload.single('profile_picture'), async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      full_name,
      bio,
      years_experience,
      phone_number,
      whatsapp,
      facebook,
      linkedin,
      instagram,
      specializations,
      areas_of_operation
    } = req.body;

    // Check if agent profile exists
    const [existingAgent] = await db.promise().query(
      `SELECT agent_id FROM agents WHERE user_id = ?`,
      [userId]
    );

    if (existingAgent.length === 0) {
      return res.status(404).json({ message: "Agent profile not found" });
    }

    // Build query
    let query = `UPDATE agents SET 
                 full_name = ?, 
                 bio = ?, 
                 years_experience = ?,
                 phone_number = ?,
                 whatsapp = ?,
                 specializations = ?,
                 areas_of_operation = ?`;
    
    let params = [
      full_name, 
      bio, 
      years_experience || 0, 
      phone_number,
      whatsapp || null,
      specializations || null,
      areas_of_operation || null
    ];
    
    // Add profile picture if uploaded
    if (req.file) {
      query += `, profile_picture = ?`;
      params.push(`/uploads/profiles/${req.file.filename}`);
    }
    
    query += ` WHERE user_id = ?`;
    params.push(userId);

    await db.promise().query(query, params);

    res.json({ 
      message: "Profile updated successfully",
      profile_picture: req.file ? `/uploads/profiles/${req.file.filename}` : null
    });
  } catch (err) {
    console.error("❌ Error updating agent profile:", err);
    res.status(500).json({ message: "Error updating profile", error: err.message });
  }
});

// 👤 GET: Single agent profile (public)
router.get("/:agent_id", async (req, res) => {
  try {
    const { agent_id } = req.params;

    const [rows] = await db.promise().query(
      `SELECT a.*, u.email 
       FROM agents a
       LEFT JOIN users u ON a.user_id = u.user_id
       WHERE a.user_id = ?`,
      [agent_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Agent not found" });
    }

    res.json({ agent: rows[0] });
  } catch (err) {
    console.error("❌ Error fetching agent:", err);
    res.status(500).json({ message: "Error fetching agent" });
  }
});

// 🏠 GET: All properties by agent
router.get("/:agent_id/properties", async (req, res) => {
  try {
    const { agent_id } = req.params;

    const [rows] = await db.promise().query(
      `SELECT * FROM properties 
       WHERE agent_id = ? AND status = 'active'
       ORDER BY created_at DESC`,
      [agent_id]
    );

    const properties = rows.map(prop => ({
      ...prop,
      images: typeof prop.images === 'string' ? JSON.parse(prop.images) : prop.images
    }));

    res.json({ properties });
  } catch (err) {
    console.error("❌ Error fetching agent properties:", err);
    res.status(500).json({ message: "Error fetching properties" });
  }
});

export default router;