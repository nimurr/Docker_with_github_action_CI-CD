import app from "./server.js";

const port = 3000;

// Bind to your cloud IP
app.listen(port, "172.31.21.163", () => {
  console.log(`Server running at http://172.31.21.163:${port}`);
});
