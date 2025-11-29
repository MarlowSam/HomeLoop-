// services/emailService.js - Email service using Nodemailer
import { createTransport } from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create transporter
const transporter = createTransport({
  service: "gmail", // Change to "hotmail" or "outlook" if Gmail doesn't work
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASSWORD, // your app password (Gmail) or regular password (Outlook)
  },
});

// Verify transporter
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email service error:", error);
  } else {
    console.log("✅ Email service ready");
  }
});

/**
 * Send review request email to user after visit
 */
export async function sendReviewRequestEmail({
  userEmail,
  userName,
  propertyId,
  propertyTitle,
  bookingId,
}) {
  const mailOptions = {
    from: `"HomeLoop" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: "How was your property visit? Leave a review! 🏠",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { display: inline-block; background-color: #007bff; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .button:hover { background-color: #0056b3; }
          .footer { text-align: center; color: #999; font-size: 12px; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Thank You for Visiting! 🏡</h1>
          </div>
          
          <div class="content">
            <h2>Hi ${userName}!</h2>
            
            <p>We hope you enjoyed your visit to <strong>${propertyTitle}</strong>!</p>
            
            <p>Your feedback is incredibly valuable and helps other users make informed decisions about their future homes. Would you mind taking just 2 minutes to share your experience?</p>
            
            <div style="text-align: center;">
              <a href="http://127.0.0.1:5500/house.html?id=${propertyId}&write_review=true&booking_id=${bookingId}" class="button">
                ✍️ Write a Review
              </a>
            </div>
            
            <p style="margin-top: 30px;">Your honest review will help:</p>
            <ul>
              <li>Other users find their perfect home</li>
              <li>Improve the quality of our listings</li>
              <li>Support great agents and properties</li>
            </ul>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This email was sent because you recently completed a visit to this property through HomeLoop.
            </p>
          </div>
          
          <div class="footer">
            <p>
              <strong>HomeLoop Real Estate Platform</strong><br>
              Making house hunting easier, one property at a time.<br>
              <a href="http://127.0.0.1:5500" style="color: #007bff;">Visit our website</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Review request email sent to ${userEmail}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending email to ${userEmail}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome email when user signs up (optional)
 */
export async function sendWelcomeEmail(userEmail, userName) {
  const mailOptions = {
    from: `"HomeLoop" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: "Welcome to HomeLoop! 🏠",
    html: `
      <h2>Welcome ${userName}!</h2>
      <p>Thank you for joining HomeLoop. Start exploring amazing properties today!</p>
      <a href="http://127.0.0.1:5500" style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Browse Properties
      </a>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Error sending welcome email:`, error);
    return { success: false, error: error.message };
  }
}

export default {
  sendReviewRequestEmail,
  sendWelcomeEmail,
};