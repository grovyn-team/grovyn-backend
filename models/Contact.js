import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    company: {
      type: String,
      trim: true,
      default: null,
    },
    projectType: {
      type: String,
      trim: true,
      default: null,
    },
    budget: {
      type: String,
      trim: true,
      default: null,
    },
    timeline: {
      type: String,
      trim: true,
      default: null,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'archived'],
      default: 'new',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Index for faster queries
contactSchema.index({ email: 1, submittedAt: -1 });
contactSchema.index({ status: 1 });
contactSchema.index({ projectType: 1 });

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;

