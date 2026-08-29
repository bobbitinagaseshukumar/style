const https = require('https');
const nodemailer = require('nodemailer');
const env = require('./env');

// Nodemailer SMTP Transporter (Fallback)
let transporter;
try {
  // Only create SMTP transporter if real credentials are configured
  const hasSmtpCreds = env.SMTP_USER && env.SMTP_PASS && 
                       env.SMTP_USER !== 'demo@gmail.com' && env.SMTP_PASS !== 'demo';
  if (hasSmtpCreds) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
    console.log('[MAIL CONFIG] SMTP transporter ready (fallback)');
  } else {
    transporter = null;
    console.log('[MAIL CONFIG] SMTP credentials not configured — Brevo API will be primary');
  }
} catch (err) {
  transporter = null;
  console.warn('[MAIL CONFIG] Failed to create SMTP transporter:', err.message);
}

/**
 * Send email via SMTP fallback
 */
const sendViaSMTP = async ({ to, subject, htmlContent, senderName, senderEmail }) => {
  if (!transporter) {
    throw new Error('SMTP transporter not configured. Set SMTP_USER and SMTP_PASS in .env');
  }
  const result = await transporter.sendMail({
    from: `"${senderName || env.FROM_NAME}" <${senderEmail || env.FROM_EMAIL}>`,
    to,
    subject,
    html: htmlContent,
  });
  console.log(`[SMTP MAIL SUCCESS] Sent to ${to}`);
  return result;
};

/**
 * Direct Brevo REST API v3 Email Delivery
 * Uses HTTPS API endpoint: https://api.brevo.com/v3/smtp/email
 * Fast, reliable, and bypasses SMTP port blocks.
 * 
 * IMPORTANT: The sender email MUST be verified in Brevo dashboard.
 * Go to: https://app.brevo.com/senders/list to verify styleverseshope@gmail.com
 */
const sendEmailViaBrevo = async ({ to, subject, htmlContent, senderName, senderEmail }) => {
  const apiKey = env.BREVO_API_KEY;
  const fromEmail = senderEmail || env.FROM_EMAIL || 'styleverseshope@gmail.com';
  const fromName = senderName || env.FROM_NAME || 'KVLR Styles';

  if (!apiKey) {
    console.warn('[BREVO MAIL] ⚠️ BREVO_API_KEY not configured. Attempting SMTP fallback...');
    return sendViaSMTP({ to, subject, htmlContent, senderName: fromName, senderEmail: fromEmail });
  }

  // Format recipient list
  const recipientList = Array.isArray(to)
    ? to.map(item => (typeof item === 'string' ? { email: item } : item))
    : [{ email: to }];

  const payload = JSON.stringify({
    sender: {
      name: fromName,
      email: fromEmail,
    },
    to: recipientList,
    subject: subject,
    htmlContent: htmlContent,
  });

  console.log(`[BREVO MAIL] Sending to ${recipientList.map(r => r.email).join(', ')} | From: ${fromName} <${fromEmail}>`);

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
            // Parse the Brevo error for clear logging
            let errorDetail = responseBody;
            try {
              const errParsed = JSON.parse(responseBody);
              errorDetail = errParsed.message || errParsed.code || responseBody;
            } catch {}

            console.error(`[BREVO MAIL ERROR] HTTP ${res.statusCode}: ${errorDetail}`);

            // Common Brevo errors with helpful messages
            if (res.statusCode === 401) {
              console.error('[BREVO MAIL] ❌ Invalid API key. Check BREVO_API_KEY in .env');
            } else if (errorDetail.includes('sender') || errorDetail.includes('not found') || errorDetail.includes('not allowed')) {
              console.error(`[BREVO MAIL] ❌ Sender email "${fromEmail}" is not verified in Brevo.`);
              console.error('[BREVO MAIL] 👉 Go to https://app.brevo.com/senders/list to add and verify this sender.');
            }

            // Attempt SMTP fallback
            if (transporter) {
              console.log('[BREVO MAIL] Attempting SMTP fallback...');
              sendViaSMTP({ to, subject, htmlContent, senderName: fromName, senderEmail: fromEmail })
                .then(resolve)
                .catch((smtpErr) => {
                  console.error('[SMTP FALLBACK FAILED]', smtpErr.message);
                  reject(new Error(`Brevo API Error ${res.statusCode}: ${errorDetail}. SMTP fallback also failed: ${smtpErr.message}`));
                });
            } else {
              reject(new Error(`Brevo API Error ${res.statusCode}: ${errorDetail}. No SMTP fallback configured.`));
            }
          }
        });
      }
    );

    req.on('error', (err) => {
      console.error('[BREVO MAIL REQUEST FAILED]', err.message);
      // Attempt SMTP fallback
      if (transporter) {
        console.log('[BREVO MAIL] Attempting SMTP fallback...');
        sendViaSMTP({ to, subject, htmlContent, senderName: fromName, senderEmail: fromEmail })
          .then(resolve)
          .catch((smtpErr) => {
            console.error('[SMTP FALLBACK FAILED]', smtpErr.message);
            reject(new Error(`Brevo request failed: ${err.message}. SMTP fallback also failed: ${smtpErr.message}`));
          });
      } else {
        reject(new Error(`Brevo request failed: ${err.message}. No SMTP fallback configured.`));
      }
    });

    req.write(payload);
    req.end();
  });
};

module.exports = {
  transporter,
  sendEmailViaBrevo,
};
