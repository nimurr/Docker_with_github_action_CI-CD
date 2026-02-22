import express from "express";
import authController from "../controller/auth.controller.js";
import authValidation from "../validation/auth.validation.js";
import validate from "../middleware/validate.js";
import fileUpload from "../middleware/fileUpload.js";

const router = express.Router();

// router.post("/register",  validate(authValidation.register), authController.register);
router.post(
    "/register",
    fileUpload({
        fieldName: "profileImage",
        folderName: "profiles",
        maxCount: 1,
    }),
    validate(authValidation.register),
    authController.register
);

router.post("/login", validate(authValidation.login), authController.login);
router.post("/verify-email", validate(authValidation.verifyEmail), authController.verifyEmail);
router.post("/resend-otp", validate(authValidation.resendOTP), authController.resendOTP);

export default router;