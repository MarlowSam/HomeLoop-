// routes/deleteproperty.js - Delete a single property
import express from "express";
import db from "../db.js";
import { verifyToken, requireAgent } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// DELETE: Delete Single Property
// ==========================================
router.delete("/:id", verifyToken, requireAgent, async (req, res) => {
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

    // Check for existing bookings
    const [bookings] = await db.promise().query(
      `SELECT id FROM bookings WHERE property_id = ? LIMIT 1`,
      [propertyId]
    );

    if (bookings.length > 0) {
      return res.status(403).json({
        message: "Cannot delete property with existing bookings"
      });
    }

    // ✅ Only block if there are actual messages in the conversation
    const [conversations] = await db.promise().query(
      `SELECT c.conversation_id FROM conversations c
       INNER JOIN messages m ON c.conversation_id = m.conversation_id
       WHERE c.property_id = ? LIMIT 1`,
      [propertyId]
    );

    if (conversations.length > 0) {
      return res.status(403).json({
        message: "Cannot delete property with existing inquiries"
      });
    }

    // If part of bundle, unlink from bundle
    if (existing[0].bundle_id) {
      await db.promise().query(
        `UPDATE properties SET bundle_id = NULL, is_bundle = 0 WHERE property_id = ?`,
        [propertyId]
      );
    }

    // Delete the property
    await db.promise().query(
      `DELETE FROM properties WHERE property_id = ? AND agent_id = ?`,
      [propertyId, req.user.userId]
    );

    console.log(`✅ Property ${propertyId} deleted successfully`);

    res.json({ message: "Property deleted successfully" });

  } catch (err) {
    console.error("❌ Error deleting property:", err);
    res.status(500).json({ message: "Error deleting property" });
  }
});

export default router;