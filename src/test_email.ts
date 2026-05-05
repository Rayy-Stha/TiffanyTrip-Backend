import { sendOTPEmail } from "./utils/emailService";
import dotenv from "dotenv";

dotenv.config();

const testEmail = async () => {
    const recipient = "raymonshrestha535@gmail.com";
    const otp = "12345";
    
    console.log(`Attempting to send test OTP email to ${recipient}...`);
    
    const success = await sendOTPEmail(recipient, otp);
    
    if (success) {
        console.log("✅ Test email sent successfully!");
    } else {
        console.log("❌ Failed to send test email. Please check your Mailjet configuration and verify your sender email.");
    }
    process.exit(success ? 0 : 1);
};

testEmail();
