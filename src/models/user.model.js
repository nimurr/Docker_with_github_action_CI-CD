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
            select: false, // never return password by default
        },

        role: {
            type: String,
            enum: Object.values(USER_ROLE),
            default: USER_ROLE.USER,
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
        isDeleted: {
            type: Boolean,
            default: false,
        },

        lastLogin: {
            type: Date,
        },
        profileImage: {
            type: String,
            default: null,
        },
        // Vendor specific data (optional)
        vendorProfile: {
            shopName: String,
            shopLogo: String,
            shopDescription: String,
            commissionRate: {
                type: Number,
                default: 0,
            },
            isApproved: {
                type: Boolean,
                default: false,
            }
        },

        // Address (for customers)
        addresses: [
            {
                fullName: String,
                phone: String,
                division: String,
                district: String,
                area: String,
                postalCode: String,
                addressLine: String,
                isDefault: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;