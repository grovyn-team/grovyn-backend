import express from 'express';
import { requireAdmin } from '../middleware/adminAuth.js';
import {
  adminBootstrap,
  adminLogin,
  adminVerifyLoginOtp,
  adminResendLoginOtp,
  adminForgotPassword,
  adminVerifyResetOtp,
  adminResetPassword,
  adminMe,
  adminLogout,
} from '../controller/adminAuth.controller.js';
import { adminListUsers, adminCreateUser, adminDeleteUser } from '../controller/adminUsers.controller.js';
import { signCloudinaryUpload } from '../controller/uploadAdmin.controller.js';
import {
  adminListCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminListProjects,
  adminCreateProject,
  adminUpdateProject,
  adminDeleteProject,
  adminGetSelectedWork,
  adminPutSelectedWork,
  adminListIndustrySlides,
  adminCreateIndustrySlide,
  adminUpdateIndustrySlide,
  adminDeleteIndustrySlide,
  adminListTestimonials,
  adminCreateTestimonial,
  adminUpdateTestimonial,
  adminDeleteTestimonial,
  adminListContacts,
  adminPatchContact,
  adminListApplications,
  adminPatchApplication,
} from '../controller/cmsAdmin.controller.js';
import {
  createOpening,
  updateOpening,
  deleteOpening,
  streamApplicationResume,
} from '../controller/career.controller.js';

const router = express.Router();

router.post('/admin/auth/bootstrap', adminBootstrap);
router.post('/admin/auth/login', adminLogin);
router.post('/admin/auth/verify-login-otp', adminVerifyLoginOtp);
router.post('/admin/auth/resend-login-otp', adminResendLoginOtp);
router.post('/admin/auth/forgot-password', adminForgotPassword);
router.post('/admin/auth/verify-reset-otp', adminVerifyResetOtp);
router.post('/admin/auth/reset-password', adminResetPassword);
router.get('/admin/auth/me', adminMe);
router.post('/admin/auth/logout', adminLogout);

router.get('/admin/users', requireAdmin, adminListUsers);
router.post('/admin/users', requireAdmin, adminCreateUser);
router.delete('/admin/users/:id', requireAdmin, adminDeleteUser);

router.post('/admin/upload/sign', requireAdmin, signCloudinaryUpload);

router.get('/admin/categories', requireAdmin, adminListCategories);
router.post('/admin/categories', requireAdmin, adminCreateCategory);
router.put('/admin/categories/:id', requireAdmin, adminUpdateCategory);
router.delete('/admin/categories/:id', requireAdmin, adminDeleteCategory);

router.get('/admin/portfolio-projects', requireAdmin, adminListProjects);
router.post('/admin/portfolio-projects', requireAdmin, adminCreateProject);
router.put('/admin/portfolio-projects/:id', requireAdmin, adminUpdateProject);
router.delete('/admin/portfolio-projects/:id', requireAdmin, adminDeleteProject);

router.get('/admin/selected-work', requireAdmin, adminGetSelectedWork);
router.put('/admin/selected-work', requireAdmin, adminPutSelectedWork);

router.get('/admin/industry-slides', requireAdmin, adminListIndustrySlides);
router.post('/admin/industry-slides', requireAdmin, adminCreateIndustrySlide);
router.put('/admin/industry-slides/:id', requireAdmin, adminUpdateIndustrySlide);
router.delete('/admin/industry-slides/:id', requireAdmin, adminDeleteIndustrySlide);

router.get('/admin/testimonials', requireAdmin, adminListTestimonials);
router.post('/admin/testimonials', requireAdmin, adminCreateTestimonial);
router.put('/admin/testimonials/:id', requireAdmin, adminUpdateTestimonial);
router.delete('/admin/testimonials/:id', requireAdmin, adminDeleteTestimonial);

router.get('/admin/contacts', requireAdmin, adminListContacts);
router.patch('/admin/contacts/:id', requireAdmin, adminPatchContact);

router.get('/admin/career-applications', requireAdmin, adminListApplications);
router.get('/admin/career-applications/:id/resume', requireAdmin, streamApplicationResume);
router.patch('/admin/career-applications/:id', requireAdmin, adminPatchApplication);

router.post('/admin/careers/openings', requireAdmin, createOpening);
router.put('/admin/careers/openings/:id', requireAdmin, updateOpening);
router.delete('/admin/careers/openings/:id', requireAdmin, deleteOpening);

export default router;
