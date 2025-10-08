import e from "express";
import dotenv from "dotenv"
import OTPmodel from "../models/Otp.js";
import User from "../models/User/User.js";
import SibApiV3Sdk from 'sib-api-v3-sdk';
import crypto from "crypto"
import bcrypt from "bcrypt"
// import bodyParser from 'body-parser';
dotenv.config()

const router = e.Router()

const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();


//send OTP
router.post('/send', async (req, res) => {
  const { email } = req.body;
  console.log("Request reset password for email:", email);

  if (!email) {
    console.log("Email missing in request");
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found for email:", email);
      return res.status(404).json({ message: "User not found" });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTPmodel.findOneAndUpdate(
      { email },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    console.log("OTP generated and saved: ", otp);

    const sendSmtpEmail = {
      sender: { email: 'vildashnetwork02@gmail.com', name: 'wiciki' },
      to: [{ email }],
      subject: "Your Password Reset OTP Code",
      htmlContent: `
        <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f6f8; margin:0; padding:0; color:#333; }
        .container { max-width:600px; margin:40px auto; background:#fff; border-radius:12px; box-shadow:0 4px 15px rgba(0,0,0,0.1); overflow:hidden; }
        .header { background: linear-gradient(135deg, #fd0d0dff, #f21010ff); color:white; padding:25px; text-align:center; font-size:22px; font-weight:bold; }
        .content { padding:30px; }
        .otp-box { margin:20px 0; padding:20px; background:#f1f5f9; border-radius:8px; text-align:center; font-size:32px; letter-spacing:6px; font-weight:bold; color:#0d6efd; border:1px dashed #0d6efd; }
        .note { font-size:14px; color:#555; margin-top:10px; }
        .footer { background:#f9fafb; padding:20px; text-align:center; font-size:12px; color:#999; }
        @media (max-width:640px) { .container { margin:20px; } .otp-box { font-size:24px; letter-spacing:4px; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">Password Reset Request</div>
        <div class="content">
          <p>Hello <strong>${user.name || "there"}</strong>,</p>
          <p>We received a request to reset your password. Use the OTP below to continue. It’s valid for <strong>10 minutes</strong>:</p>
          <div class="otp-box">${otp}</div>
          <p class="note">⚠️ If you did not request this, please ignore this email.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} WICIKI. All rights reserved.
        </div>
      </div>
    </body>
    </html>
      `
    };

    try {
      const result = await emailApi.sendTransacEmail(sendSmtpEmail);
      console.log(`OTP email sent to ${email} with messageId: ${result.messageId}`);
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);
      return res.status(500).json({ message: "Error sending OTP email" });
    }

    res.status(200).json({ message: "OTP sent to your email", success: true });
  } catch (error) {
    console.error("Error in request-reset-password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post('/validate', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP are required" });

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const otpEntry = await OTPmodel.findOne({ email: normalizedEmail });

    if (!otpEntry)
      return res.status(400).json({ message: "OTP not found or expired" });

    if (otpEntry.otp.toString() !== otp.toString())
      return res.status(400).json({ message: "Invalid OTP" });

    if (otpEntry.expiresAt < new Date())
      return res.status(400).json({ message: "OTP expired" });

    // OTP is valid
    res.status(200).json({ message: "OTP validated successfully" });
  } catch (error) {
    console.error("Error validating OTP:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/reset", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword)
      return res.status(400).json({ message: "Email and new password are required" });

    const normalizedEmail = email.trim().toLowerCase();
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const updatedUser = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete OTP after successful password reset
    await OTPmodel.deleteOne({ email: normalizedEmail });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router