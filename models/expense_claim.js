const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ExpenseClaimSchema = new Schema({
  employeeID: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  category: {
    type: String,
    enum: ["Travel", "Accommodation", "Food", "Equipment", "Training", "Medical", "Other"],
    required: true,
  },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "INR" },
  expenseDate: { type: Date, required: true },
  description: { type: String, required: true },
  receiptUrl: { type: String },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  reviewNote: { type: String },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
});

module.exports = mongoose.model("ExpenseClaim", ExpenseClaimSchema);
