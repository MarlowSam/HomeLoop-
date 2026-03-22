// routes/agentdashboard.js
import express from 'express';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';
const router = express.Router();

router.get('/summary', verifyToken, async (req, res) => {
  try {
    const agentId = req.user.userId;

    const [[stats]] = await db.promise().query(`
      SELECT
        COUNT(DISTINCT p.property_id) AS total_listings,
        COUNT(DISTINCT CASE WHEN p.is_featured = 1 THEN p.property_id END) AS featured_listings,
        COUNT(DISTINCT b.booking_id) AS total_bookings,
        COUNT(DISTINCT CASE WHEN 
          EXISTS (
            SELECT 1 FROM messages m 
            WHERE m.conversation_id = c.conversation_id 
            AND m.sender_id != ? 
            AND m.is_read = FALSE
          ) THEN c.conversation_id END
        ) AS unread_inquiry_count
      FROM properties p
      LEFT JOIN bookings b ON b.property_id = p.property_id
      LEFT JOIN conversations c ON c.property_id = p.property_id
      WHERE p.agent_user_id = ?
    `, [agentId, agentId]);

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