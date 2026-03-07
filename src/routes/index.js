import express from "express";
import authRoute from "./auth.routes.js";
import userRoute from "./users.routes.js";
import merchantRoute from "./merchant.routes.js";
import productRoute from "./product.routes.js";
import orderRoute from "./order.routes.js";
import subscriptionRoute from "./subscription.routes.js";
import adminRoute from "./admin.routes.js";
import { detectTenant } from "../middleware/tenantDetection.js";

const router = express.Router();

// Public routes
router.use("/auth", authRoute);
router.use("/users", userRoute);

// Multi-tenant routes (domain-based)
router.use("/merchants", merchantRoute);
router.use("/products", productRoute);
router.use("/orders", orderRoute);
router.use("/subscriptions", subscriptionRoute);

// Master admin routes
router.use("/admin", adminRoute);

export default router;
