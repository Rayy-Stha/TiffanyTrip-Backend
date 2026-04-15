import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create transporter using SMTP credentials from .env
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'in-v3.mailjet.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.MAILJET_API_KEY || process.env.SMTP_USER,
        pass: process.env.MAILJET_SECRET_KEY || process.env.SMTP_PASS,
    },
});

// Generate a random 5-digit OTP
export const generateOTP = (): string => {
    return Math.floor(10000 + Math.random() * 90000).toString();
};

// Send OTP to email
export const sendOTPEmail = async (email: string, otp: string): Promise<boolean> => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || "remanstha10@gmail.com",
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
    } catch (error) {
        console.error("Error sending OTP email:", error);
        return false;
    }
};

// Send password reset OTP to email
export const sendPasswordResetOTPEmail = async (email: string, otp: string): Promise<boolean> => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || "remanstha10@gmail.com",
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
    } catch (error) {
        console.error("Error sending password reset OTP email:", error);
        return false;
    }
};

// Verify OTP (basic validation)
export const verifyOTP = (storedOTP: string, providedOTP: string): boolean => {
    // Trim whitespace and convert to string to handle any type mismatches
    const stored = String(storedOTP).trim();
    const provided = String(providedOTP).trim();
    return stored === provided;
};