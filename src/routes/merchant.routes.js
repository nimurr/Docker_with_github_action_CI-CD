import express from "express";
import merchantController from "../controller/merchant.controller.js";
import auth from "../middleware/authCheker.js";
import { ensureTenantIsolation } from "../middleware/tenantDetection.js";

const router = express.Router();

// All routes require authentication and master admin role
router.use(auth("master_admin"));

// Merchant management routes
router.post("/register", merchantController.registerMerchant);
router.get("/", merchantController.getAllMerchants);
router.get("/analytics", merchantController.getMerchantAnalytics);
router.get("/:id", merchantController.getMerchantById);
router.get("/domain/:domain", merchantController.getMerchantByDomain);
router.put("/:id", merchantController.updateMerchant);
router.patch("/:id/status", merchantController.toggleMerchantStatus);
router.put("/:id/subscription", merchantController.updateMerchantSubscription);

export default router;
