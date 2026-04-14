import express from 'express';
import { authenticateToken } from '../middleware/auth';
import * as dashboardController from '../controller/dashboardController';

const router = express.Router();

// All dashboard routes require authentication
router.get('/upcoming-trips', authenticateToken, dashboardController.getUpcomingTrips);
router.get('/recommendations', authenticateToken, dashboardController.getRecommendations);
router.get('/stats', authenticateToken, dashboardController.getUserStats);

export default router;
