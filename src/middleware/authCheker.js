import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import config from "../config/config.js";
import AppError from "../utils/appError.js";

/**
 * Authentication middleware with multi-tenant support
 * @param {...string} requiredRoles - Roles allowed to access the route
 */
const auth = (...requiredRoles) => {
    return async (req, res, next) => {
        try {
            let token;

            if (
                req.headers.authorization &&
                req.headers.authorization.startsWith("Bearer")
            ) {
                token = req.headers.authorization.split(" ")[1];
            }

            if (!token) {
                return next(new AppError("Unauthorized access. Please login.", 401));
            }

            const decoded = jwt.verify(token, config.jwt.secret);

            const user = await User.findById(decoded.id).select("+password");

            if (!user) {
                return next(new AppError("User not found.", 404));
            }

            if (!user.isVerified) {
                return next(new AppError("Please verify your email first.", 403));
            }

            if (user.isBlocked) {
                return next(new AppError("Your account has been blocked. Contact support.", 403));
            }

            // Role check
            if (requiredRoles.length && !requiredRoles.includes(user.role)) {
                return next(new AppError("You are not permitted to access this resource.", 403));
            }

            // For merchant admin, ensure they have a merchantId
            if (user.role === "merchant_admin" && !user.merchantId) {
                return next(new AppError("Merchant account not properly configured.", 400));
            }

            // Attach user to request
            req.user = user;
            
            // Attach merchantId from user if not already set by tenant detection
            if (!req.merchantId && user.merchantId) {
                req.merchantId = user.merchantId;
            }

            next();
        } catch (err) {
            if (err.name === "JsonWebTokenError") {
                return next(new AppError("Invalid token.", 401));
            }
            if (err.name === "TokenExpiredError") {
                return next(new AppError("Token expired. Please login again.", 401));
            }
            return next(new AppError("Authentication failed.", 401));
        }
    };
};

export default auth;