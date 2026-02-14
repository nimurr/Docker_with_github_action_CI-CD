import express from "express";
import routes from "./src/routes/index.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/", express.static("public"));

app.use("/api/v1", routes);

export default app;
