import Merchant from "../models/merchant.model.js";
import User from "../models/user.model.js";
import SubscriptionPlan from "../models/subscriptionPlan.model.js";
import catchAsync from "../middleware/catchAsync.js";
import AppError from "../utils/appError.js";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import bcrypt from "bcryptjs";

/**
 * Register a new merchant (Master Admin only)
 */
const registerMerchant = catchAsync(async (req, res) => {
    const {
        storeName,
        domain,
        merchantEmail,
        merchantPhone,
        subscriptionPlanId,
        subscriptionDuration,
        storeSettings,
        storeAddress,
        adminUser,
    } = req.body;

    // Check if domain already exists
    const existingMerchant = await Merchant.findOne({ domain: domain.toLowerCase() });
    if (existingMerchant) {
        return next(new AppError("Domain already registered. Please use a different domain.", 400));
    }

    // Get subscription plan
    const plan = await SubscriptionPlan.findById(subscriptionPlanId);
    if (!plan || !plan.isActive) {
        throw new AppError("Invalid or inactive subscription plan.", 400);
    }

    // Calculate subscription expiry
    const subscriptionStartDate = new Date();
    let subscriptionExpireDate = new Date();
    
    if (subscriptionDuration === "yearly") {
        subscriptionExpireDate.setFullYear(subscriptionExpireDate.getFullYear() + 1);
    } else if (subscriptionDuration === "quarterly") {
        subscriptionExpireDate.setMonth(subscriptionExpireDate.getMonth() + 3);
    } else {
        subscriptionExpireDate.setMonth(subscriptionExpireDate.getMonth() + 1); // monthly
    }

    // Create merchant
    const merchant = await Merchant.create({
        storeName,
        domain: domain.toLowerCase(),
        merchantEmail,
        merchantPhone,
        subscriptionPlanId,
        subscriptionStatus: plan.trialPeriodDays > 0 ? "trial" : "active",
        subscriptionStartDate,
        subscriptionExpireDate,
        storeSettings: storeSettings || {},
        storeAddress: storeAddress || {},
    });

    // Create merchant admin user
    if (adminUser) {
        const hashedPassword = await bcrypt.hash(adminUser.password, 12);
        
        const admin = await User.create({
            fullName: adminUser.fullName,
            email: merchantEmail,
            phone: merchantPhone,
            password: hashedPassword,
            role: "merchant_admin",
            merchantId: merchant._id,
            isVerified: true, // Auto-verify merchant admin
            merchantProfile: {
                designation: adminUser.designation || "Store Owner",
            },
        });
    }

    res.status(201).json({
        success: true,
        message: "Merchant registered successfully",
        data: {
            merchant,
            storeUrl: `https://${domain}`,
        },
    });
});

/**
 * Get all merchants (Master Admin only)
 */
const getAllMerchants = catchAsync(async (req, res) => {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = {};

    if (status) {
        query.subscriptionStatus = status;
    }

    if (search) {
        query.$or = [
            { storeName: { $regex: search, $options: "i" } },
            { domain: { $regex: search, $options: "i" } },
            { merchantEmail: { $regex: search, $options: "i" } },
        ];
    }

    const merchants = await Merchant.find(query)
        .populate("subscriptionPlanId", "name price billingCycle")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const count = await Merchant.countDocuments(query);

    res.status(200).json({
        success: true,
        data: {
            merchants,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit),
            },
        },
    });
});

/**
 * Get single merchant by ID
 */
const getMerchantById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const merchant = await Merchant.findById(id)
        .populate("subscriptionPlanId", "name price billingCycle features");

    if (!merchant) {
        throw new AppError("Merchant not found.", 404);
    }

    res.status(200).json({
        success: true,
        data: { merchant },
    });
});

/**
 * Get merchant by domain (public endpoint for storefront)
 */
const getMerchantByDomain = catchAsync(async (req, res) => {
    const { domain } = req.params;

    const merchant = await Merchant.findOne({ domain: domain.toLowerCase() })
        .select("-__v");

    if (!merchant || !merchant.isActive) {
        throw new AppError("Store not found or inactive.", 404);
    }

    res.status(200).json({
        success: true,
        data: { merchant },
    });
});

/**
 * Update merchant
 */
const updateMerchant = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Prevent updating sensitive fields
    delete updateData.subscriptionPlanId;
    delete updateData.subscriptionStatus;
    delete updateData.subscriptionExpireDate;

    const merchant = await Merchant.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    );

    if (!merchant) {
        throw new AppError("Merchant not found.", 404);
    }

    res.status(200).json({
        success: true,
        message: "Merchant updated successfully",
        data: { merchant },
    });
});

/**
 * Suspend/Activate merchant (Master Admin only)
 */
const toggleMerchantStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    const merchant = await Merchant.findByIdAndUpdate(
        id,
        { isActive },
        { new: true }
    );

    if (!merchant) {
        throw new AppError("Merchant not found.", 404);
    }

    res.status(200).json({
        success: true,
        message: `Merchant ${isActive ? "activated" : "suspended"} successfully`,
        data: { merchant },
    });
});

/**
 * Update merchant subscription
 */
const updateMerchantSubscription = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { subscriptionPlanId, subscriptionDuration } = req.body;

    const plan = await SubscriptionPlan.findById(subscriptionPlanId);
    if (!plan || !plan.isActive) {
        throw new AppError("Invalid or inactive subscription plan.", 400);
    }

    const merchant = await Merchant.findById(id);
    if (!merchant) {
        throw new AppError("Merchant not found.", 404);
    }

    merchant.subscriptionPlanId = subscriptionPlanId;
    merchant.subscriptionStatus = "active";

    // Calculate new expiry
    const newExpiry = new Date();
    if (subscriptionDuration === "yearly") {
        newExpiry.setFullYear(newExpiry.getFullYear() + 1);
    } else if (subscriptionDuration === "quarterly") {
        newExpiry.setMonth(newExpiry.getMonth() + 3);
    } else {
        newExpiry.setMonth(newExpiry.getMonth() + 1);
    }
    merchant.subscriptionExpireDate = newExpiry;

    await merchant.save();

    res.status(200).json({
        success: true,
        message: "Subscription updated successfully",
        data: { merchant },
    });
});

/**
 * Get merchant analytics
 */
const getMerchantAnalytics = catchAsync(async (req, res) => {
    const { merchantId } = req;

    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
        throw new AppError("Merchant not found.", 404);
    }

    // Get product stats
    const Product = mongoose.model("Product");
    const totalProducts = await Product.countDocuments({ merchantId });
    const publishedProducts = await Product.countDocuments({ merchantId, isPublished: true, isActive: true });
    const lowStockProducts = await Product.countDocuments({ merchantId, stock: { $lte: 10 } });

    // Get order stats
    const Order = mongoose.model("Order");
    const totalOrders = await Order.countDocuments({ merchantId });
    const pendingOrders = await Order.countDocuments({ merchantId, orderStatus: "pending" });
    const completedOrders = await Order.countDocuments({ merchantId, orderStatus: "delivered" });

    // Revenue stats (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueData = await Order.aggregate([
        { $match: { merchantId: new mongoose.Types.ObjectId(merchantId), createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
    ]);

    res.status(200).json({
        success: true,
        data: {
            overview: {
                totalProducts,
                publishedProducts,
                lowStockProducts,
                totalOrders,
                pendingOrders,
                completedOrders,
                revenueLast30Days: revenueData[0]?.total || 0,
                ordersLast30Days: revenueData[0]?.count || 0,
            },
            subscription: {
                plan: merchant.subscriptionPlanId,
                status: merchant.subscriptionStatus,
                expireDate: merchant.subscriptionExpireDate,
                daysRemaining: Math.ceil((merchant.subscriptionExpireDate - new Date()) / (1000 * 60 * 60 * 24)),
            },
        },
    });
});

const merchantController = {
    registerMerchant,
    getAllMerchants,
    getMerchantById,
    getMerchantByDomain,
    updateMerchant,
    toggleMerchantStatus,
    updateMerchantSubscription,
    getMerchantAnalytics,
};

export default merchantController;
