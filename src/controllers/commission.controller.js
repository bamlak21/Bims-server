import mongoose from "mongoose";
import { Commission } from "../models/commision.model.js";
import { initialization, verify } from "../utils/chapa.js";
import { randomUUID } from "crypto";
import { User } from "../models/user.model.js";
import { Deal } from "../models/deals.model.js";
import { CreateNotification } from '../services/notificationService.js'
import { Property } from "../models/property.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { Admin } from "../models/admin.model.js";

export const GetCommissions = async (req, res) => {
  try {
    const commission = await Commission.find()
      .populate("broker_id", "firstName lastName email")
      .populate("owner_id", "firstName lastName email")
      .populate("client_id", "firstName lastName email")
      .populate("listing_id", "title type category")

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
    const commissions = await Commission.find({ broker_id: id })
      .populate("listing_id", "title")
      .populate("owner_id", "firstName lastName email")
      .populate("client_id", "firstName lastName email").lean();

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
  if (!["accepted", "rejected"].includes(decision)) {
    return res.status(400).json({
      message: "Invalid decision value. Must be 'accepted' or 'rejected'.",
    });
  }

  try {
    // 1️⃣ Find commission with party info
    const commission = await Commission.findById(commissionId)
      .populate("client_id", "firstName lastName userType")
      .populate("owner_id", "firstName lastName userType")
      .populate("broker_id", "firstName lastName userType");

    if (!commission) {
      return res.status(404).json({ message: "Commission not found" });
    }

    // 2️⃣ Identify who made the request
    const isClient = String(commission.client_id?._id) === String(userId);
    const isOwner = String(commission.owner_id?._id) === String(userId);

    if (!isClient && !isOwner) {
      return res
        .status(403)
        .json({ message: "Unauthorized: you are not part of this commission" });
    }

    const userType = isClient ? "client" : "owner";
    const statusFld = `${userType}_status`;
    const reasonFld = `${userType}_rejection_reason`;

    // 3️⃣ Prevent duplicate decisions
    if (commission[statusFld] !== "pending") {
      return res.status(400).json({
        message: `You have already ${commission[statusFld]} this commission`,
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
      const otherStatus = isClient
        ? commission.owner_status
        : commission.client_status;

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
      .populate("client_id", "firstName lastName")
      .populate("owner_id", "firstName lastName")
      .populate("broker_id", "firstName lastName");

    return res.status(200).json({
      message: "Decision updated successfully",
      commission: updated,
    });
  } catch (error) {
    console.error("❌ Error updating commission decision:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const PayCommission = async (req, res) => {
  const { amount, commissionId, user_id, partyType } = req.body;

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

    const user = await User.findById(user_id);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    commission.tx_ref = tx_ref;
    commission.payment_attempts = commission.payment_attempts || [];
    commission.payment_attempts.push({
      tx_ref,
      partyType,
      amount,
      user_id,
      status: 'pending',
      initiatedAt: new Date()
    });

    // Optional: mark as pending again
    if (partyType === 'client') {
      commission.client_payment_status = 'pending';
    } else {
      commission.owner_payment_status = 'pending';
    }

    await commission.save();
    // await commission.save();

    const checkoutUrl = await initialization(
      user.phoneNumber,
      amount,
      tx_ref,
      user.firstName,
      user.lastName,
      user.email,
      user.userType,
      partyType, // pass to initialization
      commissionId
    );

    if (!checkoutUrl || !checkoutUrl.url) {
      return res.status(500).json({ message: "Failed to initialize payment" });
    }
    return res.status(200).json({ message: "Success", url: checkoutUrl.url });
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
    const chapaRes = await verify(tx_ref);

    // Check if verification itself failed or returned null
    if (!chapaRes || chapaRes.status !== 'success') {
      console.log("Verification failed. Response:", JSON.stringify(chapaRes, null, 2));
      return res.status(400).json({ message: "Payment not successful or verification failed" });
    }

    // Chapa data structure: { status: 'success', data: { status: 'success', ... } }
    // We should check the inner data status too
    const verifiedData = chapaRes.data;
    if (verifiedData.status !== 'success') {
      console.log("Payment status not success:", verifiedData.status);
      return res.status(400).json({ message: `Payment status is ${verifiedData.status}` });
    }

    // allow reassignment if we need fallback
    let commission = await Commission.findOne({
      "payment_attempts.tx_ref": tx_ref
    });

    if (!commission) {
      // Fallback search just to be safe if array structure mismatch
      const fallback = await Commission.findOne({ tx_ref });
      if (!fallback) return res.status(404).json({ message: "Commission not found for this transaction" });

      // IMPORTANT: assign the fallback to commission so subsequent code can use it
      commission = fallback;
    }

    // Find the specific attempt to know who paid
    const attempt = commission.payment_attempts?.find(a => a.tx_ref === tx_ref);
    if (!attempt) {
      // Should not happen if query matched
      return res.status(400).json({ message: "Payment attempt record missing" });
    }

    const partyType = attempt.partyType; // 'client' or 'owner'
    // Prevent double processing
    if (attempt.status === 'paid') {
      return res.status(200).json({
        message: "Transaction already processed",
        tx_ref,
        status: commission.status,
      });
    }

    attempt.status = 'paid';
    // attempt.completedAt = new Date();

    // Mark the side as paid
    if (partyType === 'client') {
      commission.client_payment_status = 'paid';
      commission.client_paid_at = new Date();
    } else if (partyType === 'owner') {
      commission.owner_payment_status = 'paid';
      commission.owner_paid_at = new Date();
    }

    // Check if fully paid
    if (commission.client_payment_status === 'paid' && commission.owner_payment_status === 'paid') {
      commission.status = 'paid';

      // Update Deal
      const deal = await Deal.findOneAndUpdate(
        { commission_id: commission._id },
        {
          status: 'completed',
          app_fee: commission.app_fee || 0,
          commission_type: commission.commission_type,
        },
        { new: true },
      );

      // Update Listing
      const listingId = commission.listing_id;
      const model = commission.listing_type === 'Property' ? Property : Vehicle;
      await model.findOneAndUpdate({
        _id: listingId
      }, {
        status: "sold"
      }, { new: true });
    } else {
      // Partial payment
      commission.status = 'awaiting_payment';
    }

    await commission.save();

    return res.status(200).json({
      message: "Transaction verified successfully",
      tx_ref,
      status: commission.status,
    });
  } catch (error) {
    console.error(`Transaction Verification failed ${tx_ref} `, error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// export const handleWebhook = async (req, res) => {
//   const { tx_ref, status } = req.body;
//   const payload = req.body;
//   if (status !== 200) {
//     return res.status(400).json({ message: "payment failed" ,payload});
//   }

// try{
// const commissions = await Commission.findOne({tx_ref:tx_ref});

//     commissions.status = "paid";
//     await commissions.save();
//   } catch (error) {
//     console.error("webhook failed", error);
//     return res.status(400).json({ message: "failed webhook" });
//   }
// };
// src/controllers/commission.controller.js
export const handleWebhook = async (req, res) => {
  try {
    const event = req.body;
    const metadata = event.meta || {};
    const appFee = metadata.app_fee;
    const commissionType = metadata.commission_type;

    console.log("Webhook received:", JSON.stringify(event, null, 2));

    if (event.event !== "charge.success" || event.status !== "success" || !event.tx_ref) {
      return res.status(200).send("Ignored");
    }

    const tx_ref = event.tx_ref;

    // 1. Find commission directly by tx_ref (no need for two queries)
    const commission = await Commission.findOne({ tx_ref });
    if (!commission) {
      console.error("Commission not found for tx_ref:", tx_ref);
      return res.status(404).send("Commission not found");
    }

    // 2. Extract partyType from description
    const description = event.customization?.description || "";
    const partyMatch = description.match(/Paying as (client|owner)/i);
    const partyType = partyMatch ? partyMatch[1].toLowerCase() : null;

    if (!partyType || !['client', 'owner'].includes(partyType)) {
      console.error("Unknown partyType from:", description);
      return res.status(400).send("Unknown payer");
    }

    // 3. Prevent double-spending
    const alreadyPaid = partyType === 'client'
      ? commission.client_payment_status === 'paid'
      : commission.owner_payment_status === 'paid';

    if (alreadyPaid) {
      console.log(`Duplicate: ${partyType} already paid`);
      return res.status(200).send("Already processed");
    }

    // 4. Mark this side as paid
    if (partyType === 'client') {
      commission.client_payment_status = 'paid';
      commission.client_paid_at = new Date();
    } else {
      commission.owner_payment_status = 'paid';
      commission.owner_paid_at = new Date();
    }

    // 5. Update commission status
    if (commission.client_payment_status === 'paid' && commission.owner_payment_status === 'paid') {
      commission.status = 'paid';

      // Now correctly find and update the Deal
      const deal = await Deal.findOneAndUpdate(
        { commission_id: commission._id },
        {
          status: 'completed',
          app_fee: appFee,
          commission_type: commissionType,
        },
        { new: true },
      );
      const listingId = commission.listing_id;
      const model = commission.listing_type === 'Property' ? Property : Vehicle;
      await model.findOneAndUpdate({
        _id: listingId
      }, {
        status: "sold"
      }, { new: true })
      const updatedListing = await model.findById(listingId);
      console.log("Listing after update:", updatedListing.status);
      console.log("Updating listing:", listingId);
      if (!deal) console.log("Deal not found for commission:", commission._id);
      else console.log("Deal completed:", deal._id);
    } else {
      commission.status = 'awaiting_payment';
    }

    // 6. Update payment attempt inside the array
    const attempt = commission.payment_attempts?.find(a => a.tx_ref === tx_ref);
    if (attempt) {
      attempt.status = 'paid';
      // attempt.completedAt = new Date();
    }

    await commission.save();

    console.log(`✅ ${partyType.toUpperCase()} paid ${event.amount} ETB – tx_ref: ${tx_ref}`);
    return res.status(200).send("OK");

  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).send("Server error");
  }
};
export const sendPaymentReminder = async (req, res) => {

  try {
    const { commissionId, type } = req.body; // 'client' or 'owner'

    // FIX 1: Use _id, not .id
    const brokerId = req.user?.id?.toString();
    const adminId = req.user?.id?.toString();
    if (!brokerId && !adminId) {
      return res.status(401).json({ message: "Unauthorized: Invalid user" });
    }

    const commission = await Commission.findById(commissionId)
      .populate("listing_id client_id owner_id broker_id");

    if (!commission) {
      return res.status(404).json({ message: "Commission not found" });
    }
    const admin = await Admin.findById(adminId)
    const isAdmin = !!admin;
    // FIX 2: Compare using _id
    if (commission.broker_id?._id?.toString() !== brokerId && !isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const paymentStatusField =
      type === "client" ? "client_payment_status" : "owner_payment_status";

    const recipient = type === "client" ? commission.client_id : commission.owner_id;
    const recipientName = type === "client" ? "Client" : "Owner";

    // FIX 3: Safe access to recipient._id
    if (!recipient?._id) {
      return res.status(400).json({ message: `${recipientName} information missing` });
    }

    const recipientId = recipient._id.toString();

    if (commission[paymentStatusField] === "paid") {
      return res.status(400).json({ message: `${recipientName} has already paid` });
    }

    const listing = commission.listing_id;
    if (!listing?._id || !listing.title) {
      return res.status(400).json({ message: "Listing data incomplete" });
    }

    const now = new Date();
    const isOverdue = commission.status !== "paid" && commission.due_date && new Date(commission.due_date) < now;

    const amount = type === 'client' ? commission.client_share : commission.owner_share
    const listingTitle = listing.title;

    let message;
    let messageType = 'payment_reminder';

    if (isAdmin) {
      // Admin Logic: Final Warning
      // Only Admin sends the "Final Notice"/Warning
      message = req.body.message || `FINAL NOTICE: Your commission payment of ETB ${amount} for "${listingTitle}" is overdue. This is a final warning. Please complete the payment immediately to avoid account restrictions.`;
    } else {
      // Broker Logic: Reminder vs Overdue Reminder
      if (isOverdue) {
        // Overdue but from Broker (so friendly but firm)
        message = `Payment Overdue: Your commission payment of ETB ${amount} for "${listingTitle}" was due on ${new Date(commission.due_date).toLocaleDateString()}. Please make the payment soon.`;
      } else {
        // Standard Reminder (Before Due Date)
        message = `Your commission payment of ETB ${amount} for "${listingTitle}" is still pending. Please complete payment as soon as possible. Thank you!`;
      }
    }

    // Create Notification
    await CreateNotification({
      userId: recipientId,
      type: messageType, // Can stay generic 'payment_reminder' or be specific if frontend supports it
      listingId: listing._id,
      listingType: listing.type, // Property or Vehicle
      message,
      is_read: false,
      link: `/deal/${commission._id}`,
      brokerId: commission.broker_id._id,
      clientId: type === "client" ? recipientId : null,
      status: "pending",
      amount: amount,
      overdue: isOverdue
    });

    // Log reminder
    commission.reminders = commission.reminders || [];
    commission.reminders.push({
      type,
      sentAt: new Date(),
      sentBy: brokerId
    });
    await commission.save();

    return res.json({
      success: true,
      message: `Payment reminder sent to ${recipientName}`
    });

  } catch (error) {
    console.error("Reminder failed:", error);
    return res.status(500).json({ message: "Failed to send reminder" });
  }
};