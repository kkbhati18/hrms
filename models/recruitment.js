const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RecruitmentSchema = new Schema({
  title: { type: String, required: true },
  department: { type: String, required: true },
  jobDescription: { type: String, required: true },
  requirements: { type: String, required: true },
  openings: { type: Number, default: 1, min: 1 },
  type: { type: String, enum: ["Full-Time", "Part-Time", "Contract", "Internship"], default: "Full-Time" },
  experienceRequired: { type: String, default: "0-1 years" },
  status: { type: String, enum: ["Open", "Closed", "On Hold"], default: "Open" },
  postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  postedAt: { type: Date, default: Date.now },
  closingDate: { type: Date },
  applicants: [
    {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
      resumeUrl: { type: String },
      coverLetter: { type: String },
      status: { type: String, enum: ["Applied", "Shortlisted", "Interview", "Offered", "Rejected"], default: "Applied" },
      appliedAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("Recruitment", RecruitmentSchema);
