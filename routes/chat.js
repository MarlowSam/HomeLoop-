// routes/chat.js - FIXED VERSION WITH CORRECT DATABASE FIELDS
import express from "express";
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import db from "../db.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Initialize DOMPurify
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// ==========================================
// SECURITY: Message Sanitization Function
// ==========================================
function sanitizeMessage(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Message text is required');
  }

  const clean = DOMPurify.sanitize(text, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
  
  const trimmed = clean.trim();
  
  if (trimmed.length === 0) {
    throw new Error('Message cannot be empty');
  }
  
  if (trimmed.length > 1000) {
    throw new Error('Message too long (max 1000 characters)');
  }
  
  return trimmed;
}

// ==========================================
// SECURITY: Input Validation Functions
// ==========================================
function validateConversationId(id) {
  const numId = parseInt(id);
  if (isNaN(numId) || numId < 1 || !/^\d+$/.test(id)) {
    throw new Error('Invalid conversation ID');
  }
  return numId;
}

function validatePropertyId(id) {
  const numId = parseInt(id);
  if (isNaN(numId) || numId < 1 || !/^\d+$/.test(id)) {
    throw new Error('Invalid property ID');
  }
  return numId;
}

function validateAgentId(id) {
  const numId = parseInt(id);
  if (isNaN(numId) || numId < 1 || !/^\d+$/.test(id)) {
    throw new Error('Invalid agent ID');
  }
  return numId;
}

// ==========================================
// 1. GET OR CREATE CONVERSATION
// ==========================================
router.post("/conversations", verifyToken, async (req, res) => {
  try {
    let { property_id, agent_id } = req.body;
    const buyer_id = req.user.userId;

    try {
      property_id = validatePropertyId(property_id);
      agent_id = validateAgentId(agent_id);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    const [existing] = await db.promise().query(
      `SELECT conversation_id, buyer_id, agent_id, created_at, last_message_at 
       FROM conversations 
       WHERE property_id = ? AND buyer_id = ? AND agent_id = ?`,
      [property_id, buyer_id, agent_id]
    );

    if (existing.length > 0) {
      return res.json({
        success: true,
        conversation: existing[0]
      });
    }

    const [result] = await db.promise().query(
      `INSERT INTO conversations (property_id, buyer_id, agent_id) 
       VALUES (?, ?, ?)`,
      [property_id, buyer_id, agent_id]
    );

    const [newConversation] = await db.promise().query(
      `SELECT conversation_id, buyer_id, agent_id, created_at, last_message_at 
       FROM conversations 
       WHERE conversation_id = ?`,
      [result.insertId]
    );

    res.json({
      success: true,
      conversation: newConversation[0]
    });

  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred"
    });
  }
});

// ==========================================
// 2. SEND MESSAGE TO CONVERSATION
// ==========================================
router.post("/conversations/:conversationId/messages", verifyToken, async (req, res) => {
  try {
    let { conversationId } = req.params;
    let { message_text } = req.body;
    const sender_id = req.user.userId;

    try {
      conversationId = validateConversationId(conversationId);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    try {
      message_text = sanitizeMessage(message_text);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    const [conversation] = await db.promise().query(
      `SELECT * FROM conversations 
       WHERE conversation_id = ? AND (buyer_id = ? OR agent_id = ?)`,
      [conversationId, sender_id, sender_id]
    );

    if (conversation.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const [result] = await db.promise().query(
      `INSERT INTO messages (conversation_id, sender_id, message_text) 
       VALUES (?, ?, ?)`,
      [conversationId, sender_id, message_text]
    );

    await db.promise().query(
      `UPDATE conversations 
       SET last_message_at = NOW() 
       WHERE conversation_id = ?`,
      [conversationId]
    );

    const [messages] = await db.promise().query(
      `SELECT 
        m.message_id,
        m.conversation_id,
        m.sender_id,
        m.message_text,
        m.is_read,
        m.created_at,
        u.username as sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.user_id
       WHERE m.message_id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: messages[0]
    });

  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred"
    });
  }
});

// ==========================================
// 3. GET USER'S CONVERSATIONS (FOR INBOX)
// ==========================================
router.get("/conversations", verifyToken, async (req, res) => {
  try {
    const user_id = req.user.userId;

    const [conversations] = await db.promise().query(
      `SELECT 
        c.conversation_id,
        c.property_id,
        c.buyer_id,
        c.agent_id,
        c.status,
        c.created_at,
        c.last_message_at,
        p.title as property_title,
        p.address_line1,
        p.city,
        p.price as property_price,
        p.images as property_images,
        buyer.username as buyer_name,
        buyer.email as buyer_email,
        agent.username as agent_name,
        agent.email as agent_email,
        (SELECT COUNT(*) FROM messages 
         WHERE conversation_id = c.conversation_id 
         AND sender_id != ? AND is_read = FALSE) as unread_count,
        (SELECT message_text FROM messages 
         WHERE conversation_id = c.conversation_id 
         ORDER BY created_at DESC LIMIT 1) as last_message
      FROM conversations c
      JOIN properties p ON c.property_id = p.property_id
      JOIN users buyer ON c.buyer_id = buyer.user_id
      JOIN users agent ON c.agent_id = agent.user_id
      WHERE c.buyer_id = ? OR c.agent_id = ?
      ORDER BY c.last_message_at DESC`,
      [user_id, user_id, user_id]
    );

    res.json({
      success: true,
      conversations
    });

  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred"
    });
  }
});

// ==========================================
// 4. GET MESSAGES FOR A CONVERSATION
// ==========================================
router.get("/conversations/:conversationId/messages", verifyToken, async (req, res) => {
  try {
    let { conversationId } = req.params;
    const user_id = req.user.userId;
    
    try {
      conversationId = validateConversationId(conversationId);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    let limit = parseInt(req.query.limit) || 50;
    let offset = parseInt(req.query.offset) || 0;
    
    limit = Math.min(Math.max(limit, 1), 100);
    offset = Math.max(offset, 0);

    const [conversation] = await db.promise().query(
      `SELECT * FROM conversations 
       WHERE conversation_id = ? AND (buyer_id = ? OR agent_id = ?)`,
      [conversationId, user_id, user_id]
    );

    if (conversation.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const [messages] = await db.promise().query(
      `SELECT 
        m.message_id,
        m.sender_id,
        m.message_text,
        m.is_read,
        m.created_at,
        u.username as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.user_id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?`,
      [conversationId, limit, offset]
    );

    await db.promise().query(
      `UPDATE messages 
       SET is_read = TRUE 
       WHERE conversation_id = ? AND sender_id != ? AND is_read = FALSE`,
      [conversationId, user_id]
    );

    res.json({
      success: true,
      messages: messages.reverse()
    });

  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred"
    });
  }
});

// ==========================================
// 5. GET UNREAD MESSAGE COUNT
// ==========================================
router.get("/unread-count", verifyToken, async (req, res) => {
  try {
    const user_id = req.user.userId;

    const [result] = await db.promise().query(
      `SELECT COUNT(*) as unread_count
       FROM messages m
       JOIN conversations c ON m.conversation_id = c.conversation_id
       WHERE (c.buyer_id = ? OR c.agent_id = ?)
       AND m.sender_id != ?
       AND m.is_read = FALSE`,
      [user_id, user_id, user_id]
    );

    res.json({
      success: true,
      unread_count: result[0].unread_count
    });

  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred"
    });
  }
});

// ==========================================
// 6. GET AGENT INQUIRY COUNT
// ==========================================
router.get("/agent/inquiry-count", verifyToken, async (req, res) => {
  try {
    const agent_id = req.user.userId;

    const [result] = await db.promise().query(
      `SELECT COUNT(DISTINCT c.property_id) as inquiry_count
       FROM conversations c
       JOIN messages m ON c.conversation_id = m.conversation_id
       WHERE c.agent_id = ?
       AND m.sender_id != ?
       AND m.is_read = FALSE`,
      [agent_id, agent_id]
    );

    res.json({
      success: true,
      inquiry_count: result[0].inquiry_count
    });

  } catch (error) {
    console.error("Error getting inquiry count:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred"
    });
  }
});

// ==========================================
// 7. GET PROPERTIES WITH INQUIRIES
// ==========================================
router.get("/agent/properties-with-inquiries", verifyToken, async (req, res) => {
  try {
    const agent_id = req.user.userId;

    const [properties] = await db.promise().query(
      `SELECT DISTINCT c.property_id
       FROM conversations c
       JOIN messages m ON c.conversation_id = m.conversation_id
       WHERE c.agent_id = ?
       AND m.sender_id != ?
       AND m.is_read = FALSE`,
      [agent_id, agent_id]
    );

    const propertyIds = properties.map(p => p.property_id);

    res.json({
      success: true,
      property_ids: propertyIds
    });

  } catch (error) {
    console.error("Error getting properties with inquiries:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred"
    });
  }
});

// ==========================================
// 8. GET CONVERSATION BY PROPERTY
// ==========================================
router.get("/conversation/property/:propertyId", verifyToken, async (req, res) => {
  try {
    let { propertyId } = req.params;
    const user_id = req.user.userId;

    try {
      propertyId = validatePropertyId(propertyId);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    const [conversation] = await db.promise().query(
      `SELECT * FROM conversations 
       WHERE property_id = ? 
       AND (buyer_id = ? OR agent_id = ?)
       LIMIT 1`,
      [propertyId, user_id, user_id]
    );

    if (conversation.length === 0) {
      return res.json({
        success: true,
        conversation: null
      });
    }

    res.json({
      success: true,
      conversation: conversation[0]
    });

  } catch (error) {
    console.error("Error getting conversation:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred"
    });
  }
});

// ==========================================
// 9. MARK MESSAGES AS READ
// ==========================================
router.put("/conversations/:conversationId/read", verifyToken, async (req, res) => {
  try {
    let { conversationId } = req.params;
    const user_id = req.user.userId;

    try {
      conversationId = validateConversationId(conversationId);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    await db.promise().query(
      `UPDATE messages 
       SET is_read = TRUE 
       WHERE conversation_id = ? AND sender_id != ?`,
      [conversationId, user_id]
    );

    res.json({
      success: true,
      message: "Messages marked as read"
    });

  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred"
    });
  }
});

// ==========================================
// 10. GET ALL CONVERSATIONS FOR A PROPERTY (FOR AGENTS) - FIXED
// ==========================================
router.get('/property/:propertyId/conversations', verifyToken, async (req, res) => {
  try {
    let { propertyId } = req.params;
    const agent_id = req.user.userId;

    try {
      propertyId = validatePropertyId(propertyId);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    const [conversations] = await db.promise().query(
      `SELECT 
        c.conversation_id,
        u.username as user_name,
        (SELECT message_text FROM messages 
         WHERE conversation_id = c.conversation_id 
         ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages 
         WHERE conversation_id = c.conversation_id 
         ORDER BY created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages 
         WHERE conversation_id = c.conversation_id 
         AND sender_id != ? 
         AND is_read = FALSE) as unread_count
      FROM conversations c
      JOIN users u ON c.buyer_id = u.user_id
      WHERE c.property_id = ? AND c.agent_id = ?
      ORDER BY last_message_time DESC`,
      [agent_id, propertyId, agent_id]
    );

    res.json({
      success: true,
      conversations: conversations || []
    });

  } catch (error) {
    console.error('Error fetching property conversations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch conversations' 
    });
  }
});

export default router;