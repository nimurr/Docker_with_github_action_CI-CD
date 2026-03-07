import express from "express";
import masterAdminController from "../controller/masterAdmin.controller.js";
import auth from "../middleware/authCheker.js";
import { runSubscriptionJob } from "../jobs/subscriptionJob.js";

const router = express.Router();

// All routes require master admin authentication
router.use(auth("master_admin"));

// Dashboard & Analytics
router.get("/analytics", masterAdminController.getPlatformAnalytics);
router.get("/dashboard-stats", masterAdminController.getDashboardStats);
router.get("/server-health", masterAdminController.getServerHealth);
router.get("/plan-stats", masterAdminController.getPlanStats);

// User management
router.get("/users", masterAdminController.getAllUsers);
router.patch("/users/:id/status", masterAdminController.toggleUserStatus);
router.delete("/users/:id", masterAdminController.deleteUser);

// System
router.get("/logs", masterAdminController.getSystemLogs);

// Manual trigger for subscription job (for testing)
router.post("/run-subscription-job", runSubscriptionJob);

export default router;
