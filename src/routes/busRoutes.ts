import express from 'express';
import * as bookingController from '../controller/bookingController';
import * as busController from '../controller/busController';
import * as routeController from '../controller/routeController';
import * as scheduleController from '../controller/scheduleController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// ============================================
// BOOKING ROUTES (Specific routes first)
// ============================================

// All booking routes require authentication
router.get('/operator/bookings', authenticateToken, bookingController.getOperatorBookings);
router.post('/bookings', authenticateToken, bookingController.createBooking);
router.get('/bookings', authenticateToken, bookingController.getUserBookings);

// ID-based booking routes
router.get('/bookings/:id', authenticateToken, bookingController.getBookingById);
router.put('/bookings/:id/cancel', authenticateToken, bookingController.cancelBooking);
router.put('/bookings/:id/confirm', authenticateToken, bookingController.confirmBooking);

// ============================================
// SCHEDULE ROUTES
// ============================================

// Protected routes (for operators)
router.get('/operator/schedules', authenticateToken, scheduleController.getOperatorSchedules);
router.post('/schedules', authenticateToken, scheduleController.createSchedule);
router.put('/schedules/:id', authenticateToken, scheduleController.updateSchedule);
router.delete('/schedules/:id', authenticateToken, scheduleController.deleteSchedule);

// More specific paths first
router.get('/schedules/:id/seats', scheduleController.getSeats);
router.get('/schedules/:id', scheduleController.getScheduleById);
router.get('/:busId/schedules', scheduleController.getSchedulesByBus);

// ============================================
// BUS ROUTES (Generic ID routes last)
// ============================================

// Public routes
router.get('/routes', routeController.getAllRoutes);
router.get('/routes/seed', routeController.seedRoutes); // Temporary seed endpoint
router.get('/search', busController.searchBuses);

// Protected routes (for operators)
router.get('/', authenticateToken, busController.getAllBuses);
router.post('/', authenticateToken, busController.createBus);

// ID-based routes (Must be after specific paths)
router.get('/:id', busController.getBusById);
router.put('/:id', authenticateToken, busController.updateBus);
router.delete('/:id', authenticateToken, busController.deleteBus);

export default router;
