import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        merchantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Merchant",
            required: true,
            index: true,
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        orderNumber: {
            type: String,
            required: true,
            unique: true,
        },
        orderStatus: {
            type: String,
            enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"],
            default: "pending",
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
            default: "pending",
        },
        paymentMethod: {
            type: String,
            enum: ["card", "paypal", "bank_transfer", "cash_on_delivery", "stripe"],
            required: true,
        },
        paymentId: {
            type: String,
        },
        products: [{
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            name: {
                type: String,
                required: true,
            },
            image: String,
            quantity: {
                type: Number,
                required: true,
                min: 1,
            },
            price: {
                type: Number,
                required: true,
            },
            variant: {
                name: String,
                value: String,
            },
            subtotal: {
                type: Number,
                required: true,
            },
        }],
        subtotal: {
            type: Number,
            required: true,
        },
        taxAmount: {
            type: Number,
            default: 0,
        },
        shippingCost: {
            type: Number,
            default: 0,
        },
        discountAmount: {
            type: Number,
            default: 0,
        },
        discountCode: {
            type: String,
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "USD",
        },
        shippingAddress: {
            fullName: {
                type: String,
                required: true,
            },
            phone: {
                type: String,
                required: true,
            },
            street: {
                type: String,
                required: true,
            },
            city: {
                type: String,
                required: true,
            },
            state: {
                type: String,
            },
            postalCode: {
                type: String,
            },
            country: {
                type: String,
                required: true,
            },
        },
        billingAddress: {
            fullName: String,
            phone: String,
            street: String,
            city: String,
            state: String,
            postalCode: String,
            country: String,
        },
        customerNote: {
            type: String,
            trim: true,
        },
        internalNote: {
            type: String,
            trim: true,
        },
        trackingNumber: {
            type: String,
        },
        shippingCarrier: {
            type: String,
        },
        estimatedDeliveryDate: {
            type: Date,
        },
        shippedDate: {
            type: Date,
        },
        deliveredDate: {
            type: Date,
        },
        cancelledDate: {
            type: Date,
        },
        cancelReason: {
            type: String,
        },
        refundedAmount: {
            type: Number,
            default: 0,
        },
        refundReason: {
            type: String,
        },
        ip: {
            type: String,
        },
        userAgent: {
            type: String,
        },
    },
    { timestamps: true }
);

// Indexes for efficient querying
orderSchema.index({ merchantId: 1, orderStatus: 1 });
orderSchema.index({ merchantId: 1, paymentStatus: 1 });
orderSchema.index({ merchantId: 1, createdAt: -1 });
orderSchema.index({ customerId: 1, orderStatus: 1 });
orderSchema.index({ orderNumber: 1 });

// Pre-save middleware to generate order number
orderSchema.pre("save", async function (next) {
    if (!this.orderNumber) {
        const count = await mongoose.model("Order").countDocuments({ merchantId: this.merchantId });
        this.orderNumber = `ORD-${this.merchantId.toString().slice(-6).toUpperCase()}-${(count + 1).toString().padStart(6, '0')}`;
    }
    next();
});

// Calculate totals before save
orderSchema.pre("save", function (next) {
    this.subtotal = this.products.reduce((sum, item) => sum + item.subtotal, 0);
    this.totalAmount = this.subtotal + this.taxAmount + this.shippingCost - this.discountAmount;
    next();
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
