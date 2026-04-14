import express from 'express';
import { getBookingMessages, getOrderMessages, markAsRead } from '../controller/messageController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get messages for a booking
router.get('/booking/:bookingId', authenticateToken, getBookingMessages);

// Get messages for an order
router.get('/order/:orderId', authenticateToken, getOrderMessages);

// Mark messages as read (works for both booking/order)
router.put('/read', authenticateToken, markAsRead);
router.put('/booking/:bookingId/read', authenticateToken, markAsRead);
router.put('/order/:orderId/read', authenticateToken, markAsRead);

export default router;
