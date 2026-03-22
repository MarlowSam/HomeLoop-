import express from 'express';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Single endpoint — replaces 3 separate API calls from the frontend
// Returns: total_listings, featured_listings, total_bookings, unread_inquiry_count
router.get('/summary', verifyToken, async (req, res) => {
  try {
    const agentId = req.user.userId;

    const [[stats]] = await db.promise().query(`
      SELECT
        COUNT(DISTINCT p.property_id) AS total_listings,
        COUNT(DISTINCT CASE WHEN p.is_featured = 1 THEN p.property_id END) AS featured_listings,
        (
          SELECT COUNT(*) FROM bookings b
          JOIN properties bp ON bp.property_id = b.property_id
          WHERE bp.agent_id = ?
        ) AS total_bookings,
        (
          SELECT COUNT(DISTINCT c.conversation_id)
          FROM conversations c
          WHERE c.agent_id = ?
          AND EXISTS (
            SELECT 1 FROM messages m
            WHERE m.conversation_id = c.conversation_id
            AND m.sender_id != ?
            AND m.is_read = FALSE
          )
        ) AS unread_inquiry_count
      FROM properties p
      WHERE p.agent_id = ?
    `, [agentId, agentId, agentId, agentId]);

    res.json({
      success: true,
      total_listings: stats.total_listings || 0,
      featured_listings: stats.featured_listings || 0,
      total_bookings: stats.total_bookings || 0,
      unread_inquiry_count: stats.unread_inquiry_count || 0
    });

  } catch (error) {
    console.error('❌ Agent dashboard summary error:', error);
    res.status(500).json({ success: false, error: 'Failed to load dashboard summary' });
  }
});

export default router;