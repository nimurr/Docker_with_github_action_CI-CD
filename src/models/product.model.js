import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        merchantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Merchant",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        shortDescription: {
            type: String,
            trim: true,
            maxlength: 200,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        compareAtPrice: {
            type: Number,
            min: 0,
        },
        costPrice: {
            type: Number,
            min: 0,
        },
        sku: {
            type: String,
            trim: true,
        },
        barcode: {
            type: String,
            trim: true,
        },
        stock: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        lowStockThreshold: {
            type: Number,
            default: 10,
        },
        category: {
            type: String,
            trim: true,
        },
        tags: {
            type: [String],
            default: [],
        },
        images: {
            type: [String],
            default: [],
        },
        thumbnail: {
            type: String,
            default: null,
        },
        variants: [{
            name: String,
            value: String,
            price: Number,
            stock: Number,
            sku: String,
        }],
        weight: {
            value: Number,
            unit: {
                type: String,
                enum: ["kg", "g", "lb", "oz"],
                default: "kg",
            },
        },
        dimensions: {
            length: Number,
            width: Number,
            height: Number,
            unit: {
                type: String,
                enum: ["cm", "in"],
                default: "cm",
            },
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        taxClass: {
            type: String,
            default: "standard",
        },
        shippingRequired: {
            type: Boolean,
            default: true,
        },
        metaTitle: {
            type: String,
            trim: true,
            maxlength: 60,
        },
        metaDescription: {
            type: String,
            trim: true,
            maxlength: 160,
        },
        totalSales: {
            type: Number,
            default: 0,
        },
        totalRevenue: {
            type: Number,
            default: 0,
        },
        viewCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Compound indexes for efficient querying
productSchema.index({ merchantId: 1, isPublished: 1, isActive: 1 });
productSchema.index({ merchantId: 1, category: 1 });
productSchema.index({ merchantId: 1, price: 1 });
productSchema.index({ merchantId: 1, createdAt: -1 });
productSchema.index({ merchantId: 1, totalSales: -1 });

// Virtual for discount percentage
productSchema.virtual("discountPercentage").get(function () {
    if (this.compareAtPrice && this.compareAtPrice > this.price) {
        return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
    }
    return 0;
});

// Check if stock is low
productSchema.virtual("isLowStock").get(function () {
    return this.stock <= this.lowStockThreshold;
});

// Check if out of stock
productSchema.virtual("isOutOfStock").get(function () {
    return this.stock === 0;
});

const Product = mongoose.model("Product", productSchema);

export default Product;
