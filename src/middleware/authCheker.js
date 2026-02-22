import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import config from "../config/config.js";
import AppError from "../utils/appError.js";

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
                return next(new AppError("Unauthorized access.", 401));
            }

            const decoded = jwt.verify(token, config.jwt.access_secret);

            const user = await User.findById(decoded.id);

            if (!user) {
                return next(new AppError("User not found.", 404));
            }

            if (!user.isVerified) {
                return next(new AppError("Please verify your email first.", 403));
            }

            if (user.status === "inactive") {
                return next(
                    new AppError("Account is inactive. Contact support.", 403)
                );
            }

            // ✅ Role check
            if (requiredRoles.length && !requiredRoles.includes(user.role)) {
                return next(new AppError("You are not permitted.", 403));
            }

            req.user = user;
            next();
        } catch (err) {
            return next(new AppError("Invalid or expired token.", 401));
        }
    };
};

export default auth;