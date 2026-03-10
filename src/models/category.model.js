// ProductCategory model
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        images: {
            type: [String],
            default: [],
        },
        description: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

const ProductCategory = mongoose.model("ProductCategory", categorySchema);

export default ProductCategory;