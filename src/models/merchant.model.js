import mongoose from "mongoose";

const merchantSchema = new mongoose.Schema(
    {
        storeName: {
            type: String,
            required: true,
            trim: true,
        },
        domain: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        merchantEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        merchantPhone: {
            type: String,
            trim: true,
        },
        subscriptionPlanId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubscriptionPlan",
            required: true,
        },
        subscriptionStatus: {
            type: String,
            enum: ["active", "expired", "cancelled", "trial", "suspended"],
            default: "trial",
        },
        subscriptionStartDate: {
            type: Date,
        },
        subscriptionExpireDate: {
            type: Date,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        storeSettings: {
            currency: {
                type: String,
                default: "USD",
            },
            timezone: {
                type: String,
                default: "UTC",
            },
            language: {
                type: String,
                default: "en",
            },
            taxRate: {
                type: Number,
                default: 0,
            },
            shippingEnabled: {
                type: Boolean,
                default: true,
            },
        },
        storeAddress: {
            street: String,
            city: String,
            state: String,
            country: String,
            postalCode: String,
        },
        storeLogo: {
            type: String,
            default: null,
        },
        storeBanner: {
            type: String,
            default: null,
        },
        storeDescription: {
            type: String,
            trim: true,
        },
        socialLinks: {
            facebook: String,
            twitter: String,
            instagram: String,
            linkedin: String,
        },
        storageUsed: {
            type: Number,
            default: 0, // in MB
        },
        productCount: {
            type: Number,
            default: 0,
        },
        orderCount: {
            type: Number,
            default: 0,
        },
        totalRevenue: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Indexes for efficient querying
merchantSchema.index({ domain: 1 });
merchantSchema.index({ merchantEmail: 1 });
merchantSchema.index({ subscriptionStatus: 1 });
merchantSchema.index({ isActive: 1 });
merchantSchema.index({ subscriptionExpireDate: 1 });

// Pre-save middleware to update product count
merchantSchema.methods.updateStats = async function () {
    const Product = mongoose.model("Product");
    const Order = mongoose.model("Order");

    const productCount = await Product.countDocuments({ merchantId: this._id });
    const orders = await Order.aggregate([
        { $match: { merchantId: this._id } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: "$totalAmount" } } }
    ]);

    this.productCount = productCount;
    this.orderCount = orders[0]?.count || 0;
    this.totalRevenue = orders[0]?.revenue || 0;
};

const Merchant = mongoose.model("Merchant", merchantSchema);

export default Merchant;
