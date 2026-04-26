import ProjectCategory from '../models/ProjectCategory.js';
import PortfolioProject from '../models/PortfolioProject.js';
import SelectedWork from '../models/SelectedWork.js';
import IndustrySlide from '../models/IndustrySlide.js';
import TestimonialEntry from '../models/TestimonialEntry.js';
import Contact from '../models/Contact.js';
import CareerApplication from '../models/CareerApplication.js';

const LEAD_STATUSES = ['prospect', 'viewed', 'replied', 'no_response', 'deal'];
const APP_STATUSES = [
  'pending',
  'viewed',
  'rejected',
  'selected',
  'under_evaluation',
  'on_hold',
  'future_use',
  'reviewed',
  'shortlisted',
  'accepted',
];

// --- Categories ---
export async function adminListCategories(_req, res) {
  try {
    const rows = await ProjectCategory.find({}).sort({ order: 1, createdAt: 1 });
    res.status(200).json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function adminCreateCategory(req, res) {
  try {
    const row = await ProjectCategory.create(req.body);
    res.status(201).json(row);
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ success: false, message: 'Duplicate key' });
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function adminUpdateCategory(req, res) {
  try {
    const row = await ProjectCategory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json(row);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function adminDeleteCategory(req, res) {
  try {
    const row = await ProjectCategory.findByIdAndDelete(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

// --- Portfolio projects ---
export async function adminListProjects(_req, res) {
  try {
    const rows = await PortfolioProject.find({}).sort({ order: 1, createdAt: 1 });
    res.status(200).json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function adminCreateProject(req, res) {
  try {
    const row = await PortfolioProject.create(req.body);
    res.status(201).json(row);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function adminUpdateProject(req, res) {
  try {
    const row = await PortfolioProject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json(row);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function adminDeleteProject(req, res) {
  try {
    const row = await PortfolioProject.findByIdAndDelete(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

// --- Selected work singleton ---
export async function adminGetSelectedWork(_req, res) {
  try {
    let doc = await SelectedWork.findOne({ key: 'default' });
    if (!doc) doc = await SelectedWork.create({ key: 'default' });
    res.status(200).json(doc);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function adminPutSelectedWork(req, res) {
  try {
    const body = req.body || {};
    const doc = await SelectedWork.findOneAndUpdate(
      { key: 'default' },
      {
        $set: {
          card1: { ...body.card1 },
          card2: { ...body.card2 },
          card3: { ...body.card3 },
          card4: { ...body.card4 },
        },
      },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(200).json(doc);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

// --- Industry slides ---
export async function adminListIndustrySlides(_req, res) {
  try {
    const rows = await IndustrySlide.find({}).sort({ order: 1, createdAt: 1 });
    res.status(200).json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function adminCreateIndustrySlide(req, res) {
  try {
    const row = await IndustrySlide.create(req.body);
    res.status(201).json(row);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function adminUpdateIndustrySlide(req, res) {
  try {
    const row = await IndustrySlide.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json(row);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function adminDeleteIndustrySlide(req, res) {
  try {
    const row = await IndustrySlide.findByIdAndDelete(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

// --- Testimonials ---
export async function adminListTestimonials(_req, res) {
  try {
    const rows = await TestimonialEntry.find({}).sort({ order: 1, createdAt: 1 });
    res.status(200).json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function adminCreateTestimonial(req, res) {
  try {
    const row = await TestimonialEntry.create(req.body);
    res.status(201).json(row);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function adminUpdateTestimonial(req, res) {
  try {
    const row = await TestimonialEntry.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json(row);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function adminDeleteTestimonial(req, res) {
  try {
    const row = await TestimonialEntry.findByIdAndDelete(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

// --- Contacts (queries) ---
export async function adminListContacts(_req, res) {
  try {
    const rows = await Contact.find({}).sort({ submittedAt: -1 }).lean();
    res.status(200).json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function adminPatchContact(req, res) {
  try {
    const { status } = req.body || {};
    if (!LEAD_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const row = await Contact.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json(row);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

// --- Career applications ---
export async function adminListApplications(_req, res) {
  try {
    const rows = await CareerApplication.find({}).sort({ submittedAt: -1 }).lean();
    res.status(200).json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function adminPatchApplication(req, res) {
  try {
    const { status } = req.body || {};
    if (!APP_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const row = await CareerApplication.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json(row);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}
