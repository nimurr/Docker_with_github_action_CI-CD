import Product from "../models/product.model.js";
import Merchant from "../models/merchant.model.js";
import catchAsync from "../middleware/catchAsync.js";
import AppError from "../utils/appError.js";

/**
 * Create a new product (Merchant Admin)
 */
const createProduct = catchAsync(async (req, res) => {
    const productData = {
        ...req.body,
        merchantId: req.merchantId,
    };

    // Check merchant's product limit
    const merchant = await Merchant.findById(req.merchantId);
    if (!merchant) {
        throw new AppError("Merchant not found.", 404);
    }

    const SubscriptionPlan = (await import("../models/subscriptionPlan.model.js")).default;
    const plan = await SubscriptionPlan.findById(merchant.subscriptionPlanId);
    
    const currentProductCount = await Product.countDocuments({ merchantId: req.merchantId });
    if (currentProductCount >= plan.productLimit) {
        throw new AppError(`Product limit reached. Your plan allows ${plan.productLimit} products.`, 400);
    }

    // Handle product images from file upload
    if (req.files && req.files.length > 0) {
        productData.images = req.files.map(file => `/uploads/products/${file.filename}`);
        if (productData.images.length > 0) {
            productData.thumbnail = productData.images[0];
        }
    }

    const product = await Product.create(productData);

    // Update merchant product count
    merchant.productCount = currentProductCount + 1;
    await merchant.save();

    res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: { product },
    });
});

/**
 * Get all products for the merchant (with filters)
 */
const getProducts = catchAsync(async (req, res) => {
    const { 
        page = 1, 
        limit = 20, 
        search, 
        category, 
        minPrice, 
        maxPrice, 
        status,
        sortBy = "createdAt",
        order = "desc"
    } = req.query;

    const query = { merchantId: req.merchantId };

    if (search) {
        query.name = { $regex: search, $options: "i" };
    }

    if (category) {
        query.category = category;
    }

    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (status) {
        if (status === "published") {
            query.isPublished = true;
            query.isActive = true;
        } else if (status === "draft") {
            query.isPublished = false;
        } else if (status === "inactive") {
            query.isActive = false;
        }
    }

    const sortOptions = { [sortBy]: order === "asc" ? 1 : -1 };

    const products = await Product.find(query)
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.status(200).json({
        success: true,
        data: {
            products,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
            },
        },
    });
});

/**
 * Get published products (for storefront - public)
 */
const getPublishedProducts = catchAsync(async (req, res) => {
    const { 
        page = 1, 
        limit = 20, 
        search, 
        category, 
        minPrice, 
        maxPrice,
        sortBy = "createdAt",
        order = "desc"
    } = req.query;

    const query = {
        merchantId: req.merchantId,
        isPublished: true,
        isActive: true,
    };

    if (search) {
        query.name = { $regex: search, $options: "i" };
    }

    if (category) {
        query.category = category;
    }

    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const sortOptions = { [sortBy]: order === "asc" ? 1 : -1 };

    const products = await Product.find(query)
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.status(200).json({
        success: true,
        data: {
            products,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
            },
        },
    });
});

/**
 * Get single product by ID
 */
const getProductById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findOne({ 
        _id: id, 
        merchantId: req.merchantId 
    });

    if (!product) {
        throw new AppError("Product not found.", 404);
    }

    // Increment view count
    product.viewCount += 1;
    await product.save();

    res.status(200).json({
        success: true,
        data: { product },
    });
});

/**
 * Get single published product (for storefront - public)
 */
const getPublishedProduct = catchAsync(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findOne({ 
        _id: id, 
        merchantId: req.merchantId,
        isPublished: true,
        isActive: true
    });

    if (!product) {
        throw new AppError("Product not found.", 404);
    }

    // Increment view count
    product.viewCount += 1;
    await product.save();

    res.status(200).json({
        success: true,
        data: { product },
    });
});

/**
 * Update product
 */
const updateProduct = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Handle product images from file upload
    if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => `/uploads/products/${file.filename}`);
        if (updateData.images) {
            updateData.images = [...updateData.images, ...newImages];
        } else {
            updateData.images = newImages;
        }
        if (!updateData.thumbnail && updateData.images.length > 0) {
            updateData.thumbnail = updateData.images[0];
        }
    }

    const product = await Product.findOneAndUpdate(
        { _id: id, merchantId: req.merchantId },
        updateData,
        { new: true, runValidators: true }
    );

    if (!product) {
        throw new AppError("Product not found.", 404);
    }

    res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: { product },
    });
});

/**
 * Delete product
 */
const deleteProduct = catchAsync(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findOneAndDelete({ 
        _id: id, 
        merchantId: req.merchantId 
    });

    if (!product) {
        throw new AppError("Product not found.", 404);
    }

    // Update merchant product count
    const merchant = await Merchant.findById(req.merchantId);
    if (merchant) {
        merchant.productCount = Math.max(0, merchant.productCount - 1);
        await merchant.save();
    }

    res.status(200).json({
        success: true,
        message: "Product deleted successfully",
    });
});

/**
 * Bulk update products (publish/unpublish/delete)
 */
const bulkUpdateProducts = catchAsync(async (req, res) => {
    const { productIds, action } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        throw new AppError("Please provide product IDs.", 400);
    }

    let updateData = {};
    
    switch (action) {
        case "publish":
            updateData = { isPublished: true, isActive: true };
            break;
        case "unpublish":
            updateData = { isPublished: false };
            break;
        case "activate":
            updateData = { isActive: true };
            break;
        case "deactivate":
            updateData = { isActive: false };
            break;
        case "delete":
            await Product.deleteMany({ 
                _id: { $in: productIds }, 
                merchantId: req.merchantId 
            });
            
            // Update merchant product count
            const merchant = await Merchant.findById(req.merchantId);
            if (merchant) {
                merchant.productCount = Math.max(0, merchant.productCount - productIds.length);
                await merchant.save();
            }
            
            return res.status(200).json({
                success: true,
                message: `${productIds.length} products deleted successfully`,
            });
        default:
            throw new AppError("Invalid action.", 400);
    }

    await Product.updateMany(
        { _id: { $in: productIds }, merchantId: req.merchantId },
        updateData
    );

    res.status(200).json({
        success: true,
        message: `Products ${action}ed successfully`,
    });
});

/**
 * Update product stock
 */
const updateProductStock = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { stock, operation } = req.body;

    const product = await Product.findOne({ 
        _id: id, 
        merchantId: req.merchantId 
    });

    if (!product) {
        throw new AppError("Product not found.", 404);
    }

    if (operation === "add") {
        product.stock += Number(stock);
    } else if (operation === "subtract") {
        product.stock = Math.max(0, product.stock - Number(stock));
    } else {
        product.stock = Number(stock);
    }

    await product.save();

    res.status(200).json({
        success: true,
        message: "Stock updated successfully",
        data: { product },
    });
});

/**
 * Get product categories (for the merchant)
 */
const getProductCategories = catchAsync(async (req, res) => {
    const categories = await Product.distinct("category", { 
        merchantId: req.merchantId,
        isPublished: true,
        isActive: true
    });

    res.status(200).json({
        success: true,
        data: { categories },
    });
});

const productController = {
    createProduct,
    getProducts,
    getPublishedProducts,
    getProductById,
    getPublishedProduct,
    updateProduct,
    deleteProduct,
    bulkUpdateProducts,
    updateProductStock,
    getProductCategories,
};

export default productController;
