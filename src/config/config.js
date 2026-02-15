import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const config = {
  env: process.env.NODE_ENV || "dev",
  port: process.env.PORT || 3000,
  backend_ip: process.env.BACKEND_IP || "localhost",
  mongodb_url: process.env.MONGODB_URL || "",

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    access_expiration_minutes: parseInt(process.env.JWT_ACCESS_EXPIRATION_MINUTES, 10) || 60,
    refresh_expiration_days: parseInt(process.env.JWT_REFRESH_EXPIRATION_DAYS, 10) || 30,
    reset_password_expiration_minutes: parseInt(process.env.JWT_RESET_PASSWORD_EXPIRATION_MINUTES, 10) || 10,
    verify_email_expiration_minutes: parseInt(process.env.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES, 10) || 10,
  },

  // Email / SMTP configuration
  email: {
    smtp_host: process.env.SMTP_HOST,
    smtp_port: parseInt(process.env.SMTP_PORT, 10) || 587,
    smtp_username: process.env.SMTP_USERNAME,
    smtp_password: process.env.SMTP_PASSWORD,
    email_from: process.env.EMAIL_FROM,
  },

  // Stripe configuration
  stripe: {
    secret_key: process.env.STRIPE_SECRET_KEY,
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  // Redis configuration
  redisUrl: process.env.REDIS_URL || "redis://127.0.0.1:6379",

  // Cloudinary config (if needed later)
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
    api_key: process.env.CLOUDINARY_API_KEY || "",
    api_secret: process.env.CLOUDINARY_API_SECRET || "",
  },
};

export default config;
