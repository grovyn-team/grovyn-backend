import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';
import Contact from '../models/Contact.js';

// Configure nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send contact inquiry email to company
 */
const sendInquiryEmail = async (contactData) => {
  const transporter = createTransporter();
  // Always send to SMTP_USER to ensure company receives the inquiry
  const recipientEmail = process.env.SMTP_USER;

  // Escape HTML to prevent XSS
  const escapeHtml = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const formatMessage = (text) => {
    if (!text) return '';
    return escapeHtml(text).replace(/\n/g, '<br>');
  };

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'Grovyn'}" <${process.env.SMTP_USER}>`,
    to: recipientEmail,
    replyTo: contactData.email,
    subject: `New Contact Inquiry from ${contactData.name}${contactData.company ? ` - ${contactData.company}` : ''}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Outfit', Roboto, 'Helvetica Neue', Arial, sans-serif; 
              line-height: 1.6; 
              color: #f2f8f6; 
              background-color: #0d1512;
              margin: 0;
              padding: 20px;
            }
            .email-wrapper { 
              max-width: 650px; 
              margin: 0 auto; 
              background-color: #131a17;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
            }
            .header { 
              background: linear-gradient(135deg, hsl(160, 70%, 45%) 0%, hsl(180, 60%, 40%) 100%);
              color: #0a1410; 
              padding: 30px 25px; 
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .header p {
              margin: 8px 0 0 0;
              opacity: 0.9;
              font-size: 14px;
            }
            .content { 
              background-color: #131a17; 
              padding: 30px 25px; 
            }
            .info-card {
              background-color: #1a2420;
              border: 1px solid #2a3a34;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
            }
            .info-card h2 {
              margin: 0 0 18px 0;
              font-size: 12px;
              color: hsl(160, 70%, 45%);
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-bottom: 1px solid #2a3a34;
              padding-bottom: 10px;
            }
            .field { 
              margin-bottom: 16px;
            }
            .field:last-child {
              margin-bottom: 0;
            }
            .field-label { 
              font-weight: 600; 
              color: #9db8b0; 
              margin-bottom: 6px;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .field-value { 
              color: #f2f8f6;
              font-size: 15px;
              padding: 10px 12px;
              background-color: #0d1512;
              border: 1px solid #2a3a34;
              border-radius: 6px;
            }
            .field-value a {
              color: hsl(160, 70%, 50%);
              text-decoration: none;
              font-weight: 500;
            }
            .field-value a:hover {
              text-decoration: underline;
              color: hsl(160, 70%, 55%);
            }
            .message-box {
              background-color: #0d1512;
              border: 1px solid #2a3a34;
              border-left: 4px solid hsl(160, 70%, 45%);
              border-radius: 8px;
              padding: 18px;
              margin-top: 10px;
            }
            .message-content {
              color: #e8f4f0;
              line-height: 1.8;
              white-space: pre-wrap;
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              padding-top: 20px;
              border-top: 1px solid #2a3a34;
              color: #7a9288; 
              font-size: 12px;
              line-height: 1.6;
            }
            .timestamp {
              background-color: #1a2420;
              border: 1px solid #2a3a34;
              padding: 12px;
              border-radius: 6px;
              margin-top: 20px;
              text-align: center;
              font-size: 13px;
              color: #9db8b0;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <h1>📧 New Contact Inquiry</h1>
              <p>You have received a new inquiry from your website</p>
            </div>
            
            <div class="content">
              <!-- Contact Information Section -->
              <div class="info-card">
                <h2>Contact Information</h2>
                
                <div class="field">
                  <div class="field-label">Full Name</div>
                  <div class="field-value">${escapeHtml(contactData.name)}</div>
                </div>
                
                <div class="field">
                  <div class="field-label">Email Address</div>
                  <div class="field-value">
                    <a href="mailto:${contactData.email}">${escapeHtml(contactData.email)}</a>
                  </div>
                </div>
                
                ${contactData.company ? `
                <div class="field">
                  <div class="field-label">Company / Organization</div>
                  <div class="field-value">${escapeHtml(contactData.company)}</div>
                </div>
                ` : ''}
              </div>

              <!-- Project Details Section -->
              ${(contactData.projectType || contactData.budget || contactData.timeline) ? `
              <div class="info-card">
                <h2>Project Details</h2>
                
                ${contactData.projectType ? `
                <div class="field">
                  <div class="field-label">Project Type</div>
                  <div class="field-value">${escapeHtml(contactData.projectType)}</div>
                </div>
                ` : ''}
                
                ${contactData.budget ? `
                <div class="field">
                  <div class="field-label">Budget Range</div>
                  <div class="field-value">${escapeHtml(contactData.budget)}</div>
                </div>
                ` : ''}
                
                ${contactData.timeline ? `
                <div class="field">
                  <div class="field-label">Timeline</div>
                  <div class="field-value">${escapeHtml(contactData.timeline)}</div>
                </div>
                ` : ''}
              </div>
              ` : ''}
              
              <!-- Message Section -->
              <div class="info-card">
                <h2>Message / Project Description</h2>
                <div class="message-box">
                  <div class="message-content">${formatMessage(contactData.message)}</div>
                </div>
              </div>

              <div class="timestamp">
                <strong>Submitted:</strong> ${new Date(contactData.submittedAt).toLocaleString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit',
                  timeZoneName: 'short'
                })}
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Grovyn Website Contact Form</strong></p>
              <p>This is an automated notification email. The inquiry has been saved to your database.</p>
              <p style="margin-top: 8px; color: #6a857a;">
                You can reply directly to this email to respond to ${escapeHtml(contactData.name)}.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
New Contact Inquiry

Name: ${contactData.name}
Email: ${contactData.email}
${contactData.company ? `Company: ${contactData.company}\n` : ''}${contactData.projectType ? `Project Type: ${contactData.projectType}\n` : ''}${contactData.budget ? `Budget Range: ${contactData.budget}\n` : ''}${contactData.timeline ? `Timeline: ${contactData.timeline}\n` : ''}
Message:
${contactData.message}

Submitted at: ${new Date(contactData.submittedAt).toLocaleString()}
    `.trim(),
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send confirmation email to user
 */
const sendConfirmationEmail = async (contactData) => {
  const transporter = createTransporter();

  // Escape HTML to prevent XSS
  const escapeHtml = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'Grovyn'}" <${process.env.SMTP_USER}>`,
    to: contactData.email,
    subject: 'Thank you for contacting Grovyn',
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Outfit', Roboto, 'Helvetica Neue', Arial, sans-serif; 
              line-height: 1.6; 
              color: #f2f8f6; 
              background-color: #0d1512;
              margin: 0;
              padding: 20px;
            }
            .email-wrapper { 
              max-width: 650px; 
              margin: 0 auto; 
              background-color: #131a17;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
            }
            .header { 
              background: linear-gradient(135deg, hsl(160, 70%, 45%) 0%, hsl(180, 60%, 40%) 100%);
              color: #0a1410; 
              padding: 40px 25px; 
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .header p {
              margin: 10px 0 0 0;
              opacity: 0.9;
              font-size: 16px;
            }
            .content { 
              background-color: #131a17; 
              padding: 40px 30px; 
            }
            .content p {
              color: #e8f4f0;
              font-size: 16px;
              line-height: 1.8;
              margin-bottom: 20px;
            }
            .content p:last-of-type {
              margin-bottom: 0;
            }
            .greeting {
              color: #f2f8f6;
              font-size: 18px;
              font-weight: 500;
              margin-bottom: 20px;
            }
            .signature {
              margin-top: 30px;
              padding-top: 30px;
              border-top: 1px solid #2a3a34;
            }
            .signature p {
              color: #f2f8f6;
              font-weight: 500;
              margin-bottom: 5px;
            }
            .footer { 
              text-align: center; 
              margin-top: 0; 
              padding: 30px 25px;
              background-color: #1a2420;
              border-top: 1px solid #2a3a34;
              color: #7a9288; 
              font-size: 12px;
              line-height: 1.6;
            }
            .icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <div class="icon">✨</div>
              <h1>Thank You for Contacting Grovyn</h1>
              <p>We've received your inquiry</p>
            </div>
            <div class="content">
              <p class="greeting">Dear ${escapeHtml(contactData.name)},</p>
              
              <p>Thank you for reaching out to us! We have received your inquiry and our team will review it shortly.</p>
              
              <p>We typically respond within 24 hours during business days. If you have any urgent questions, please feel free to contact us directly.</p>
              
              <div class="signature">
                <p>Best regards,</p>
                <p>The Grovyn Team</p>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated confirmation email. Please do not reply to this message.</p>
              <p style="margin-top: 10px; color: #6a857a;">
                If you need to contact us, please visit our website or reach out through our official channels.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Thank You for Contacting Grovyn

Dear ${contactData.name},

Thank you for reaching out to us! We have received your inquiry and our team will review it shortly.

We typically respond within 24 hours during business days. If you have any urgent questions, please feel free to contact us directly.

Best regards,
The Grovyn Team

This is an automated confirmation email. Please do not reply to this message.
    `.trim(),
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Handle contact form submission
 */
const submitContact = async (req, res) => {
  try {
    const { name, email, company, projectType, budget, timeline, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required fields.',
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // Prepare contact data
    const contactData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: company ? company.trim() : null,
      projectType: projectType ? projectType.trim() : null,
      budget: budget ? budget.trim() : null,
      timeline: timeline ? timeline.trim() : null,
      message: message.trim(),
      status: 'new',
      submittedAt: new Date(),
    };

    // Save to database
    const savedContact = await Contact.create(contactData);

    // Check if email configuration is available
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('SMTP credentials not configured. Email functionality is disabled.');
      // Still return success if email is not configured, but log a warning
      return res.status(200).json({
        success: true,
        message: 'Contact inquiry saved successfully. (Email notification disabled)',
        data: {
          contactId: savedContact._id,
          submittedAt: savedContact.submittedAt,
        },
      });
    }

    try {
      // Send inquiry email to company
      await sendInquiryEmail(contactData);

      // Send confirmation email to user
      await sendConfirmationEmail(contactData);

      res.status(200).json({
        success: true,
        message: 'Contact inquiry submitted successfully. We will get back to you soon!',
        data: {
          contactId: savedContact._id,
          submittedAt: savedContact.submittedAt,
        },
      });
    } catch (emailError) {
      console.error('Error sending emails:', emailError);
      // Still return success if email fails, but log the error
      // The inquiry is saved in the database, so it's not lost
      res.status(200).json({
        success: true,
        message: 'Contact inquiry saved successfully. (Email delivery failed, but your inquiry has been recorded)',
        data: {
          contactId: savedContact._id,
          submittedAt: savedContact.submittedAt,
        },
        warning: 'Email notification could not be sent, but your inquiry has been saved.',
      });
    }
  } catch (error) {
    console.error('Error processing contact inquiry:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process contact inquiry',
    });
  }
};

export { submitContact };

