import express from 'express';
import {
    editProfile,
    getMe,
    login,
    register,
    resendOTP,
    resetCode,
    resetPassword,
    verifyOTPAndRegister
} from '../controller/userController';

import { authenticateToken } from '../utils/authMiddleware';
import catchAsync from '../utils/catchAsync';

const UserRouter = () => {
    const router = express.Router();

    // REGISTER - Send OTP
    router.post('/register', catchAsync(register));

    // VERIFY OTP - Complete registration
    router.post('/verify-otp', catchAsync(verifyOTPAndRegister));

    // RESEND OTP
    router.post('/resend-otp', catchAsync(resendOTP));

    // LOGIN
    router.post('/login', catchAsync(login));

    // RESET CODE - Send OTP for password reset
    router.post('/reset-code', catchAsync(resetCode));

    // RESET PASSWORD - Verify OTP and update password
    router.post('/reset-password', catchAsync(resetPassword));

    // EDIT PROFILE - Update user profile (requires authentication)
    router.put('/edit-profile', authenticateToken, catchAsync(editProfile));

    // GET ME - Get current user profile (requires authentication)
    router.get('/me', authenticateToken, catchAsync(getMe));

    return router;
};

export default UserRouter;