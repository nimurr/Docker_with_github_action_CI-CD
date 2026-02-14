import app from "./server.js";

const port = 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running at http://<YOUR_SERVER_IP>:${port}`);
});
