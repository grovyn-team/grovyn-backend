import express from 'express';
import { subscribeNewsletter } from '../controller/newsletter.controller.js';

const router = express.Router();

router.post('/newsletter', subscribeNewsletter);

export default router;
