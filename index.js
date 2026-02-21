import app from "./server.js";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import config from "./src/config/config.js";

dotenv.config();
connectDB();

const port = config.port || 3000;


app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://${config.backend_ip}:${port}`);
});

