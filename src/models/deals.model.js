import mongoose from "mongoose";
const DealSchema = new mongoose.Schema(
  {
    broker_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    listing_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    listing_type: {
      type: String,
      enum: ["Property", "Vehicle"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active","negotiating", "agreement", "completed", "cancelled"],
      default: "active",
    },
    offer: { type: Number, default: 0 },
    title: { type: String, required: true },

    // 🔹 Hybrid Snapshot
    listing_snapshot: {
      title: String,
      description: String,
      price: Number,
      location: Object,
      images: [String],
    },
    broker_notes: { type: String, default: "" },
    commission_id: { type: mongoose.Schema.Types.ObjectId, ref: "Commission" },
  },
  { timestamps: true }
);

export const Deal = mongoose.model("Deal", DealSchema);
