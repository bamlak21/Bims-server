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
        "approved",
        "verification",
        "assignment",
        "status_update",
        "message",
        "rejection",
        "new_user",
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
  },
  { timestamps: true }
);

export const Notifications = mongoose.model(
  "Notifications",
  NotificationSchema
);
