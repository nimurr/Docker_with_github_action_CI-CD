import app from "./server.js";

const port = 3000;

// Bind to your cloud IP
app.listen(port, "13.213.62.53", () => {
  console.log(`Server running at http://13.213.62.53:${port}`);
});
