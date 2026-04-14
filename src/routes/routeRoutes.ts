import { Router } from 'express';
import { createRoute, deleteRoute, getAllRoutes, getOperatorRoutes, seedRoutes, updateRoute } from '../controller/routeController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public / General Routes
router.get('/', getAllRoutes);
router.post('/seed', seedRoutes); // Typically would have admin auth

// Operator specific Routes
router.get('/operator', authenticateToken, getOperatorRoutes);
router.post('/', authenticateToken, createRoute);
router.put('/:id', authenticateToken, updateRoute);
router.delete('/:id', authenticateToken, deleteRoute);

export default router;
