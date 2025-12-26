import express from 'express';
import multer from 'multer';
import { applyForJob } from '../controller/career.controller.js';

const router = express.Router();

// Configure multer for memory storage (to upload directly to Cloudinary)
const storage = multer.memoryStorage();

// File filter to only allow PDF, DOC, DOCX, and TXT files
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Route for job application with file upload
router.post('/careers/apply', (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      // Handle multer errors
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size exceeds 5MB limit.',
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      // Handle file filter errors
      return res.status(400).json({
        success: false,
        message: err.message || 'Error uploading file.',
      });
    }
    next();
  });
}, applyForJob);

export default router;