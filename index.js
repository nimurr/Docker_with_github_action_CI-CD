// import app from "./server.js";
// import dotenv from "dotenv";
// dotenv.config();

// const myIp = process.env.BACKEND_IP;

// const port = 3000;

// // Bind to your cloud IP
// app.listen(port, myIp, () => {
//   console.log(`Server running at my http://${myIp}:${port}`);
// });


import app from "./server.js";
import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT || 4000;

// IMPORTANT: bind to 0.0.0.0 inside docker
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});
