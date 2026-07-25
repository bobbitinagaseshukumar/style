/**
 * StyleVerse Email Service
 * Wraps Nodemailer with a queue, retry, and all transactional email methods.
 */

const nodemailer = require('nodemailer');
const templates = require('../emails/templates');

/* ─── Transporter ───────────────────────────────────────────── */
let transporter;
const getTransporter = () => {
  if (transporter) return transporter;

  // Prefer environment config
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && process.env.RESEND_API_KEY) {
    // Option A: Resend (recommended for production)
    transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: { user: 'resend', pass: process.env.RESEND_API_KEY },
    });
  } else {
    // Option B: SMTP (Gmail / any SMTP)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: false },
    });
  }

  return transporter;
};

/* ─── In-memory email queue (production: use Bull/Redis) ────── */
const emailQueue = [];
let processingQueue = false;

const enqueue = (mailOptions) => {
  emailQueue.push({ mailOptions, attempts: 0, maxAttempts: 3 });
  if (!processingQueue) processQueue();
};

const processQueue = async () => {
  if (processingQueue || emailQueue.length === 0) return;
  processingQueue = true;

  while (emailQueue.length > 0) {
    const job = emailQueue.shift();
    try {
      await getTransporter().sendMail(job.mailOptions);
      console.log(`[EMAIL SENT] to: ${job.mailOptions.to} | subject: ${job.mailOptions.subject}`);
    } catch (err) {
      console.error(`[EMAIL ERROR] attempt ${job.attempts + 1}: ${err.message}`);
      if (job.attempts + 1 < job.maxAttempts) {
        job.attempts += 1;
        // Re-queue with exponential backoff
        setTimeout(() => {
          emailQueue.push(job);
          if (!processingQueue) processQueue();
        }, 2000 * Math.pow(2, job.attempts));
      } else {
        console.error(`[EMAIL FAILED] Giving up after ${job.maxAttempts} attempts for: ${job.mailOptions.to}`);
      }
    }
    // Throttle: 10 emails/sec max
    await new Promise(r => setTimeout(r, 100));
  }

  processingQueue = false;
};

/* ─── Core send function ────────────────────────────────────── */
const sendEmail = ({ to, subject, html, from, priority = 'normal' }) => {
  const mailOptions = {
    from: from || `"${process.env.FROM_NAME || 'KVLR Styles'}" <${process.env.FROM_EMAIL || 'noreply@kvlrstyles.com'}>`,
    to,
    subject,
    html,
  };

  if (priority === 'high') {
    // Send immediately for critical emails (OTP, password reset)
    return getTransporter().sendMail(mailOptions).catch(err => {
      console.error(`[EMAIL ERROR] High priority failed: ${err.message}`);
    });
  }

  // Non-critical — use queue
  enqueue(mailOptions);
  return Promise.resolve();
};

/* ══════════════════════════════════════════════════════════════
   ACCOUNT & AUTH EMAILS
══════════════════════════════════════════════════════════════ */
const sendOTPEmail = (email, fullName, otp) =>
  sendEmail({
    to: email,
    subject: `${otp} — Your ${process.env.FROM_NAME || 'KVLR Styles'} Verification Code`,
    html: templates.otpEmail(fullName, otp),
    priority: 'high',
  });

const sendWelcomeEmail = (email, fullName) =>
  sendEmail({
    to: email,
    subject: `Welcome to KVLR Styles, ${fullName}! 🎉`,
    html: templates.welcomeEmail(fullName, email),
    from: `"KVLR Styles" <${process.env.FROM_EMAIL}>`,
  });

const sendPasswordResetEmail = (email, fullName, otp, ip) =>
  sendEmail({
    to: email,
    subject: `Password Reset OTP — KVLR Styles`,
    html: templates.forgotPasswordEmail(fullName, otp, ip),
    priority: 'high',
  });

const sendPasswordChangedEmail = (email, fullName) =>
  sendEmail({
    to: email,
    subject: `Password Changed Successfully — KVLR Styles`,
    html: templates.passwordChangedEmail(fullName),
    priority: 'high',
  });

/* ══════════════════════════════════════════════════════════════
   ORDER EMAILS
══════════════════════════════════════════════════════════════ */
const sendOrderPlacedEmail = (email, fullName, order) =>
  sendEmail({
    to: email,
    subject: `Order Confirmed! #${order.orderNumber} — KVLR Styles`,
    html: templates.orderPlacedEmail(fullName, order),
    priority: 'high',
  });

const sendOrderShippedEmail = (email, fullName, order) =>
  sendEmail({
    to: email,
    subject: `🚚 Your Order #${order.orderNumber} is On the Way!`,
    html: templates.orderShippedEmail(fullName, order),
  });

const sendOrderDeliveredEmail = (email, fullName, order) =>
  sendEmail({
    to: email,
    subject: `🎁 Order #${order.orderNumber} Delivered! Rate Your Purchase`,
    html: templates.orderDeliveredEmail(fullName, order),
  });

const sendOrderCancelledEmail = (email, fullName, order) =>
  sendEmail({
    to: email,
    subject: `Order #${order.orderNumber} Cancelled — KVLR Styles`,
    html: templates.orderCancelledEmail(fullName, order),
  });

/* ══════════════════════════════════════════════════════════════
   MARKETING EMAILS
══════════════════════════════════════════════════════════════ */
const sendOfferEmail = (email, fullName, offer) =>
  sendEmail({
    to: email,
    subject: `🎁 ${offer.discount || ''}% OFF — ${offer.title || 'Exclusive Offer'} | KVLR Styles`,
    html: templates.offerEmail(fullName, offer),
  });

const sendBackInStockEmail = (email, fullName, product) =>
  sendEmail({
    to: email,
    subject: `🔔 Back in Stock: ${product.name}`,
    html: templates.backInStockEmail(fullName, product),
  });

const sendAbandonedCartEmail = (email, fullName, cartItems, discount) =>
  sendEmail({
    to: email,
    subject: `🛒 You forgot something! Complete your order`,
    html: templates.abandonedCartEmail(fullName, cartItems, discount),
  });

const sendNewArrivalsEmail = (email, fullName, products) =>
  sendEmail({
    to: email,
    subject: `✨ New Arrivals Just Dropped — KVLR Styles`,
    html: templates.newArrivalsEmail(fullName, products),
  });

const sendNewsletterEmail = (email, fullName, subject, bodyHtml) =>
  sendEmail({
    to: email,
    subject,
    html: templates.newsletterEmail(fullName, subject, bodyHtml),
  });

/* ══════════════════════════════════════════════════════════════
   BULK SENDER (with rate limiting)
══════════════════════════════════════════════════════════════ */
const sendBulkEmail = async (recipients, subject, html, batchSize = 50) => {
  const results = { sent: 0, failed: 0 };
  const batches = [];
  for (let i = 0; i < recipients.length; i += batchSize) {
    batches.push(recipients.slice(i, i + batchSize));
  }
  for (const batch of batches) {
    await Promise.allSettled(
      batch.map(({ email, fullName }) =>
        sendEmail({ to: email, subject, html: html.replace(/{{name}}/g, fullName || 'Valued Customer') })
          .then(() => results.sent++)
          .catch(() => results.failed++)
      )
    );
    // 1-second pause between batches
    await new Promise(r => setTimeout(r, 1000));
  }
  return results;
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendOrderPlacedEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail,
  sendOfferEmail,
  sendBackInStockEmail,
  sendAbandonedCartEmail,
  sendNewArrivalsEmail,
  sendNewsletterEmail,
  sendBulkEmail,
};
