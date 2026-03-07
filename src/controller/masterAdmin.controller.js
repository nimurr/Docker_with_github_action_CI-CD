import mongoose from "mongoose";
import Merchant from "../models/merchant.model.js";
import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import SubscriptionPlan from "../models/subscriptionPlan.model.js";
import catchAsync from "../middleware/catchAsync.js";
import AppError from "../utils/appError.js";
import os from "os";

/**
 * Get platform-wide analytics (Master Admin only)
 */
const getPlatformAnalytics = catchAsync(async (req, res) => {
    // Total counts
    const totalMerchants = await Merchant.countDocuments();
    const activeMerchants = await Merchant.countDocuments({ isActive: true, subscriptionStatus: "active" });
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Revenue analytics
    const revenueData = await Order.aggregate([
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    // Subscription revenue
    const subscriptionRevenue = await Merchant.aggregate([
        { $match: { subscriptionStatus: "active" } },
        { $group: { _id: null, total: { $sum: 1 } } }
    ]);

    // Merchants by plan
    const merchantsByPlan = await Merchant.aggregate([
        { $match: { subscriptionStatus: "active" } },
        { $lookup: {
            from: "subscriptionplans",
            localField: "subscriptionPlanId",
            foreignField: "_id",
            as: "plan"
        }},
        { $unwind: "$plan" },
        { $group: { _id: "$plan.name", count: { $sum: 1 } } }
    ]);

    // Recent orders (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrdersData = await Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { 
            _id: null, 
            count: { $sum: 1 },
            revenue: { $sum: "$totalAmount" }
        }}
    ]);

    // Top merchants by revenue
    const topMerchants = await Order.aggregate([
        { $group: { 
            _id: "$merchantId", 
            totalRevenue: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 }
        }},
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
        { $lookup: {
            from: "merchants",
            localField: "_id",
            foreignField: "_id",
            as: "merchant"
        }},
        { $unwind: "$merchant" },
        { $project: {
            merchantId: "$_id",
            storeName: "$merchant.storeName",
            domain: "$merchant.domain",
            totalRevenue: 1,
            orderCount: 1,
        }}
    ]);

    res.status(200).json({
        success: true,
        data: {
            overview: {
                totalMerchants,
                activeMerchants,
                totalUsers,
                totalProducts,
                totalOrders,
                totalRevenue: revenueData[0]?.total || 0,
                activeSubscriptions: subscriptionRevenue[0]?.total || 0,
            },
            recentActivity: {
                ordersLast30Days: recentOrdersData[0]?.count || 0,
                revenueLast30Days: recentOrdersData[0]?.revenue || 0,
            },
            merchantsByPlan,
            topMerchants,
        },
    });
});

/**
 * Get dashboard stats (Master Admin)
 */
const getDashboardStats = catchAsync(async (req, res) => {
    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });
    const todayRevenue = await Order.aggregate([
        { $match: { createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const newMerchantsToday = await Merchant.countDocuments({ createdAt: { $gte: today } });

    // Pending actions
    const pendingOrders = await Order.countDocuments({ orderStatus: "pending" });
    const expiringSubscriptions = await Merchant.countDocuments({
        subscriptionExpireDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        subscriptionStatus: "active"
    });

    res.status(200).json({
        success: true,
        data: {
            today: {
                orders: todayOrders,
                revenue: todayRevenue[0]?.total || 0,
                newMerchants: newMerchantsToday,
            },
            pendingActions: {
                pendingOrders,
                expiringSubscriptions,
            },
        },
    });
});

/**
 * Get all users (Master Admin)
 */
const getAllUsers = catchAsync(async (req, res) => {
    const { page = 1, limit = 20, role, search, status } = req.query;

    const query = {};

    if (role) {
        query.role = role;
    }

    if (status) {
        if (status === "verified") query.isVerified = true;
        if (status === "unverified") query.isVerified = false;
        if (status === "blocked") query.isBlocked = true;
    }

    if (search) {
        query.$or = [
            { fullName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
        ];
    }

    const users = await User.find(query)
        .select("-password")
        .populate("merchantId", "storeName domain")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
        success: true,
        data: {
            users,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
            },
        },
    });
});

/**
 * Get server health and performance metrics
 */
const getServerHealth = catchAsync(async (req, res) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const cpuLoad = os.loadavg();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const cpuInfo = os.cpus();

    // Database connection stats
    const dbState = mongoose.connection.readyState;
    const dbHost = mongoose.connection.host;

    res.status(200).json({
        success: true,
        data: {
            server: {
                uptime: `${Math.floor(uptime)} seconds`,
                timestamp: new Date(),
                platform: process.platform,
                nodeVersion: process.version,
            },
            cpu: {
                cores: cpuInfo.length,
                model: cpuInfo[0]?.model,
                speed: cpuInfo[0]?.speed,
                load: cpuLoad,
            },
            memory: {
                total: (totalMemory / 1024 / 1024 / 1024).toFixed(2) + " GB",
                free: (freeMemory / 1024 / 1024 / 1024).toFixed(2) + " GB",
                used: ((totalMemory - freeMemory) / 1024 / 1024 / 1024).toFixed(2) + " GB",
                usagePercent: (((totalMemory - freeMemory) / totalMemory) * 100).toFixed(2) + "%",
            },
            processMemory: {
                rss: (memoryUsage.rss / 1024 / 1024).toFixed(2) + " MB",
                heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + " MB",
                heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2) + " MB",
                external: (memoryUsage.external / 1024 / 1024).toFixed(2) + " MB",
            },
            database: {
                status: dbState === 1 ? "connected" : "disconnected",
                host: dbHost,
            },
        },
    });
});

/**
 * Block/Unblock user
 */
const toggleUserStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { isBlocked } = req.body;

    const user = await User.findByIdAndUpdate(
        id,
        { isBlocked },
        { new: true }
    ).select("-password");

    if (!user) {
        throw new AppError("User not found.", 404);
    }

    res.status(200).json({
        success: true,
        message: `User ${isBlocked ? "blocked" : "unblocked"} successfully`,
        data: { user },
    });
});

/**
 * Delete user
 */
const deleteUser = catchAsync(async (req, res) => {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
        throw new AppError("User not found.", 404);
    }

    res.status(200).json({
        success: true,
        message: "User deleted successfully",
    });
});

/**
 * Get system logs (recent activity)
 */
const getSystemLogs = catchAsync(async (req, res) => {
    const { limit = 50 } = req.query;

    // This would typically come from a logging service
    // For now, return a placeholder
    res.status(200).json({
        success: true,
        data: {
            logs: [],
            message: "Logs would be retrieved from logging service",
        },
    });
});

/**
 * Get all subscription plans with merchant counts
 */
const getPlanStats = catchAsync(async (req, res) => {
    const plans = await SubscriptionPlan.aggregate([
        {
            $lookup: {
                from: "merchants",
                localField: "_id",
                foreignField: "subscriptionPlanId",
                as: "merchants"
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                price: 1,
                billingCycle: 1,
                productLimit: 1,
                storageLimit: 1,
                isActive: 1,
                merchantCount: { $size: "$merchants" },
                activeMerchantCount: {
                    $size: {
                        $filter: {
                            input: "$merchants",
                            as: "merchant",
                            cond: { $eq: ["$$merchant.subscriptionStatus", "active"] }
                        }
                    }
                }
            }
        }
    ]);

    res.status(200).json({
        success: true,
        data: { plans },
    });
});

const masterAdminController = {
    getPlatformAnalytics,
    getDashboardStats,
    getAllUsers,
    getServerHealth,
    toggleUserStatus,
    deleteUser,
    getSystemLogs,
    getPlanStats,
};

export default masterAdminController;
