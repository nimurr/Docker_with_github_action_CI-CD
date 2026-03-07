import express from "express";
import subscriptionController from "../controller/subscription.controller.js";
import auth from "../middleware/authCheker.js";
import { detectTenant } from "../middleware/tenantDetection.js";

const router = express.Router();

// Public routes - view available plans
router.get("/plans", subscriptionController.getActiveSubscriptionPlans);
router.get("/plans/:id", subscriptionController.getSubscriptionPlanById);

// Protected routes - require authentication
router.use(auth("merchant_admin"));
router.use(detectTenant);

// Merchant subscription management
router.get("/current", subscriptionController.getCurrentSubscription);
router.post("/subscribe", subscriptionController.subscribeToPlan);
router.post("/cancel", subscriptionController.cancelSubscription);

// Master admin only routes for plan management
router.use(auth("master_admin"));
router.post("/plans", subscriptionController.createSubscriptionPlan);
router.put("/plans/:id", subscriptionController.updateSubscriptionPlan);
router.delete("/plans/:id", subscriptionController.deleteSubscriptionPlan);
router.get("/plans-all", subscriptionController.getSubscriptionPlans);

export default router;
