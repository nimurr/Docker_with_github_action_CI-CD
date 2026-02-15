import express from "express";
import routes from "./src/routes/index.js";
import os from "os";
import logger from "./src/utils/logers.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", routes);



app.use(express.static("public")); // ✅ correct way

app.get("/health", logger, async (req, res) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const cpuLoad = os.loadavg();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    res.status(200).json({
        status: "OK",
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


export default app;
