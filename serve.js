// serve.js
import express from "express";
import bodyParser from "body-parser";
// import routes from "./src/routes/index.js"; // Uncomment when you have routes

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files
app.use("/public", express.static("public"));

// Routes
// app.use("/api", routes);

// Health check
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.get("/api/v1", (req, res) => {
  res.send("Hello World v2!");
});

export default app;
