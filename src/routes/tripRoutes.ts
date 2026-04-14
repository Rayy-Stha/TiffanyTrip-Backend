import express from 'express';
import * as tripController from '../controller/tripController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All trip routes require authentication
router.post('/', authenticateToken, tripController.createTrip);
router.get('/', authenticateToken, tripController.getUserTrips);
router.get('/:id', authenticateToken, tripController.getTripById);
router.get('/:id/restaurants', authenticateToken, tripController.getTripRestaurants);
router.put('/:id', authenticateToken, tripController.updateTrip);
router.delete('/:id', authenticateToken, tripController.deleteTrip);

export default router;
