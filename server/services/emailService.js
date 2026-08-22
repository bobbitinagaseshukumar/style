const prisma = require('../config/db');
const { sendEmailViaBrevo } = require('../config/mail');
const env = require('../config/env');

/**
 * Enterprise Email Notification Service & Dynamic Template Engine
 * - Automatically syncs with dynamic Store Settings from PostgreSQL database.
 * - Formats high-compatibility absolute HTTPS image URLs for all email clients.
 * - Generates high-converting product links pointing to the live storefront.
 */

// Helper: Dynamically fetch current store branding & live storefront URL
async function getStoreMetadata() {
  let settings = null;
  try {
    settings = await prisma.storeSettings.findFirst();
  } catch (e) {
    console.warn('[EMAIL SERVICE] StoreSettings query fallback:', e.message);
  }

  let clientUrl = env.CLIENT_URL;
  if (!clientUrl || clientUrl.includes('localhost')) {
    if (process.env.VERCEL_URL) {
      clientUrl = `https://${process.env.VERCEL_URL}`;
    } else {
      clientUrl = 'https://styleverse.vercel.app';
    }
  }
  clientUrl = clientUrl.replace(/\/$/, '');

  return {
    storeName: settings?.storeName || env.FROM_NAME || 'KVLR Styles',
    storeTagline: settings?.storeTagline || 'Enterprise Luxury Clothing & Jewellery Platform',
    primaryColor: settings?.primaryColor || '#D4AF37',
    clientUrl,
  };
}

// Helper: Ensure full absolute HTTPS image URLs for email clients with smart fallbacks
function formatEmailImageUrl(url, productName = '', imgId = '', productId = '') {
  const serverBase = (process.env.RENDER_EXTERNAL_URL || 'https://style-q21b.onrender.com').replace(/\/$/, '');

  if (imgId) {
    return `${serverBase}/api/v1/products/render-image?imgId=${imgId}`;
  }

  if (!url || typeof url !== 'string' || url.trim() === '') {
    if (productId) {
      return `${serverBase}/api/v1/products/render-image?productId=${productId}`;
    }
    return getFallbackImageUrl(productName);
  }

  const clean = url.trim();

  // If base64 data URI, route through image-render endpoint so Gmail & Outlook load actual binary image!
  if (clean.startsWith('data:image/')) {
    if (productId) {
      return `${serverBase}/api/v1/products/render-image?productId=${productId}`;
    }
    return `${serverBase}/api/v1/products/render-image?url=${encodeURIComponent(clean)}`;
  }

  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }

  const cleanPath = clean.startsWith('/') ? clean : `/${clean}`;
  return `${serverBase}${cleanPath}`;
}

function getFallbackImageUrl(productName = '') {
  const lower = (productName || '').toLowerCase();
  if (lower.includes('saree') || lower.includes('women') || lower.includes('silk') || lower.includes('lehenga') || lower.includes('dress')) {
    return 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80';
  }
  if (lower.includes('men') || lower.includes('kurta') || lower.includes('shirt') || lower.includes('suit') || lower.includes('pant')) {
    return 'https://images.unsplash.com/photo-1597983073493-88cd35cf03b0?w=800&auto=format&fit=crop&q=80';
  }
  if (lower.includes('jewel') || lower.includes('gold') || lower.includes('necklace') || lower.includes('ring') || lower.includes('earring')) {
    return 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80';
  }
  if (lower.includes('kid') || lower.includes('child') || lower.includes('baby') || lower.includes('boy') || lower.includes('girl')) {
    return 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80';
}

/**
 * Base Email Layout Wrapper (Luxury Dark / Gold Design)
 */
function wrapTemplate({
  headline,
  description,
  bannerImage,
  products = [],
  buttonText,
  buttonUrl,
  unsubscribeUrl,
  storeName = 'StyleVerse',
  storeTagline = 'Enterprise Luxury Clothing & Jewellery Platform',
  primaryColor = '#D4AF37',
  clientUrl = 'https://styleverse.vercel.app'
}) {
  const goldAccent = primaryColor || '#D4AF37';
  const darkBg = '#0D0D0D';

  const productGridHtml = products.length > 0 ? `
    <div style="margin-top: 24px;">
      ${products.map((p) => {
        const primaryImg = (p.images && p.images.length > 0)
          ? (p.images.find(img => typeof img === 'object' && img.isPrimary) || p.images[0])
          : null;
        const rawImg = primaryImg
          ? (typeof primaryImg === 'object' ? primaryImg.url : primaryImg)
          : (p.image || p.imageUrl || p.coverImage || '');
        const prodImg = formatEmailImageUrl(rawImg, p.name, primaryImg?.id, p.id);
        const pSlug = p.slug || p.id;
        const pUrl = `${clientUrl}/product/${pSlug}`;

        return `
          <div style="background-color: #181818; border: 1px solid rgba(212,175,55,0.35); border-radius: 14px; padding: 18px; margin-bottom: 20px; text-align: center;">
            <a href="${pUrl}" target="_blank" style="text-decoration: none; display: block;">
              <img src="${prodImg}" alt="${p.name}" style="width: 100%; max-width: 500px; height: 260px; object-fit: cover; border-radius: 10px; margin: 0 auto 14px auto; display: block; border: 1px solid rgba(255,255,255,0.12);" />
            </a>
            <h3 style="color: #ffffff; font-size: 18px; font-weight: 800; margin: 8px 0 6px 0; font-family: sans-serif;">
              <a href="${pUrl}" target="_blank" style="color: #ffffff; text-decoration: none;">${p.name}</a>
            </h3>
            ${p.shortDesc ? `<p style="color: #aaaaaa; font-size: 13px; margin: 4px 0 12px 0; line-height: 1.4;">${p.shortDesc}</p>` : ''}
            <div style="margin: 10px 0 16px 0;">
              <span style="color: ${goldAccent}; font-weight: 900; font-size: 20px;">₹${(p.discountPrice || p.price || 0).toLocaleString('en-IN')}</span>
              ${(p.price && p.discountPrice && p.price > p.discountPrice) ? `
                <span style="color: #777777; text-decoration: line-through; font-size: 14px; margin-left: 10px;">₹${p.price.toLocaleString('en-IN')}</span>
              ` : ''}
            </div>
            <div>
              <a href="${pUrl}" target="_blank" style="background: linear-gradient(135deg, ${goldAccent} 0%, #B89327 100%); color: #000000; font-weight: 800; font-size: 13px; padding: 10px 24px; border-radius: 8px; text-decoration: none; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(212,175,55,0.3);">
                View Product Details →
              </a>
            </div>
          </div>
        `;
      }).join('')}
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
                  <a href="${clientUrl}" target="_blank" style="text-decoration: none;">
                    <span style="font-size: 26px; font-weight: 900; letter-spacing: 3px; color: ${goldAccent}; text-transform: uppercase; display: block;">${storeName}</span>
                    <p style="font-size: 10px; color: #999999; margin: 4px 0 0 0; letter-spacing: 3px; text-transform: uppercase;">${storeTagline}</p>
                  </a>
                </td>
              </tr>

              <!-- HERO BANNER IMAGE -->
              ${bannerImage ? `
                <tr>
                  <td>
                    <a href="${buttonUrl || clientUrl}" target="_blank" style="display: block;">
                      <img src="${bannerImage}" alt="Banner" style="width: 100%; max-height: 280px; object-fit: cover; display: block;" />
                    </a>
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
                    <div style="text-align: center; margin-top: 32px; margin-bottom: 8px;">
                      <a href="${buttonUrl}" target="_blank" style="background: linear-gradient(135deg, ${goldAccent} 0%, #B89327 100%); color: #000000; font-weight: 800; font-size: 14px; padding: 14px 34px; border-radius: 10px; text-decoration: none; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 20px rgba(212,175,55,0.4);">
                        ${buttonText}
                      </a>
                    </div>
                  ` : ''}
                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td align="center" style="padding: 24px 20px; background-color: #000000; border-top: 1px solid rgba(255,255,255,0.08); font-size: 11px; color: #666666;">
                  <p style="margin: 0 0 8px 0; color: #888888;">© ${new Date().getFullYear()} ${storeName}. All rights reserved.</p>
                  <p style="margin: 0;">
                    You received this email from <a href="${clientUrl}" style="color: ${goldAccent}; text-decoration: underline;">${storeName}</a>. 
                    ${unsubscribeUrl ? `<a href="${unsubscribeUrl}" style="color: ${goldAccent}; text-decoration: underline; margin-left: 8px;">Unsubscribe</a>` : `<a href="${clientUrl}" style="color: ${goldAccent}; text-decoration: underline; margin-left: 8px;">Visit Store</a>`}
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
    const { storeName, storeTagline, primaryColor, clientUrl } = await getStoreMetadata();
    const goldAccent = primaryColor || '#D4AF37';

    const description = `
      <p style="margin-bottom: 16px;">Hello <strong>${fullName || 'Valued Customer'}</strong>,</p>
      <p style="margin-bottom: 20px;">Use the following One-Time Password (OTP) to complete your verification at <strong>${storeName}</strong>. This code is valid for <strong>10 minutes</strong>.</p>
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
      storeName,
      storeTagline,
      primaryColor,
      clientUrl,
    });

    return sendEmailViaBrevo({
      to: email,
      subject: `${otp} is your ${storeName} verification code`,
      htmlContent,
      senderName: storeName,
    });
  }

  // ==================== 2. WELCOME EMAIL ====================
  async sendWelcomeEmail(email, fullName) {
    const { storeName, storeTagline, primaryColor, clientUrl } = await getStoreMetadata();

    const description = `
      <p style="margin-bottom: 16px;">Welcome to <strong>${storeName}</strong>, <strong>${fullName}</strong>! 🎉</p>
      <p style="margin-bottom: 20px;">We are thrilled to have you as part of our exclusive community. Explore our latest luxury collections, handcrafted by master artisans.</p>
    `;

    const htmlContent = wrapTemplate({
      headline: `✨ Welcome to ${storeName}`,
      description,
      buttonText: 'Explore Exclusive Collections →',
      buttonUrl: `${clientUrl}/categories`,
      storeName,
      storeTagline,
      primaryColor,
      clientUrl,
    });

    return sendEmailViaBrevo({
      to: email,
      subject: `Welcome to ${storeName} — Discover Handcrafted Luxury`,
      htmlContent,
      senderName: storeName,
    });
  }

  // ==================== 3. FORGOT PASSWORD OTP ====================
  async sendPasswordResetEmail(email, fullName, otp) {
    const { storeName, storeTagline, primaryColor, clientUrl } = await getStoreMetadata();
    const goldAccent = primaryColor || '#D4AF37';

    const description = `
      <p style="margin-bottom: 16px;">Hello <strong>${fullName || 'User'}</strong>,</p>
      <p style="margin-bottom: 20px;">We received a request to reset your password at <strong>${storeName}</strong>. Use the OTP code below to reset your account password. This code will expire in <strong>10 minutes</strong>.</p>
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
      storeName,
      storeTagline,
      primaryColor,
      clientUrl,
    });

    return sendEmailViaBrevo({
      to: email,
      subject: `${otp} is your password reset code - ${storeName}`,
      htmlContent,
      senderName: storeName,
    });
  }

  // ==================== 4. PASSWORD CHANGED NOTICE ====================
  async sendPasswordChangedEmail(email, fullName) {
    const { storeName, storeTagline, primaryColor, clientUrl } = await getStoreMetadata();

    const description = `
      <p style="margin-bottom: 16px;">Hello <strong>${fullName}</strong>,</p>
      <p style="margin-bottom: 16px;">Your <strong>${storeName}</strong> account password was updated successfully. If you made this change, no further action is required.</p>
      <p style="color: #ff6b6b; font-size: 12px;">If you did NOT change your password, please contact support immediately.</p>
    `;

    const htmlContent = wrapTemplate({
      headline: '🛡️ Account Password Updated',
      description,
      storeName,
      storeTagline,
      primaryColor,
      clientUrl,
    });

    return sendEmailViaBrevo({
      to: email,
      subject: `Security Alert: Your password was updated - ${storeName}`,
      htmlContent,
      senderName: storeName,
    });
  }

  // ==================== 5. ORDER PLACED (SENT TO ADMIN FOR APPROVAL) ====================
  // ==================== 5. ORDER PLACED EMAIL (BEFORE ADMIN CONFIRMATION) ====================
  async sendOrderPlacedEmail(email, fullName, orderData) {
    const { storeName, storeTagline, primaryColor, clientUrl } = await getStoreMetadata();
    const goldAccent = primaryColor || '#D4AF37';

    const itemsListHtml = (orderData.items || []).map((item) => {
      const prodImg = formatEmailImageUrl(item.image || item.imageUrl, item.name, item.imgId, item.productId);
      const pSlug = item.slug || item.productId || item.id;
      const pUrl = `${clientUrl}/product/${pSlug}`;

      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
          <td style="padding: 12px; width: 70px;">
            <a href="${pUrl}" target="_blank">
              <img src="${prodImg}" alt="${item.name || 'Product'}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(212,175,55,0.3); display: block;" />
            </a>
          </td>
          <td style="padding: 12px; color: #FFFFFF; font-size: 13px; font-weight: 600;">
            <a href="${pUrl}" target="_blank" style="color: #FFFFFF; text-decoration: none; font-weight: 700;">
              ${item.name || 'Product Item'}
            </a>
            ${(item.size || item.color) ? `
              <div style="font-size: 11px; color: #AAAAAA; margin-top: 4px;">
                ${item.color ? `Color: ${item.color}` : ''} ${item.size ? `| Size: ${item.size}` : ''}
              </div>
            ` : ''}
          </td>
          <td style="padding: 12px; color: #DDDDDD; font-size: 13px; text-align: center;">
            x${item.quantity || 1}
          </td>
          <td style="padding: 12px; color: ${goldAccent}; font-size: 14px; font-weight: 800; text-align: right;">
            ₹${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
          </td>
        </tr>
      `;
    }).join('');

    const isPaid = orderData.paymentStatus === 'PAID' || orderData.paymentTxnId;

    const description = `
      <p style="margin-bottom: 12px; font-size: 15px; color: #FFFFFF;">Thank you for your order, <strong>${fullName}</strong>!</p>
      <p style="margin-bottom: 16px; color: #CCCCCC; font-size: 13px;">We have received your order <strong>#${orderData.orderNumber}</strong> at <strong>${storeName}</strong>.</p>
      
      <!-- BEFORE CONFIRMATION STATUS BADGE -->
      <div style="background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.35); padding: 14px 18px; border-radius: 10px; margin-bottom: 20px; font-size: 13px; color: ${goldAccent};">
        ⏳ <strong>Order Status (Before Confirmation):</strong> Order Received & Pending Store Approval. You will receive an official confirmation notice once approved by administration.
      </div>

      <!-- PAYMENT & ORDER SUMMARY BOX -->
      <div style="background: #161616; padding: 18px; border-radius: 12px; margin-bottom: 24px; border: 1px solid rgba(212,175,55,0.25);">
        <h4 style="color: ${goldAccent}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">💳 Payment & Order Details</h4>
        <p style="margin: 4px 0; font-size: 13px; color: #FFFFFF;"><strong>Order Number:</strong> #${orderData.orderNumber}</p>
        <p style="margin: 4px 0; font-size: 13px; color: ${goldAccent};"><strong>Total Amount:</strong> ₹${(orderData.total || 0).toLocaleString('en-IN')}</p>
        <p style="margin: 4px 0; font-size: 13px; color: #CCCCCC;"><strong>Payment Method:</strong> ${orderData.paymentMethod || 'Online Payment'}</p>
        <p style="margin: 4px 0; font-size: 13px; color: ${isPaid ? '#10B981' : '#F59E0B'};"><strong>Payment Status:</strong> ${isPaid ? '✅ PAID & CONFIRMED' : '⏳ PENDING'}</p>
        ${orderData.paymentTxnId ? `<p style="margin: 4px 0; font-size: 13px; color: #CCCCCC;"><strong>Transaction ID:</strong> ${orderData.paymentTxnId}</p>` : ''}
        <p style="margin: 4px 0; font-size: 13px; color: #CCCCCC;"><strong>Estimated Delivery:</strong> ${orderData.estimatedDelivery || '3-5 Business Days'}</p>
        ${orderData.shippingAddress ? `<p style="margin: 4px 0; font-size: 13px; color: #CCCCCC;"><strong>Delivery Address:</strong> ${orderData.shippingAddress}</p>` : ''}
      </div>

      <!-- ORDERED ITEMS TABLE -->
      <h3 style="color: #FFFFFF; font-size: 14px; font-weight: 700; margin-bottom: 12px;">Order Items Breakdown:</h3>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; background: #121212; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
        <thead>
          <tr style="background: #1F1F1F; color: ${goldAccent}; font-size: 11px; text-transform: uppercase;">
            <th style="padding: 10px 12px; text-align: left;">Product</th>
            <th style="padding: 10px 12px; text-align: left;">Details</th>
            <th style="padding: 10px 12px; text-align: center;">Qty</th>
            <th style="padding: 10px 12px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsListHtml}
        </tbody>
      </table>
    `;

    const htmlContent = wrapTemplate({
      headline: `💳 Payment & Order Details — #${orderData.orderNumber}`,
      description,
      buttonText: 'View Order Status →',
      buttonUrl: `${clientUrl}/orders`,
      storeName,
      storeTagline,
      primaryColor,
      clientUrl,
    });

    return sendEmailViaBrevo({
      to: email,
      subject: `Order & Payment Details #${orderData.orderNumber} - ${storeName}`,
      htmlContent,
      senderName: storeName,
    });
  }

  // ==================== 5B. ORDER APPROVED & CONFIRMED EMAIL (AFTER ADMIN CONFIRMATION) ====================
  async sendOrderApprovedEmail(email, fullName, orderData) {
    const { storeName, storeTagline, primaryColor, clientUrl } = await getStoreMetadata();
    const goldAccent = primaryColor || '#D4AF37';

    const itemsListHtml = (orderData.items || []).map((item) => {
      const prodImg = formatEmailImageUrl(item.image || item.imageUrl, item.name, item.imgId, item.productId);
      const pSlug = item.slug || item.productId || item.id;
      const pUrl = `${clientUrl}/product/${pSlug}`;

      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
          <td style="padding: 12px; width: 70px;">
            <a href="${pUrl}" target="_blank">
              <img src="${prodImg}" alt="${item.name || 'Product'}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(212,175,55,0.3); display: block;" />
            </a>
          </td>
          <td style="padding: 12px; color: #FFFFFF; font-size: 13px; font-weight: 600;">
            <a href="${pUrl}" target="_blank" style="color: #FFFFFF; text-decoration: none; font-weight: 700;">
              ${item.name || 'Product Item'}
            </a>
            ${(item.size || item.color) ? `
              <div style="font-size: 11px; color: #AAAAAA; margin-top: 4px;">
                ${item.color ? `Color: ${item.color}` : ''} ${item.size ? `| Size: ${item.size}` : ''}
              </div>
            ` : ''}
          </td>
          <td style="padding: 12px; color: #DDDDDD; font-size: 13px; text-align: center;">
            x${item.quantity || 1}
          </td>
          <td style="padding: 12px; color: ${goldAccent}; font-size: 14px; font-weight: 800; text-align: right;">
            ₹${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
          </td>
        </tr>
      `;
    }).join('');

    const description = `
      <p style="margin-bottom: 12px; font-size: 15px; color: #FFFFFF;">Great news, <strong>${fullName}</strong>!</p>
      <p style="margin-bottom: 16px; color: #CCCCCC; font-size: 13px;">Your order <strong>#${orderData.orderNumber}</strong> has been <strong>officially confirmed and approved</strong> by our team at <strong>${storeName}</strong>. Your items are now being prepared for shipping.</p>
      
      <!-- AFTER CONFIRMATION STATUS BADGE -->
      <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.35); padding: 14px 18px; border-radius: 10px; margin-bottom: 20px; font-size: 13px; color: #10B981;">
        ✅ <strong>Order Status (After Confirmation):</strong> Confirmed & Approved! Expected Delivery: <strong>${orderData.estimatedDelivery || '3-5 Business Days'}</strong>.
      </div>

      <!-- ORDER SUMMARY BOX -->
      <div style="background: #161616; padding: 18px; border-radius: 12px; margin-bottom: 24px; border: 1px solid rgba(212,175,55,0.25);">
        <p style="margin: 4px 0; font-size: 13px; color: #FFFFFF;"><strong>Order Number:</strong> #${orderData.orderNumber}</p>
        <p style="margin: 4px 0; font-size: 13px; color: ${goldAccent};"><strong>Total Amount:</strong> ₹${(orderData.total || 0).toLocaleString('en-IN')}</p>
        <p style="margin: 4px 0; font-size: 13px; color: #CCCCCC;"><strong>Payment Method:</strong> ${orderData.paymentMethod || 'Online Payment'}</p>
        <p style="margin: 4px 0; font-size: 13px; color: #CCCCCC;"><strong>Expected Delivery:</strong> ${orderData.estimatedDelivery || '3-5 Business Days'}</p>
        ${orderData.deliveryNotes ? `<p style="margin: 4px 0; font-size: 13px; color: #CCCCCC;"><strong>Delivery Notes:</strong> ${orderData.deliveryNotes}</p>` : ''}
        ${orderData.shippingAddress ? `<p style="margin: 4px 0; font-size: 13px; color: #CCCCCC;"><strong>Delivery Address:</strong> ${orderData.shippingAddress}</p>` : ''}
      </div>

      <!-- ORDERED ITEMS TABLE -->
      <h3 style="color: #FFFFFF; font-size: 14px; font-weight: 700; margin-bottom: 12px;">Confirmed Items Breakdown:</h3>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; background: #121212; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
        <thead>
          <tr style="background: #1F1F1F; color: ${goldAccent}; font-size: 11px; text-transform: uppercase;">
            <th style="padding: 10px 12px; text-align: left;">Product</th>
            <th style="padding: 10px 12px; text-align: left;">Details</th>
            <th style="padding: 10px 12px; text-align: center;">Qty</th>
            <th style="padding: 10px 12px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsListHtml}
        </tbody>
      </table>
    `;

    const htmlContent = wrapTemplate({
      headline: `✅ Order Confirmed — #${orderData.orderNumber}`,
      description,
      buttonText: 'Track Order Details →',
      buttonUrl: `${clientUrl}/orders`,
      storeName,
      storeTagline,
      primaryColor,
      clientUrl,
    });

    return sendEmailViaBrevo({
      to: email,
      subject: `✅ Order Confirmed #${orderData.orderNumber} - ${storeName}`,
      htmlContent,
      senderName: storeName,
    });
  }

  // ==================== SUPER ADMIN NEW ORDER ALERT EMAIL ====================
  async sendAdminOrderAlertEmail(adminEmail, orderData) {
    const { storeName, storeTagline, primaryColor, clientUrl } = await getStoreMetadata();
    const goldAccent = primaryColor || '#D4AF37';

    const itemsListHtml = (orderData.items || []).map((item) => {
      const prodImg = formatEmailImageUrl(item.image || item.imageUrl, item.name, item.imgId, item.productId);
      const pSlug = item.slug || item.productId || item.id;
      const pUrl = `${clientUrl}/product/${pSlug}`;

      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
          <td style="padding: 12px; width: 70px;">
            <a href="${pUrl}" target="_blank">
              <img src="${prodImg}" alt="${item.name || 'Product'}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(212,175,55,0.3); display: block;" />
            </a>
          </td>
          <td style="padding: 12px; color: #FFFFFF; font-size: 13px; font-weight: 600;">
            <a href="${pUrl}" target="_blank" style="color: #FFFFFF; text-decoration: none; font-weight: 700;">
              ${item.name || 'Product Item'}
            </a>
            ${(item.size || item.color) ? `
              <div style="font-size: 11px; color: #AAAAAA; margin-top: 4px;">
                ${item.color ? `Color: ${item.color}` : ''} ${item.size ? `| Size: ${item.size}` : ''}
              </div>
            ` : ''}
          </td>
          <td style="padding: 12px; color: #DDDDDD; font-size: 13px; text-align: center;">
            x${item.quantity || 1}
          </td>
          <td style="padding: 12px; color: ${goldAccent}; font-size: 14px; font-weight: 800; text-align: right;">
            ₹${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
          </td>
        </tr>
      `;
    }).join('');

    const description = `
      <p style="margin-bottom: 12px; font-size: 15px; color: #FFFFFF;">🚨 <strong>New Customer Order Received!</strong></p>
      <p style="margin-bottom: 20px; color: #CCCCCC; font-size: 13px;">Order <strong>#${orderData.orderNumber}</strong> was placed on <strong>${storeName}</strong>.</p>
      
      <!-- CUSTOMER DETAILS BOX -->
      <div style="background: #161616; padding: 18px; border-radius: 12px; margin-bottom: 24px; border: 1px solid rgba(212,175,55,0.25);">
        <h4 style="color: ${goldAccent}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">👤 Customer Details</h4>
        <p style="margin: 4px 0; font-size: 13px; color: #FFFFFF;"><strong>Name:</strong> ${orderData.customerName || 'Customer'}</p>
        <p style="margin: 4px 0; font-size: 13px; color: #CCCCCC;"><strong>Email:</strong> ${orderData.customerEmail || 'N/A'}</p>
        <p style="margin: 4px 0; font-size: 13px; color: #CCCCCC;"><strong>Phone:</strong> ${orderData.customerPhone || 'N/A'}</p>
        <p style="margin: 4px 0; font-size: 13px; color: #CCCCCC;"><strong>Payment Method:</strong> ${orderData.paymentMethod || 'COD'}</p>
        <p style="margin: 4px 0; font-size: 13px; color: #CCCCCC;"><strong>Shipping Address:</strong> ${orderData.shippingAddress || 'N/A'}</p>
      </div>

      <!-- ORDERED ITEMS TABLE -->
      <h3 style="color: #FFFFFF; font-size: 14px; font-weight: 700; margin-bottom: 12px;">Ordered Products:</h3>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; background: #121212; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
        <thead>
          <tr style="background: #1F1F1F; color: ${goldAccent}; font-size: 11px; text-transform: uppercase;">
            <th style="padding: 10px 12px; text-align: left;">Product</th>
            <th style="padding: 10px 12px; text-align: left;">Details</th>
            <th style="padding: 10px 12px; text-align: center;">Qty</th>
            <th style="padding: 10px 12px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsListHtml}
        </tbody>
      </table>

      <!-- GRAND TOTAL SUMMARY -->
      <div style="text-align: right; margin-bottom: 20px; font-size: 15px; color: #FFFFFF;">
        <span style="font-size: 16px; font-weight: 800; color: ${goldAccent};">Grand Total: ₹${(orderData.total || 0).toLocaleString('en-IN')}</span>
      </div>
    `;

    const htmlContent = wrapTemplate({
      headline: `🚨 NEW ORDER ALERT — #${orderData.orderNumber}`,
      description,
      buttonText: 'Manage Order in Admin Panel →',
      buttonUrl: `${clientUrl}/admin/orders`,
      storeName,
      storeTagline,
      primaryColor,
      clientUrl,
    });

    return sendEmailViaBrevo({
      to: adminEmail,
      subject: `🚨 NEW ORDER #${orderData.orderNumber} - ₹${(orderData.total || 0).toLocaleString('en-IN')} (${orderData.customerName})`,
      htmlContent,
      senderName: storeName,
    });
  }

  // ==================== 6. ORDER SHIPPED EMAIL ====================
  async sendOrderShippedEmail(email, fullName, orderData) {
    const { storeName, storeTagline, primaryColor, clientUrl } = await getStoreMetadata();

    const description = `
      <p style="margin-bottom: 12px;">Great news, <strong>${fullName}</strong>!</p>
      <p style="margin-bottom: 20px;">Your order <strong>#${orderData.orderNumber}</strong> from <strong>${storeName}</strong> has been shipped and is on its way to you.</p>
      <div style="background: #181818; padding: 16px; border-radius: 10px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.1);">
        <p style="margin: 4px 0; font-size: 13px; color: #fff;"><strong>Courier:</strong> ${orderData.courierName || 'Standard Logistics'}</p>
        <p style="margin: 4px 0; font-size: 13px; color: ${primaryColor || '#D4AF37'};"><strong>Tracking Number:</strong> ${orderData.trackingNumber || 'Will be updated'}</p>
      </div>
    `;

    const htmlContent = wrapTemplate({
      headline: `🚚 Your Order Has Shipped! (#${orderData.orderNumber})`,
      description,
      products: orderData.items || [],
      buttonText: 'Track Order →',
      buttonUrl: orderData.trackingUrl || `${clientUrl}/orders`,
      storeName,
      storeTagline,
      primaryColor,
      clientUrl,
    });

    return sendEmailViaBrevo({
      to: email,
      subject: `Your order #${orderData.orderNumber} is on the way! - ${storeName}`,
      htmlContent,
      senderName: storeName,
    });
  }

  // ==================== 7. ORDER DELIVERED EMAIL ====================
  async sendOrderDeliveredEmail(email, fullName, orderData) {
    const { storeName, storeTagline, primaryColor, clientUrl } = await getStoreMetadata();

    const description = `
      <p style="margin-bottom: 12px;">Hello <strong>${fullName}</strong>,</p>
      <p style="margin-bottom: 20px;">Your order <strong>#${orderData.orderNumber}</strong> from <strong>${storeName}</strong> has been successfully delivered! We hope you love your new purchase.</p>
    `;

    const htmlContent = wrapTemplate({
      headline: `🎁 Order Delivered! (#${orderData.orderNumber})`,
      description,
      products: orderData.items || [],
      buttonText: 'Leave a Product Review →',
      buttonUrl: `${clientUrl}/orders`,
      storeName,
      storeTagline,
      primaryColor,
      clientUrl,
    });

    return sendEmailViaBrevo({
      to: email,
      subject: `Order Delivered #${orderData.orderNumber} - ${storeName}`,
      htmlContent,
      senderName: storeName,
    });
  }

  // ==================== 8. ORDER CANCELLED & REFUND EMAIL ====================
  async sendOrderCancelledEmail(email, fullName, orderData) {
    const { storeName, storeTagline, primaryColor, clientUrl } = await getStoreMetadata();

    const description = `
      <p style="margin-bottom: 12px; font-size: 15px;">Dear <strong>${fullName || 'Valued Customer'}</strong>,</p>
      <p style="margin-bottom: 16px; line-height: 1.6;">We are writing to inform you that your order <strong>#${orderData.orderNumber}</strong> at <strong>${storeName}</strong> has been cancelled.</p>
      
      ${orderData.reason ? `
      <div style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; padding: 14px 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 4px 0; font-weight: bold; color: #ef4444; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Reason & Store Apology Note:</p>
        <p style="margin: 0; color: #ffffff; font-size: 14px; font-style: italic; line-height: 1.5;">"${orderData.reason}"</p>
      </div>
      ` : ''}

      <!-- STRICT 10-MINUTE REFUND NOTICE -->
      <div style="background: rgba(239, 68, 68, 0.12); border: 2px solid #ef4444; padding: 16px 20px; border-radius: 12px; margin: 18px 0; box-shadow: 0 4px 15px rgba(239,68,68,0.2);">
        <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 800; color: #ef4444; text-transform: uppercase; letter-spacing: 0.5px;">
          💳 REFUND NOTIFICATION:
        </p>
        <p style="margin: 0; font-size: 15px; color: #ffffff; font-weight: 800; line-height: 1.5;">
          Order Canceled. Your amount will be returned within 10 minutes strictly.
        </p>
        <p style="margin: 6px 0 0 0; font-size: 12px; color: #fca5a5;">
          Total refund amount of ₹${(orderData.total || 0).toLocaleString('en-IN')} has been queued to your original payment account.
        </p>
      </div>

      <p style="margin-top: 16px; font-size: 13px; color: #9ca3af; line-height: 1.5;">We deeply regret any inconvenience caused. If you have questions regarding your refund, our support team is available 24/7.</p>
    `;

    const htmlContent = wrapTemplate({
      headline: `❌ Order Cancelled (#${orderData.orderNumber})`,
      description,
      products: orderData.items || [],
      buttonText: 'View My Orders →',
      buttonUrl: `${clientUrl}/orders`,
      storeName,
      storeTagline,
      primaryColor,
      clientUrl,
    });

    return sendEmailViaBrevo({
      to: email,
      subject: `Order Cancellation & Refund Alert #${orderData.orderNumber} - ${storeName}`,
      htmlContent,
      senderName: storeName,
    });
  }

  // ==================== 9. NEW PRODUCT BROADCAST NOTIFICATION ====================
  /**
   * Broadcast email & in-app notification to all customers when a new product is published.
   */
  async sendNewProductNotificationToCustomers(product) {
    if (!product || !product.id) return;
    const { storeName, storeTagline, primaryColor, clientUrl } = await getStoreMetadata();

    console.log(`[NEW PRODUCT BROADCAST] Initiating broadcast for product: "${product.name}" (${product.id}) on ${storeName}`);

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
      const productSlug = product.slug || product.id;
      const productUrl = `${clientUrl}/product/${productSlug}`;

      const headline = `✨ Just Dropped: ${product.name}`;
      const description = `
        <p style="margin-bottom: 12px;">Exciting news! A brand new luxury addition has just arrived at <strong>${storeName}</strong>.</p>
        <p style="margin-bottom: 20px; font-size: 15px; color: #ffffff;">Be among the first to explore <strong>${product.name}</strong>${product.category?.name ? ' in ' + product.category.name : ''}.</p>
      `;

      const htmlContent = wrapTemplate({
        headline,
        description,
        products: [product],
        buttonText: `Explore ${product.name} Now →`,
        buttonUrl: productUrl,
        storeName,
        storeTagline,
        primaryColor,
        clientUrl,
      });

      // 1. Create In-App Notifications for all customers in PostgreSQL
      const inAppRecords = customers.map(c => ({
        userId: c.id,
        title: `✨ New Arrival: ${product.name}`,
        message: `Check out our newly published item "${product.name}" for ₹${(product.discountPrice || product.price || 0).toLocaleString('en-IN')}!`,
        type: 'NEW_PRODUCT',
        link: `/product/${productSlug}`,
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
                subject: `✨ New Arrival Alert: ${product.name} - ${storeName}`,
                htmlContent,
                senderName: storeName,
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
    const { storeName, storeTagline, primaryColor, clientUrl } = await getStoreMetadata();
    const htmlContent = wrapTemplate({
      headline,
      description,
      bannerImage,
      products,
      buttonText,
      buttonUrl,
      storeName,
      storeTagline,
      primaryColor,
      clientUrl,
    });

    let count = 0;
    for (const email of recipients) {
      try {
        await sendEmailViaBrevo({ to: email, subject, htmlContent, senderName: storeName });
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

  // ==================== 11. BACK IN STOCK NOTIFICATION ====================
  async sendBackInStockEmail(email, product) {
    const { storeName, storeTagline, primaryColor, clientUrl } = await getStoreMetadata();
    const productSlug = product.slug || product.id;
    const productUrl = `${clientUrl}/product/${productSlug}`;
    const productImg = product.images?.[0]?.url || '';

    const description = `
      <p style="margin-bottom: 12px; font-size: 15px; color: #FFFFFF;">Great news! An item you wanted is <strong style="color: ${primaryColor || '#D4AF37'};">back in stock</strong>!</p>
      <div style="background: #161616; border-radius: 12px; padding: 18px; margin-bottom: 20px; border: 1px solid rgba(212,175,55,0.25);">
        ${productImg ? `<img src="${formatEmailImageUrl(productImg, product.name)}" alt="${product.name}" style="width: 100%; max-width: 300px; border-radius: 10px; margin-bottom: 12px; display: block;" />` : ''}
        <h3 style="color: #FFFFFF; font-size: 16px; margin: 0 0 6px 0;">${product.name}</h3>
        <p style="color: ${primaryColor || '#D4AF37'}; font-size: 18px; font-weight: 800; margin: 0;">₹${(product.discountPrice || product.price || 0).toLocaleString('en-IN')}</p>
        <p style="color: #10B981; font-size: 13px; margin-top: 6px;">✅ In Stock — ${product.stock || 0} units available</p>
      </div>
      <p style="color: #AAAAAA; font-size: 12px;">Hurry! Stock is limited and may sell out quickly.</p>
    `;

    const htmlContent = wrapTemplate({
      headline: `🔔 Back in Stock: ${product.name}`,
      description,
      buttonText: `Shop Now →`,
      buttonUrl: productUrl,
      storeName,
      storeTagline,
      primaryColor,
      clientUrl,
    });

    return sendEmailViaBrevo({
      to: email,
      subject: `🔔 Back in Stock: ${product.name} — ${storeName}`,
      htmlContent,
      senderName: storeName,
    });
  }
}

const emailServiceInstance = new EmailService();

// Bind methods for safe destructuring across controllers
module.exports = emailServiceInstance;
module.exports.sendOTPEmail = emailServiceInstance.sendOTPEmail.bind(emailServiceInstance);
module.exports.sendWelcomeEmail = emailServiceInstance.sendWelcomeEmail.bind(emailServiceInstance);
module.exports.sendPasswordResetEmail = emailServiceInstance.sendPasswordResetEmail.bind(emailServiceInstance);
module.exports.sendPasswordChangedEmail = emailServiceInstance.sendPasswordChangedEmail.bind(emailServiceInstance);
module.exports.sendOrderPlacedEmail = emailServiceInstance.sendOrderPlacedEmail.bind(emailServiceInstance);
module.exports.sendOrderApprovedEmail = emailServiceInstance.sendOrderApprovedEmail.bind(emailServiceInstance);
module.exports.sendAdminOrderAlertEmail = emailServiceInstance.sendAdminOrderAlertEmail.bind(emailServiceInstance);
module.exports.sendOrderShippedEmail = emailServiceInstance.sendOrderShippedEmail.bind(emailServiceInstance);
module.exports.sendOrderDeliveredEmail = emailServiceInstance.sendOrderDeliveredEmail.bind(emailServiceInstance);
module.exports.sendOrderCancelledEmail = emailServiceInstance.sendOrderCancelledEmail.bind(emailServiceInstance);
module.exports.sendNewProductNotificationToCustomers = emailServiceInstance.sendNewProductNotificationToCustomers.bind(emailServiceInstance);
module.exports.sendCampaign = emailServiceInstance.sendCampaign.bind(emailServiceInstance);
module.exports.sendBackInStockEmail = emailServiceInstance.sendBackInStockEmail.bind(emailServiceInstance);

