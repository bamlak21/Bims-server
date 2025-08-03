import mongoose, { Schema } from "mongoose";

const VehicleSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    mileage: { type: Number, required: true },
    transmission: {
      type: String,
      enum: ["manual", "automatic"],
      required: true,
    },
    fuelType: {
      type: String,
      enum: ["gasoline", "diesel", "hybrid", "electric"],
      required: true,
    },
    condition: {
      type: String,
      enum: ["excellent", "good", "fair", "poor"],
      required: true,
    },
    image_paths: [{ type: String }],
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "draft", "approved", "rejected", "closed"],
      required: true,
    },
    rejection_reason: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Vehicle = mongoose.model("Vehicle", VehicleSchema);
