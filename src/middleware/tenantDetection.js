import Merchant from "../models/merchant.model.js";
import AppError from "../utils/appError.js";

/**
 * Domain-based tenant detection middleware
 * Detects the merchant based on the request host/domain
 * and attaches merchant info to the request object
 */
const detectTenant = async (req, res, next) => {
    try {
        // Get domain from request header
        const domain = req.headers.host || req.headers["x-domain"] || req.get("host");

        if (!domain) {
            // For API requests without domain, merchantId might come from JWT
            return next();
        }

        // Extract just the hostname (remove port if present)
        const hostname = domain.split(":")[0];

        // Skip tenant detection for localhost and common API domains
        if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "api") {
            // For development, allow passing merchantId in header
            const merchantId = req.headers["x-merchant-id"];
            if (merchantId) {
                const merchant = await Merchant.findById(merchantId);
                if (!merchant || !merchant.isActive) {
                    return next(new AppError("Invalid or inactive merchant.", 403));
                }
                req.merchant = merchant;
                req.merchantId = merchant._id;
            }
            return next();
        }

        // Find merchant by domain
        const merchant = await Merchant.findOne({ 
            domain: hostname.toLowerCase(),
            isActive: true 
        });

        if (!merchant) {
            return next(new AppError("Store not found or inactive.", 404));
        }

        // Check subscription expiry
        if (merchant.subscriptionExpireDate && merchant.subscriptionExpireDate < new Date()) {
            merchant.isActive = false;
            await merchant.save();
            return next(new AppError("Store subscription has expired.", 403));
        }

        if (merchant.subscriptionStatus !== "active" && merchant.subscriptionStatus !== "trial") {
            return next(new AppError("Store subscription is not active.", 403));
        }

        // Attach merchant info to request
        req.merchant = merchant;
        req.merchantId = merchant._id;
        req.storeSettings = merchant.storeSettings;

        next();
    } catch (error) {
        console.error("Tenant detection error:", error);
        next(new AppError("Failed to detect store.", 500));
    }
};

/**
 * Middleware to ensure tenant isolation for merchant admin routes
 * Ensures merchant admin can only access their own data
 */
const ensureTenantIsolation = async (req, res, next) => {
    try {
        // If user is master admin, skip isolation check
        if (req.user && req.user.role === "master_admin") {
            return next();
        }

        // For merchant admin, ensure they're accessing their own merchant data
        if (req.user && req.user.role === "merchant_admin") {
            const requestedMerchantId = req.params.merchantId || req.body.merchantId;

            if (requestedMerchantId && requestedMerchantId !== req.user.merchantId?.toString()) {
                return next(new AppError("Access denied. You can only access your own store data.", 403));
            }

            // Automatically set merchantId if not provided
            if (!req.body.merchantId && !req.params.merchantId) {
                req.body.merchantId = req.user.merchantId;
                req.merchantId = req.user.merchantId;
            }
        }

        next();
    } catch (error) {
        next(new AppError("Tenant isolation check failed.", 500));
    }
};

/**
 * Middleware to filter queries by merchantId
 * Use this in routes that need tenant-isolated data
 */
const getMerchantFilter = (merchantId) => {
    return { merchantId };
};

export { detectTenant, ensureTenantIsolation, getMerchantFilter };
export default detectTenant;
