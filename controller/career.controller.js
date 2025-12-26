import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import CareerApplication from '../models/CareerApplication.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

    // Save to MongoDB
    const savedApplication = await CareerApplication.create(applicationData);

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
