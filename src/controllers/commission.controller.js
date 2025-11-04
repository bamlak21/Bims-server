import mongoose from "mongoose";
import { Commission } from "../models/commision.model.js";
import { initialization, verify } from "../utils/chapa.js";
import { randomUUID } from "crypto";
import { User } from "../models/user.model.js";

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
    if (!mongoose.Types.ObjectId.isValid(commissionId)) {
      return res.status(400).json({ message: "Invalid commission ID" });
    }
    const commission = await Commission.findById(commissionId)
      .populate(
        "broker_id owner_id client_id",
        "firstName lastName email phone"
      )
      .populate("listing_id");

    if (!commission)
      return res.status(404).json({ message: "Commission not found" });

    res.json(commission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateCommissionDecision = async (req, res) => {
  const { commissionId } = req.params;
  const { decision, reason } = req.body;
  const userId = req.user?.id;
  console.log("→ Logged-in userId:", userId);
  if (!['accepted', 'rejected'].includes(decision)) {
    return res.status(400).json({ message: "Invalid decision value. Must be 'accepted' or 'rejected'." });
  }

  try {
    // 1️⃣ Find commission with party info
    const commission = await Commission.findById(commissionId)
      .populate('client_id', 'firstName lastName userType')
      .populate('owner_id', 'firstName lastName userType')
      .populate('broker_id', 'firstName lastName userType');

    if (!commission) {
      return res.status(404).json({ message: "Commission not found" });
    }

    // 2️⃣ Identify who made the request
    const isClient = String(commission.client_id?._id) === String(userId);
    const isOwner  = String(commission.owner_id?._id) === String(userId);

    if (!isClient && !isOwner) {
      return res.status(403).json({ message: "Unauthorized: you are not part of this commission" });
    }

    const userType   = isClient ? "client" : "owner";
    const statusFld  = `${userType}_status`;
    const reasonFld  = `${userType}_rejection_reason`;

    // 3️⃣ Prevent duplicate decisions
    if (commission[statusFld] !== "pending") {
      return res.status(400).json({
        message: `You have already ${commission[statusFld]} this commission`
      });
    }

    // 4️⃣ Apply decision
    commission[statusFld] = decision;
    commission.updatedAt = new Date();

    if (decision === "rejected" && reason?.trim()) {
      commission[reasonFld] = reason.trim();
    }

    // 5️⃣ Update overall status
    if (decision === "accepted") {
      const otherStatus = isClient ? commission.owner_status : commission.client_status;

      if (otherStatus === "accepted") {
        // ✅ Both accepted → agreement approved
        commission.status = "awaiting_payment"; // next step: payments
      }
    } else {
      // ❌ Any rejection → fully rejected
      commission.status = "rejected";
    }

    await commission.save();
    

    // 6️⃣ Return populated commission
    const updated = await Commission.findById(commission._id)
      .populate('client_id', 'firstName lastName')
      .populate('owner_id', 'firstName lastName')
      .populate('broker_id', 'firstName lastName');

    return res.status(200).json({
      message: "Decision updated successfully",
      commission: updated
    });
  } catch (error) {
    console.error("❌ Error updating commission decision:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const PayCommission = async (req, res) => {
  const { amount, commissionId, user_id } = req.body;

  if (!amount || !commissionId || !user_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const tx_ref = "tx-" + randomUUID();

  try {
    const commission = await Commission.findById(commissionId)
      .populate("client_id")
      .populate("owner_id")
      .populate("broker_id");

    if (!commission) {
      return res.status(400).json({ message: "Commission doesn't exist" });
    }

    const user =
      commission.client_id._id.toString() === user_id
        ? commission.client_id
        : commission.owner_id;

    commission.tx_ref = tx_ref;
    await commission.save();

    const checkoutUrl = await initialization(
  user.phoneNumber,
  amount,
  tx_ref,
  user.firstName,
  user.lastName,
  user.email
);

   if (!checkoutUrl || !checkoutUrl.url) {
  return res.status(500).json({ message: "Failed to initialize payment" });
}
    return res.status(200).json({ message: "Success", url: checkoutUrl.url});
  } catch (error) {
    console.error("Failed to pay commission", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


export const verifyCommissionPayment = async (req, res) => {
  const { tx_ref } = req.query;

  if (!tx_ref)
    return res.status(400).json({ message: "Missing required field" });

  try {
    const check = await verify(tx_ref);
    if (check !== 200)
      return res.status(404).json({ message: "Transaction not verified" });

    const commission = await Commission.findOne({ tx_ref });
    if (!commission) {
      return res.status(400).json({ message: "Commission doesn't exist" });
    }
    commission.status = "paid";
    await commission.save();
    return res
      .status(200)
      .json({
        message: "Transaction verified",
        tx_ref,
        status: commission.status,
      });
  } catch (error) {
    console.error(`Transaction Verification failed ${tx_ref} `, error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
