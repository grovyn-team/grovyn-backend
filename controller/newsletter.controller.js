import nodemailer from 'nodemailer';
import NewsletterSubscriber from '../models/NewsletterSubscriber.js';

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const escapeHtml = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Send confirmation email to the subscriber (revert like other websites)
 */
const sendConfirmationEmail = async (email) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'Grovyn'}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "You're subscribed to Grovyn updates",
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #f2f8f6; background-color: #0d1512; margin: 0; padding: 20px; }
            .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #131a17; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4); }
            .header { background: linear-gradient(135deg, hsl(160, 70%, 45%) 0%, hsl(180, 60%, 40%) 100%); color: #0a1410; padding: 36px 24px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
            .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 15px; }
            .content { padding: 32px 24px; }
            .content p { color: #e8f4f0; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0; }
            .footer { text-align: center; padding: 24px; background-color: #1a2420; border-top: 1px solid #2a3a34; color: #7a9288; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <h1>You're subscribed</h1>
              <p>Thanks for signing up for Grovyn updates</p>
            </div>
            <div class="content">
              <p>We'll send you occasional updates about our work, product news, and insights. We respect your privacy and you can unsubscribe anytime.</p>
              <p>Best,<br><strong>The Grovyn Team</strong></p>
            </div>
            <div class="footer">
              <p>You received this because ${escapeHtml(email)} subscribed at grovyn.in</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `You're subscribed to Grovyn updates.\n\nWe'll send you occasional updates about our work. You can unsubscribe anytime.\n\nBest,\nThe Grovyn Team`,
  };
  return transporter.sendMail(mailOptions);
};

/**
 * POST /newsletter - Subscribe email to newsletter
 */
const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    const trimmed = email.trim().toLowerCase();
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(trimmed)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    let subscriber = await NewsletterSubscriber.findOne({ email: trimmed });
    if (subscriber) {
      return res.status(200).json({
        success: true,
        message: 'You are already subscribed. Thank you!',
        data: { subscribedAt: subscriber.subscribedAt },
      });
    }

    subscriber = await NewsletterSubscriber.create({
      email: trimmed,
      source: req.body.source || 'website',
    });

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await sendConfirmationEmail(trimmed);
      } catch (emailErr) {
        console.error('Newsletter confirmation email failed:', emailErr);
      }
    }

    res.status(201).json({
      success: true,
      message: "You're subscribed! Check your inbox for a confirmation.",
      data: {
        subscribedAt: subscriber.subscribedAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: 'You are already subscribed. Thank you!',
      });
    }
    console.error('Newsletter subscribe error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to subscribe',
    });
  }
};

export { subscribeNewsletter };
