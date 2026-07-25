/**
 * WhatsApp utilities for the frontend.
 * Generates WhatsApp message text and deeplinks.
 */

/**
 * Build a formatted WhatsApp order message.
 * @param {Object} params
 * @param {Object} params.user  - { fullName, phone, whatsappNumber, address }
 * @param {Array}  params.items - [{ name, color, size, quantity, price, image }]
 * @param {string} params.paymentMethod - 'COD' | 'Bank Transfer'
 * @param {string} params.notes
 * @returns {string} URL-encoded WhatsApp message
 */
export const buildWhatsAppOrderMessage = ({ user, items = [], paymentMethod = 'Cash on Delivery', notes = '' }) => {
  const itemLines = items.map((item, i) => {
    const subtotal = (item.price * item.quantity).toLocaleString('en-IN');
    return (
      `${i + 1}. *${item.name}*\n` +
      (item.color ? `   Color: ${item.color}\n` : '') +
      (item.size ? `   Size: ${item.size}\n` : '') +
      `   Qty: ${item.quantity} × ₹${item.price?.toLocaleString('en-IN')} = ₹${subtotal}` +
      (item.image ? `\n   📷 ${item.image}` : '')
    );
  }).join('\n\n');

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal > 999 ? 0 : 99;
  const total = subtotal + shipping;

  const msg =
    `🛍️ *New Order Request*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👤 *Customer Details*\n` +
    `Name: ${user?.fullName || 'Customer'}\n` +
    (user?.phone ? `Phone: ${user.phone}\n` : '') +
    (user?.whatsappNumber ? `WhatsApp: ${user.whatsappNumber}\n` : '') +
    (user?.address ? `Address: ${user.address}\n` : '') +
    `\n━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `📦 *Order Details*\n\n` +
    itemLines +
    `\n\n━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Subtotal: ₹${subtotal.toLocaleString('en-IN')}\n` +
    `Shipping: ${shipping === 0 ? 'FREE 🎁' : '₹' + shipping}\n` +
    `*Grand Total: ₹${total.toLocaleString('en-IN')}*\n` +
    `\n━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `💳 *Payment:* ${paymentMethod}\n` +
    (notes ? `📝 *Notes:* ${notes}\n` : '') +
    `\nPlease confirm my order. Thank you! 🙏`;

  return encodeURIComponent(msg);
};

/**
 * Generate WhatsApp chat link.
 * @param {string} phone - with country code, digits only, e.g. "919876543210"
 * @param {string} encodedMessage - URL-encoded message
 */
export const whatsappLink = (phone, encodedMessage) => {
  const clean = (phone || '').replace(/\D/g, '');
  return `https://wa.me/${clean}${encodedMessage ? '?text=' + encodedMessage : ''}`;
};
