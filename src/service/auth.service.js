import User from "../models/user.model.js";
import bcrypt from "bcryptjs"; // assuming you hash passwords
import { sendVerificationOTP } from "./otp.service.js";
import AppError from "../utils/appError.js";
import otpModel from "../models/otp.model.js";


const register = async (data) => {
    const { email, password, fullName, role } = data;

    // 1️⃣ Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        if (existingUser.isVerified) {
            // Already verified → cannot register again
            throw new AppError("Email already in use. Please login.", 400);
        } else {
            // Exists but not verified → resend OTP
            await sendVerificationOTP(existingUser._id);

            // ✅ Return here to prevent creating a duplicate user
            throw new AppError("Email already registered but not verified. OTP resent to your email.", 400);
        }
    }

    // 2️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3️⃣ Create new user
    const newUser = await User.create({
        fullName,
        email,
        password: hashedPassword,
        role,
    });

    // 4️⃣ Send OTP
    await sendVerificationOTP(newUser._id);

    return newUser;
};


const login = async ({ email, password }) => {
    // 1️⃣ Find user
    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new Error("Invalid email or password");

    // 2️⃣ Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid email or password");

    // 3️⃣ Check if email is verified
    if (!user.isVerified) {
        // Optionally, re-send OTP if user not verified
        await sendVerificationOTP(user._id);
        throw new AppError("Email not verified. OTP sent to your email.", 400);
    }
    if (user.isDeleted) throw new AppError("Account is deleted. Contact support.", 403);

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
    throw new AppError("Email verified successfully. You can now log in.", 200);

}
const resendOTP = async ({ email }) => {
    const user = await User.findOne({ email });
    if (!user) throw new AppError("User not found", 404);
    if (user.isVerified) throw new AppError("Email already verified", 400);
    await sendVerificationOTP(user._id);
    throw new AppError("OTP resent successfully. Please check your email.", 200);
}

const authService = {
    register,
    login,
    verifyEmail,
    resendOTP
};

export default authService;