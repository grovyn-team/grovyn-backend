import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import CareerApplication from '../models/CareerApplication.js';
import nodemailer from 'nodemailer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


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
 * Upload PDF file to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer from multer
 * @param {string} fileName - Original file name
 * @param {string} folder - Cloudinary folder path (optional)
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadPDFToCloudinary = async (fileBuffer, fileName, folder = 'careers/resumes') => {
  return new Promise((resolve, reject) => {
    // Generate a unique public_id from timestamp and sanitized filename
    const sanitizedFileName = fileName
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .toLowerCase();

    const publicId = `${Date.now()}_${sanitizedFileName.replace(/\.(pdf|doc|docx|txt)$/i, '')}`;

    // Convert buffer to stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto', // Auto-detect resource type (works for PDF, DOC, DOCX, etc.)
        folder: folder,
        public_id: publicId,
        allowed_formats: ['pdf', 'doc', 'docx', 'txt'],
        use_filename: false, // Don't use original filename
        unique_filename: true, // Ensure unique filenames
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Create a readable stream from buffer and pipe to Cloudinary
    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
};

/**
 * Process and upload resume to Cloudinary
 * @param {Object} file - Multer file object
 * @returns {Promise<Object>} Upload result with URL and public_id
 */
const processAndUploadResume = async (file) => {
  try {
    // Validate file type
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.');
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error('File size exceeds 5MB limit.');
    }

    // Upload to Cloudinary
    const uploadResult = await uploadPDFToCloudinary(
      file.buffer,
      file.originalname,
      'careers/resumes'
    );

    return {
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      created_at: uploadResult.created_at,
    };
  } catch (error) {
    console.error('Error uploading resume to Cloudinary:', error);
    throw new Error(`Failed to upload resume: ${error.message}`);
  }
};

/**
 * Send confirmation email to job applicant
 */
const sendApplicationConfirmationEmail = async (applicationData) => {
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
    to: applicationData.email,
    subject: 'Thank You for Your Application - Grovyn',
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
            .position-info {
              background-color: #1a2420;
              border-left: 4px solid hsl(160, 70%, 45%);
              padding: 20px;
              margin: 25px 0;
              border-radius: 8px;
            }
            .position-info p {
              margin: 5px 0;
              color: #f2f8f6;
            }
            .position-label {
              font-size: 14px;
              color: #7a9288;
              margin-bottom: 5px;
            }
            .position-value {
              font-size: 18px;
              font-weight: 600;
              color: hsl(160, 70%, 55%);
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
              <div class="icon">🎯</div>
              <h1>Thank You for Your Application</h1>
              <p>We've received your job application</p>
            </div>
            <div class="content">
              <p class="greeting">Dear ${escapeHtml(applicationData.name)},</p>
              
              <p>Thank you for your interest in joining the Grovyn team! We have successfully received your job application and resume.</p>
              
              <div class="position-info">
                <p class="position-label">Position Applied For:</p>
                <p class="position-value">${escapeHtml(applicationData.position)}</p>
              </div>
              
              <p>Our hiring team will carefully review your application and qualifications. If your profile matches our requirements, we will reach out to you soon to discuss the next steps in our hiring process.</p>
              
              <p>We appreciate your patience and look forward to the possibility of working together!</p>
              
              <div class="signature">
                <p>Best regards,</p>
                <p>The Grovyn Hiring Team</p>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated confirmation email. Please do not reply to this message.</p>
              <p style="margin-top: 10px; color: #6a857a;">
                If you have any questions about your application, please visit our website or reach out through our official channels.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Thank You for Your Application - Grovyn

Dear ${applicationData.name},

Thank you for your interest in joining the Grovyn team! We have successfully received your job application for the position of ${applicationData.position} and your resume.

Our hiring team will carefully review your application and qualifications. If your profile matches our requirements, we will reach out to you soon to discuss the next steps in our hiring process.

We appreciate your patience and look forward to the possibility of working together!

Best regards,
The Grovyn Hiring Team

---
This is an automated confirmation email. Please do not reply to this message.
    `.trim(),
  };
  return transporter.sendMail(mailOptions);
};

/**
 * Handle job application submission
 */
const applyForJob = async (req, res) => {
  try {
    const { name, email, phone, position, message } = req.body;

    // Validate required fields
    if (!name || !email || !position) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and position are required fields.',
      });
    }

    // Check if resume file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Resume file is required.',
      });
    }

    // Process and upload resume to Cloudinary
    const resumeUploadResult = await processAndUploadResume(req.file);

    // Save application data to database
    const applicationData = {
      name,
      email,
      phone: phone || null,
      position,
      coverLetter: message || null,
      resume: {
        url: resumeUploadResult.url,
        public_id: resumeUploadResult.public_id,
        uploadedAt: new Date(),
      },
      status: 'pending',
    };
    
    // Save to MongoDB first
    const savedApplication = await CareerApplication.create(applicationData);
    
    // Send confirmation email to applicant
    try {
      await sendApplicationConfirmationEmail(applicationData);
    } catch (emailError) {
      // Log email error but don't fail the request since application was saved
      console.error('Error sending confirmation email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: savedApplication._id,
        resumeUrl: resumeUploadResult.url,
        submittedAt: savedApplication.submittedAt,
      },
    });
  } catch (error) {
    console.error('Error processing job application:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process application',
    });
  }
};

export { applyForJob, processAndUploadResume, uploadPDFToCloudinary };
