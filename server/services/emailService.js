const prisma = require('../config/db');
const { sendEmailViaBrevo } = require('../config/mail');
const env = require('../config/env');

/**
 * Enterprise Email Notification Service & Template Engine
 * Powered by Brevo API for instant high-deliverability transactional emails
 * & automated customer broadcasts when new products are published.
 */
/**
 * Base Email Layout Wrapper (Luxury Dark / Gold Design)
 */
function wrapTemplate({ headline, description, bannerImage, products = [], buttonText, buttonUrl, unsubscribeUrl }) {
  const goldAccent = '#D4AF37';
  const darkBg = '#0D0D0D';
  const siteUrl = env.CLIENT_URL || 'http://localhost:3000';

  const productGridHtml = products.length > 0 ? `
    <div style="margin-top: 24px;">
      ${products.map(p => `
        <div style="background-color: #181818; border: 1px solid rgba(212,175,55,0.3); border-radius: 12px; padding: 16px; margin-bottom: 16px; text-align: center;">
          ${(p.images?.[0]?.url || p.image || p.imageUrl) ? `
            <img src="${p.images?.[0]?.url || p.image || p.imageUrl}" alt="${p.name}" style="max-width: 100%; height: 220px; object-fit: cover; border-radius: 10px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.1);" />
          ` : ''}
          <h4 style="color: #ffffff; font-size: 16px; font-weight: 700; margin: 6px 0; font-family: sans-serif;">${p.name}</h4>
          ${p.shortDesc ? `<p style="color: #aaaaaa; font-size: 12px; margin: 4px 0 10px 0; line-height: 1.4;">${p.shortDesc}</p>` : ''}
          <div style="margin: 8px 0;">
            <span style="color: ${goldAccent}; font-weight: 800; font-size: 18px;">₹${(p.discountPrice || p.price || 0).toLocaleString('en-IN')}</span>
            ${(p.price && p.discountPrice && p.price > p.discountPrice) ? `
              <span style="color: #777777; text-decoration: line-through; font-size: 13px; margin-left: 8px;">₹${p.price.toLocaleString('en-IN')}</span>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${headline}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #050505; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #050505; padding: 24px 0;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: ${darkBg}; border: 1px solid rgba(212,175,55,0.35); border-radius: 16px; overflow: hidden; max-width: 95%;">
              
              <!-- HEADER BRAND LOGO -->
              <tr>
                <td align="center" style="padding: 28px 20px; background-color: #000000; border-bottom: 1px solid rgba(255,255,255,0.08);">
                  <span style="font-size: 24px; font-weight: 900; letter-spacing: 3px; color: ${goldAccent}; text-transform: uppercase;">KVLR STYLES</span>
                  <p style="font-size: 10px; color: #999999; margin: 4px 0 0 0; letter-spacing: 3px; text-transform: uppercase;">LUXURY ETHNIC FASHION & JEWELLERY</p>
                </td>
              </tr>

              <!-- HERO BANNER IMAGE -->
              ${bannerImage ? `
                <tr>
                  <td>
                    <img src="${bannerImage}" alt="Banner" style="width: 100%; max-height: 280px; object-fit: cover; display: block;" />
                  </td>
                </tr>
              ` : ''}

              <!-- CONTENT BODY -->
              <tr>
                <td style="padding: 32px 28px; text-align: left; color: #E5E5E5;">
                  <h1 style="color: #FFFFFF; font-size: 22px; font-weight: 800; margin: 0 0 12px 0; line-height: 1.3;">${headline}</h1>
                  <div style="font-size: 14px; line-height: 1.6; color: #CCCCCC; margin-bottom: 24px;">
                    ${description}
                  </div>

                  ${productGridHtml}

                  <!-- CALL TO ACTION BUTTON -->
                  ${buttonText && buttonUrl ? `
                    <div style="text-align: center; margin-top: 32px;">
                      <a href="${buttonUrl}" target="_blank" style="background: linear-gradient(135deg, #D4AF37 0%, #B89327 100%); color: #000000; font-weight: 800; font-size: 14px; padding: 14px 32px; border-radius: 10px; text-decoration: none; display: inline-block; box-shadow: 0 4px 20px rgba(212,175,55,0.4);">
                        ${buttonText}
                      </a>
                    </div>
                  ` : ''}
                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td align="center" style="padding: 24px 20px; background-color: #000000; border-top: 1px solid rgba(255,255,255,0.08); font-size: 11px; color: #666666;">
                  <p style="margin: 0 0 8px 0; color: #888888;">© 2026 KVLR Styles Platform. All rights reserved.</p>
                  <p style="margin: 0;">
                    You received this email from KVLR Styles. 
                    ${unsubscribeUrl ? `<a href="${unsubscribeUrl}" style="color: ${goldAccent}; text-decoration: underline;">Unsubscribe</a>` : `<a href="${siteUrl}" style="color: ${goldAccent}; text-decoration: underline;">Visit Store</a>`}
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

class EmailService {

  // ==================== 1. OTP EMAIL (Brevo API) ====================
  async sendOTPEmail(email, fullName, otp) {
    const goldAccent = '#D4AF37';
    const description = `
      <p style="margin-bottom: 16px;">Hello <strong>${fullName || 'Valued Customer'}</strong>,</p>
      <p style="margin-bottom: 20px;">Use the following One-Time Password (OTP) to complete your verification at KVLR Styles. This code is valid for <strong>10 minutes</strong>.</p>
      <div style="text-align: center; margin: 24px 0;">
        <div style="display: inline-block; background-color: #1a1a1a; border: 2px solid ${goldAccent}; border-radius: 12px; padding: 16px 36px; letter-spacing: 8px; font-size: 32px; font-weight: 900; color: ${goldAccent}; box-shadow: 0 0 20px rgba(212,175,55,0.3);">
          ${otp}
        </div>
      </div>
      <p style="font-size: 12px; color: #888888; text-align: center; margin-top: 16px;">If you did not request this OTP, please ignore this email or contact customer support.</p>
    `;

    const htmlContent = wrapTemplate({
      headline: '🔐 Your One-Time Verification Code',
      description,
    });

    return sendEmailViaBrevo({
      to: email,
      subject: `${otp} is your KVLR Styles verification code`,
      htmlContent,
    });
  }

  // ==================== 2. WELCOME EMAIL ====================
  async sendWelcomeEmail(email, fullName) {
    const siteUrl = env.CLIENT_URL || 'http://localhost:3000';
    const description = `
      <p style="margin-bottom: 16px;">Welcome to KVLR Styles, <strong>${fullName}</strong>! 🎉</p>
      <p style="margin-bottom: 20px;">We are thrilled to have you as part of our exclusive community. Explore our latest royal silk sarees, temple jewellery, and festive men's collections handcrafted by master artisans.</p>
    `;

    const htmlContent = wrapTemplate({
      headline: '✨ Welcome to Royal Elegance',
      description,
      buttonText: 'Explore Exclusive Collections',
      buttonUrl: `${siteUrl}/categories`,
    });

    return sendEmailViaBrevo({
      to: email,
      subject: 'Welcome to KVLR Styles — Discover Handcrafted Elegance',
      htmlContent,
    });
  }

  // ==================== 3. FORGOT PASSWORD OTP ====================
  async sendPasswordResetEmail(email, fullName, otp) {
    const goldAccent = '#D4AF37';
    const description = `
      <p style="margin-bottom: 16px;">Hello <strong>${fullName || 'User'}</strong>,</p>
      <p style="margin-bottom: 20px;">We received a request to reset your password. Use the OTP code below to reset your account password. This code will expire in <strong>10 minutes</strong>.</p>
      <div style="text-align: center; margin: 24px 0;">
        <div style="display: inline-block; background-color: #1a1a1a; border: 2px solid ${goldAccent}; border-radius: 12px; padding: 16px 36px; letter-spacing: 8px; font-size: 32px; font-weight: 900; color: ${goldAccent};">
          ${otp}
        </div>
      </div>
      <p style="font-size: 12px; color: #888888; text-align: center;">If you did not request a password reset, your account is secure and you can ignore this email.</p>
    `;

    const htmlContent = wrapTemplate({
      headline: '🔑 Password Reset Request',
      description,
    });

    return sendEmailViaBrevo({
      to: email,
      subject: `${otp} is your password reset code - KVLR Styles`,
      htmlContent,
    });
  }

  // ==================== 4. PASSWORD CHANGED NOTICE ====================
  async sendPasswordChangedEmail(email, fullName) {
    const description = `
      <p style="margin-bottom: 16px;">Hello <strong>${fullName}</strong>,</p>
      <p style="margin-bottom: 16px;">Your KVLR Styles account password was updated successfully. If you made this change, no further action is required.</p>
      <p style="color: #ff6b6b; font-size: 12px;">If you did NOT change your password, please contact support immediately.</p>
    `;

    const htmlContent = wrapTemplate({
      headline: '🛡️ Account Password Updated',
      description,
    });

    return sendEmailViaBrevo({
      to: email,
      subject: 'Security Alert: Your password was updated - KVLR Styles',
      htmlContent,
    });
  }

  // ==================== 5. ORDER PLACED EMAIL ====================
  async sendOrderPlacedEmail(email, fullName, orderData) {
    const siteUrl = env.CLIENT_URL || 'http://localhost:3000';
    const description = `
      <p style="margin-bottom: 12px;">Thank you for your order, <strong>${fullName}</strong>!</p>
      <p style="margin-bottom: 20px;">We have received your order <strong>#${orderData.orderNumber}</strong> and our team is preparing it for shipment.</p>
      <div style="background: #181818; padding: 16px; border-radius: 10px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.1);">
        <p style="margin: 4px 0; font-[13px]; color: #fff;"><strong>Order Number:</strong> #${orderData.orderNumber}</p>
        <p style="margin: 4px 0; font-[13px]; color: #D4AF37;"><strong>Total Amount:</strong> ₹${(orderData.total || 0).toLocaleString('en-IN')}</p>
        <p style="margin: 4px 0; font-[13px]; color: #aaa;"><strong>Estimated Delivery:</strong> ${orderData.estimatedDelivery || '3-5 Business Days'}</p>
      </div>
    `;

    const htmlContent = wrapTemplate({
      headline: `🛍️ Order Confirmed! (#${orderData.orderNumber})`,
      description,
      products: orderData.items || [],
      buttonText: 'View Order Details',
      buttonUrl: `${siteUrl}/orders`,
    });

    return sendEmailViaBrevo({
      to: email,
      subject: `Order Confirmed #${orderData.orderNumber} - KVLR Styles`,
      htmlContent,
    });
  }

  // ==================== 6. ORDER SHIPPED EMAIL ====================
  async sendOrderShippedEmail(email, fullName, orderData) {
    const siteUrl = env.CLIENT_URL || 'http://localhost:3000';
    const description = `
      <p style="margin-bottom: 12px;">Great news, <strong>${fullName}</strong>!</p>
      <p style="margin-bottom: 20px;">Your order <strong>#${orderData.orderNumber}</strong> has been shipped and is on its way to you.</p>
      <div style="background: #181818; padding: 16px; border-radius: 10px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.1);">
        <p style="margin: 4px 0; font-[13px]; color: #fff;"><strong>Courier:</strong> ${orderData.courierName || 'Standard Logistics'}</p>
        <p style="margin: 4px 0; font-[13px]; color: #D4AF37;"><strong>Tracking Number:</strong> ${orderData.trackingNumber || 'Will be updated'}</p>
      </div>
    `;

    const htmlContent = wrapTemplate({
      headline: `🚚 Your Order Has Shipped! (#${orderData.orderNumber})`,
      description,
      products: orderData.items || [],
      buttonText: 'Track Order',
      buttonUrl: orderData.trackingUrl || `${siteUrl}/orders`,
    });

    return sendEmailViaBrevo({
      to: email,
      subject: `Your order #${orderData.orderNumber} is on the way! - KVLR Styles`,
      htmlContent,
    });
  }

  // ==================== 7. ORDER DELIVERED EMAIL ====================
  async sendOrderDeliveredEmail(email, fullName, orderData) {
    const siteUrl = env.CLIENT_URL || 'http://localhost:3000';
    const description = `
      <p style="margin-bottom: 12px;">Hello <strong>${fullName}</strong>,</p>
      <p style="margin-bottom: 20px;">Your order <strong>#${orderData.orderNumber}</strong> has been successfully delivered! We hope you love your new purchase.</p>
    `;

    const htmlContent = wrapTemplate({
      headline: `🎁 Order Delivered! (#${orderData.orderNumber})`,
      description,
      products: orderData.items || [],
      buttonText: 'Leave a Product Review',
      buttonUrl: `${siteUrl}/orders`,
    });

    return sendEmailViaBrevo({
      to: email,
      subject: `Order Delivered #${orderData.orderNumber} - KVLR Styles`,
      htmlContent,
    });
  }

  // ==================== 8. ORDER CANCELLED EMAIL ====================
  async sendOrderCancelledEmail(email, fullName, orderData) {
    const description = `
      <p style="margin-bottom: 12px;">Hello <strong>${fullName}</strong>,</p>
      <p style="margin-bottom: 20px;">Your order <strong>#${orderData.orderNumber}</strong> has been cancelled. If any payment was made, your refund is being processed.</p>
      ${orderData.reason ? `<p style="color: #aaa; font-size: 13px;">Reason: ${orderData.reason}</p>` : ''}
    `;

    const htmlContent = wrapTemplate({
      headline: `❌ Order Cancelled (#${orderData.orderNumber})`,
      description,
    });

    return sendEmailViaBrevo({
      to: email,
      subject: `Order Cancelled #${orderData.orderNumber} - KVLR Styles`,
      htmlContent,
    });
  }

  // ==================== 9. NEW PRODUCT BROADCAST NOTIFICATION ====================
  /**
   * Broadcast email & in-app notification to all customers when a new product is published.
   */
  async sendNewProductNotificationToCustomers(product) {
    if (!product || !product.id) return;
    const siteUrl = env.CLIENT_URL || 'http://localhost:3000';

    console.log(`[NEW PRODUCT BROADCAST] Initiating broadcast for product: "${product.name}" (${product.id})`);

    try {
      // Fetch all active customer accounts
      const customers = await prisma.user.findMany({
        where: {
          role: 'CUSTOMER',
          status: 'ACTIVE',
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          emailNotifications: true,
          promoNotifications: true,
        },
      });

      if (!customers || customers.length === 0) {
        console.log('[NEW PRODUCT BROADCAST] No active customers found for notification.');
        return;
      }

      // Filter customers who accept email notifications
      const emailRecipients = customers.filter(c => c.email && c.emailNotifications !== false);
      const productUrl = `${siteUrl}/product/${product.slug || product.id}`;
      const mainImage = product.images?.[0]?.url || product.image || '';

      const headline = `✨ Just Dropped: ${product.name}`;
      const description = `
        <p style="margin-bottom: 12px;">Exciting news! A brand new luxury addition has just arrived at <strong>KVLR Styles</strong>.</p>
        <p style="margin-bottom: 20px; font-size: 15px; color: #ffffff;">Be among the first to explore <strong>${product.name}</strong>${product.category?.name ? ' in ' + product.category.name : ''}.</p>
      `;

      const htmlContent = wrapTemplate({
        headline,
        description,
        products: [product],
        buttonText: 'Shop New Arrival Now',
        buttonUrl: productUrl,
      });

      // 1. Create In-App Notifications for all customers in PostgreSQL
      const inAppRecords = customers.map(c => ({
        userId: c.id,
        title: `✨ New Arrival: ${product.name}`,
        message: `Check out our newly published item "${product.name}" for ₹${(product.discountPrice || product.price || 0).toLocaleString('en-IN')}!`,
        type: 'NEW_PRODUCT',
        link: `/product/${product.slug || product.id}`,
      }));

      await prisma.notification.createMany({ data: inAppRecords });
      console.log(`[NEW PRODUCT BROADCAST] Created ${inAppRecords.length} in-app notifications.`);

      // 2. Send Email Broadcast via Brevo API in non-blocking batches
      if (emailRecipients.length > 0) {
        setImmediate(async () => {
          let successCount = 0;
          for (const customer of emailRecipients) {
            try {
              await sendEmailViaBrevo({
                to: customer.email,
                subject: `✨ New Arrival Alert: ${product.name} - KVLR Styles`,
                htmlContent,
              });
              successCount++;
            } catch (err) {
              console.error(`[NEW PRODUCT BROADCAST FAILED] Recipient: ${customer.email}`, err.message);
            }
          }
          console.log(`[NEW PRODUCT BROADCAST COMPLETE] Successfully sent Brevo emails to ${successCount}/${emailRecipients.length} customers.`);
        });
      }
    } catch (error) {
      console.error('[NEW PRODUCT BROADCAST ERROR]', error);
    }
  }

  // ==================== 10. CAMPAIGN BROADCAST ====================
  async sendCampaign({ campaignId, subject, recipients, headline, description, bannerImage, products, buttonText, buttonUrl }) {
    const htmlContent = wrapTemplate({ headline, description, bannerImage, products, buttonText, buttonUrl });

    let count = 0;
    for (const email of recipients) {
      try {
        await sendEmailViaBrevo({ to: email, subject, htmlContent });
        count++;
      } catch (e) {
        console.error(`[CAMPAIGN EMAIL ERROR] ${email}:`, e);
      }
    }

    if (campaignId) {
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'SENT',
          sentCount: { increment: count },
          deliveredCount: { increment: count },
        }
      });
    }

    return { success: true, count, htmlContent };
  }
}

module.exports = new EmailService();
