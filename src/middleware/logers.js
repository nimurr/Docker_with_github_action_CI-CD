import fs from "fs";
import path from "path";

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, "app.log");

// Logger function
const logger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${req.method} ${req.originalUrl} - IP: ${req.ip}\n`;

    // Write to log file (non-blocking)
    fs.appendFile(logFile, logMessage, (err) => {
        if (err) console.error("Failed to write log:", err);
    });

    // Also log to console in development
    if (process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "development") {
        console.log(logMessage.trim());
    }

    next();
};

export default logger;
