import mongoose from "mongoose";
import Report from "../models/report.model.js";

export const CreateReport = async (req, res) => {
  const { reportedBy, reportedUserId, reason, details } = req.body;

  if (!reason || !reportedBy || !reportedUserId) {
    return res.status(400).json({ message: "Required Fields missing" });
  }

  if (
    !mongoose.Types.ObjectId.isValid(reportedBy) &&
    !mongoose.Types.ObjectId.isValid(reportedUserId)
  ) {
    return res.status(400).json({ message: "Invalid Object Id" });
  }
  try {
    const report = await Report.create({
      reportedBy,
      reportedUserId,
      reason,
      details,
    });

    return res
      .status(201)
      .json({ message: "User Reported Successfully", reportId: report._id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const GetReports = async (req, res) => {
  try {
    const reports = await Report.find().lean();

    return res.status(200).json({ message: "Success", reports });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};
