"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController_1 = require("../controller/paymentController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.post('/khalti/initiate', auth_1.authenticateToken, paymentController_1.initiatePayment);
router.post('/khalti/verify', auth_1.authenticateToken, paymentController_1.verifyPayment);
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map