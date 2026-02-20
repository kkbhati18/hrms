const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const HolidaySchema = new Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ["National", "Regional", "Optional", "Company"], default: "National" },
  description: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Holiday", HolidaySchema);
