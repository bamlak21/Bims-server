import mongoose from "mongoose";
import { Commission } from "../models/commision.model.js";

export const GetCommissions = async (req, res) => {
  try {
    const commission = await Commission.find()
      .populate("broker_id", "name email")
      .populate("owner_id", "name email")
      .populate("client_id", "name email")
      .lean();

    if (commission.length === 0) {
      return res.status(404).json({ message: "No Commissions found" });
    }

    return res.status(200).json({ message: "Success", commission });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const GetBrokerCommissions = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  try {
    const commissions = await Commission.find({ broker_id: id }).lean();

    if (!commissions) {
      return res
        .status(404)
        .json({ message: "No commissions found for broker" });
    }

    return res.status(200).json({ message: "Success", commissions });
  } catch (error) {
    console.error("Error while fetching broker commissions", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const GetCommissionByListingId = async (req, res) => {
  const { listing_id } = req.query;
  if (!listing_id) {
    return res.status(400).json({ message: "Listing ID is required" });
  }
  try {
    const commission = await Commission.findOne({ listing_id })
      .populate("broker_id", "firstName lastName email")
      .populate("owner_id", "firstName lastName email")
      .populate("client_id", "firstName lastName email")
      .lean();
    if (!commission) {
      return res.status(404).json({ message: "Commission not found" });
    }
    return res.status(200).json(commission);
  } catch (error) {
    console.error("Error fetching commission:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const getCommissionById = async (req, res) => {
  try {
    const { commissionId } = req.params;
    if(!mongoose.Types.ObjectId.isValid(commissionId)) {
      return res.status(400).json({ message: "Invalid commission ID" });
    }
    const commission = await Commission.findById(commissionId)
      .populate("broker_id owner_id client_id", "firstName lastName email phone")
      .populate("listing_id");

    if (!commission) return res.status(404).json({ message: "Commission not found" });

    res.json(commission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
