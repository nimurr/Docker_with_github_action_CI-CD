import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import Merchant from "../models/merchant.model.js";
import Customer from "../models/customer.model.js";
import catchAsync from "../middleware/catchAsync.js";
import AppError from "../utils/appError.js";
import mongoose from "mongoose";

/**
 * Create a new order (Customer or Merchant Admin)
 */
const createOrder = catchAsync(async (req, res) => {
    const { products, paymentMethod, shippingAddress, customerNote } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
        throw new AppError("Please provide products.", 400);
    }

    const merchant = await Merchant.findById(req.merchantId);
    if (!merchant) {
        throw new AppError("Merchant not found.", 404);
    }

    // Validate products and calculate totals
    const orderProducts = [];
    let subtotal = 0;

    for (const item of products) {
        const product = await Product.findOne({ 
            _id: item.productId, 
            merchantId: req.merchantId,
            isPublished: true,
            isActive: true
        });

        if (!product) {
            throw new AppError(`Product ${item.productId} not found or unavailable.`, 400);
        }

        if (product.stock < item.quantity) {
            throw new AppError(`Insufficient stock for ${product.name}. Available: ${product.stock}`, 400);
        }

        const itemSubtotal = product.price * item.quantity;
        subtotal += itemSubtotal;

        orderProducts.push({
            productId: product._id,
            name: product.name,
            image: product.thumbnail,
            quantity: item.quantity,
            price: product.price,
            variant: item.variant || null,
            subtotal: itemSubtotal,
        });

        // Reduce product stock
        product.stock -= item.quantity;
        product.totalSales += item.quantity;
        product.totalRevenue += itemSubtotal;
        await product.save();
    }

    // Calculate tax and shipping
    const taxAmount = subtotal * (merchant.storeSettings.taxRate || 0) / 100;
    const shippingCost = merchant.storeSettings.shippingEnabled ? 10 : 0; // Default shipping
    const discountAmount = 0; // Can be calculated from discount codes
    const totalAmount = subtotal + taxAmount + shippingCost - discountAmount;

    // Create order
    const order = await Order.create({
        merchantId: req.merchantId,
        customerId: req.user._id,
        products: orderProducts,
        paymentMethod,
        shippingAddress,
        customerNote,
        subtotal,
        taxAmount,
        shippingCost,
        discountAmount,
        totalAmount,
        currency: merchant.storeSettings.currency,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
    });

    // Update merchant stats
    merchant.orderCount += 1;
    merchant.totalRevenue += totalAmount;
    await merchant.save();

    // Update or create customer
    await Customer.findOneAndUpdate(
        { merchantId: req.merchantId, userId: req.user._id },
        {
            merchantId: req.merchantId,
            userId: req.user._id,
            firstName: req.user.fullName.split(" ")[0],
            lastName: req.user.fullName.split(" ")[1] || "",
            email: req.user.email,
            $inc: { orderCount: 1, totalSpent: totalAmount },
        },
        { upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: { order },
    });
});

/**
 * Get all orders for the merchant
 */
const getOrders = catchAsync(async (req, res) => {
    const { 
        page = 1, 
        limit = 20, 
        status, 
        paymentStatus,
        search,
        startDate,
        endDate,
        sortBy = "createdAt",
        order = "desc"
    } = req.query;

    const query = { merchantId: req.merchantId };

    if (status) {
        query.orderStatus = status;
    }

    if (paymentStatus) {
        query.paymentStatus = paymentStatus;
    }

    if (search) {
        query.orderNumber = { $regex: search, $options: "i" };
    }

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const sortOptions = { [sortBy]: order === "asc" ? 1 : -1 };

    const orders = await Order.find(query)
        .populate("customerId", "fullName email phone")
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    // Calculate totals
    const revenueData = await Order.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
    ]);

    res.status(200).json({
        success: true,
        data: {
            orders,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
            },
            summary: {
                totalRevenue: revenueData[0]?.total || 0,
                totalOrders: revenueData[0]?.count || 0,
            },
        },
    });
});

/**
 * Get order by ID
 */
const getOrderById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const order = await Order.findOne({ 
        _id: id, 
        merchantId: req.merchantId 
    }).populate("customerId", "fullName email phone");

    if (!order) {
        throw new AppError("Order not found.", 404);
    }

    res.status(200).json({
        success: true,
        data: { order },
    });
});

/**
 * Get customer's own orders
 */
const getMyOrders = catchAsync(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;

    const query = { 
        customerId: req.user._id,
        merchantId: req.merchantId
    };

    if (status) {
        query.orderStatus = status;
    }

    const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.status(200).json({
        success: true,
        data: {
            orders,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
            },
        },
    });
});

/**
 * Update order status
 */
const updateOrderStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { orderStatus, paymentStatus, trackingNumber, shippingCarrier, internalNote } = req.body;

    const order = await Order.findOne({ 
        _id: id, 
        merchantId: req.merchantId 
    });

    if (!order) {
        throw new AppError("Order not found.", 404);
    }

    if (orderStatus) {
        order.orderStatus = orderStatus;

        // Set timestamps for status changes
        if (orderStatus === "shipped") {
            order.shippedDate = new Date();
            if (trackingNumber) order.trackingNumber = trackingNumber;
            if (shippingCarrier) order.shippingCarrier = shippingCarrier;
        } else if (orderStatus === "delivered") {
            order.deliveredDate = new Date();
        } else if (orderStatus === "cancelled") {
            order.cancelledDate = new Date();
            
            // Restore product stock
            for (const item of order.products) {
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { stock: item.quantity, totalSales: -item.quantity, totalRevenue: -item.subtotal }
                });
            }
        }
    }

    if (paymentStatus) {
        order.paymentStatus = paymentStatus;
    }

    if (internalNote) {
        order.internalNote = internalNote;
    }

    await order.save();

    res.status(200).json({
        success: true,
        message: "Order updated successfully",
        data: { order },
    });
});

/**
 * Process refund
 */
const processRefund = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const order = await Order.findOne({ 
        _id: id, 
        merchantId: req.merchantId 
    });

    if (!order) {
        throw new AppError("Order not found.", 404);
    }

    if (order.paymentStatus !== "paid") {
        throw new AppError("Order must be paid before refund.", 400);
    }

    const refundAmount = amount || order.totalAmount;
    
    if (refundAmount > order.totalAmount) {
        throw new AppError("Refund amount cannot exceed order total.", 400);
    }

    order.refundedAmount += refundAmount;
    order.refundReason = reason;
    
    if (order.refundedAmount >= order.totalAmount) {
        order.paymentStatus = "refunded";
    } else {
        order.paymentStatus = "partially_refunded";
    }

    await order.save();

    res.status(200).json({
        success: true,
        message: `Refund of $${refundAmount} processed successfully`,
        data: { order },
    });
});

/**
 * Get order statistics
 */
const getOrderStats = catchAsync(async (req, res) => {
    const { startDate, endDate } = req.query;

    const query = { merchantId: req.merchantId };
    
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Status counts
    const statusCounts = await Order.aggregate([
        { $match: query },
        { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
    ]);

    // Payment status counts
    const paymentStatusCounts = await Order.aggregate([
        { $match: query },
        { $group: { _id: "$paymentStatus", count: { $sum: 1 } } }
    ]);

    // Revenue by status
    const revenueByStatus = await Order.aggregate([
        { $match: { ...query, paymentStatus: "paid" } },
        { $group: { _id: "$orderStatus", revenue: { $sum: "$totalAmount" } } }
    ]);

    // Daily orders (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyOrders = await Order.aggregate([
        { 
            $match: { 
                merchantId: new mongoose.Types.ObjectId(req.merchantId),
                createdAt: { $gte: sevenDaysAgo }
            } 
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                orders: { $sum: 1 },
                revenue: { $sum: "$totalAmount" }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
        success: true,
        data: {
            statusCounts,
            paymentStatusCounts,
            revenueByStatus,
            dailyOrders,
        },
    });
});

/**
 * Cancel order (Customer)
 */
const cancelOrder = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { cancelReason } = req.body;

    const order = await Order.findOne({ 
        _id: id, 
        merchantId: req.merchantId,
        customerId: req.user._id
    });

    if (!order) {
        throw new AppError("Order not found.", 404);
    }

    if (order.orderStatus !== "pending" && order.orderStatus !== "confirmed") {
        throw new AppError("Order cannot be cancelled at this stage.", 400);
    }

    order.orderStatus = "cancelled";
    order.cancelledDate = new Date();
    order.cancelReason = cancelReason;

    // Restore product stock
    for (const item of order.products) {
        await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: item.quantity }
        });
    }

    await order.save();

    res.status(200).json({
        success: true,
        message: "Order cancelled successfully",
        data: { order },
    });
});

const orderController = {
    createOrder,
    getOrders,
    getOrderById,
    getMyOrders,
    updateOrderStatus,
    processRefund,
    getOrderStats,
    cancelOrder,
};

export default orderController;
