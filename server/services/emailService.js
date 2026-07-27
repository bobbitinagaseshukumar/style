const prisma = require('../config/db');

/**
 * Enterprise Responsive Email Notification Service & Template Engine
 * Ready for Nodemailer / SendGrid / Amazon SES integration
 */
class EmailService {
  /**
   * Base Email Layout Wrapper
   */
  wrapTemplate({ headline, description, bannerImage, products = [], buttonText, buttonUrl, unsubscribeUrl }) {
    const goldAccent = '#D4AF37';
    const darkBg = '#0D0D0D';

    const productGridHtml = products.length > 0 ? `
      <div style="margin-top: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
        ${products.map(p => `
          <div style="background-color: #181818; border: 1px solid rgba(212,175,55,0.2); border-radius: 12px; padding: 12px; text-align: center;">
            ${p.images?.[0]?.url || p.image ? `<img src="${p.images?.[0]?.url || p.image}" alt="${p.name}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />` : ''}
            <h4 style="color: #ffffff; font-size: 13px; margin: 4px 0; font-family: sans-serif;">${p.name}</h4>
            <p style="color: ${goldAccent}; font-weight: bold; font-size: 14px; margin: 4px 0;">₹${p.discountPrice || p.price}</p>
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
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #050505; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: ${darkBg}; border: 1px solid rgba(212,175,55,0.3); border-radius: 16px; overflow: hidden; max-width: 95%;">
                
                <!-- HEADER BRAND LOGO -->
                <tr>
                  <td align="center" style="padding: 28px 20px; background-color: #000000; border-bottom: 1px solid rgba(255,255,255,0.08);">
                    <span style="font-size: 24px; font-weight: 900; letter-spacing: 2px; color: ${goldAccent}; text-transform: uppercase;">STYLEVERSE</span>
                    <p style="font-size: 10px; color: #888888; margin: 4px 0 0 0; letter-spacing: 3px; uppercase;">LUXURY FASHION & JEWELLERY</p>
                  </td>
                </tr>

                <!-- HERO BANNER IMAGE -->
                ${bannerImage ? `
                  <tr>
                    <td>
                      <img src="${bannerImage}" alt="Campaign Banner" style="width: 100%; max-height: 280px; object-fit: cover; display: block;" />
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
                        <a href="${buttonUrl}" target="_blank" style="background: linear-gradient(135deg, #D4AF37 0%, #B89327 100%); color: #000000; font-weight: bold; font-size: 14px; padding: 14px 32px; border-radius: 10px; text-decoration: none; display: inline-block; box-shadow: 0 4px 20px rgba(212,175,55,0.4);">
                          ${buttonText}
                        </a>
                      </div>
                    ` : ''}
                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td align="center" style="padding: 24px 20px; background-color: #000000; border-top: 1px solid rgba(255,255,255,0.08); font-size: 11px; color: #666666;">
                    <p style="margin: 0 0 8px 0; color: #888888;">© 2026 StyleVerse Platform. All rights reserved.</p>
                    <p style="margin: 0;">
                      You received this email because of your preferences at StyleVerse. 
                      ${unsubscribeUrl ? `<a href="${unsubscribeUrl}" style="color: ${goldAccent}; text-decoration: underline;">Unsubscribe</a>` : ''}
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
   * Send Email Campaign (Queues logs & returns response)
   */
  async sendCampaign({ campaignId, subject, recipients, headline, description, bannerImage, products, buttonText, buttonUrl }) {
    const sentLogs = [];
    const htmlContent = this.wrapTemplate({ headline, description, bannerImage, products, buttonText, buttonUrl });

    // Mock send execution (ready for Nodemailer `transporter.sendMail`)
    for (const email of recipients) {
      sentLogs.push({
        campaignId: campaignId || null,
        recipientEmail: email,
        subject,
        status: 'SENT',
      });
    }

    if (sentLogs.length > 0) {
      await prisma.emailLog.createMany({ data: sentLogs });
    }

    // Update campaign counters
    if (campaignId) {
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'SENT',
          sentCount: { increment: recipients.length },
          deliveredCount: { increment: recipients.length },
        }
      });
    }

    return { success: true, count: recipients.length, htmlContent };
  }
}

module.exports = new EmailService();
