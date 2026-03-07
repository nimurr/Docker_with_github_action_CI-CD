import catchAsync from "../middleware/catchAsync.js";
import authService from "../service/auth.service.js";
import jwt from "jsonwebtoken";
import config from "../config/config.js";

const register = catchAsync(async (req, res) => {
  const userData = req.body;

  if (req.file) {
    const imagePath = `/uploads/profiles/${req.file.filename}`;
    userData.profileImage = imagePath;
  }

  const result = await authService.register(userData);

  res.status(result.statusCode).json({
    success: true,
    message: result.message,
    // data: result.user,
  });
});

const login = catchAsync(async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authService.login({ email, password });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role, merchantId: user.merchantId },
      config.jwt.secret,
      { expiresIn: config.jwt.access_expiration_minutes * 60 }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          merchantId: user.merchantId,
          isVerified: user.isVerified,
          merchantProfile: user.merchantProfile,
          customerProfile: user.customerProfile,
        },
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

const verifyEmail = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const result = await authService.verifyEmail({ email, otp });
  res.status(result.statusCode).json({
    success: true,
    message: result.message,
  });
});

const resendOTP = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await authService.resendOTP({ email });
  res.status(200).json({
    success: true,
    message: "OTP resent successfully. Please check your email.",
    data: result,
  });
});

const authController = {
  register,
  login,
  verifyEmail,
  resendOTP
};

export default authController;