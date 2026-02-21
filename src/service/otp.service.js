import config from "../config/config.js";
import OTP from "../models/otp.model.js";
import User from "../models/user.model.js";
import nodemailer from "nodemailer";
import AppError from "../utils/appError.js";

// Configure Nodemailer (Gmail example)
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: config.email.smtp_username, // your email
    pass: config.email.smtp_password, // your email password or app password
  },
});

// Generate OTP
function generateOTP(length = 6) {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}


export const sendVerificationOTP = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const otp = generateOTP();

  // Store OTP in DB
  await OTP.create({
    userId: user._id,
    otp,
    purpose: "email_verification",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Verify your email",
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #4caf50; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0; font-size: 24px;">Verify Your Email</h2>
      </div>
      <div style="padding: 30px; text-align: center;">
        <p style="font-size: 16px; color: #333;">Hello <strong>${user.fullName}</strong>,</p>
        <p style="font-size: 16px; color: #333;">Use the OTP below to verify your email address. This OTP will expire in 10 minutes.</p>
        
        <div style="margin: 20px 0;">
          <span style="display: inline-block; font-size: 24px; letter-spacing: 4px; background-color: #f0f0f0; padding: 15px 25px; border-radius: 6px; font-weight: bold;">${otp}</span>
        </div>
  
        <p style="font-size: 14px; color: #666;">If you did not request this, please ignore this email.</p>
        
        <a href="http://${config.backend_ip}/api/v1/auth/login" 
           style="display: inline-block; margin-top: 20px; padding: 12px 30px; background-color: #4caf50; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
           Go to Login
        </a>
      </div>
      <div style="background-color: #f5f5f5; text-align: center; padding: 15px; font-size: 12px; color: #999;">
        © 2026 YourCompany. All rights reserved.
      </div>
    </div>
  `,
    });
    throw new AppError("OTP email sent successfully", 200);
    console.log("OTP email sent to:", user.email);
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    // DO NOT throw — just log and allow the API to continue
  }

  return true; // always return
};