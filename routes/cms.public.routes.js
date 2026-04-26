import express from 'express';
import {
  getCategoriesPublic,
  getPortfolioProjectsPublic,
  getSelectedWorkPublic,
  getIndustrySlidesPublic,
  getTestimonialsPublic,
} from '../controller/cmsPublic.controller.js';

const router = express.Router();

router.get('/cms/categories', getCategoriesPublic);
router.get('/cms/portfolio-projects', getPortfolioProjectsPublic);
router.get('/cms/selected-work', getSelectedWorkPublic);
router.get('/cms/industry-slides', getIndustrySlidesPublic);
router.get('/cms/testimonials', getTestimonialsPublic);

export default router;
