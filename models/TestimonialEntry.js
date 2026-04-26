import mongoose from 'mongoose';

const testimonialEntrySchema = new mongoose.Schema(
  {
    logoUrl: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    quote: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '', trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

testimonialEntrySchema.index({ order: 1, createdAt: -1 });

export default mongoose.model('TestimonialEntry', testimonialEntrySchema);
