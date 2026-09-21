/**
 * Zohaib DigiForge - Automated 100% Free Notification Engine
 * Trigger: Order status changes to "Delivered" or "Access Delivered"
 * 
 * 1. Sends automated Gmail review prompt via Nodemailer SMTP (0 API cost).
 * 2. Writes in-app notification doc to Firestore `notifications` collection (0 extra cost).
 * 3. Updates order doc with `reviewPromptSent: true` to prevent duplicates.
 */

const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Configure 100% Free Nodemailer Gmail SMTP Transporter
 * Secrets configured in Firebase environment or process.env:
 * - GMAIL_EMAIL (e.g. zohaibdigiforge@gmail.com)
 * - GMAIL_APP_PASSWORD (16-character Google App Password)
 */
function createGmailTransporter() {
  const gmailEmail = process.env.GMAIL_EMAIL || functions.config().gmail?.email || 'zohaibdigiforge@gmail.com';
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD || functions.config().gmail?.app_password;

  if (!gmailAppPassword) {
    console.warn('[ZDF-Mailer] Warning: GMAIL_APP_PASSWORD secret is not configured. Email will be logged.');
  }

  return {
    transporter: nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailEmail,
        pass: gmailAppPassword,
      },
    }),
    senderEmail: gmailEmail
  };
}

/**
 * Generates high-converting, branded HTML email template for Review Request
 */
function generateReviewEmailHtml({ customerName, productName, orderId, reviewLink, productThumbnail }) {
  const displayName = customerName || 'Valued Creator';
  const displayProduct = productName || 'your digital asset';
  const fallbackLink = reviewLink || `https://zohaibdigiforge.com/?view=reviews&orderId=${orderId}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>How was ${displayProduct}? Leave a Review 🌟</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070B14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070B14; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background: linear-gradient(180deg, #0D1527 0%, #080D1A 100%); border: 1px solid #1E293B; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          
          <!-- Top Accent Header Bar -->
          <tr>
            <td style="background: linear-gradient(90deg, #0D6EFD 0%, #28B9FF 50%, #10B981 100%); height: 6px; line-height: 6px; font-size: 0;">&nbsp;</td>
          </tr>

          <!-- Brand Header -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center;">
              <div style="display: inline-block; padding: 6px 14px; background: rgba(13, 110, 253, 0.12); border: 1px solid rgba(40, 185, 255, 0.25); border-radius: 999px; margin-bottom: 16px;">
                <span style="color: #28B9FF; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">✦ Zohaib DigiForge Verified Purchase</span>
              </div>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                Your Access is Ready! 🚀
              </h1>
              <p style="margin: 8px 0 0 0; color: #94A3B8; font-size: 14px; line-height: 1.5;">
                Hi <strong style="color: #F8FAFC;">${displayName}</strong>, we hope you're loving your new tools.
              </p>
            </td>
          </tr>

          <!-- Product Feature Card -->
          <tr>
            <td style="padding: 0 32px;">
              <table role="presentation" width="100%" style="background-color: rgba(15, 23, 42, 0.7); border: 1px solid #1E293B; border-radius: 14px; padding: 18px;">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="font-size: 11px; color: #10B981; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
                      ✓ Verified Order: #${orderId}
                    </div>
                    <div style="color: #FFFFFF; font-size: 16px; font-weight: 700; line-height: 1.3;">
                      ${displayProduct}
                    </div>
                    <div style="color: #64748B; font-size: 12px; margin-top: 4px;">
                      Status: <span style="color: #38BDF8; font-weight: 600;">Access Delivered</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Value / Review Prompt -->
          <tr>
            <td style="padding: 24px 32px 10px 32px; text-align: center;">
              <p style="margin: 0 0 20px 0; color: #CBD5E1; font-size: 15px; line-height: 1.6;">
                How was your experience with <strong style="color: #38BDF8;">${displayProduct}</strong>? Your honest review helps thousands of Pakistani creators & students make the right choice.
              </p>
              
              <!-- 5 Stars Visual -->
              <div style="font-size: 26px; color: #F59E0B; letter-spacing: 4px; margin-bottom: 22px;">
                ★ ★ ★ ★ ★
              </div>

              <!-- CTA Button -->
              <div>
                <a href="${fallbackLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0D6EFD 0%, #28B9FF 100%); color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 36px; border-radius: 12px; box-shadow: 0 10px 20px rgba(13, 110, 253, 0.35); letter-spacing: 0.2px;">
                  Leave a 1-Minute Review 🌟
                </a>
              </div>

              <p style="margin: 16px 0 0 0; color: #64748B; font-size: 12px;">
                Takes under 60 seconds • Verified Buyer Badge included
              </p>
            </td>
          </tr>

          <!-- Footer & Direct WhatsApp Support -->
          <tr>
            <td style="padding: 28px 32px; background-color: #060A13; border-top: 1px solid #1E293B; margin-top: 24px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #94A3B8; font-size: 12px;">
                Need help or direct support? WhatsApp us anytime at <strong style="color: #22C55E;">+92 340 6070632</strong>
              </p>
              <p style="margin: 0; color: #475569; font-size: 11px;">
                © ${new Date().getFullYear()} Zohaib DigiForge • Premium Digital Assets & Software Tools
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Cloud Function v2 Firestore Trigger
 * Listens for updates on `orders/{orderId}`
 */
exports.onOrderDelivered = onDocumentUpdated('orders/{orderId}', async (event) => {
  const before = event.data.before ? event.data.before.data() : null;
  const after = event.data.after ? event.data.after.data() : null;

  if (!before || !after) {
    return null;
  }

  const orderId = event.params.orderId;
  const beforeStatus = (before.status || '').toLowerCase();
  const afterStatus = (after.status || '').toLowerCase();

  const isDeliveredState = (status) => 
    status === 'delivered' || 
    status === 'access delivered' || 
    status === 'completed';

  // Condition: status changed to Delivered and prompt hasn't been sent yet
  if (!isDeliveredState(beforeStatus) && isDeliveredState(afterStatus) && !after.reviewPromptSent) {
    console.log(`[ZDF-Trigger] Order ${orderId} reached Delivered state. Triggering automated 0-cost notifications.`);

    const customerEmail = after.email || (after.customer && after.customer.email);
    const customerName = after.customerName || (after.customer && after.customer.name) || 'Valued Creator';
    const userId = after.userId || customerEmail || 'guest-buyer';

    // Get primary product details
    const firstItem = (after.items && after.items.length > 0) ? after.items[0] : null;
    const productName = firstItem?.title || after.productName || 'Premium Digital Resource';
    const productId = firstItem?.productId || after.productId || 'item-1';
    const productThumbnail = firstItem?.thumbnail || after.thumbnail || '';

    // Direct review link
    const reviewLink = `https://zohaibdigiforge.com/?view=reviews&orderId=${orderId}&product=${productId}`;

    // 1. Create In-App Notification in Firestore `notifications` collection
    try {
      const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await db.collection('notifications').doc(notifId).set({
        id: notifId,
        userId: userId,
        type: 'review_request',
        title: `How was ${productName}? 🌟`,
        message: `Your access for order #${orderId} was delivered. Click here to leave a quick 1-minute verified review!`,
        relatedOrderId: orderId,
        productId: productId,
        productTitle: productName,
        productThumbnail: productThumbnail,
        isRead: false,
        createdAt: new Date().toISOString(),
        link: reviewLink,
        customerName: customerName,
        customerEmail: customerEmail
      });
      console.log(`[ZDF-InApp] In-app notification doc ${notifId} successfully saved to Firestore.`);
    } catch (notifErr) {
      console.error('[ZDF-InApp] Error creating in-app notification doc:', notifErr);
    }

    // 2. Dispatch Gmail Review Email via Nodemailer SMTP (100% Free)
    if (customerEmail) {
      try {
        const { transporter, senderEmail } = createGmailTransporter();
        const mailOptions = {
          from: `"Zohaib DigiForge" <${senderEmail}>`,
          to: customerEmail,
          subject: `How was ${productName}? Leave a Review 🌟 (Order #${orderId})`,
          text: `Hi ${customerName},\n\nYour access to ${productName} for order #${orderId} has been delivered!\n\nWe'd love to hear your feedback. Please leave a quick review here:\n${reviewLink}\n\nThank you,\nZohaib DigiForge Team`,
          html: generateReviewEmailHtml({
            customerName,
            productName,
            orderId,
            reviewLink,
            productThumbnail
          })
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[ZDF-Email] Review request email sent successfully to ${customerEmail}. MessageId: ${info.messageId}`);
      } catch (mailErr) {
        console.error(`[ZDF-Email] Error sending Gmail review email to ${customerEmail}:`, mailErr);
      }
    } else {
      console.warn(`[ZDF-Email] No email address found for order #${orderId}. Skipped email dispatch.`);
    }

    // 3. Mark order with reviewPromptSent = true to avoid duplicate dispatches
    try {
      await db.collection('orders').doc(orderId).set({
        reviewPromptSent: true,
        reviewPromptSentAt: new Date().toISOString()
      }, { merge: true });
      console.log(`[ZDF-Order] Order #${orderId} updated with reviewPromptSent = true.`);
    } catch (orderUpdateErr) {
      console.error('[ZDF-Order] Error updating order reviewPromptSent flag:', orderUpdateErr);
    }
  }

  return null;
});
