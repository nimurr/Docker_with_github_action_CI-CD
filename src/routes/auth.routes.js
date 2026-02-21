import express from "express";
import authController from "../controller/auth.controller";
import authValidation from "../validation/auth.validation";

const router = express.Router();

router.post("/register", authValidation.register, authController.register);
router.post("/login", authValidation.login, authController.login);

export default router;