// serve.js
import express from "express";
import bodyParser from "body-parser";
// import routes from "./src/routes/index.js"; // your main routes

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Example static folder (public files)
app.use("/public", express.static("public"));

// Routes
// app.use("/api", routes);

// Health check route
app.get("/", (req, res) => {
    res.send("Server is running 🚀");
});

export default app;
