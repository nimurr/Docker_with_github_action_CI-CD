import express from "express";
import routes from "./src/routes/index.js";
import os from "os";
import logger from "./src/utils/logers.js";
import requestTracker, { requestTimestamps } from "./src/middleware/trackrequests.js";
import errorHandler from "./src/middleware/errorHandler.js";
import path from "path";

const app = express();

// Disable Express header for security (small performance gain)
app.disable("x-powered-by");

// Fast JSON parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Apply tracking ONLY to API routes (not static/health)
app.use("/api/v1", logger, requestTracker, routes);

app.use(express.static("public", {
  maxAge: "1d",
  etag: false,
  lastModified: false
}));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads"), {
  maxAge: "1d",
  etag: false,
  lastModified: false
}));

// Lightweight health check - NO middleware overhead
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    pid: process.pid,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Readiness check for load balancer
app.get("/ready", (req, res) => {
  res.status(200).json({ status: "ready", pid: process.pid });
});

// Ping endpoint for load testing
app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

// API performance test endpoint (no DB, no logging)
app.get("/api/perf-test", (req, res) => {
  res.status(200).json({ 
    ok: true, 
    pid: process.pid,
    timestamp: Date.now()
  });
});

app.use(errorHandler);

export default app;
