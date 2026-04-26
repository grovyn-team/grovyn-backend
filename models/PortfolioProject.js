import mongoose from 'mongoose';

const portfolioProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    categoryKey: { type: String, required: true, trim: true, lowercase: true, index: true },
    /** Display label for pill (denormalized for fast public API) */
    categoryLabel: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    completedDate: { type: String, default: '', trim: true },
    metricsLabel: { type: String, default: '', trim: true },
    metricsValue: { type: String, default: '', trim: true },
    image: { type: String, required: true, trim: true },
    dossierId: { type: String, default: '', trim: true },
    /** Live site URL; use # or empty for “launching soon” */
    url: { type: String, default: '#', trim: true },
    techStack: { type: [String], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

portfolioProjectSchema.index({ order: 1, createdAt: -1 });
portfolioProjectSchema.index({ categoryKey: 1, order: 1 });

export default mongoose.model('PortfolioProject', portfolioProjectSchema);
