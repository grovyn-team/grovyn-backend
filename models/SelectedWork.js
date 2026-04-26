import mongoose from 'mongoose';

const selectedWorkSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    card1: {
      backgroundImage: { type: String, default: '' },
      archiveTag: { type: String, default: '' },
      title: { type: String, default: '' },
      footerLeftLabel: { type: String, default: '' },
      footerLeftValue: { type: String, default: '' },
      footerLeftAccent: { type: Boolean, default: true },
      footerRightLabel: { type: String, default: '' },
      footerRightValue: { type: String, default: '' },
    },
    card2: {
      tagIcon: { type: String, default: 'smartphone' },
      tagText: { type: String, default: '' },
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      bottomId: { type: String, default: '' },
    },
    card3: {
      tagIcon: { type: String, default: 'activity' },
      tagText: { type: String, default: '' },
      logoImage: { type: String, default: '' },
      backgroundImage: { type: String, default: '' },
      title: { type: String, default: '' },
      bottomId: { type: String, default: '' },
    },
    card4: {
      backgroundImage: { type: String, default: '' },
      tagIcon: { type: String, default: 'shield-check' },
      tagText: { type: String, default: '' },
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      footerLabel: { type: String, default: '' },
      footerValue: { type: String, default: '' },
      techChips: { type: [String], default: [] },
    },
  },
  { timestamps: true }
);

export default mongoose.model('SelectedWork', selectedWorkSchema);
