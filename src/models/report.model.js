import mongoose, { model, Schema } from "mongoose";

const ReportSchema = new Schema({
  reportedBy: { type: mongoose.Types.ObjectId, ref: "User", required: true },
  reportedUserId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reason: { type: String, default: "", required: true },
  details: { type: String, default: "" },
});

const Report = model("Report", ReportSchema);

export default Report;
