"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const routeController_1 = require("../controller/routeController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public / General Routes
router.get('/', routeController_1.getAllRoutes);
router.post('/seed', routeController_1.seedRoutes); // Typically would have admin auth
// Operator specific Routes
router.get('/operator', auth_1.authenticateToken, routeController_1.getOperatorRoutes);
router.post('/', auth_1.authenticateToken, routeController_1.createRoute);
router.put('/:id', auth_1.authenticateToken, routeController_1.updateRoute);
router.delete('/:id', auth_1.authenticateToken, routeController_1.deleteRoute);
exports.default = router;
//# sourceMappingURL=routeRoutes.js.map