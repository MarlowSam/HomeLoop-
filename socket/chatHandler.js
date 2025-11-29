// socket/chatHandler.js - SECURE VERSION WITH XSS PROTECTION
import jwt from "jsonwebtoken";
import createDOMPurify from 'dompurify'; // 🔒 SECURITY: XSS protection
import { JSDOM } from 'jsdom'; // 🔒 SECURITY: For DOMPurify
import db from "../db.js";

// 🔒 SECURITY: Initialize DOMPurify
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Store active socket connections: userId -> socketId
const activeUsers = new Map();

// ==========================================
// 🔒 SECURITY: Message Sanitization Function
// ==========================================
function sanitizeMessage(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Message text is required');
  }

  // 🔒 SECURITY: Remove all HTML tags and scripts
  const clean = DOMPurify.sanitize(text, { 
    ALLOWED_TAGS: [], // No HTML allowed
    ALLOWED_ATTR: []
  });
  
  const trimmed = clean.trim();
  
  // 🔒 SECURITY: Validate length
  if (trimmed.length === 0) {
    throw new Error('Message cannot be empty');
  }
  
  if (trimmed.length > 1000) {
    throw new Error('Message too long (max 1000 characters)');
  }
  
  return trimmed;
}

// ==========================================
// 🔒 SECURITY: Input Validation Functions
// ==========================================
function validateConversationId(id) {
  const numId = parseInt(id);
  if (isNaN(numId) || numId < 1) {
    throw new Error('Invalid conversation ID');
  }
  return numId;
}

export default function chatHandler(io) {
  
  // ============================================
  // 🔒 SECURITY: SOCKET.IO AUTHENTICATION MIDDLEWARE
  // ============================================
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error("Authentication required"));
      }

      // 🔒 SECURITY: Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      
      // 🔒 SECURITY: Store token for periodic verification
      socket.authToken = token;
      
      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication failed"));
    }
  });

  // ============================================
  // CONNECTION EVENT
  // ============================================
  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.userId} (${socket.userRole})`);
    
    // Store user's socket connection
    activeUsers.set(socket.userId, socket.id);

    // Update online status in database
    updateOnlineStatus(socket.userId, true, socket.id);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // 🔒 SECURITY: Periodic token verification (every 5 minutes)
    const verifyInterval = setInterval(() => {
      try {
        jwt.verify(socket.authToken, process.env.JWT_SECRET);
      } catch (error) {
        console.log(`Token expired for user ${socket.userId}, disconnecting`);
        socket.disconnect(true);
        clearInterval(verifyInterval);
      }
    }, 5 * 60 * 1000);

    // 🔒 SECURITY: Rate limiting for socket events
    const messageRateLimit = new Map(); // Track message timestamps
    const RATE_LIMIT_WINDOW = 60000; // 1 minute
    const MAX_MESSAGES = 20; // 20 messages per minute

    function checkRateLimit(userId) {
      const now = Date.now();
      const userMessages = messageRateLimit.get(userId) || [];
      
      // Remove old messages outside window
      const recentMessages = userMessages.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
      
      if (recentMessages.length >= MAX_MESSAGES) {
        return false; // Rate limit exceeded
      }
      
      recentMessages.push(now);
      messageRateLimit.set(userId, recentMessages);
      return true;
    }

    // ============================================
    // JOIN CONVERSATION ROOM
    // ============================================
    socket.on("join_conversation", async (conversationId) => {
      try {
        // 🔒 SECURITY: Validate conversation ID
        conversationId = validateConversationId(conversationId);

        // 🔒 SECURITY: Verify user is part of this conversation
        const [conversation] = await db.promise().query(
          `SELECT * FROM conversations 
           WHERE conversation_id = ? AND (buyer_id = ? OR agent_id = ?)`,
          [conversationId, socket.userId, socket.userId]
        );

        if (conversation.length > 0) {
          socket.join(`conversation_${conversationId}`);
          console.log(`User ${socket.userId} joined conversation ${conversationId}`);
          
          // Notify other user that this user is online
          const otherUserId = conversation[0].buyer_id === socket.userId 
            ? conversation[0].agent_id 
            : conversation[0].buyer_id;
          
          io.to(`user_${otherUserId}`).emit("user_online", {
            userId: socket.userId,
            conversationId
          });
        } else {
          socket.emit("error", { message: "Access denied to conversation" });
        }
      } catch (error) {
        console.error("Error joining conversation:", error);
        socket.emit("error", { message: "Invalid conversation" });
      }
    });

    // ============================================
    // SEND MESSAGE
    // ============================================
    socket.on("send_message", async (data) => {
      try {
        // 🔒 SECURITY: Check rate limit
        if (!checkRateLimit(socket.userId)) {
          return socket.emit("error", { 
            message: "Too many messages. Please slow down." 
          });
        }

        let { conversationId, messageText } = data;

        // 🔒 SECURITY: Validate conversation ID
        conversationId = validateConversationId(conversationId);

        // 🔒 SECURITY: Sanitize message text
        try {
          messageText = sanitizeMessage(messageText);
        } catch (err) {
          return socket.emit("error", { message: err.message });
        }

        // 🔒 SECURITY: Verify user is part of this conversation
        const [conversation] = await db.promise().query(
          `SELECT * FROM conversations 
           WHERE conversation_id = ? AND (buyer_id = ? OR agent_id = ?)`,
          [conversationId, socket.userId, socket.userId]
        );

        if (conversation.length === 0) {
          return socket.emit("error", { message: "Access denied" });
        }

        // Save message to database
        const [result] = await db.promise().query(
          `INSERT INTO messages (conversation_id, sender_id, message_text) 
           VALUES (?, ?, ?)`,
          [conversationId, socket.userId, messageText]
        );

        // Update conversation's last_message_at
        await db.promise().query(
          `UPDATE conversations 
           SET last_message_at = NOW() 
           WHERE conversation_id = ?`,
          [conversationId]
        );

        // Get the saved message with sender info
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

        const message = messages[0];

        // Broadcast to conversation room
        io.to(`conversation_${conversationId}`).emit("new_message", message);

        // Send notification to other user
        const otherUserId = conversation[0].buyer_id === socket.userId 
          ? conversation[0].agent_id 
          : conversation[0].buyer_id;
        
        io.to(`user_${otherUserId}`).emit("new_message_notification", {
          conversationId,
          propertyId: conversation[0].property_id,
          message
        });

        console.log(`✅ Message sent in conversation ${conversationId}`);

      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // ============================================
    // TYPING INDICATOR
    // ============================================
    socket.on("typing", async (data) => {
      try {
        let { conversationId } = data;

        // 🔒 SECURITY: Validate conversation ID
        conversationId = validateConversationId(conversationId);

        // 🔒 SECURITY: Verify user is part of conversation
        const [conversation] = await db.promise().query(
          `SELECT * FROM conversations 
           WHERE conversation_id = ? AND (buyer_id = ? OR agent_id = ?)`,
          [conversationId, socket.userId, socket.userId]
        );

        if (conversation.length > 0) {
          const otherUserId = conversation[0].buyer_id === socket.userId 
            ? conversation[0].agent_id 
            : conversation[0].buyer_id;
          
          io.to(`user_${otherUserId}`).emit("user_typing", {
            conversationId,
            userId: socket.userId
          });
        }
      } catch (error) {
        console.error("Error handling typing indicator:", error);
      }
    });

    // ============================================
    // STOP TYPING
    // ============================================
    socket.on("stop_typing", async (data) => {
      try {
        let { conversationId } = data;

        // 🔒 SECURITY: Validate conversation ID
        conversationId = validateConversationId(conversationId);

        const [conversation] = await db.promise().query(
          `SELECT * FROM conversations 
           WHERE conversation_id = ? AND (buyer_id = ? OR agent_id = ?)`,
          [conversationId, socket.userId, socket.userId]
        );

        if (conversation.length > 0) {
          const otherUserId = conversation[0].buyer_id === socket.userId 
            ? conversation[0].agent_id 
            : conversation[0].buyer_id;
          
          io.to(`user_${otherUserId}`).emit("user_stop_typing", {
            conversationId,
            userId: socket.userId
          });
        }
      } catch (error) {
        console.error("Error handling stop typing:", error);
      }
    });

    // ============================================
    // MARK AS READ
    // ============================================
    socket.on("mark_as_read", async (data) => {
      try {
        let { conversationId } = data;

        // 🔒 SECURITY: Validate conversation ID
        conversationId = validateConversationId(conversationId);

        await db.promise().query(
          `UPDATE messages 
           SET is_read = TRUE 
           WHERE conversation_id = ? AND sender_id != ?`,
          [conversationId, socket.userId]
        );

        // Notify the other user
        const [conversation] = await db.promise().query(
          `SELECT * FROM conversations 
           WHERE conversation_id = ?`,
          [conversationId]
        );

        if (conversation.length > 0) {
          const otherUserId = conversation[0].buyer_id === socket.userId 
            ? conversation[0].agent_id 
            : conversation[0].buyer_id;
          
          io.to(`user_${otherUserId}`).emit("messages_read", {
            conversationId
          });
        }
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    // ============================================
    // DISCONNECT EVENT
    // ============================================
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
      
      // 🔒 SECURITY: Clear verification interval
      clearInterval(verifyInterval);
      
      // Remove from active users
      activeUsers.delete(socket.userId);

      // Update online status
      updateOnlineStatus(socket.userId, false, null);
    });
  });
}

// ============================================
// HELPER: UPDATE ONLINE STATUS
// ============================================
async function updateOnlineStatus(userId, isOnline, socketId) {
  try {
    await db.promise().query(
      `INSERT INTO user_online_status (user_id, is_online, socket_id, last_seen) 
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
       is_online = ?, socket_id = ?, last_seen = NOW()`,
      [userId, isOnline, socketId, isOnline, socketId]
    );
  } catch (error) {
    console.error("Error updating online status:", error);
  }
}