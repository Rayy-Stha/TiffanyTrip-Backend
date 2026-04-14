import express from 'express';
import * as orderController from '../controller/orderController';
import * as restaurantController from '../controller/restaurantController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// ============================================
// MENU ITEM ROUTES
// ============================================

router.post('/menu-items', authenticateToken, restaurantController.createMenuItem);
router.put('/menu-items/:id', authenticateToken, restaurantController.updateMenuItem);
router.delete('/menu-items/:id', authenticateToken, restaurantController.deleteMenuItem);

// ============================================
// ORDER ROUTES
// ============================================

// All order routes require authentication
router.post('/orders', authenticateToken, orderController.createOrder);
router.get('/orders', authenticateToken, orderController.getUserOrders);
router.get('/orders/:id', authenticateToken, orderController.getOrderById);
router.get('/:restaurantId/orders', authenticateToken, orderController.getRestaurantOrders);
router.put('/orders/:id/status', authenticateToken, orderController.updateOrderStatus);

// ============================================
// RESTAURANT ROUTES
// ============================================

// Protected routes (for restaurant owners)
router.get('/my-restaurant', authenticateToken, restaurantController.getMyRestaurant);
router.post('/', authenticateToken, restaurantController.createRestaurant);
router.put('/:id', authenticateToken, restaurantController.updateRestaurant);
router.delete('/:id', authenticateToken, restaurantController.deleteRestaurant);

// Public routes
router.get('/', restaurantController.getRestaurantsByRoute);
router.get('/:id', restaurantController.getRestaurantById);
router.get('/:id/menu', restaurantController.getMenu);



export default router;
