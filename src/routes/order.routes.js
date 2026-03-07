import express from "express";
import orderController from "../controller/order.controller.js";
import auth from "../middleware/authCheker.js";
import { detectTenant } from "../middleware/tenantDetection.js";

const router = express.Router();

// Public routes (for checkout)
router.post(
    "/",
    detectTenant,
    auth("customer", "merchant_admin"),
    orderController.createOrder
);

// Customer routes
router.get(
    "/my-orders",
    detectTenant,
    auth("customer"),
    orderController.getMyOrders
);
router.post(
    "/:id/cancel",
    detectTenant,
    auth("customer"),
    orderController.cancelOrder
);

// Merchant admin routes
router.use(auth("merchant_admin"));
router.use(detectTenant);

router.get("/", orderController.getOrders);
router.get("/stats", orderController.getOrderStats);
router.get("/:id", orderController.getOrderById);
router.put("/:id/status", orderController.updateOrderStatus);
router.post("/:id/refund", orderController.processRefund);

export default router;
