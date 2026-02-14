// serve.js
import express from "express";
import bodyParser from "body-parser";
// import routes from "./src/routes/index.js"; // Uncomment when you have routes

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/", express.static("public"));

//======== Routes =========
// app.use("/api/v1", routes);


app.get("/api/v1", (req, res) => {
    res.send("Server is running v1 `/api/v1` successfully!");
});

export default app;
