import mongoose, { Schema } from "mongoose";

const VehicleSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true, default: "vehicle" },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    vehicleSpecs: {
      make: { type: String },
      model: { type: String },
      year: { type: Number },
      mileage: { type: Number },
      transmission: { type: String, enum: ["manual", "automatic"] },
      fuelType: {
        type: String,
        enum: ["gasoline", "diesel", "hybrid", "electric"],
      },
      condition: { type: String, enum: ["excellent", "good", "fair", "poor"] },
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

export const Vehicle = mongoose.model("vehicles", VehicleSchema);
