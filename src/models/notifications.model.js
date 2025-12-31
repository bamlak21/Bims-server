import mongoose, { Schema } from "mongoose";

const NotificationSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "request",
        "approved_assigning",
        "declined_assigning",
        "client_assigned",
        "approved",
        "approved_account",
        "verification",
        "assignment",
        "status_update",
        "message",
        "rejection",
        "new_user",
        "payment_reminder",
        "Verification_review",
        "listing_updated"
      ],
      required: true,
    },
    listing_id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "listing_type",
    },
    listing_type: { type: String, enum: ["Vehicle", "Property"] },
    message: { type: String, required: true },
    is_read: { type: Boolean, default: false },
    link: { type: String, default: "" },
    broker_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    action_required: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
    amount:{type:Number},
    overdue: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Notifications = mongoose.model(
  "Notifications",
  NotificationSchema
);
