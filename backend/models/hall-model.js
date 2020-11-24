const mongoose = require("mongoose");

const hallSchema = mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  currentMovie: { type: String, required: true },
  seats: [],
});

module.exports = mongoose.model("Hall", hallSchema);
