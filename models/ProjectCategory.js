import mongoose from 'mongoose';

const projectCategorySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'key must be lowercase slug'],
    },
    name: { type: String, required: true, trim: true },
    /** Lucide icon name, e.g. layers, activity, smartphone */
    iconKey: { type: String, default: 'layers', trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

projectCategorySchema.index({ order: 1, createdAt: -1 });

export default mongoose.model('ProjectCategory', projectCategorySchema);
