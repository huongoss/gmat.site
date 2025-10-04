import express from 'express';
import requireAuth from '../middleware/requireAuth';
import requireAdmin from '../middleware/requireAdmin';
import { sendSalesEmail } from '../controllers/adminController';

const router = express.Router();

router.post('/email', requireAuth, requireAdmin, sendSalesEmail);

export default router;
