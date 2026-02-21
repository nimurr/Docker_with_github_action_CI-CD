import catchAsync from "../middleware/catchAsync.js";
import authService from "../service/auth.service.js";
import response from "../utils/response.js";

const register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);

  response({
    statusCode: 201,
    status: "success",
    message: "User registered successfully. OTP sent to your email.",
    data: result,
  });
});

const login = catchAsync(async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authService.login({ email, password });

    response({
      statusCode: 200,
      status: "success",
      message: "User logged in successfully",
      data: { user },
    });
  } catch (error) {
    response({
      statusCode: 400,
      status: "fail",
      message: error.message,
      data: null,
    });
  }
});

const verifyEmail = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const result = await authService.verifyEmail({ email, otp });
  response({
    statusCode: 200,
    status: "success",
    message: "Email verified successfully. You can now log in.",
    data: result,
  });
});

const resendOTP = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await authService.resendOTP({ email });
  response({
    statusCode: 200,
    status: "success",
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