import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
    {
        merchantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Merchant",
            required: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        avatar: {
            type: String,
            default: null,
        },
        addresses: [{
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
        }],
        orderCount: {
            type: Number,
            default: 0,
        },
        totalSpent: {
            type: Number,
            default: 0,
        },
        averageOrderValue: {
            type: Number,
            default: 0,
        },
        lastOrderDate: {
            type: Date,
        },
        tags: {
            type: [String],
            default: [],
        },
        notes: {
            type: String,
            trim: true,
        },
        marketingOptIn: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Indexes
customerSchema.index({ merchantId: 1, email: 1 });
customerSchema.index({ merchantId: 1, totalSpent: -1 });
customerSchema.index({ merchantId: 1, orderCount: -1 });

// Update customer stats method
customerSchema.methods.updateStats = async function () {
    const Order = mongoose.model("Order");
    
    const orders = await Order.aggregate([
        { $match: { customerId: this.userId, merchantId: this.merchantId } },
        { $group: { 
            _id: null, 
            count: { $sum: 1 }, 
            total: { $sum: "$totalAmount" },
            lastOrder: { $max: "$createdAt" }
        }}
    ]);

    this.orderCount = orders[0]?.count || 0;
    this.totalSpent = orders[0]?.total || 0;
    this.averageOrderValue = this.orderCount > 0 ? this.totalSpent / this.orderCount : 0;
    this.lastOrderDate = orders[0]?.lastOrder || null;
};

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
