import express from 'express';
import requireAuth from '../middleware/requireAuth';
import requireAdmin from '../middleware/requireAdmin';
import { sendSalesEmail, getAllUsers, deleteUser } from '../controllers/adminController';

const router = express.Router();

router.post('/email', requireAuth, requireAdmin, sendSalesEmail);
router.get('/users', requireAuth, requireAdmin, getAllUsers);
router.delete('/users/:userId', requireAuth, requireAdmin, deleteUser);

export default router;
