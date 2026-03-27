import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { sendVerificationOTP } from "./otp.service.js";
import AppError from "../utils/appError.js";
import otpModel from "../models/otp.model.js";
import jwt from "jsonwebtoken";
import config from "../config/config.js";

const register = async (data) => {
    const { email, password, fullName, role,  merchantId } = data;

    // 1️⃣ Check if user exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        if (existingUser.isVerified) {
            throw new AppError("Email already in use. Please login.", 400);
        } else {
            await sendVerificationOTP(existingUser._id);

            return {
                statusCode: 200,
                message:
                    "Email already registered but not verified. OTP resent to your email.",
                user: existingUser,
            };
        }
    }

    // 2️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3️⃣ Create user
    const newUser = await User.create({
        fullName,
        email,
        password: hashedPassword,
        role: role || "customer",
        merchantId: merchantId || null,
    });

    // 4️⃣ Send OTP
    await sendVerificationOTP(newUser._id);

    return {
        statusCode: 201,
        message: "User registered successfully. OTP sent to your email.",
        user: newUser,
    };
};

const login = async ({ email, password }) => {
    // 1️⃣ Find user
    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new Error("Invalid email or password");

    // 2️⃣ Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid email or password");

    if (user.isBlocked) throw new AppError("Account is blocked. Contact support.", 403);

    // 4️⃣ Return user (omit password)
    user.password = undefined;
    return user;
};

const verifyEmail = async ({ email, otp }) => {
    const user = await User.findOne({ email });
    if (!user) throw new AppError("User not found", 404);
    if (user.isVerified) throw new AppError("Email already verified", 400);

    // Verify OTP
    const isValidOTP = await otpModel.findOne({
        userId: user._id,
        otp,
        purpose: "email_verification",
        expiresAt: { $gt: new Date() },
    });
    if (!isValidOTP) throw new AppError("Invalid or expired OTP", 400);

    // Mark user as verified
    user.isVerified = true;
    await user.save();
    // Optionally, delete used OTP
    await otpModel.deleteMany({ userId: user._id, purpose: "email_verification" });
    return {
        statusCode: 200,
        message: "Email verified successfully. You can now log in.",
    };
}

const resendOTP = async ({ email }) => {
    const user = await User.findOne({ email });
    if (!user) throw new AppError("User not found", 404);
    if (user.isVerified) throw new AppError("Email already verified", 400);
    await sendVerificationOTP(user._id);
    return {
        statusCode: 200,
        message: "OTP resent successfully. Please check your email.",
    };
}

/**
 * Register a new master admin (first user)
 */
const registerMasterAdmin = async (data) => {
    const { email, password, fullName } = data;

    // Check if any master admin exists
    const existingAdmin = await User.findOne({ role: "master_admin" });
    if (existingAdmin) {
        throw new AppError("Master admin already exists.", 400);
    }

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError("Email already in use.", 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create master admin
    const admin = await User.create({
        fullName,
        email,
        password: hashedPassword,
        role: "master_admin",
        isVerified: true,
    });

    return {
        statusCode: 201,
        message: "Master admin created successfully.",
        admin,
    };
};

/**
 * Generate JWT token
 */
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role, merchantId: user.merchantId },
        config.jwt.secret,
        { expiresIn: config.jwt.access_expiration_minutes * 60 }
    );
};

const authService = {
    register,
    login,
    verifyEmail,
    resendOTP,
    registerMasterAdmin,
    generateToken,
};

export default authService;