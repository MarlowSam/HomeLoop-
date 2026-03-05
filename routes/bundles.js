// routes/bundles.js - Bundle Package Management
// FIXED VERSION - Now includes agent profile picture in PROPERTIES query
import express from "express";
import db from "../db.js";
import { verifyToken, requireAgent } from '../middleware/auth.js';

const router = express.Router();

console.log('📦 Bundles route module loaded');

// ==========================================
// POST: Create Bundle Package
// ==========================================
router.post("/", verifyToken, requireAgent, async (req, res) => {
  console.log('📦 POST /api/bundles - Creating new bundle');
  
  try {
    const { viewing_fee, is_featured } = req.body;
    const agent_id = req.user.userId;

    // Validate viewing fee
    const viewingFee = parseFloat(viewing_fee);
    if (isNaN(viewingFee) || viewingFee < 0) {
      console.log('❌ Invalid viewing fee:', viewing_fee);
      return res.status(400).json({ message: "Valid viewing fee is required" });
    }

    const isFeatured = is_featured ? 1 : 0;

    console.log('Creating bundle:', { agent_id, viewingFee, isFeatured });

    const [result] = await db.promise().query(
      `INSERT INTO bundles (agent_id, viewing_fee, is_featured) 
       VALUES (?, ?, ?)`,
      [agent_id, viewingFee, isFeatured]
    );

    console.log('✅ Bundle created with ID:', result.insertId);

    res.status(201).json({
      success: true,
      message: "Bundle created successfully",
      bundleId: result.insertId
    });
  } catch (err) {
    console.error("❌ Error creating bundle:", err);
    res.status(500).json({ message: "Error creating bundle package" });
  }
});

// ==========================================
// GET: Get Bundle by ID with Properties AND AGENT PHOTO
// ==========================================
router.get("/:id", async (req, res) => {
  console.log('📦 GET /api/bundles/:id - Fetching bundle');
  console.log('   Bundle ID from params:', req.params.id);
  
  try {
    const bundleId = parseInt(req.params.id);
    
    console.log('   Parsed bundle ID:', bundleId);
    
    if (isNaN(bundleId) || bundleId < 1) {
      console.log('❌ Invalid bundle ID');
      return res.status(400).json({ message: "Invalid bundle ID" });
    }

    console.log('   Querying database for bundle ID:', bundleId);

    // Get bundle info WITH AGENT PHOTO
    const [bundleRows] = await db.promise().query(
      `SELECT b.*, 
              a.agency_name, 
              a.full_name as agent_name,
              a.profile_picture as agent_photo,
              a.user_id as agent_user_id
       FROM bundles b
       LEFT JOIN agents a ON b.agent_id = a.user_id
       WHERE b.bundle_id = ?`,
      [bundleId]
    );

    console.log('   Bundle query result:', bundleRows.length, 'rows');

    if (bundleRows.length === 0) {
      console.log('❌ Bundle not found in database');
      return res.status(404).json({ message: "Bundle not found" });
    }

    const bundle = bundleRows[0];
    console.log('✅ Bundle found:', {
      bundle_id: bundle.bundle_id,
      viewing_fee: bundle.viewing_fee,
      agent_id: bundle.agent_id,
      agent_photo: bundle.agent_photo
    });

    // CRITICAL FIX: Get all properties in this bundle WITH FULL AGENT INFO
    console.log('   Fetching properties for bundle...');
    const [propertyRows] = await db.promise().query(
      `SELECT p.*, 
              a.agency_name,
              a.full_name as agent_name,
              a.profile_picture as agent_photo,
              a.user_id as agent_user_id,
              a.user_id as agent_id
       FROM properties p
       LEFT JOIN agents a ON p.agent_id = a.user_id
       WHERE p.bundle_id = ? AND p.status = 'active'
       ORDER BY p.created_at ASC`,
      [bundleId]
    );

    console.log('   Found', propertyRows.length, 'properties in bundle');
    
    // Log agent photo data for each property
    propertyRows.forEach((prop, index) => {
      console.log(`   Property ${index + 1} agent data:`, {
        property_id: prop.property_id,
        agent_id: prop.agent_id,
        agent_user_id: prop.agent_user_id,
        agent_photo: prop.agent_photo,
        agency_name: prop.agency_name
      });
    });

    const properties = propertyRows.map(prop => ({
      ...prop,
      images: typeof prop.images === 'string' ? JSON.parse(prop.images) : prop.images,
      videos: typeof prop.videos === 'string' ? JSON.parse(prop.videos) : prop.videos
    }));

    const responseData = {
      bundle: {
        ...bundle,
        properties
      }
    };

    console.log('✅ Sending bundle data with', properties.length, 'properties');
    console.log('   Sample property agent photo:', properties[0]?.agent_photo);

    res.json(responseData);
  } catch (err) {
    console.error("❌ Error fetching bundle:", err);
    console.error("   Error stack:", err.stack);
    res.status(500).json({ message: "Error fetching bundle" });
  }
});

// ==========================================
// GET: Get All Bundles by Agent
// ==========================================
router.get("/agent/:agentId", verifyToken, async (req, res) => {
  console.log('📦 GET /api/bundles/agent/:agentId');
  
  try {
    const agentId = parseInt(req.params.agentId);
    
    if (isNaN(agentId) || agentId < 1) {
      return res.status(400).json({ message: "Invalid agent ID" });
    }

    // Verify agent owns these bundles or is admin
    if (req.user.userId !== agentId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    const [bundles] = await db.promise().query(
      `SELECT b.*, 
              COUNT(p.property_id) as property_count
       FROM bundles b
       LEFT JOIN properties p ON b.bundle_id = p.bundle_id
       WHERE b.agent_id = ?
       GROUP BY b.bundle_id
       ORDER BY b.created_at DESC`,
      [agentId]
    );

    console.log('✅ Found', bundles.length, 'bundles for agent', agentId);

    res.json({ bundles });
  } catch (err) {
    console.error("❌ Error fetching agent bundles:", err);
    res.status(500).json({ message: "Error fetching bundles" });
  }
});

// ==========================================
// GET: Get All Featured Bundles
// ==========================================
router.get("/featured/all", async (req, res) => {
  console.log('📦 GET /api/bundles/featured/all');
  
  try {
    const limit = parseInt(req.query.limit) || 10;

    const [bundles] = await db.promise().query(
      `SELECT b.*, 
              a.agency_name, 
              a.full_name as agent_name,
              a.profile_picture as agent_photo,
              COUNT(p.property_id) as property_count
       FROM bundles b
       LEFT JOIN agents a ON b.agent_id = a.user_id
       LEFT JOIN properties p ON b.bundle_id = p.bundle_id
       WHERE b.is_featured = 1
       GROUP BY b.bundle_id
       ORDER BY b.created_at DESC
       LIMIT ?`,
      [limit]
    );

    console.log('✅ Found', bundles.length, 'featured bundles');

    res.json({ bundles });
  } catch (err) {
    console.error("❌ Error fetching featured bundles:", err);
    res.status(500).json({ message: "Error fetching featured bundles" });
  }
});

// ==========================================
// DELETE: Delete Bundle (and unlink properties)
// ==========================================
router.delete("/:id", verifyToken, requireAgent, async (req, res) => {
  console.log('📦 DELETE /api/bundles/:id');
  
  try {
    const bundleId = parseInt(req.params.id);
    
    if (isNaN(bundleId) || bundleId < 1) {
      return res.status(400).json({ message: "Invalid bundle ID" });
    }

    // Verify agent owns this bundle
    const [bundleRows] = await db.promise().query(
      `SELECT agent_id FROM bundles WHERE bundle_id = ?`,
      [bundleId]
    );

    if (bundleRows.length === 0) {
      return res.status(404).json({ message: "Bundle not found" });
    }

    if (bundleRows[0].agent_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    // Unlink properties from bundle (don't delete properties)
    await db.promise().query(
      `UPDATE properties SET bundle_id = NULL, is_bundle = 0 WHERE bundle_id = ?`,
      [bundleId]
    );

    // Delete bundle
    await db.promise().query(
      `DELETE FROM bundles WHERE bundle_id = ?`,
      [bundleId]
    );

    console.log('✅ Bundle deleted:', bundleId);

    res.json({ message: "Bundle deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting bundle:", err);
    res.status(500).json({ message: "Error deleting bundle" });
  }
});

export default router;