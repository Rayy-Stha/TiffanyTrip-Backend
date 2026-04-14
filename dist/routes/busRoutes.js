"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bookingController = __importStar(require("../controller/bookingController"));
const busController = __importStar(require("../controller/busController"));
const routeController = __importStar(require("../controller/routeController"));
const scheduleController = __importStar(require("../controller/scheduleController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// ============================================
// BOOKING ROUTES (Specific routes first)
// ============================================
// All booking routes require authentication
router.get('/operator/bookings', auth_1.authenticateToken, bookingController.getOperatorBookings);
router.post('/bookings', auth_1.authenticateToken, bookingController.createBooking);
router.get('/bookings', auth_1.authenticateToken, bookingController.getUserBookings);
// ID-based booking routes
router.get('/bookings/:id', auth_1.authenticateToken, bookingController.getBookingById);
router.put('/bookings/:id/cancel', auth_1.authenticateToken, bookingController.cancelBooking);
router.put('/bookings/:id/confirm', auth_1.authenticateToken, bookingController.confirmBooking);
// ============================================
// SCHEDULE ROUTES
// ============================================
// Protected routes (for operators)
router.get('/operator/schedules', auth_1.authenticateToken, scheduleController.getOperatorSchedules);
router.post('/schedules', auth_1.authenticateToken, scheduleController.createSchedule);
router.put('/schedules/:id', auth_1.authenticateToken, scheduleController.updateSchedule);
router.delete('/schedules/:id', auth_1.authenticateToken, scheduleController.deleteSchedule);
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
router.get('/', auth_1.authenticateToken, busController.getAllBuses);
router.post('/', auth_1.authenticateToken, busController.createBus);
// ID-based routes (Must be after specific paths)
router.get('/:id', busController.getBusById);
router.put('/:id', auth_1.authenticateToken, busController.updateBus);
router.delete('/:id', auth_1.authenticateToken, busController.deleteBus);
exports.default = router;
//# sourceMappingURL=busRoutes.js.map