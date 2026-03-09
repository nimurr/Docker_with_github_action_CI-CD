import express from "express";
import productController from "../controller/product.controller.js";
import auth from "../middleware/authCheker.js";
import { detectTenant } from "../middleware/tenantDetection.js";
import fileUpload from "../middleware/fileUpload.js";

const router = express.Router();

// Public routes (storefront) - require tenant detection
router.get("/published", detectTenant, productController.getPublishedProducts);
router.get("/published/:id", detectTenant, productController.getPublishedProduct);
router.get("/categories", detectTenant, productController.getProductCategories);

// Protected routes - require authentication and tenant detection
router.use(auth("merchant_admin"));
router.use(detectTenant);

router.post(
    "/",
    fileUpload.array("images", 10),
    productController.createProduct
);

router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);
router.put("/:id", fileUpload.array("images", 10), productController.updateProduct);
router.delete("/:id", productController.deleteProduct);
router.patch("/:id/stock", productController.updateProductStock);
router.post("/bulk-update", productController.bulkUpdateProducts);

export default router;
