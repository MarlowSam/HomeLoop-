// routes/reviews.js - Property Reviews Routes (Fixed for your auth system)
import express from "express";
import db from "../db.js";
import { verifyToken } from "../middleware/auth.js"; // 👈 Using YOUR auth middleware

const router = express.Router();

// ========== GET REVIEWS FOR A PROPERTY ==========
router.get("/:propertyId", async (req, res) => {
  try {
    const { propertyId } = req.params;

    const query = `
      SELECT 
        r.review_id,
        r.rating,
        r.comment,
        r.review_date,
        r.is_verified,
        u.username as reviewer_name,
        u.user_id as reviewer_id
      FROM property_reviews r
      JOIN users u ON r.user_id = u.user_id
      WHERE r.property_id = ?
      ORDER BY r.review_date DESC
    `;

    const [reviews] = await db.promise().query(query, [propertyId]);

    res.json({
      success: true,
      reviews: reviews,
      total: reviews.length,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching reviews",
      error: error.message,
    });
  }
});

// ========== CREATE A NEW REVIEW ==========
router.post("/", verifyToken, async (req, res) => { // 👈 Using verifyToken
  try {
    const userId = req.user.userId; // 👈 From YOUR auth middleware (req.user.userId)
    const { property_id, booking_id, rating, comment } = req.body;

    // Validate input
    if (!property_id || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Property ID, rating, and comment are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Check if user has already reviewed this property with this booking
    const [existingReview] = await db.promise().query(
      `SELECT review_id FROM property_reviews 
       WHERE user_id = ? AND property_id = ? AND booking_id = ?`,
      [userId, property_id, booking_id || null]
    );

    if (existingReview.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this property",
      });
    }

    // Optional: Verify user has a completed booking for this property
    if (booking_id) {
      const [booking] = await db.promise().query(
        `SELECT booking_id FROM bookings 
         WHERE booking_id = ? AND user_id = ? AND property_id = ? AND status = 'confirmed'`,
        [booking_id, userId, property_id]
      );

      if (booking.length === 0) {
        return res.status(403).json({
          success: false,
          message: "You can only review properties you have visited",
        });
      }
    }

    // Insert the review
    const insertQuery = `
      INSERT INTO property_reviews (property_id, user_id, booking_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.promise().query(insertQuery, [
      property_id,
      userId,
      booking_id || null,
      rating,
      comment,
    ]);

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review_id: result.insertId,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting review",
      error: error.message,
    });
  }
});

// ========== UPDATE A REVIEW ==========
router.put("/:reviewId", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    // Validate input
    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Rating and comment are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Check if review exists and belongs to user
    const [review] = await db.promise().query(
      "SELECT review_id FROM property_reviews WHERE review_id = ? AND user_id = ?",
      [reviewId, userId]
    );

    if (review.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Review not found or you don't have permission to edit it",
      });
    }

    // Update the review
    await db.promise().query(
      "UPDATE property_reviews SET rating = ?, comment = ?, updated_at = NOW() WHERE review_id = ?",
      [rating, comment, reviewId]
    );

    res.json({
      success: true,
      message: "Review updated successfully",
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({
      success: false,
      message: "Error updating review",
      error: error.message,
    });
  }
});

// ========== DELETE A REVIEW ==========
router.delete("/:reviewId", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reviewId } = req.params;

    // Check if review exists and belongs to user
    const [review] = await db.promise().query(
      "SELECT review_id FROM property_reviews WHERE review_id = ? AND user_id = ?",
      [reviewId, userId]
    );

    if (review.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Review not found or you don't have permission to delete it",
      });
    }

    // Delete the review
    await db.promise().query("DELETE FROM property_reviews WHERE review_id = ?", [
      reviewId,
    ]);

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting review",
      error: error.message,
    });
  }
});

// ========== GET USER'S REVIEWS ==========
router.get("/user/my-reviews", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const query = `
      SELECT 
        r.review_id,
        r.rating,
        r.comment,
        r.review_date,
        p.property_id,
        p.property_type,
        p.city,
        p.price
      FROM property_reviews r
      JOIN properties p ON r.property_id = p.property_id
      WHERE r.user_id = ?
      ORDER BY r.review_date DESC
    `;

    const [reviews] = await db.promise().query(query, [userId]);

    res.json({
      success: true,
      reviews: reviews,
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching your reviews",
      error: error.message,
    });
  }
});

// ========== CHECK IF USER CAN REVIEW ==========
router.get("/can-review/:propertyId", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { propertyId } = req.params;
    const { booking_id } = req.query;

    // Check if user already reviewed
    const [existingReview] = await db.promise().query(
      `SELECT review_id FROM property_reviews 
       WHERE user_id = ? AND property_id = ? AND (booking_id = ? OR booking_id IS NULL)`,
      [userId, propertyId, booking_id || null]
    );

    if (existingReview.length > 0) {
      return res.json({
        success: true,
        can_review: false,
        reason: "already_reviewed",
      });
    }

    // Check if user has a booking
    const [booking] = await db.promise().query(
      `SELECT booking_id, visit_date, status FROM bookings 
       WHERE property_id = ? AND user_id = ? 
       ORDER BY visit_date DESC LIMIT 1`,
      [propertyId, userId]
    );

    if (booking.length === 0) {
      return res.json({
        success: true,
        can_review: false,
        reason: "no_booking",
      });
    }

    const visitDate = new Date(booking[0].visit_date);
    const today = new Date();

    if (visitDate > today) {
      return res.json({
        success: true,
        can_review: false,
        reason: "visit_not_completed",
      });
    }

    res.json({
      success: true,
      can_review: true,
      booking_id: booking[0].booking_id,
    });
  } catch (error) {
    console.error("Error checking review eligibility:", error);
    res.status(500).json({
      success: false,
      message: "Error checking review eligibility",
      error: error.message,
    });
  }
});

export default router;