"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const messageController_1 = require("../controller/messageController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get messages for a booking
router.get('/booking/:bookingId', auth_1.authenticateToken, messageController_1.getBookingMessages);
// Get messages for an order
router.get('/order/:orderId', auth_1.authenticateToken, messageController_1.getOrderMessages);
// Mark messages as read (works for both booking/order)
router.put('/read', auth_1.authenticateToken, messageController_1.markAsRead);
router.put('/booking/:bookingId/read', auth_1.authenticateToken, messageController_1.markAsRead);
router.put('/order/:orderId/read', auth_1.authenticateToken, messageController_1.markAsRead);
exports.default = router;
//# sourceMappingURL=messageRoutes.js.map