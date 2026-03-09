import app from "./server.js";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import config from "./src/config/config.js";
import { startSubscriptionJob } from "./src/jobs/subscriptionJob.js";

dotenv.config();
connectDB();

// Start background jobs
startSubscriptionJob();

const port = config.port || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://${config.backend_ip}:${port}`);
  console.log(`Environment: ${config.env}`);
});