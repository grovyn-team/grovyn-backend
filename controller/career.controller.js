import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import CareerApplication from '../models/CareerApplication.js';
import JobOpening from '../models/JobOpening.js';

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

// ---------- Job openings (CRUD for careers listing) ----------

const FIELDS = 'slug title type team location description requirements translations order';

/**
 * Resolve localized fields for one opening. Uses translations[locale] when present, else root.
 * @param {Object} opening - Lean opening doc (may have translations map/object)
 * @param {string|undefined} locale - e.g. 'ar', 'fr'
 * @returns {Object} Opening with title, type, team, location, description, requirements resolved for locale (no translations in response).
 */
function resolveLocaleFields(opening, locale) {
  const out = {
    slug: opening.slug,
    title: opening.title,
    type: opening.type,
    team: opening.team,
    location: opening.location ?? null,
    description: opening.description ?? null,
    requirements: Array.isArray(opening.requirements) ? opening.requirements : [],
  };
  const t = opening.translations;
  if (locale && t && typeof t === 'object') {
    const tr = t[locale];
    if (tr && typeof tr === 'object') {
      if (tr.title) out.title = tr.title;
      if (tr.type) out.type = tr.type;
      if (tr.team) out.team = tr.team;
      if (tr.location != null) out.location = tr.location;
      if (tr.description != null) out.description = tr.description;
      if (Array.isArray(tr.requirements)) out.requirements = tr.requirements;
    }
  }
  return out;
}

/**
 * GET /careers/openings - List all job openings (for frontend).
 * Query: ?locale=ar (optional). Returns array of { slug, title, type, team, location?, description?, requirements? }.
 */
const getOpenings = async (req, res) => {
  try {
    const locale = typeof req.query.locale === 'string' ? req.query.locale.trim() : undefined;
    const openings = await JobOpening.find({})
      .sort({ order: 1, createdAt: -1 })
      .select(FIELDS)
      .lean();
    const resolved = openings.map((o) => resolveLocaleFields(o, locale));
    res.status(200).json(resolved);
  } catch (error) {
    console.error('Error fetching job openings:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch openings',
    });
  }
};

/**
 * GET /careers/openings/:slug - Get one job opening by slug.
 * Query: ?locale=ar (optional).
 */
const getOpeningBySlug = async (req, res) => {
  try {
    const locale = typeof req.query.locale === 'string' ? req.query.locale.trim() : undefined;
    const opening = await JobOpening.findOne({ slug: req.params.slug })
      .select(FIELDS)
      .lean();
    if (!opening) {
      return res.status(404).json({ success: false, message: 'Opening not found' });
    }
    res.status(200).json(resolveLocaleFields(opening, locale));
  } catch (error) {
    console.error('Error fetching job opening:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch opening',
    });
  }
};

/**
 * POST /careers/openings - Create a new job opening.
 * Body: { slug, title, type, team, location?, description?, requirements?, order?, translations? }
 * translations: { [locale]: { title?, type?, team?, location?, description?, requirements? } }
 */
const createOpening = async (req, res) => {
  try {
    const { slug, title, type, team, location, description, requirements, order, translations } = req.body;
    if (!slug || !title || !type || !team) {
      return res.status(400).json({
        success: false,
        message: 'slug, title, type, and team are required.',
      });
    }
    const payload = {
      slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
      title: title.trim(),
      type: type.trim(),
      team: team.trim(),
      location: location ? location.trim() : null,
      description: description ? description.trim() : null,
      requirements: Array.isArray(requirements) ? requirements.filter(Boolean) : [],
      order: typeof order === 'number' ? order : 0,
    };
    if (translations && typeof translations === 'object' && !Array.isArray(translations)) {
      payload.translations = translations;
    }
    const opening = await JobOpening.create(payload);
    res.status(201).json(opening);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'A job opening with this slug already exists.' });
    }
    console.error('Error creating job opening:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create opening',
    });
  }
};

/**
 * PUT /careers/openings/:id - Update a job opening by MongoDB _id.
 * Body: { slug?, title?, type?, team?, location?, description?, requirements?, order?, translations? }
 */
const updateOpening = async (req, res) => {
  try {
    const { id } = req.params;
    const update = {};
    const allowed = ['slug', 'title', 'type', 'team', 'location', 'description', 'requirements', 'order'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'slug') update[key] = String(req.body[key]).trim().toLowerCase().replace(/\s+/g, '-');
        else if (key === 'title' || key === 'type' || key === 'team') update[key] = String(req.body[key]).trim();
        else if (key === 'location' || key === 'description') update[key] = req.body[key] ? String(req.body[key]).trim() : null;
        else if (key === 'requirements') update[key] = Array.isArray(req.body[key]) ? req.body[key].filter(Boolean) : [];
        else if (key === 'order') update[key] = Number(req.body[key]) || 0;
      }
    }
    if (req.body.translations !== undefined) {
      update.translations = req.body.translations && typeof req.body.translations === 'object' && !Array.isArray(req.body.translations)
        ? req.body.translations
        : {};
    }
    const opening = await JobOpening.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
    if (!opening) {
      return res.status(404).json({ success: false, message: 'Opening not found' });
    }
    res.status(200).json(opening);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'A job opening with this slug already exists.' });
    }
    console.error('Error updating job opening:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update opening',
    });
  }
};

/**
 * DELETE /careers/openings/:id - Delete a job opening by MongoDB _id.
 */
const deleteOpening = async (req, res) => {
  try {
    const opening = await JobOpening.findByIdAndDelete(req.params.id);
    if (!opening) {
      return res.status(404).json({ success: false, message: 'Opening not found' });
    }
    res.status(200).json({ success: true, message: 'Opening deleted' });
  } catch (error) {
    console.error('Error deleting job opening:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete opening',
    });
  }
};

export {
  applyForJob,
  processAndUploadResume,
  uploadPDFToCloudinary,
  getOpenings,
  getOpeningBySlug,
  createOpening,
  updateOpening,
  deleteOpening,
};
