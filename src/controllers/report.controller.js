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
    const reports = await Report.find()
    .populate('reportedBy', 'firstName lastName email userType createdAt photo isActive')
      .populate('reportedUserId', 'firstName lastName email userType photo verified createdAt isActive').lean();

    return res.status(200).json({ message: "Success", reports });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const UpdateReport = async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes, resolvedBy, resolvedAt, updatedAt } = req.body;

  try {
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.status = status;
    report.adminNotes = adminNotes;
    report.resolvedBy = resolvedBy;
    report.resolvedAt = resolvedAt;
    report.updatedAt = updatedAt;

    await report.save();

    const populatedReport = await Report.findById(id)
      .populate('reportedBy', 'firstName lastName email userType')
      .populate('reportedUserId', 'firstName lastName email userType verified')
      .populate('resolvedBy', 'firstName lastName email')
      .lean();

    return res.status(200).json({ message: "Success", report: populatedReport });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};