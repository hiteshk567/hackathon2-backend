require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const userRoutes = require("./routes/user-routes");
const hallRoutes = require("./routes/hall-routes");

const app = express();

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.r51p6.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
  {
    useNewUrlParser: true,
  }
);

app.use("/api/user", userRoutes);
app.use("/api/hall", hallRoutes);

app.use((req, res, next) => {
  throw new HttpError("Could not find this route", 404);
});

app.use((error, req, res, next) => {
  if (error.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred" });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 5000;
}
app.listen(port);
