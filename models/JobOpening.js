import mongoose from 'mongoose';

/**
 * Job opening schema - matches frontend Careers UI.
 * Root-level title, type, team, etc. are the default (e.g. English).
 * translations: { [locale]: { title, type, team, location?, description?, requirements? } } for localized content.
 * GET ?locale=ar returns translations.ar when present, else root.
 */
const jobOpeningSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens only'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Type is required (e.g. Full-time)'],
      trim: true,
    },
    team: {
      type: String,
      required: [true, 'Team is required (e.g. Product)'],
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    requirements: {
      type: [String],
      default: [],
    },
    order: {
      type: Number,
      default: 0,
    },
    /** Per-locale overrides. Keys: en, ar, es, fr, de, zh, hi, pt. Value: { title?, type?, team?, location?, description?, requirements? }. */
    translations: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: () => new Map(),
    },
  },
  { timestamps: true }
);

jobOpeningSchema.index({ order: 1, createdAt: -1 });

const JobOpening = mongoose.model('JobOpening', jobOpeningSchema);

export default JobOpening;
