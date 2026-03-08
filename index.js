import cluster from "cluster";
import os from "os";
import dotenv from "dotenv";
import config from "./src/config/config.js";

dotenv.config();

const numCPUs = process.env.CLUSTER_WORKERS || os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} started`);
  console.log(`Spawning ${numCPUs} workers for high-performance mode`);
  console.log(`Environment: ${config.env}`);
  
  // Fork workers
  const workers = [];
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    workers.push(worker);
  }

  // Handle worker exit
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
    cluster.fork();
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    cluster.workers.forEach(worker => worker.kill("SIGTERM"));
    process.exit(0);
  });

} else {
  // Worker process
  import("./server.js").then(({ default: app }) => {
    const port = config.port || 3000;
    app.listen(port, "0.0.0.0", () => {
      console.log(`Worker ${process.pid} listening on port ${port}`);
    });
  }).catch(err => {
    console.error("Worker failed to start:", err);
    process.exit(1);
  });
}
