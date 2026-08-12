const https = require('https');
const nodemailer = require('nodemailer');
const env = require('./env');

// Nodemailer SMTP Transporter (Fallback)
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

/**
 * Direct Brevo REST API v3 Email Delivery
 * Uses HTTPS API endpoint: https://api.brevo.com/v3/smtp/email
 * Fast, reliable, and bypasses SMTP port blocks.
 */
const sendEmailViaBrevo = async ({ to, subject, htmlContent, senderName, senderEmail }) => {
  const apiKey = env.BREVO_API_KEY;

  if (!apiKey) {
    console.warn('[BREVO MAIL] BREVO_API_KEY not configured. Falling back to SMTP.');
    return transporter.sendMail({
      from: `"${senderName || env.FROM_NAME}" <${senderEmail || env.FROM_EMAIL}>`,
      to,
      subject,
      html: htmlContent,
    });
  }

  // Format recipient list
  const recipientList = Array.isArray(to)
    ? to.map(item => (typeof item === 'string' ? { email: item } : item))
    : [{ email: to }];

  const payload = JSON.stringify({
    sender: {
      name: senderName || env.FROM_NAME || 'KVLR Styles',
      email: senderEmail || env.FROM_EMAIL || 'noreply@styleverse.com',
    },
    to: recipientList,
    subject: subject,
    htmlContent: htmlContent,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      'https://api.brevo.com/v3/smtp/email',
      {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': apiKey,
        },
      },
      (res) => {
        let responseBody = '';
        res.on('data', chunk => { responseBody += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(responseBody);
              console.log(`[BREVO MAIL SUCCESS] Sent to ${recipientList.map(r => r.email).join(', ')} | MessageId: ${parsed.messageId || 'ok'}`);
              resolve({ success: true, messageId: parsed.messageId, data: parsed });
            } catch {
              resolve({ success: true, response: responseBody });
            }
          } else {
            console.error(`[BREVO MAIL ERROR] HTTP ${res.statusCode}: ${responseBody}`);
            // Attempt SMTP fallback
            transporter.sendMail({
              from: `"${senderName || env.FROM_NAME}" <${senderEmail || env.FROM_EMAIL}>`,
              to,
              subject,
              html: htmlContent,
            }).then(resolve).catch(() => reject(new Error(`Brevo API Error ${res.statusCode}: ${responseBody}`)));
          }
        });
      }
    );

    req.on('error', (err) => {
      console.error('[BREVO MAIL REQUEST FAILED]', err.message);
      // Attempt SMTP fallback
      transporter.sendMail({
        from: `"${senderName || env.FROM_NAME}" <${senderEmail || env.FROM_EMAIL}>`,
        to,
        subject,
        html: htmlContent,
      }).then(resolve).catch(reject);
    });

    req.write(payload);
    req.end();
  });
};

module.exports = {
  transporter,
  sendEmailViaBrevo,
};
