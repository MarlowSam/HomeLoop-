import express from 'express';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/summary', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [rows] = await db.promise().query(`
      SELECT 
        p.property_id,
        p.address_line1,
        p.city,
        p.property_type,
        p.price,
        p.bedrooms,
        p.bathrooms,
        p.units_available,
        p.images,
        c.conversation_id,
        c.agent_id,
        c.unread_count,
        EXISTS (
          SELECT 1 FROM messages m 
          WHERE m.conversation_id = c.conversation_id 
          AND m.sender_id = c.agent_id
        ) AS agent_has_replied
      FROM conversations c
      JOIN properties p ON p.property_id = c.property_id
      WHERE c.buyer_id = ?
      ORDER BY c.unread_count DESC, c.last_message_at DESC
    `, [userId]);

    // Parse images if stored as JSON string
    const properties = rows.map(row => ({
      ...row,
      images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || [])
    }));

    res.json({ success: true, properties });

  } catch (error) {
    console.error('❌ Favourites summary error:', error);
    res.status(500).json({ success: false, error: 'Failed to load favourites' });
  }
});

export default router;