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
const orderController = __importStar(require("../controller/orderController"));
const restaurantController = __importStar(require("../controller/restaurantController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// ============================================
// MENU ITEM ROUTES
// ============================================
router.post('/menu-items', auth_1.authenticateToken, restaurantController.createMenuItem);
router.put('/menu-items/:id', auth_1.authenticateToken, restaurantController.updateMenuItem);
router.delete('/menu-items/:id', auth_1.authenticateToken, restaurantController.deleteMenuItem);
// ============================================
// ORDER ROUTES
// ============================================
// All order routes require authentication
router.post('/orders', auth_1.authenticateToken, orderController.createOrder);
router.get('/orders', auth_1.authenticateToken, orderController.getUserOrders);
router.get('/orders/:id', auth_1.authenticateToken, orderController.getOrderById);
router.get('/:restaurantId/orders', auth_1.authenticateToken, orderController.getRestaurantOrders);
router.put('/orders/:id/status', auth_1.authenticateToken, orderController.updateOrderStatus);
// ============================================
// RESTAURANT ROUTES
// ============================================
// Protected routes (for restaurant owners)
router.get('/my-restaurant', auth_1.authenticateToken, restaurantController.getMyRestaurant);
router.post('/', auth_1.authenticateToken, restaurantController.createRestaurant);
router.put('/:id', auth_1.authenticateToken, restaurantController.updateRestaurant);
router.delete('/:id', auth_1.authenticateToken, restaurantController.deleteRestaurant);
// Public routes
router.get('/', restaurantController.getRestaurantsByRoute);
router.get('/:id', restaurantController.getRestaurantById);
router.get('/:id/menu', restaurantController.getMenu);
exports.default = router;
//# sourceMappingURL=restaurantRoutes.js.map