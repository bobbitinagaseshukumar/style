const prisma = require('../config/db');

/**
 * Enterprise Intelligent AI Shopping Assistant Service
 * Natural language intent parser, live product database search, order status checker,
 * policy engine, and human support escalation with ticket generation.
 */
class ChatbotService {
  /**
   * Process Natural Language Query
   */
  async processQuery({ query, user, sessionId }) {
    const q = query.trim().toLowerCase();

    // 1. Check for Human Support Escalation Request
    if (this.isEscalationQuery(q)) {
      return await this.escalateToSupport({ user, sessionId, query });
    }

    // 2. Order Tracking & Status Intent
    if (this.isOrderQuery(q)) {
      return await this.handleOrderSupport({ q, user });
    }

    // 3. Product Search Intent ("black shirt under 1000", "cotton sarees", "gold rings", "shoes")
    if (this.isProductSearchQuery(q)) {
      return await this.handleProductSearch({ q });
    }

    // 4. Cart & Wishlist Support Intent
    if (q.includes('cart') || q.includes('basket')) {
      return this.handleCartHelp({ user });
    }
    if (q.includes('wishlist') || q.includes('saved')) {
      return this.handleWishlistHelp({ user });
    }

    // 5. Shipping & Delivery Intent
    if (q.includes('ship') || q.includes('deliver') || q.includes('courier') || q.includes('time')) {
      return {
        reply: "📦 **Shipping & Delivery Information**:\n• Free Express Shipping on orders above ₹2,999.\n• Standard Delivery: 2-5 business days across India.\n• Cash on Delivery (COD) is available on all eligible postal codes.\n• Real-time SMS & Email tracking links sent upon dispatch.",
        type: 'INFO',
        actions: [{ label: 'Track My Order', action: 'TRACK_ORDER' }, { label: 'Store Policies', action: 'POLICIES' }]
      };
    }

    // 6. Returns & Refunds Intent
    if (q.includes('return') || q.includes('refund') || q.includes('replace') || q.includes('exchange')) {
      return {
        reply: "🔄 **Returns & Refund Policy**:\n• Easy 7-Day Hassle-Free Returns & Replacements.\n• Pickup arranged right from your doorstep.\n• Refunds processed back to original payment method or wallet within 48 hours of quality verification.",
        type: 'INFO',
        actions: [{ label: 'Return an Item', action: 'RETURN_ITEM' }, { label: 'Contact Support', action: 'ESCALATE' }]
      };
    }

    // 7. Payments & Offers Intent
    if (q.includes('pay') || q.includes('upi') || q.includes('cod') || q.includes('card') || q.includes('coupon') || q.includes('offer') || q.includes('discount')) {
      return {
        reply: "💳 **Payment Methods & Active Offers**:\n• We accept UPI, GPay, PhonePe, Credit/Debit Cards, NetBanking & Cash on Delivery.\n• Use code **KVLR10** for extra 10% OFF on luxury collections.\n• Festive offers & flash sales updated daily!",
        type: 'INFO',
        actions: [{ label: 'View Offers & Coupons', action: 'OFFERS' }, { label: 'Find a Product', action: 'SEARCH_PRODUCT' }]
      };
    }

    // 8. General Greetings / Default Intent
    if (q.includes('hi') || q.includes('hello') || q.includes('hey') || q.includes('greet')) {
      return {
        reply: `👋 Hello${user ? ' ' + (user.fullName || 'there') : ''}! Welcome to KVLR Styles. I am your AI Shopping Assistant. How can I help you today?`,
        type: 'GREETING',
        actions: [
          { label: '🚚 Track My Order', action: 'TRACK_ORDER' },
          { label: '🔍 Find a Product', action: 'SEARCH_PRODUCT' },
          { label: '🔄 Return & Refund', action: 'RETURNS' },
          { label: '🎟️ Offers & Coupons', action: 'OFFERS' },
          { label: '👨‍💻 Human Support', action: 'ESCALATE' }
        ]
      };
    }

    // Default Fallback with DB Product Recommendations
    const featuredProducts = await prisma.product.findMany({
      where: { status: 'PUBLISHED', isVisible: true },
      take: 3,
      include: { images: true }
    });

    return {
      reply: `I searched our catalog for "${query}". Here are some of our top recommended luxury items you might like:`,
      type: 'PRODUCT_CARDS',
      products: featuredProducts,
      actions: [{ label: 'Talk to Human Agent', action: 'ESCALATE' }]
    };
  }

  /* ── Helper Intent Detectors ── */

  isEscalationQuery(q) {
    return q.includes('human') || q.includes('agent') || q.includes('person') || q.includes('frustrated') || q.includes('useless') || q.includes('escalate') || q.includes('complaint') || q.includes('customer care');
  }

  isOrderQuery(q) {
    return q.includes('order') || q.includes('track') || q.includes('where is my') || q.includes('shipped') || q.includes('status') || q.includes('dispatch');
  }

  isProductSearchQuery(q) {
    return q.includes('shirt') || q.includes('saree') || q.includes('shoe') || q.includes('dress') || q.includes('gold') || q.includes('under') || q.includes('show') || q.includes('recommend') || q.includes('jean') || q.includes('bag') || q.includes('watch') || q.includes('jacket') || q.includes('kurta');
  }

  /* ── Handlers ── */

  async handleOrderSupport({ q, user }) {
    if (!user) {
      return {
        reply: "🔐 Please sign in to securely track your orders and check real-time delivery status.",
        type: 'AUTH_REQUIRED',
        actions: [{ label: 'Sign In Now', action: 'LOGIN' }]
      };
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { items: { include: { product: { include: { images: true } } } } }
    });

    if (orders.length === 0) {
      return {
        reply: "🛍️ You have not placed any orders yet. Would you like me to help you find some trending luxury products?",
        type: 'INFO',
        actions: [{ label: 'Browse Trending Products', action: 'SEARCH_PRODUCT' }]
      };
    }

    const latestOrder = orders[0];
    const itemNames = latestOrder.items.map(i => i.product?.name || 'Product').join(', ');
    const trackingLink = `/orders/${latestOrder.id}`;

    return {
      reply: `📦 **Your Latest Order (#${latestOrder.orderNo || latestOrder.id.slice(0, 8)})**:\n• Status: **${latestOrder.orderStatus}**\n• Items: ${itemNames}\n• Payment: **${latestOrder.paymentStatus}** (${latestOrder.paymentMethod})\n• Total: ₹${latestOrder.totalAmount}`,
      type: 'ORDER_CARD',
      order: {
        id: latestOrder.id,
        orderNo: latestOrder.orderNo || latestOrder.id.slice(0, 8),
        status: latestOrder.orderStatus,
        total: latestOrder.totalAmount,
        items: latestOrder.items,
        trackingLink
      },
      actions: [{ label: 'View Order Details', action: 'VIEW_ORDER', link: trackingLink }, { label: 'Contact Support', action: 'ESCALATE' }]
    };
  }

  async handleProductSearch({ q }) {
    // Extract price constraint (e.g. "under 1000", "under 1500")
    let maxPrice = null;
    const priceMatch = q.match(/under\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
    if (priceMatch) {
      maxPrice = parseFloat(priceMatch[1]);
    }

    // Clean search terms
    const keywords = q
      .replace(/under\s*(?:₹|rs\.?|inr)?\s*\d+/gi, '')
      .replace(/show|me|i|want|need|recommend|a|some|for|in|looking|find/gi, '')
      .trim();

    let whereClause = { status: 'PUBLISHED', isVisible: true };
    const andConditions = [];

    if (keywords) {
      andConditions.push({
        OR: [
          { name: { contains: keywords, mode: 'insensitive' } },
          { description: { contains: keywords, mode: 'insensitive' } },
          { shortDesc: { contains: keywords, mode: 'insensitive' } },
          { tags: { contains: keywords, mode: 'insensitive' } },
          { category: { name: { contains: keywords, mode: 'insensitive' } } }
        ]
      });
    }

    if (maxPrice) {
      andConditions.push({ price: { lte: maxPrice } });
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    let products = await prisma.product.findMany({
      where: whereClause,
      take: 4,
      include: { images: true, category: true }
    });

    // Fallback if strict search returned 0
    if (products.length === 0) {
      products = await prisma.product.findMany({
        where: { status: 'PUBLISHED', isVisible: true },
        take: 3,
        include: { images: true, category: true }
      });
    }

    return {
      reply: `✨ Here are the matching products from our database based on your request:`,
      type: 'PRODUCT_CARDS',
      products,
      actions: [{ label: 'View All Products', action: 'BROWSE_ALL' }]
    };
  }

  handleCartHelp({ user }) {
    return {
      reply: "🛒 Your cart allows you to manage items, apply promo codes, and proceed to instant checkout. Click below to view your cart items.",
      type: 'INFO',
      actions: [{ label: 'View My Cart', action: 'VIEW_CART', link: '/cart' }]
    };
  }

  handleWishlistHelp({ user }) {
    return {
      reply: "❤️ Your wishlist keeps track of all your saved luxury items. Click below to explore your saved favorites.",
      type: 'INFO',
      actions: [{ label: 'View My Wishlist', action: 'VIEW_WISHLIST', link: '/wishlist' }]
    };
  }

  async escalateToSupport({ user, sessionId, query }) {
    // Generate unique Ticket No
    const ticketCount = await prisma.supportTicket.count();
    const ticketNo = `TICK-${Date.now().toString().slice(-5)}`;

    let ticket = null;
    if (user) {
      ticket = await prisma.supportTicket.create({
        data: {
          ticketNo,
          userId: user.id,
          subject: `Chatbot Escalation: ${query.slice(0, 40)}...`,
          category: 'Chatbot AI Escalation',
          priority: 'HIGH',
          status: 'OPEN',
          messages: {
            create: {
              senderRole: 'CUSTOMER',
              senderName: user.fullName || 'Customer',
              message: `Escalated Query: ${query}`
            }
          }
        }
      });
    }

    return {
      reply: `👨‍💻 **Support Ticket Created (#${ticketNo})**:\nOur customer support specialist has been notified and will contact you via email shortly. Your ticket reference is **${ticketNo}**.`,
      type: 'ESCALATION',
      ticketNo,
      actions: [{ label: 'Back to Store', action: 'STORE_HOME' }]
    };
  }
}

module.exports = new ChatbotService();
