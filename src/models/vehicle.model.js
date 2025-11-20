import mongoose, { Schema } from "mongoose";

const VehicleSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true, default: "Vehicle" },
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
    proofImage_paths: [{ type: String }],
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    broker_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    needBroker: {
  type: String,
  enum: ["Yes", "No"],
  required: true,
  default: "No",
},

    is_broker_assigned: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "approved", "rejected", "sold"],
      required: true,
    },
    rejection_reason: { type: String, default: "" },
    assignedVerifier: { type: Schema.Types.ObjectId, ref: "User", default: null },
    assignedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    verifiedAt: { type: Date },
    verificationComment: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Vehicle = mongoose.model("Vehicle", VehicleSchema);
