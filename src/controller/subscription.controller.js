import SubscriptionPlan from "../models/subscriptionPlan.model.js";
import Merchant from "../models/merchant.model.js";
import catchAsync from "../middleware/catchAsync.js";
import AppError from "../utils/appError.js";

/**
 * Create a subscription plan (Master Admin only)
 */
const createSubscriptionPlan = catchAsync(async (req, res) => {
    const planData = req.body;

    const plan = await SubscriptionPlan.create(planData);

    res.status(201).json({
        success: true,
        message: "Subscription plan created successfully",
        data: { plan },
    });
});

/**
 * Get all subscription plans
 */
const getSubscriptionPlans = catchAsync(async (req, res) => {
    const { isActive } = req.query;

    const query = {};
    if (isActive !== undefined) {
        query.isActive = isActive === "true";
    }

    const plans = await SubscriptionPlan.find(query).sort({ price: 1 });

    res.status(200).json({
        success: true,
        data: { plans },
    });
});

/**
 * Get active subscription plans (public)
 */
const getActiveSubscriptionPlans = catchAsync(async (req, res) => {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 });

    res.status(200).json({
        success: true,
        data: { plans },
    });
});

/**
 * Get subscription plan by ID
 */
const getSubscriptionPlanById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const plan = await SubscriptionPlan.findById(id);

    if (!plan) {
        throw new AppError("Subscription plan not found.", 404);
    }

    res.status(200).json({
        success: true,
        data: { plan },
    });
});

/**
 * Update subscription plan (Master Admin only)
 */
const updateSubscriptionPlan = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const plan = await SubscriptionPlan.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    );

    if (!plan) {
        throw new AppError("Subscription plan not found.", 404);
    }

    res.status(200).json({
        success: true,
        message: "Subscription plan updated successfully",
        data: { plan },
    });
});

/**
 * Delete subscription plan (Master Admin only)
 */
const deleteSubscriptionPlan = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Check if any merchant is using this plan
    const merchantCount = await Merchant.countDocuments({ subscriptionPlanId: id });
    
    if (merchantCount > 0) {
        throw new AppError(`Cannot delete plan. ${merchantCount} merchant(s) are using this plan.`, 400);
    }

    const plan = await SubscriptionPlan.findByIdAndDelete(id);

    if (!plan) {
        throw new AppError("Subscription plan not found.", 404);
    }

    res.status(200).json({
        success: true,
        message: "Subscription plan deleted successfully",
    });
});

/**
 * Subscribe to a plan (for new merchants or upgrades)
 */
const subscribeToPlan = catchAsync(async (req, res) => {
    const { planId, billingCycle } = req.body;

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
        throw new AppError("Invalid or inactive subscription plan.", 400);
    }

    const merchant = await Merchant.findById(req.merchantId);
    if (!merchant) {
        throw new AppError("Merchant not found.", 404);
    }

    // Calculate expiry based on billing cycle
    const expiryDate = new Date();
    const cycle = billingCycle || plan.billingCycle;

    if (cycle === "yearly") {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else if (cycle === "quarterly") {
        expiryDate.setMonth(expiryDate.getMonth() + 3);
    } else {
        expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    merchant.subscriptionPlanId = planId;
    merchant.subscriptionStatus = "active";
    merchant.subscriptionExpireDate = expiryDate;

    await merchant.save();

    res.status(200).json({
        success: true,
        message: `Successfully subscribed to ${plan.name} plan`,
        data: { 
            merchant: {
                subscriptionPlanId: merchant.subscriptionPlanId,
                subscriptionStatus: merchant.subscriptionStatus,
                subscriptionExpireDate: merchant.subscriptionExpireDate,
            }
        },
    });
});

/**
 * Get merchant's current subscription
 */
const getCurrentSubscription = catchAsync(async (req, res) => {
    const merchant = await Merchant.findById(req.merchantId)
        .populate("subscriptionPlanId", "name price billingCycle features productLimit storageLimit");

    if (!merchant) {
        throw new AppError("Merchant not found.", 404);
    }

    const daysRemaining = Math.ceil(
        (merchant.subscriptionExpireDate - new Date()) / (1000 * 60 * 60 * 24)
    );

    res.status(200).json({
        success: true,
        data: {
            subscription: {
                plan: merchant.subscriptionPlanId,
                status: merchant.subscriptionStatus,
                startDate: merchant.subscriptionStartDate,
                expireDate: merchant.subscriptionExpireDate,
                daysRemaining,
                autoRenew: true,
            },
            usage: {
                products: merchant.productCount,
                productLimit: merchant.subscriptionPlanId?.productLimit || 0,
                storageUsed: merchant.storageUsed,
                storageLimit: merchant.subscriptionPlanId?.storageLimit || 0,
            },
        },
    });
});

/**
 * Cancel subscription (downgrade to inactive)
 */
const cancelSubscription = catchAsync(async (req, res) => {
    const merchant = await Merchant.findById(req.merchantId);

    if (!merchant) {
        throw new AppError("Merchant not found.", 404);
    }

    merchant.subscriptionStatus = "cancelled";
    await merchant.save();

    res.status(200).json({
        success: true,
        message: "Subscription cancelled. Your store will remain active until the end of the billing period.",
        data: {
            subscription: {
                status: merchant.subscriptionStatus,
                expireDate: merchant.subscriptionExpireDate,
            },
        },
    });
});

const subscriptionController = {
    createSubscriptionPlan,
    getSubscriptionPlans,
    getActiveSubscriptionPlans,
    getSubscriptionPlanById,
    updateSubscriptionPlan,
    deleteSubscriptionPlan,
    subscribeToPlan,
    getCurrentSubscription,
    cancelSubscription,
};

export default subscriptionController;
