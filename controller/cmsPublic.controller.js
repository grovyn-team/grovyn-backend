import ProjectCategory from '../models/ProjectCategory.js';
import PortfolioProject from '../models/PortfolioProject.js';
import SelectedWork from '../models/SelectedWork.js';
import IndustrySlide from '../models/IndustrySlide.js';
import TestimonialEntry from '../models/TestimonialEntry.js';

function mapProject(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id),
    name: o.name,
    category: o.categoryLabel,
    categoryKey: o.categoryKey,
    industry: o.categoryLabel,
    description: o.description || '',
    completedDate: o.completedDate || '',
    techStack: Array.isArray(o.techStack) ? o.techStack : [],
    metrics: { label: o.metricsLabel || '', value: o.metricsValue || '' },
    image: o.image,
    dossierId: o.dossierId || '',
    url: o.url || '#',
  };
}

export async function getCategoriesPublic(_req, res) {
  try {
    const rows = await ProjectCategory.find({}).sort({ order: 1, createdAt: 1 }).lean();
    res.status(200).json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to load categories' });
  }
}

export async function getPortfolioProjectsPublic(_req, res) {
  try {
    const rows = await PortfolioProject.find({}).sort({ order: 1, createdAt: 1 }).lean();
    res.status(200).json(rows.map((r) => mapProject(r)));
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to load projects' });
  }
}

export async function getSelectedWorkPublic(_req, res) {
  try {
    let doc = await SelectedWork.findOne({ key: 'default' }).lean();
    if (!doc) {
      doc = { key: 'default', card1: {}, card2: {}, card3: {}, card4: {} };
    }
    res.status(200).json(doc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to load selected work' });
  }
}

export async function getIndustrySlidesPublic(_req, res) {
  try {
    const rows = await IndustrySlide.find({}).sort({ order: 1, createdAt: 1 }).lean();
    res.status(200).json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to load industries' });
  }
}

export async function getTestimonialsPublic(_req, res) {
  try {
    const rows = await TestimonialEntry.find({}).sort({ order: 1, createdAt: 1 }).lean();
    const mapped = rows.map((o) => ({
      id: String(o._id),
      name: o.customerName,
      role: o.subtitle || '',
      text: o.quote,
      rating: `${o.rating}/5`,
      ratingValue: o.rating,
      image: o.logoUrl,
    }));
    res.status(200).json(mapped);
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to load testimonials' });
  }
}
