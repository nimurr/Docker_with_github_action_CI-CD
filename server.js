import express from "express";
import routes from "./src/routes/index.js";
import os from "os";
import logger from "./src/utils/logers.js";
import requestTracker, { requestTimestamps } from "./src/middleware/trackrequests.js";
import errorHandler from "./src/middleware/errorHandler.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", logger, requestTracker, routes);

app.use(express.static("public")); // ✅ Live View chart For Check Server Health

app.use(requestTracker);

app.get("/health", logger, async (req, res) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const cpuLoad = os.loadavg();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    const requestsLast5Sec = requestTimestamps.length;

    res.status(200).json({
        status: "OK",
        requestsLast5Seconds: requestsLast5Sec,   // 👈 ADD THIS
        uptime: `${Math.floor(uptime)} seconds`,
        timestamp: new Date(),
        system: {
            platform: process.platform,
            cpuCores: os.cpus().length,
            cpuLoad: cpuLoad,
            totalMemoryMB: (totalMemory / 1024 / 1024).toFixed(2),
            freeMemoryMB: (freeMemory / 1024 / 1024).toFixed(2),
        },
        memory: {
            rss: (memoryUsage.rss / 1024 / 1024).toFixed(2) + " MB",
            heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + " MB",
            heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2) + " MB",
        }
    });
});

app.use(errorHandler); // last middleware

export default app;
