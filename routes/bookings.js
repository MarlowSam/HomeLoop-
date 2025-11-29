// routes/bookings.js - Bookings API Routes
import express from "express";
import db from "../db.js";

const router = express.Router();

// ============================================
// 📝 POST: Create a new booking
// ============================================
router.post("/", async (req, res) => {
  try {
    const { 
      property_id, 
      full_name, 
      email, 
      phone, 
      preferred_date, 
      preferred_time, 
      notes 
    } = req.body;

    // Validate required fields
    if (!property_id || !full_name || !email || !phone || !preferred_date || !preferred_time) {
      return res.status(400).json({ 
        message: "Missing required fields" 
      });
    }

    // Get agent_id from the property
    const [property] = await db.promise().query(
      "SELECT agent_id FROM properties WHERE property_id = ?",
      [property_id]
    );

    if (property.length === 0) {
      return res.status(404).json({ 
        message: "Property not found" 
      });
    }

    const agent_id = property[0].agent_id;

    // Insert booking into database
    const [result] = await db.promise().query(
      `INSERT INTO bookings 
       (property_id, agent_id, full_name, email, phone, preferred_date, preferred_time, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [property_id, agent_id, full_name, email, phone, preferred_date, preferred_time, notes || null]
    );

    res.status(201).json({ 
      message: "Booking created successfully",
      booking_id: result.insertId 
    });
  } catch (err) {
    console.error("❌ Error creating booking:", err);
    res.status(500).json({ 
      message: "Error creating booking",
      error: err.message 
    });
  }
});

// ============================================
// 📋 GET: Get all bookings (for agent dashboard)
// ============================================
router.get("/", async (req, res) => {
  try {
    const { status, limit = 100, agent_id } = req.query;

    let query = "SELECT * FROM bookings WHERE agent_id IS NOT NULL";
    const params = [];
    const conditions = [];

    // Filter by agent_id (REQUIRED for agent dashboard)
    if (agent_id) {
      conditions.push("agent_id = ?");
      params.push(agent_id);
    }

    // Filter by status if provided
    if (status) {
      conditions.push("status = ?");
      params.push(status);
    }

    if (conditions.length > 0) {
      query += " AND " + conditions.join(" AND ");
    }

    query += " ORDER BY created_at DESC LIMIT ?";
    params.push(parseInt(limit));

    const [rows] = await db.promise().query(query, params);

    res.json({ 
      count: rows.length,
      bookings: rows 
    });
  } catch (err) {
    console.error("❌ Error fetching bookings:", err);
    res.status(500).json({ 
      message: "Error fetching bookings",
      error: err.message 
    });
  }
});

// ============================================
// 👤 GET: Get single booking by ID
// ============================================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.promise().query(
      "SELECT * FROM bookings WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        message: "Booking not found" 
      });
    }

    res.json({ 
      booking: rows[0] 
    });
  } catch (err) {
    console.error("❌ Error fetching booking:", err);
    res.status(500).json({ 
      message: "Error fetching booking",
      error: err.message 
    });
  }
});

// ============================================
// ✏️ PATCH: Update booking status
// ============================================
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["pending", "confirmed", "cancelled"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status. Must be: pending, confirmed, or cancelled" 
      });
    }

    const [result] = await db.promise().query(
      "UPDATE bookings SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        message: "Booking not found" 
      });
    }

    res.json({ 
      message: "Booking updated successfully" 
    });
  } catch (err) {
    console.error("❌ Error updating booking:", err);
    res.status(500).json({ 
      message: "Error updating booking",
      error: err.message 
    });
  }
});

// ============================================
// 🗑️ DELETE: Delete a booking
// ============================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.promise().query(
      "DELETE FROM bookings WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        message: "Booking not found" 
      });
    }

    res.json({ 
      message: "Booking deleted successfully" 
    });
  } catch (err) {
    console.error("❌ Error deleting booking:", err);
    res.status(500).json({ 
      message: "Error deleting booking",
      error: err.message 
    });
  }
});

export default router;