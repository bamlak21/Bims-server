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
  status: {
      type: String,
      enum: ["pending", "investigating","dismissed", "resolved"],
      default: "pending",
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // an admin who resolved it
    },
    resolvedAt: {
      type: Date,
    },
},
  { timestamps: true });

const Report = model("Report", ReportSchema);

export default Report;
