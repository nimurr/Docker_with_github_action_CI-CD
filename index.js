import app from "./server.js";
import dotenv from "dotenv";
dotenv.config();

const myIp = process.env.BACKEND_IP;

const port = 3000;

// Bind to your cloud IP
app.listen(port, myIp, () => {
  console.log(`Server running at my http://${myIp}:${port}`);
});
