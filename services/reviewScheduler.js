// services/reviewScheduler.js - Auto-send review requests after visits
import cron from "node-cron";
import db from "../db.js";
import { sendReviewRequestEmail } from "./emailService.js";

/**
 * Check for completed visits and send review request emails
 * Runs every day at 10:00 AM
 */
export function startReviewScheduler() {
  // Run every day at 10:00 AM
  cron.schedule("0 10 * * *", async () => {
    console.log("🔍 Checking for completed visits to request reviews...");
    await checkAndSendReviewRequests();
  });

  console.log("✅ Review scheduler started (runs daily at 10:00 AM)");
}

/**
 * Main function to check bookings and send emails
 * You can also call this manually for testing
 */
export async function checkAndSendReviewRequests() {
  try {
    // Find bookings where:
    // 1. Visit date was 1 day ago (give users time after visit)
    // 2. Status is confirmed
    // 3. Review email hasn't been sent yet
    // 4. User hasn't already reviewed the property

    const query = `
      SELECT 
        b.booking_id,
        b.property_id,
        b.user_id,
        b.visit_date,
        u.email as user_email,
        u.full_name as user_name,
        p.property_type,
        p.city,
        p.address_line1
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      JOIN properties p ON b.property_id = p.property_id
      WHERE 
        b.status = 'confirmed'
        AND b.review_email_sent = FALSE
        AND DATE(b.visit_date) = DATE(DATE_SUB(NOW(), INTERVAL 1 DAY))
        AND NOT EXISTS (
          SELECT 1 FROM property_reviews pr 
          WHERE pr.booking_id = b.booking_id
        )
      LIMIT 50
    `;

    const [bookings] = await db.promise().query(query); // 👈 Using db.promise()

    if (bookings.length === 0) {
      console.log("No bookings found that need review requests.");
      return;
    }

    console.log(`📧 Found ${bookings.length} bookings to send review requests for`);

    let successCount = 0;
    let failCount = 0;

    // Send emails
    for (const booking of bookings) {
      const propertyTitle = booking.address_line1
        ? `${booking.property_type} in ${booking.address_line1}, ${booking.city}`
        : `${booking.property_type} in ${booking.city}`;

      const emailResult = await sendReviewRequestEmail({
        userEmail: booking.user_email,
        userName: booking.user_name,
        propertyId: booking.property_id,
        propertyTitle: propertyTitle,
        bookingId: booking.booking_id,
      });

      if (emailResult.success) {
        // Mark email as sent
        await db.promise().query(
          `UPDATE bookings 
           SET review_email_sent = TRUE, review_requested_at = NOW() 
           WHERE booking_id = ?`,
          [booking.booking_id]
        );
        successCount++;
      } else {
        failCount++;
      }

      // Add small delay between emails to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(
      `✅ Review request emails: ${successCount} sent, ${failCount} failed`
    );
  } catch (error) {
    console.error("❌ Error in review scheduler:", error);
  }
}