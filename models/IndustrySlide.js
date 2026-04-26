import mongoose from 'mongoose';

const ICON_IDS = ['healthcare', 'fintech', 'ecommerce', 'edtech', 'media', 'construction'];

const industrySlideSchema = new mongoose.Schema(
  {
    iconId: {
      type: String,
      required: true,
      enum: ICON_IDS,
    },
    title: { type: String, required: true, trim: true },
    watermark: { type: String, default: '', trim: true },
    imageUrl: { type: String, required: true, trim: true },
    imageLabel: { type: String, default: '', trim: true },
    areas: { type: [String], default: [] },
    statProjects: { type: String, default: '', trim: true },
    statUptime: { type: String, default: '', trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

industrySlideSchema.index({ order: 1, createdAt: -1 });

export default mongoose.model('IndustrySlide', industrySlideSchema);
