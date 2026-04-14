import express from 'express';
import { initiatePayment, verifyPayment } from '../controller/paymentController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/khalti/initiate', authenticateToken, initiatePayment);
router.post('/khalti/verify', authenticateToken, verifyPayment);

export default router;
