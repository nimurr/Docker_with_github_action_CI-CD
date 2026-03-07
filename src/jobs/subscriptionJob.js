import Merchant from "../models/merchant.model.js";
import User from "../models/user.model.js";

/**
 * Background job to check and deactivate expired subscriptions
 * Runs daily to check for expired subscriptions and deactivate stores
 */
const checkExpiredSubscriptions = async () => {
    try {
        console.log("🔄 Running subscription expiry check job...");

        const now = new Date();

        // Find merchants with expired subscriptions
        const expiredMerchants = await Merchant.find({
            subscriptionExpireDate: { $lt: now },
            subscriptionStatus: { $in: ["active", "trial"] },
            isActive: true,
        });

        console.log(`Found ${expiredMerchants.length} merchants with expired subscriptions`);

        for (const merchant of expiredMerchants) {
            // Deactivate merchant
            merchant.isActive = false;
            merchant.subscriptionStatus = "expired";
            await merchant.save();

            // Deactivate merchant admin users
            await User.updateMany(
                { merchantId: merchant._id, role: "merchant_admin" },
                { isBlocked: true }
            );

            console.log(`🚫 Deactivated merchant: ${merchant.storeName} (${merchant.domain})`);
        }

        // Find merchants expiring in 7 days (send warning)
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const expiringSoon = await Merchant.find({
            subscriptionExpireDate: { $lte: sevenDaysFromNow, $gt: now },
            subscriptionStatus: "active",
            isActive: true,
        });

        console.log(`⚠️ ${expiringSoon.length} merchants expiring in 7 days`);

        // Here you would send email notifications
        // await sendExpiryWarningEmails(expiringSoon);

        // Find merchants expiring in 24 hours (urgent warning)
        const oneDayFromNow = new Date();
        oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

        const expiringUrgent = await Merchant.find({
            subscriptionExpireDate: { $lte: oneDayFromNow, $gt: now },
            subscriptionStatus: "active",
            isActive: true,
        });

        console.log(`🚨 ${expiringUrgent.length} merchants expiring in 24 hours`);

        // Here you would send urgent email notifications
        // await sendUrgentExpiryEmails(expiringUrgent);

        console.log("✅ Subscription expiry check completed");

        return {
            deactivated: expiredMerchants.length,
            expiringSoon: expiringSoon.length,
            expiringUrgent: expiringUrgent.length,
        };
    } catch (error) {
        console.error("❌ Error in subscription expiry check:", error);
        throw error;
    }
};

/**
 * Schedule the job to run daily at 2 AM
 * In production, use a proper job scheduler like node-cron
 */
const startSubscriptionJob = () => {
    // Run immediately on startup
    checkExpiredSubscriptions();

    // Then run every 24 hours
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    setInterval(checkExpiredSubscriptions, TWENTY_FOUR_HOURS);

    console.log("📅 Subscription expiry check job scheduled (runs every 24 hours)");
};

/**
 * Manual trigger for testing
 */
const runSubscriptionJob = async (req, res) => {
    try {
        const result = await checkExpiredSubscriptions();
        res.status(200).json({
            success: true,
            message: "Subscription expiry check completed",
            data: result,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to run subscription expiry check",
            error: error.message,
        });
    }
};

export { checkExpiredSubscriptions, startSubscriptionJob, runSubscriptionJob };
export default checkExpiredSubscriptions;
