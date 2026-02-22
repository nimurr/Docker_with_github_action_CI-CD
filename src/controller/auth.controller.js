import catchAsync from "../middleware/catchAsync.js";
import authService from "../service/auth.service.js";

const register = catchAsync(async (req, res) => {
  const userData = req.body;

  if (req.file) {
    userData.profileImage = req.file.path;
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

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: user,
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