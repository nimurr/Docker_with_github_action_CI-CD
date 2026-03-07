import mongoose from "mongoose";
import USER_ROLE from "../config/roles.js";

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },

        phone: {
            type: String,
            unique: true,
            sparse: true,
        },

        password: {
            type: String,
            required: true,
            select: false,
        },

        role: {
            type: String,
            enum: Object.values(USER_ROLE),
            default: USER_ROLE.CUSTOMER,
        },

        // Multi-tenant: Link to merchant (null for master admin)
        merchantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Merchant",
            default: null,
            index: true,
        },

        avatar: {
            type: String,
            default: null,
        },

        isVerified: {
            type: Boolean,
            default: false,
        },

        isBlocked: {
            type: Boolean,
            default: false,
        },

        lastLogin: {
            type: Date,
        },

        // Merchant admin specific fields
        merchantProfile: {
            designation: String,
            permissions: {
                canManageProducts: { type: Boolean, default: true },
                canManageOrders: { type: Boolean, default: true },
                canManageCustomers: { type: Boolean, default: true },
                canManageSettings: { type: Boolean, default: true },
                canViewAnalytics: { type: Boolean, default: true },
            },
        },

        // Customer specific fields
        customerProfile: {
            addresses: [
                {
                    label: {
                        type: String,
                        enum: ["home", "work", "other"],
                        default: "home",
                    },
                    fullName: String,
                    phone: String,
                    street: String,
                    city: String,
                    state: String,
                    postalCode: String,
                    country: String,
                    isDefault: {
                        type: Boolean,
                        default: false,
                    },
                },
            ],
            orderCount: {
                type: Number,
                default: 0,
            },
            totalSpent: {
                type: Number,
                default: 0,
            },
        },
    },
    { timestamps: true }
);

// Indexes for efficient querying
userSchema.index({ email: 1, role: 1 });
userSchema.index({ merchantId: 1, role: 1 });

const User = mongoose.model("User", userSchema);

export default User;