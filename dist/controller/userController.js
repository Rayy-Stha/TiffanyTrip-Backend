"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.editProfile = exports.resetPassword = exports.resetCode = exports.login = exports.resendOTP = exports.verifyOTPAndRegister = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = __importDefault(require("../model/index"));
const emailService_1 = require("../utils/emailService");
dotenv_1.default.config();
// Store temporary registration data with OTP
const tempRegistrations = {};
// Store temporary password reset data with OTP
const tempPasswordResets = {};
// Registration code - Send OTP to email
const register = async (req, res) => {
    const { full_name, email, phone, password, role } = req.body;
    try {
        console.log('📝 Registration Request:', { full_name, email, phone, role });
        // Validate required fields
        if (!full_name || !email || !phone || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        // Check if email already exists
        const existing = await index_1.default.user.findUnique({ where: { email } });
        if (existing && existing.is_verified) {
            return res.status(400).json({ message: "Email already exists and is verified" });
        }
        // Check if phone already exists and is verified
        const existingPhone = await index_1.default.user.findUnique({ where: { phone } });
        if (existingPhone && existingPhone.is_verified) {
            return res.status(400).json({ message: "Phone already exists and is verified" });
        }
        // Hash password
        const hashed = await bcryptjs_1.default.hash(password, 10);
        // Generate OTP
        const otp = (0, emailService_1.generateOTP)();
        const otp_expires_at = Date.now() + 10 * 60 * 1000; // 10 minutes validity
        // Validate and normalize role - only accept valid roles from schema
        const validRoles = ['ADMIN', 'TRAVELLER', 'BUS_OPERATOR', 'RESTAURANT'];
        const normalizedRole = (role || "TRAVELLER").toUpperCase();
        if (!validRoles.includes(normalizedRole)) {
            console.log('⚠️ Invalid role provided:', role, '- defaulting to TRAVELLER');
            const finalRole = 'TRAVELLER';
            console.log('✅ Final role:', finalRole);
        }
        else {
            console.log('✅ Normalized role:', normalizedRole);
        }
        const finalRole = validRoles.includes(normalizedRole) ? normalizedRole : 'TRAVELLER';
        // Store temporary registration data
        tempRegistrations[email] = {
            full_name,
            email,
            phone,
            password,
            password_hash: hashed,
            role: finalRole,
            otp,
            otp_expires_at,
        };
        console.log('💾 Stored temp registration for:', email);
        console.log('🔑 Generated OTP:', otp);
        // Send OTP to email
        const emailSent = await (0, emailService_1.sendOTPEmail)(email, otp);
        if (!emailSent) {
            delete tempRegistrations[email];
            return res.status(500).json({ message: "Failed to send OTP. Please try again." });
        }
        console.log('📧 OTP email sent successfully to:', email);
        return res.status(200).json({
            message: "Registration initiated. OTP sent to your email.",
            email,
        });
    }
    catch (err) {
        console.error("Register Error:", err);
        return res.status(500).json({ message: "Error registering user" });
    }
};
exports.register = register;
// Verify OTP and complete registration
const verifyOTPAndRegister = async (req, res) => {
    const { email, otp } = req.body;
    try {
        console.log('🔐 OTP Verification Request:', { email, otp });
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }
        // Check if temporary registration exists
        const tempReg = tempRegistrations[email];
        console.log('📋 Temp registration exists?', !!tempReg);
        console.log('📋 All temp registrations:', Object.keys(tempRegistrations));
        if (!tempReg) {
            return res.status(400).json({ message: "No pending registration found. Please register again." });
        }
        // Check if OTP has expired
        if (Date.now() > tempReg.otp_expires_at) {
            delete tempRegistrations[email];
            return res.status(400).json({ message: "OTP has expired. Please register again." });
        }
        // Verify OTP
        console.log('🔍 OTP Verification Debug:');
        console.log('  Stored OTP:', tempReg.otp);
        console.log('  Provided OTP:', otp);
        console.log('  Type of stored:', typeof tempReg.otp);
        console.log('  Type of provided:', typeof otp);
        console.log('  Trimmed match:', tempReg.otp.trim() === otp.trim());
        if (!(0, emailService_1.verifyOTP)(tempReg.otp, otp)) {
            return res.status(400).json({ message: "Invalid OTP. Please try again." });
        }
        // Check if user already exists (maybe from previous failed verification)
        const existingUser = await index_1.default.user.findUnique({ where: { email } });
        let user;
        if (existingUser) {
            // Update existing unverified user
            if (existingUser.is_verified) {
                delete tempRegistrations[email];
                return res.status(400).json({ message: "Email already verified. Please login instead." });
            }
            user = await index_1.default.user.update({
                where: { email },
                data: {
                    full_name: tempReg.full_name,
                    phone: tempReg.phone,
                    password_hash: tempReg.password_hash,
                    role: tempReg.role,
                    is_verified: true,
                },
            });
        }
        else {
            // Create new user
            user = await index_1.default.user.create({
                data: {
                    full_name: tempReg.full_name,
                    email: tempReg.email,
                    phone: tempReg.phone,
                    password_hash: tempReg.password_hash,
                    role: tempReg.role,
                    is_verified: true,
                },
            });
        }
        // Clean up temporary data
        delete tempRegistrations[email];
        // Generate JWT token for auto-login
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
        return res.status(201).json({
            message: "Registration successful! Your account is now verified.",
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                is_verified: user.is_verified,
            },
        });
    }
    catch (err) {
        console.error("OTP Verification Error:", err);
        return res.status(500).json({ message: "Error verifying OTP" });
    }
};
exports.verifyOTPAndRegister = verifyOTPAndRegister;
// Resend OTP
const resendOTP = async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        // Check if temporary registration exists
        const tempReg = tempRegistrations[email];
        if (!tempReg) {
            return res.status(400).json({ message: "No pending registration found for this email. Please register first." });
        }
        // Generate new OTP
        const newOtp = (0, emailService_1.generateOTP)();
        const newOtpExpiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity
        // Update temporary registration with new OTP
        tempRegistrations[email] = {
            ...tempReg,
            otp: newOtp,
            otp_expires_at: newOtpExpiresAt,
        };
        // Send new OTP to email
        const emailSent = await (0, emailService_1.sendOTPEmail)(email, newOtp);
        if (!emailSent) {
            return res.status(500).json({ message: "Failed to resend OTP. Please try again." });
        }
        return res.status(200).json({
            message: "OTP has been resent to your email.",
            email,
        });
    }
    catch (err) {
        console.error("Resend OTP Error:", err);
        return res.status(500).json({ message: "Error resending OTP" });
    }
};
exports.resendOTP = resendOTP;
// Login code 
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const user = await index_1.default.user.findUnique({ where: { email } });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        // Check if user is verified
        if (!user.is_verified) {
            return res.status(403).json({ message: "Please verify your email first" });
        }
        const validPass = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!validPass)
            return res.status(401).json({ message: "Invalid credentials" });
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, full_name: user.full_name, phone: user.phone, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
        // Return user details (excluding sensitive information)
        const userDetails = {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            is_verified: user.is_verified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        return res.status(200).json({
            message: "Login successful",
            token,
            user: userDetails
        });
    }
    catch (err) {
        console.error("Login Error:", err);
        return res.status(500).json({ message: "Error logging in" });
    }
};
exports.login = login;
// Reset code - Send OTP for password reset
const resetCode = async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        // Check if user exists
        const user = await index_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Check if user is verified
        if (!user.is_verified) {
            return res.status(403).json({ message: "Please verify your email first" });
        }
        // Generate OTP
        const otp = (0, emailService_1.generateOTP)();
        const otp_expires_at = Date.now() + 10 * 60 * 1000; // 10 minutes validity
        // Store temporary password reset data
        tempPasswordResets[email] = {
            email,
            otp,
            otp_expires_at,
        };
        // Send OTP to email
        const emailSent = await (0, emailService_1.sendPasswordResetOTPEmail)(email, otp);
        if (!emailSent) {
            delete tempPasswordResets[email];
            return res.status(500).json({ message: "Failed to send OTP. Please try again." });
        }
        return res.status(200).json({
            message: "Password reset OTP sent to your email.",
            email,
        });
    }
    catch (err) {
        console.error("Reset Code Error:", err);
        return res.status(500).json({ message: "Error sending reset code" });
    }
};
exports.resetCode = resetCode;
// Reset password - Verify OTP and update password
const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Email, OTP, and new password are required" });
        }
        // Check if temporary password reset exists
        const tempReset = tempPasswordResets[email];
        if (!tempReset) {
            return res.status(400).json({ message: "No password reset request found. Please request a reset code first." });
        }
        // Check if OTP has expired
        if (Date.now() > tempReset.otp_expires_at) {
            delete tempPasswordResets[email];
            return res.status(400).json({ message: "OTP has expired. Please request a new reset code." });
        }
        // Verify OTP
        if (!(0, emailService_1.verifyOTP)(tempReset.otp, otp)) {
            return res.status(400).json({ message: "Invalid OTP. Please try again." });
        }
        // Hash new password
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        // Update user password in database
        await index_1.default.user.update({
            where: { email },
            data: { password_hash: hashedPassword },
        });
        // Clean up temporary data
        delete tempPasswordResets[email];
        return res.status(200).json({
            message: "Password reset successful. You can now login with your new password.",
        });
    }
    catch (err) {
        console.error("Reset Password Error:", err);
        return res.status(500).json({ message: "Error resetting password" });
    }
};
exports.resetPassword = resetPassword;
// Edit profile - Update user profile information
const editProfile = async (req, res) => {
    const { full_name, phone } = req.body;
    const user = req.user; // From auth middleware
    try {
        if (!user || !user.id) {
            return res.status(401).json({ message: "Authentication required" });
        }
        // Validate input
        if (!full_name && !phone) {
            return res.status(400).json({ message: "At least one field (full_name or phone) must be provided" });
        }
        // Get current user
        const currentUser = await index_1.default.user.findUnique({ where: { id: user.id } });
        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }
        // Prepare update data
        const updateData = {};
        if (full_name)
            updateData.full_name = full_name;
        if (phone) {
            // Check if phone is already taken by another user
            if (phone !== currentUser.phone) {
                const phoneExists = await index_1.default.user.findUnique({ where: { phone } });
                if (phoneExists) {
                    return res.status(400).json({ message: "Phone number already exists" });
                }
            }
            updateData.phone = phone;
        }
        // Update user profile
        const updatedUser = await index_1.default.user.update({
            where: { id: user.id },
            data: updateData,
            select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
                role: true,
                is_verified: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser,
        });
    }
    catch (err) {
        console.error("Edit Profile Error:", err);
        return res.status(500).json({ message: "Error updating profile" });
    }
};
exports.editProfile = editProfile;
// Get current user profile
const getMe = async (req, res) => {
    const user = req.user;
    try {
        if (!user || !user.id) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const currentUser = await index_1.default.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
                role: true,
                is_verified: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({
            user: currentUser,
        });
    }
    catch (err) {
        console.error("Get Me Error:", err);
        return res.status(500).json({ message: "Error fetching profile" });
    }
};
exports.getMe = getMe;
//# sourceMappingURL=userController.js.map