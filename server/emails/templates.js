/**
 * StyleVerse Premium Email Templates
 * All templates use inline CSS for max email client compatibility.
 * Brand: Dark luxury with #D4AF37 gold, white text, crisp typography.
 */

const BRAND = {
  name: 'KVLR Styles',
  tagline: 'Luxury Fashion & Jewellery',
  color: '#D4AF37',
  dark: '#0F0F0F',
  surface: '#1A1A1A',
  card: '#222222',
  text: '#FFFFFF',
  muted: '#A0A0A0',
  site: process.env.CLIENT_URL || 'http://localhost:3000',
  support: process.env.SUPPORT_EMAIL || 'support@kvlrstyles.com',
  address: 'Fashion Street, Hyderabad, India',
  instagram: '#',
  facebook: '#',
  whatsapp: '#',
};

/* ─── Shared wrapper ────────────────────────────────────────── */
const wrap = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${BRAND.name}</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0A;padding:20px 0;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background-color:${BRAND.surface};border-radius:20px;overflow:hidden;border:1px solid #2A2A2A;">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,${BRAND.dark} 0%,#1C1C1C 100%);padding:30px 40px;text-align:center;border-bottom:2px solid ${BRAND.color};">
            <h1 style="margin:0;font-size:28px;font-weight:900;letter-spacing:4px;color:${BRAND.color};font-family:Georgia,serif;">${BRAND.name.toUpperCase()}</h1>
            <p style="margin:6px 0 0;font-size:11px;color:${BRAND.muted};letter-spacing:3px;text-transform:uppercase;">${BRAND.tagline}</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr><td style="padding:40px;">${content}</td></tr>

        <!-- FOOTER -->
        <tr>
          <td style="background-color:#111111;padding:30px 40px;text-align:center;border-top:1px solid #2A2A2A;">
            <p style="margin:0 0 12px;font-size:13px;color:${BRAND.muted};">
              Questions? <a href="mailto:${BRAND.support}" style="color:${BRAND.color};text-decoration:none;">${BRAND.support}</a>
            </p>
            <div style="margin:12px 0;">
              <a href="${BRAND.instagram}" style="display:inline-block;margin:0 6px;width:32px;height:32px;background:#2A2A2A;border-radius:50%;line-height:32px;text-align:center;color:${BRAND.color};text-decoration:none;font-size:14px;">&#9679;</a>
              <a href="${BRAND.facebook}" style="display:inline-block;margin:0 6px;width:32px;height:32px;background:#2A2A2A;border-radius:50%;line-height:32px;text-align:center;color:${BRAND.color};text-decoration:none;font-size:14px;">f</a>
              <a href="${BRAND.whatsapp}" style="display:inline-block;margin:0 6px;width:32px;height:32px;background:#2A2A2A;border-radius:50%;line-height:32px;text-align:center;color:${BRAND.color};text-decoration:none;font-size:14px;">W</a>
            </div>
            <p style="margin:12px 0 0;font-size:11px;color:#555555;line-height:1.6;">
              ${BRAND.address}<br/>
              <a href="${BRAND.site}/privacy" style="color:#555;text-decoration:none;">Privacy Policy</a> &nbsp;|&nbsp;
              <a href="${BRAND.site}/terms" style="color:#555;text-decoration:none;">Terms</a> &nbsp;|&nbsp;
              <a href="${BRAND.site}/unsubscribe" style="color:#555;text-decoration:none;">Unsubscribe</a><br/>
              &copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

/* ─── Reusable sub-pieces ───────────────────────────────────── */
const btn = (text, url, bg = BRAND.color, fg = '#000000') =>
  `<a href="${url}" style="display:inline-block;background-color:${bg};color:${fg};text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;font-size:14px;letter-spacing:1px;margin:8px 4px;">${text}</a>`;

const heading = (text) =>
  `<h2 style="color:${BRAND.text};font-size:22px;font-weight:700;margin:0 0 8px;">${text}</h2>`;

const para = (text) =>
  `<p style="color:${BRAND.muted};font-size:14px;line-height:1.7;margin:0 0 16px;">${text}</p>`;

const divider = () =>
  `<hr style="border:none;border-top:1px solid #2A2A2A;margin:24px 0;"/>`;

const goldBox = (content) =>
  `<div style="background-color:${BRAND.card};border:1px solid ${BRAND.color};border-radius:12px;padding:24px;margin:20px 0;">${content}</div>`;

const otpBox = (otp) =>
  `<div style="background-color:${BRAND.dark};border:2px dashed ${BRAND.color};border-radius:12px;padding:28px;text-align:center;margin:24px 0;">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:3px;color:${BRAND.muted};text-transform:uppercase;">Your Verification Code</p>
    <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:${BRAND.color};font-family:monospace;">${otp}</div>
    <p style="margin:8px 0 0;font-size:11px;color:#666;">Valid for <strong style="color:#FFF;">5 minutes</strong> &nbsp;·&nbsp; Do not share this code</p>
  </div>`;

const orderRow = (label, value, bold = false) =>
  `<tr>
    <td style="padding:8px 12px;font-size:13px;color:${BRAND.muted};border-bottom:1px solid #2A2A2A;">${label}</td>
    <td style="padding:8px 12px;font-size:13px;color:${bold ? BRAND.color : BRAND.text};font-weight:${bold ? '700' : '400'};text-align:right;border-bottom:1px solid #2A2A2A;">${value}</td>
  </tr>`;

const badge = (text, bg = BRAND.color, fg = '#000') =>
  `<span style="display:inline-block;background:${bg};color:${fg};font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;">${text}</span>`;

/* ══════════════════════════════════════════════════════════════
   1. OTP VERIFICATION EMAIL
══════════════════════════════════════════════════════════════ */
const otpEmail = (fullName, otp) => wrap(`
  ${heading('Verify Your Email')}
  ${para(`Hello <strong style="color:#FFF;">${fullName || 'Valued Customer'}</strong>, welcome to ${BRAND.name}! Please use the code below to verify your email address and activate your account.`)}
  ${otpBox(otp)}
  ${para('This code expires in <strong style="color:#FFF;">5 minutes</strong>. If you did not request this, please ignore this email. Your account remains secure.')}
  ${goldBox(`
    <p style="margin:0;font-size:13px;color:${BRAND.muted};">
      &#9888; <strong style="color:#FFF;">Security Notice:</strong> ${BRAND.name} will never ask for your OTP over phone or chat. Never share this code with anyone.
    </p>
  `)}
`);

/* ══════════════════════════════════════════════════════════════
   2. WELCOME EMAIL
══════════════════════════════════════════════════════════════ */
const welcomeEmail = (fullName, email) => wrap(`
  <div style="text-align:center;margin-bottom:28px;">
    <div style="font-size:52px;margin-bottom:8px;">🎉</div>
    ${heading(`Welcome, ${fullName}!`)}
    ${para('Your account is now active. Explore our handcrafted sarees, kundan jewellery, designer wear, and exclusive collections.')}
  </div>
  ${goldBox(`
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;color:${BRAND.muted};text-transform:uppercase;">Account Details</p>
    <p style="margin:4px 0;font-size:14px;color:${BRAND.text};">&#10003; &nbsp;<strong>Name:</strong> &nbsp;${fullName}</p>
    <p style="margin:4px 0;font-size:14px;color:${BRAND.text};">&#10003; &nbsp;<strong>Email:</strong> &nbsp;${email}</p>
    <p style="margin:4px 0;font-size:14px;color:${BRAND.text};">&#10003; &nbsp;<strong>Member Since:</strong> &nbsp;${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  `)}
  <div style="text-align:center;margin-top:28px;">
    ${btn('Explore Collection', `${BRAND.site}/categories`)}
    ${btn('My Account', `${BRAND.site}/profile`, '#2A2A2A', BRAND.color)}
  </div>
`);

/* ══════════════════════════════════════════════════════════════
   3. FORGOT PASSWORD
══════════════════════════════════════════════════════════════ */
const forgotPasswordEmail = (fullName, otp, ip = 'Unknown') => wrap(`
  ${heading('Password Reset Request')}
  ${para(`Hello <strong style="color:#FFF;">${fullName}</strong>, we received a request to reset your password. Use the code below:`)}
  ${otpBox(otp)}
  ${goldBox(`
    <p style="margin:0 0 8px;font-size:13px;color:${BRAND.muted};">&#9888; Security Alert</p>
    <p style="margin:0;font-size:13px;color:${BRAND.text};">Request IP: <strong>${ip}</strong><br/>Time: <strong>${new Date().toLocaleString('en-IN')}</strong></p>
    <p style="margin:8px 0 0;font-size:12px;color:#FF6B6B;">If you did not request a password reset, your account may be at risk. <a href="mailto:${BRAND.support}" style="color:${BRAND.color};">Contact Support</a> immediately.</p>
  `)}
`);

/* ══════════════════════════════════════════════════════════════
   4. PASSWORD CHANGED
══════════════════════════════════════════════════════════════ */
const passwordChangedEmail = (fullName) => wrap(`
  <div style="text-align:center;margin-bottom:24px;">
    <div style="font-size:44px;">🔐</div>
    ${heading('Password Changed Successfully')}
  </div>
  ${para(`Hello <strong style="color:#FFF;">${fullName}</strong>, your password has been updated successfully.`)}
  ${goldBox(`
    <p style="margin:0 0 8px;font-size:13px;color:${BRAND.muted};">Change Details</p>
    <p style="margin:4px 0;font-size:13px;color:${BRAND.text};">&#10003; &nbsp;Date: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
    <p style="margin:4px 0;font-size:13px;color:${BRAND.text};">&#10003; &nbsp;Time: ${new Date().toLocaleTimeString('en-IN')}</p>
  `)}
  ${para(`If you did not make this change, please <a href="mailto:${BRAND.support}" style="color:${BRAND.color};">contact our support team</a> immediately.`)}
`);

/* ══════════════════════════════════════════════════════════════
   5. ORDER PLACED
══════════════════════════════════════════════════════════════ */
const orderPlacedEmail = (fullName, order) => {
  const items = (order.items || []).map(item => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #2A2A2A;">
        <div style="display:flex;align-items:center;gap:12px;">
          ${item.image ? `<img src="${item.image}" width="56" height="68" style="border-radius:8px;object-fit:cover;" alt="${item.name}" />` : ''}
          <div>
            <p style="margin:0;font-size:14px;color:${BRAND.text};font-weight:600;">${item.name}</p>
            ${item.color ? `<p style="margin:2px 0 0;font-size:12px;color:${BRAND.muted};">Color: ${item.color}</p>` : ''}
            ${item.size ? `<p style="margin:2px 0 0;font-size:12px;color:${BRAND.muted};">Size: ${item.size}</p>` : ''}
            <p style="margin:2px 0 0;font-size:12px;color:${BRAND.muted};">Qty: ${item.quantity}</p>
          </div>
        </div>
      </td>
      <td style="padding:12px;text-align:right;border-bottom:1px solid #2A2A2A;font-size:14px;color:${BRAND.text};font-weight:600;">&#8377;${(item.price * item.quantity).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  return wrap(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:44px;">✅</div>
      ${heading('Order Confirmed!')}
      ${badge('Order #' + order.orderNumber)}
    </div>
    ${para(`Thank you, <strong style="color:#FFF;">${fullName}</strong>! Your order has been received and is being processed.`)}
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.card};border-radius:12px;overflow:hidden;margin:16px 0;">
      <tr style="background:${BRAND.dark};">
        <th style="padding:12px;text-align:left;font-size:12px;color:${BRAND.muted};font-weight:600;letter-spacing:1px;text-transform:uppercase;">Product</th>
        <th style="padding:12px;text-align:right;font-size:12px;color:${BRAND.muted};font-weight:600;letter-spacing:1px;text-transform:uppercase;">Amount</th>
      </tr>
      ${items}
    </table>
    ${goldBox(`
      <table width="100%" cellpadding="0" cellspacing="0">
        ${orderRow('Subtotal', '&#8377;' + (order.subtotal || 0).toLocaleString('en-IN'))}
        ${order.discount ? orderRow('Discount', '- &#8377;' + order.discount.toLocaleString('en-IN')) : ''}
        ${order.shippingCharge ? orderRow('Shipping', '&#8377;' + order.shippingCharge.toLocaleString('en-IN')) : orderRow('Shipping', 'FREE')}
        ${orderRow('Grand Total', '&#8377;' + (order.total || 0).toLocaleString('en-IN'), true)}
      </table>
    `)}
    ${goldBox(`
      <p style="margin:0 0 8px;font-size:13px;color:${BRAND.muted};">Delivery Details</p>
      <p style="margin:0;font-size:13px;color:${BRAND.text};">${order.address || 'As per account address'}</p>
      <p style="margin:8px 0 0;font-size:13px;color:${BRAND.color};font-weight:700;">Estimated Delivery: ${order.estimatedDelivery || '3-5 Business Days'}</p>
    `)}
    <div style="text-align:center;margin-top:24px;">
      ${btn('Track Order', `${BRAND.site}/orders/${order.orderId || ''}`)}
      ${btn('Continue Shopping', `${BRAND.site}/categories`, '#2A2A2A', BRAND.color)}
    </div>
  `);
};

/* ══════════════════════════════════════════════════════════════
   6. ORDER STATUS EMAILS (Shipped / Delivered / Cancelled)
══════════════════════════════════════════════════════════════ */
const orderShippedEmail = (fullName, order) => wrap(`
  <div style="text-align:center;margin-bottom:24px;">
    <div style="font-size:44px;">🚚</div>
    ${heading('Your Order is On the Way!')}
    ${badge('Order #' + order.orderNumber)}
  </div>
  ${para(`Great news, <strong style="color:#FFF;">${fullName}</strong>! Your order has been shipped.`)}
  ${goldBox(`
    ${order.courierName ? `<p style="margin:4px 0;font-size:13px;color:${BRAND.text};">&#128666; &nbsp;<strong>Courier:</strong> &nbsp;${order.courierName}</p>` : ''}
    ${order.trackingNumber ? `<p style="margin:4px 0;font-size:13px;color:${BRAND.text};">&#128204; &nbsp;<strong>Tracking No:</strong> &nbsp;<span style="color:${BRAND.color};font-family:monospace;">${order.trackingNumber}</span></p>` : ''}
    <p style="margin:8px 0 0;font-size:13px;color:${BRAND.color};font-weight:700;">ETA: ${order.estimatedDelivery || '2-3 Business Days'}</p>
  `)}
  <div style="text-align:center;margin-top:24px;">
    ${btn('Track Shipment', order.trackingUrl || `${BRAND.site}/orders`)}
  </div>
`);

const orderDeliveredEmail = (fullName, order) => wrap(`
  <div style="text-align:center;margin-bottom:24px;">
    <div style="font-size:52px;">🎁</div>
    ${heading('Order Delivered!')}
  </div>
  ${para(`Hello <strong style="color:#FFF;">${fullName}</strong>, your order <strong style="color:${BRAND.color};">#${order.orderNumber}</strong> has been delivered successfully. We hope you love it!`)}
  ${divider()}
  ${para('We\'d love to hear what you think. Your review helps others make better choices.')}
  <div style="text-align:center;margin-top:24px;">
    ${btn('Rate Your Purchase', `${BRAND.site}/orders/${order.orderId || ''}`)}
    ${btn('Continue Shopping', `${BRAND.site}/categories`, '#2A2A2A', BRAND.color)}
  </div>
`);

const orderCancelledEmail = (fullName, order) => wrap(`
  <div style="text-align:center;margin-bottom:24px;">
    <div style="font-size:44px;">❌</div>
    ${heading('Order Cancelled')}
    ${badge('Order #' + order.orderNumber, '#FF4444', '#FFF')}
  </div>
  ${para(`Hello <strong style="color:#FFF;">${fullName}</strong>, your order has been cancelled.`)}
  ${goldBox(`
    ${order.reason ? `<p style="margin:4px 0;font-size:13px;color:${BRAND.text};"><strong>Reason:</strong> ${order.reason}</p>` : ''}
    <p style="margin:8px 0 0;font-size:13px;color:${BRAND.muted};">Refund Status: <strong style="color:${BRAND.color};">${order.refundStatus || 'Processing (3-5 business days)'}</strong></p>
  `)}
  ${para(`For any concerns, please <a href="mailto:${BRAND.support}" style="color:${BRAND.color};">contact our support team</a>.`)}
  <div style="text-align:center;margin-top:24px;">
    ${btn('Browse Alternatives', `${BRAND.site}/categories`)}
  </div>
`);

/* ══════════════════════════════════════════════════════════════
   7. OFFER / PROMOTION EMAIL
══════════════════════════════════════════════════════════════ */
const offerEmail = (fullName, offer) => wrap(`
  <div style="text-align:center;background:linear-gradient(135deg,${BRAND.dark},#1C1A0A);border-radius:12px;padding:32px;margin-bottom:24px;">
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;color:${BRAND.muted};text-transform:uppercase;">Limited Time Offer</p>
    <h2 style="margin:0 0 8px;font-size:32px;font-weight:900;color:${BRAND.color};">${offer.discount || '0'}% OFF</h2>
    <p style="margin:0;font-size:18px;font-weight:700;color:${BRAND.text};">${offer.title || 'Special Offer'}</p>
    ${offer.endDate ? `<p style="margin:8px 0 0;font-size:12px;color:${BRAND.muted};">Valid until ${new Date(offer.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>` : ''}
  </div>
  ${para(`Hello <strong style="color:#FFF;">${fullName || 'Valued Customer'}</strong>, ${offer.description || 'We have an exclusive offer just for you!'}`)}
  ${offer.couponCode ? goldBox(`
    <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;color:${BRAND.muted};text-transform:uppercase;">Your Coupon Code</p>
    <div style="font-size:24px;font-weight:900;letter-spacing:6px;color:${BRAND.color};font-family:monospace;">${offer.couponCode}</div>
    <p style="margin:8px 0 0;font-size:12px;color:${BRAND.muted};">Copy the code and apply at checkout</p>
  `) : ''}
  <div style="text-align:center;margin-top:24px;">
    ${btn('Shop Now — Don\'t Miss Out!', offer.shopUrl || `${BRAND.site}/categories`)}
  </div>
`);

/* ══════════════════════════════════════════════════════════════
   8. BACK IN STOCK
══════════════════════════════════════════════════════════════ */
const backInStockEmail = (fullName, product) => wrap(`
  <div style="text-align:center;margin-bottom:24px;">
    <div style="font-size:44px;">🔔</div>
    ${heading('It\'s Back in Stock!')}
  </div>
  ${para(`Good news, <strong style="color:#FFF;">${fullName}</strong>! An item from your watchlist is available again.`)}
  ${goldBox(`
    ${product.image ? `<div style="text-align:center;margin-bottom:16px;"><img src="${product.image}" width="120" style="border-radius:12px;object-fit:cover;" alt="${product.name}" /></div>` : ''}
    <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:${BRAND.text};text-align:center;">${product.name}</p>
    <p style="margin:0;font-size:20px;font-weight:900;color:${BRAND.color};text-align:center;">&#8377;${(product.price || 0).toLocaleString('en-IN')}</p>
  `)}
  <div style="text-align:center;margin-top:24px;">
    ${btn('Buy Now Before It\'s Gone!', product.url || `${BRAND.site}/product/${product.slug}`)}
  </div>
`);

/* ══════════════════════════════════════════════════════════════
   9. ABANDONED CART REMINDER
══════════════════════════════════════════════════════════════ */
const abandonedCartEmail = (fullName, cartItems, discount) => {
  const itemsHtml = (cartItems || []).slice(0, 3).map(item => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #2A2A2A;">
        ${item.image ? `<img src="${item.image}" width="48" height="56" style="border-radius:8px;object-fit:cover;vertical-align:middle;" />` : ''}
        &nbsp;
        <span style="font-size:13px;color:${BRAND.text};vertical-align:middle;">${item.name}</span>
      </td>
      <td style="padding:10px;text-align:right;border-bottom:1px solid #2A2A2A;font-size:13px;color:${BRAND.color};font-weight:700;">&#8377;${(item.price || 0).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  return wrap(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:44px;">🛒</div>
      ${heading('You Left Something Behind!')}
    </div>
    ${para(`Hey <strong style="color:#FFF;">${fullName}</strong>, you have items waiting in your cart. Complete your purchase before they sell out!`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.card};border-radius:12px;overflow:hidden;margin:16px 0;">
      ${itemsHtml}
    </table>
    ${discount ? goldBox(`
      <p style="margin:0 0 6px;font-size:12px;color:${BRAND.muted};text-align:center;">EXCLUSIVE COMEBACK OFFER</p>
      <p style="margin:0;font-size:22px;font-weight:900;color:${BRAND.color};text-align:center;">Extra ${discount}% OFF Your Cart</p>
    `) : ''}
    <div style="text-align:center;margin-top:24px;">
      ${btn('Complete My Order', `${BRAND.site}/cart`)}
    </div>
  `);
};

/* ══════════════════════════════════════════════════════════════
   10. NEW ARRIVALS
══════════════════════════════════════════════════════════════ */
const newArrivalsEmail = (fullName, products) => {
  const productsHtml = (products || []).slice(0, 3).map(p => `
    <td style="padding:8px;text-align:center;vertical-align:top;width:33%;">
      ${p.image ? `<img src="${p.image}" width="140" style="border-radius:12px;object-fit:cover;height:170px;" alt="${p.name}" />` : ''}
      <p style="margin:8px 0 4px;font-size:13px;color:${BRAND.text};font-weight:600;">${p.name}</p>
      <p style="margin:0;font-size:14px;color:${BRAND.color};font-weight:700;">&#8377;${(p.price || 0).toLocaleString('en-IN')}</p>
    </td>
  `).join('');

  return wrap(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:44px;">✨</div>
      ${heading('New Arrivals Just for You')}
    </div>
    ${para(`Hello <strong style="color:#FFF;">${fullName || 'Valued Customer'}</strong>, our latest collection just dropped. Explore fresh styles before they sell out!`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;"><tr>${productsHtml}</tr></table>
    <div style="text-align:center;margin-top:24px;">
      ${btn('View Full Collection', `${BRAND.site}/categories`)}
    </div>
  `);
};

/* ══════════════════════════════════════════════════════════════
   11. NEWSLETTER
══════════════════════════════════════════════════════════════ */
const newsletterEmail = (fullName, subject, bodyHtml) => wrap(`
  ${heading(subject)}
  ${para(`Hello <strong style="color:#FFF;">${fullName || 'Valued Customer'}</strong>,`)}
  ${divider()}
  <div style="color:${BRAND.muted};font-size:14px;line-height:1.8;">${bodyHtml}</div>
  ${divider()}
  <div style="text-align:center;margin-top:24px;">
    ${btn('Visit Our Store', `${BRAND.site}/categories`)}
  </div>
`);

/* ══════════════════════════════════════════════════════════════
   EXPORTS
══════════════════════════════════════════════════════════════ */
module.exports = {
  otpEmail,
  welcomeEmail,
  forgotPasswordEmail,
  passwordChangedEmail,
  orderPlacedEmail,
  orderShippedEmail,
  orderDeliveredEmail,
  orderCancelledEmail,
  offerEmail,
  backInStockEmail,
  abandonedCartEmail,
  newArrivalsEmail,
  newsletterEmail,
};
