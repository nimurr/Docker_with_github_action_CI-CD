import mongoose from "mongoose";
import config from "./config.js";

const connectDB = async () => {
    try {
        await mongoose.connect(config.mongodb_url);

        console.log("MongoDB Connected Successfully ✅");
    } catch (error) {
        console.error("Database connection failed ❌");
        console.error(error.message);
        process.exit(1);
    }
};

export default connectDB;