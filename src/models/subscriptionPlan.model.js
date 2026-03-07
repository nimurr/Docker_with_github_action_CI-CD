import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        description: {
            type: String,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        billingCycle: {
            type: String,
            enum: ["monthly", "yearly", "quarterly"],
            default: "monthly",
        },
        productLimit: {
            type: Number,
            required: true,
            default: 100,
        },
        storageLimit: {
            type: Number,
            required: true,
            default: 1024, // in MB
        },
        features: {
            type: [String],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        trialPeriodDays: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

subscriptionPlanSchema.index({ name: 1 });
subscriptionPlanSchema.index({ isActive: 1 });

const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);

export default SubscriptionPlan;
