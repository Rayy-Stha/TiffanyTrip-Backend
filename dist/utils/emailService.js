"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOTP = exports.sendPasswordResetOTPEmail = exports.sendOTPEmail = exports.generateOTP = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Create transporter using SMTP credentials from .env
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
// Generate a random 5-digit OTP
const generateOTP = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
};
exports.generateOTP = generateOTP;
// Send OTP to email
const sendOTPEmail = async (email, otp) => {
    try {
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: "Triffny Trip - Email Verification OTP",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #FF6B35; margin: 0; font-size: 32px;">Triffny Trip</h1>
                        <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Your Journey, Our Care</p>
                    </div>
                    
                    <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-top: 0; font-size: 24px;">Email Verification</h2>
                        
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                            Welcome to Triffny Trip! To complete your account setup, please verify your email address using the OTP below:
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="background-color: #FF6B35; padding: 20px; border-radius: 8px; display: inline-block;">
                                <p style="color: white; font-size: 40px; letter-spacing: 8px; margin: 0; font-weight: bold; font-family: 'Courier New', monospace;">
                                    ${otp}
                                </p>
                            </div>
                        </div>
                        
                        <p style="color: #999; font-size: 14px; text-align: center;">
                            This OTP is valid for <strong>10 minutes</strong> only.
                        </p>
                        
                        <div style="background-color: #FFF3E0; border-left: 4px solid #FF6B35; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="color: #E65100; margin: 0; font-size: 14px;">
                                <strong>⚠️ Security Notice:</strong> Never share this OTP with anyone. Triffny Trip staff will never ask for your OTP.
                            </p>
                        </div>
                        
                        <p style="color: #666; font-size: 14px; line-height: 1.6;">
                            If you didn't create this account, please ignore this email.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #999; font-size: 12px; margin: 0;">
                            © 2025 Triffny Trip. All rights reserved.<br>
                            <a href="https://triffnytrip.com" style="color: #FF6B35; text-decoration: none;">Visit our website</a>
                        </p>
                    </div>
                </div>
            `,
            text: `Triffny Trip - Email Verification\n\nYour OTP is: ${otp}\n\nThis is valid for 10 minutes.\n\nDo not share this OTP with anyone.\n\nTriffny Trip - Your Journey, Our Care`,
        });
        console.log(`OTP sent successfully to ${email}`);
        return true;
    }
    catch (error) {
        console.error("Error sending OTP email:", error);
        return false;
    }
};
exports.sendOTPEmail = sendOTPEmail;
// Send password reset OTP to email
const sendPasswordResetOTPEmail = async (email, otp) => {
    try {
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: "Triffny Trip - Password Reset OTP",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #FF6B35; margin: 0; font-size: 32px;">Triffny Trip</h1>
                        <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Your Journey, Our Care</p>
                    </div>
                    
                    <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-top: 0; font-size: 24px;">Password Reset</h2>
                        
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                            We received a request to reset your password. Use the OTP below to reset your password:
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="background-color: #FF6B35; padding: 20px; border-radius: 8px; display: inline-block;">
                                <p style="color: white; font-size: 40px; letter-spacing: 8px; margin: 0; font-weight: bold; font-family: 'Courier New', monospace;">
                                    ${otp}
                                </p>
                            </div>
                        </div>
                        
                        <p style="color: #999; font-size: 14px; text-align: center;">
                            This OTP is valid for <strong>10 minutes</strong> only.
                        </p>
                        
                        <div style="background-color: #FFF3E0; border-left: 4px solid #FF6B35; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="color: #E65100; margin: 0; font-size: 14px;">
                                <strong>⚠️ Security Notice:</strong> Never share this OTP with anyone. Triffny Trip staff will never ask for your OTP.
                            </p>
                        </div>
                        
                        <p style="color: #666; font-size: 14px; line-height: 1.6;">
                            If you didn't request this password reset, please ignore this email.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #999; font-size: 12px; margin: 0;">
                            © 2025 Triffny Trip. All rights reserved.<br>
                            <a href="https://triffnytrip.com" style="color: #FF6B35; text-decoration: none;">Visit our website</a>
                        </p>
                    </div>
                </div>
            `,
            text: `Triffny Trip - Password Reset\n\nYour OTP is: ${otp}\n\nThis is valid for 10 minutes.\n\nDo not share this OTP with anyone.\n\nTriffny Trip - Your Journey, Our Care`,
        });
        console.log(`Password reset OTP sent successfully to ${email}`);
        return true;
    }
    catch (error) {
        console.error("Error sending password reset OTP email:", error);
        return false;
    }
};
exports.sendPasswordResetOTPEmail = sendPasswordResetOTPEmail;
// Verify OTP (basic validation)
const verifyOTP = (storedOTP, providedOTP) => {
    // Trim whitespace and convert to string to handle any type mismatches
    const stored = String(storedOTP).trim();
    const provided = String(providedOTP).trim();
    return stored === provided;
};
exports.verifyOTP = verifyOTP;
//# sourceMappingURL=emailService.js.map