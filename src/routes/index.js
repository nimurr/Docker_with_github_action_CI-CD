import express from "express";
import authRoute from "./auth.routes.js";
import userRoute from "./users.routes.js";
const router = express.Router();

router.use("/auth", authRoute);
router.use("/users", userRoute);

export default router;
