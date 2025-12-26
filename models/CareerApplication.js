import mongoose from 'mongoose';

const careerApplicationSchema = new mongoose.Schema(
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
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    position: {
      type: String,
      required: [true, 'Position is required'],
      trim: true,
    },
    coverLetter: {
      type: String,
      trim: true,
      default: null,
    },
    resume: {
      url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted'],
      default: 'pending',
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
careerApplicationSchema.index({ email: 1, submittedAt: -1 });
careerApplicationSchema.index({ position: 1 });
careerApplicationSchema.index({ status: 1 });

const CareerApplication = mongoose.model('CareerApplication', careerApplicationSchema);

export default CareerApplication;

