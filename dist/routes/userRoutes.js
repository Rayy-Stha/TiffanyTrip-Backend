"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controller/userController");
const authMiddleware_1 = require("../utils/authMiddleware");
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const UserRouter = () => {
    const router = express_1.default.Router();
    // REGISTER - Send OTP
    router.post('/register', (0, catchAsync_1.default)(userController_1.register));
    // VERIFY OTP - Complete registration
    router.post('/verify-otp', (0, catchAsync_1.default)(userController_1.verifyOTPAndRegister));
    // RESEND OTP
    router.post('/resend-otp', (0, catchAsync_1.default)(userController_1.resendOTP));
    // LOGIN
    router.post('/login', (0, catchAsync_1.default)(userController_1.login));
    // RESET CODE - Send OTP for password reset
    router.post('/reset-code', (0, catchAsync_1.default)(userController_1.resetCode));
    // RESET PASSWORD - Verify OTP and update password
    router.post('/reset-password', (0, catchAsync_1.default)(userController_1.resetPassword));
    // EDIT PROFILE - Update user profile (requires authentication)
    router.put('/edit-profile', authMiddleware_1.authenticateToken, (0, catchAsync_1.default)(userController_1.editProfile));
    // GET ME - Get current user profile (requires authentication)
    router.get('/me', authMiddleware_1.authenticateToken, (0, catchAsync_1.default)(userController_1.getMe));
    return router;
};
exports.default = UserRouter;
//# sourceMappingURL=userRoutes.js.map